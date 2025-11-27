const Busboy = require("busboy");
const crypto = require("crypto");
const File = require("../models/File");
const CipherStream = require("../services/engine/CipherStream");
const ShardStream = require("../services/engine/ShardStream");
const DistributorStream = require("../services/engine/DistributorStream");
const LocalFileSystemProvider = require("../services/cloud/LocalFileSystemProvider");
const GoogleDriveProvider = require("../services/cloud/GoogleDriveProvider");
const DecipherStream = require("../services/engine/DecipherStream");

/**
 * Handles file uploads.
 *
 * Pipeline:
 * 1. Busboy parses the incoming multipart request.
 * 2. CipherStream encrypts the file stream.
 * 3. ShardStream splits the encrypted stream into chunks.
 * 4. DistributorStream uploads chunks to cloud providers.
 * 5. Saves file metadata and chunk manifest to MongoDB.
 */
exports.uploadFile = (req, res, next) => {
  const busboy = Busboy({ headers: req.headers });

  busboy.on("file", async (fieldname, file, info) => {
    const { filename, mimeType } = info;
    console.log(`[Upload] Starting upload for: ${filename}`);

    try {
      // 1. Prepare Providers
      const providers = [];

      // A. Add Linked Accounts
      if (req.user.linkedAccounts && req.user.linkedAccounts.length > 0) {
        for (const account of req.user.linkedAccounts) {
          if (account.provider === "google") {
            const provider = new GoogleDriveProvider();
            // Mongoose field encryption should have decrypted the refreshToken
            provider.setCredentials({
              accessToken: account.accessToken,
              refreshToken: account.refreshToken,
              expiryDate: account.expiryDate,
            });
            // Add a custom identifier for the distributor
            provider.id = `google-${account.providerId}`;

            // Handle Token Refresh
            provider.onTokenRefresh(async (newTokens) => {
              console.log("[GoogleDrive] Token Refreshed!");
              const accountIndex = req.user.linkedAccounts.findIndex(
                (a) => a.provider === "google"
              );
              if (accountIndex !== -1) {
                req.user.linkedAccounts[accountIndex].accessToken =
                  newTokens.access_token;
                if (newTokens.refresh_token) {
                  req.user.linkedAccounts[accountIndex].refreshToken =
                    newTokens.refresh_token;
                }
                req.user.linkedAccounts[accountIndex].expiryDate = new Date(
                  newTokens.expiry_date
                );
                await req.user.save();
                console.log("[GoogleDrive] New tokens saved to DB.");
              }
            });

            providers.push(provider);
          }
          // Add other providers here (dropbox, mega)
        }
      }

      // B. Fallback to Local Storage if no cloud accounts linked
      if (providers.length === 0) {
        console.log("[Upload] No linked accounts found. Using Local Mock.");
        providers.push(
          new LocalFileSystemProvider("local-1", {
            storagePath: "./storage_mock/disk1",
          }),
          new LocalFileSystemProvider("local-2", {
            storagePath: "./storage_mock/disk2",
          })
        );
      } else {
        console.log(`[Upload] Using ${providers.length} cloud provider(s).`);
      }

      // 2. Setup Pipeline
      const key = crypto.randomBytes(32); // Generate unique key for this file
      const cipherStream = new CipherStream(key);
      const shardStream = new ShardStream(10 * 1024 * 1024); // 10MB chunks

      const fileMetadata = { name: filename, size: 0, mimeType }; // Size unknown initially
      const distributorStream = new DistributorStream(providers, fileMetadata);

      // 3. Run Pipeline
      file.pipe(cipherStream).pipe(shardStream).pipe(distributorStream);

      // 4. Handle Completion
      distributorStream.on("finish", async () => {
        console.log(`[Upload] Finished: ${filename}`);
        const manifest = distributorStream.getManifest();

        // 5. Save to DB
        const newFile = await File.create({
          user: req.user._id,
          name: filename,
          size: manifest.totalSize,
          mimeType: mimeType,
          encryption: {
            algorithm: "aes-256-gcm",
            // TODO: Encrypt this key with user's master key before saving!
            // For prototype, we might just store it (INSECURE) or not store it (User needs it)
            // Let's store it hex encoded for now to verify flow
            key: key.toString("hex"),
          },
          chunks: manifest.chunks,
        });

        res.status(201).json({
          status: "success",
          data: {
            file: newFile,
          },
        });
      });

      distributorStream.on("error", (err) => {
        console.error("[Upload] Pipeline Error:", err);
        // TODO: Cleanup uploaded chunks
        if (!res.headersSent) {
          next(err);
        }
      });
    } catch (err) {
      console.error("[Upload] Setup Error:", err);
      if (!res.headersSent) {
        next(err);
      }
    }
  });

  busboy.on("error", (err) => {
    console.error("[Busboy] Error:", err);
    if (!res.headersSent) {
      next(err);
    }
  });

  req.pipe(busboy);
};

exports.listFiles = async (req, res, next) => {
  try {
    const files = await File.find({ user: req.user._id }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      status: "success",
      results: files.length,
      data: { files },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Handles file downloads.
 *
 * Pipeline:
 * 1. Retrieves file metadata from DB (including hidden encryption key).
 * 2. Identifies the provider holding the file chunk.
 * 3. Fetches the raw stream from the provider.
 * 4. DecipherStream decrypts the stream using the stored key.
 * 5. Pipes the decrypted content to the response.
 */
exports.downloadFile = async (req, res, next) => {
  try {
    const { id } = req.params;
    console.log(`[Download] Request for file ID: ${id}`);

    const file = await File.findOne({ _id: id, user: req.user._id }).select(
      "+encryption.key"
    );

    if (!file) {
      console.error(`[Download] File not found in DB: ${id}`);
      return next(new AppError("File not found", 404));
    }

    if (!file.chunks || file.chunks.length === 0) {
      console.error(`[Download] No chunks found for file: ${id}`);
      return next(new AppError("File corruption: No chunks found", 500));
    }

    // Sort chunks by index to ensure correct order
    const sortedChunks = file.chunks.sort((a, b) => a.index - b.index);
    console.log(`[Download] Found ${sortedChunks.length} chunks.`);

    // Prepare Response Headers
    res.setHeader("Content-Type", file.mimeType || "application/octet-stream");
    res.setHeader("Content-Disposition", `attachment; filename="${file.name}"`);

    // Initialize Decipher
    const key = Buffer.from(file.encryption.key, "hex");
    const decipherStream = new DecipherStream(key);

    // Pipe Decipher -> Response
    decipherStream.pipe(res);

    // Handle Decipher Errors
    decipherStream.on("error", (err) => {
      console.error("[Download] Decryption Error:", err);
      // We can't send a JSON error if headers are already sent, but we can log it.
      // The stream will end abruptly.
    });

    // Helper to get provider instance
    const getProvider = (chunk) => {
      const providerName = chunk.provider || "local-1";
      if (providerName.startsWith("google")) {
        const googleAccount = req.user.linkedAccounts.find(
          (acc) => acc.provider === "google"
        );
        if (!googleAccount) throw new Error("Google Drive account not linked");

        const provider = new GoogleDriveProvider();
        provider.setCredentials({
          accessToken: googleAccount.accessToken,
          refreshToken: googleAccount.refreshToken,
          expiryDate: googleAccount.expiryDate,
        });
        return provider;
      } else {
        return new LocalFileSystemProvider(providerName, {
          storagePath: `./storage_mock/${
            providerName === "local-1" ? "disk1" : "disk2"
          }`,
        });
      }
    };

    // Stream chunks sequentially
    // We use a recursive function or async iteration to pipe one after another
    const streamChunks = async () => {
      try {
        for (const chunk of sortedChunks) {
          console.log(
            `[Download] Fetching chunk ${chunk.index} from ${chunk.provider}`
          );
          const provider = getProvider(chunk);
          const chunkStream = await provider.download(chunk.providerFileId);

          await new Promise((resolve, reject) => {
            chunkStream.pipe(decipherStream, { end: false }); // Don't end decipher yet
            chunkStream.on("end", resolve);
            chunkStream.on("error", reject);
          });
        }
        // All chunks piped, now we can end the decipher stream
        decipherStream.end();
      } catch (err) {
        console.error("[Download] Stream Error:", err);
        if (!res.headersSent) next(err);
        else decipherStream.destroy(err);
      }
    };

    await streamChunks();
  } catch (err) {
    console.error("[Download] Controller Exception:", err);
    next(err);
  }
};

/**
 * Handles file deletion.
 *
 * Pipeline:
 * 1. Finds the file metadata in DB.
 * 2. Iterates through all chunks.
 * 3. Deletes each chunk from its respective cloud provider.
 * 4. Removes the file record from the database.
 */
exports.deleteFile = async (req, res, next) => {
  try {
    const { id } = req.params;
    const file = await File.findOne({ _id: id, user: req.user._id });

    if (!file) {
      return next(new AppError("File not found", 404));
    }

    console.log(`[Delete] Deleting file: ${file.name} (${id})`);

    // Delete chunks from providers
    const deletePromises = file.chunks.map(async (chunk) => {
      try {
        let provider;
        const providerName = chunk.provider || "local-1";

        if (providerName.startsWith("google")) {
          const googleAccount = req.user.linkedAccounts.find(
            (acc) => acc.provider === "google"
          );
          if (googleAccount) {
            provider = new GoogleDriveProvider();
            provider.setCredentials({
              accessToken: googleAccount.accessToken,
              refreshToken: googleAccount.refreshToken,
              expiryDate: googleAccount.expiryDate,
            });
          }
        } else {
          provider = new LocalFileSystemProvider(providerName, {
            storagePath: `./storage_mock/${
              providerName === "local-1" ? "disk1" : "disk2"
            }`,
          });
        }

        if (provider) {
          await provider.delete(chunk.providerFileId);
          console.log(
            `[Delete] Deleted chunk from ${providerName}: ${chunk.providerFileId}`
          );
        }
      } catch (err) {
        console.error(
          `[Delete] Failed to delete chunk from ${chunk.provider}:`,
          err.message
        );
        // Continue deleting other chunks/file even if one fails
      }
    });

    await Promise.all(deletePromises);

    // Delete from DB
    await File.deleteOne({ _id: id });

    res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (err) {
    next(err);
  }
};
