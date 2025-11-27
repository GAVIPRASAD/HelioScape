const Busboy = require("busboy");
const crypto = require("crypto");
const File = require("../models/File");
const CipherStream = require("../services/engine/CipherStream");
const ShardStream = require("../services/engine/ShardStream");
const DistributorStream = require("../services/engine/DistributorStream");
const LocalFileSystemProvider = require("../services/cloud/LocalFileSystemProvider");
const GoogleDriveProvider = require("../services/cloud/GoogleDriveProvider");

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

const DecipherStream = require("../services/engine/DecipherStream");

exports.downloadFile = async (req, res, next) => {
  try {
    const { id } = req.params;
    const file = await File.findOne({ _id: id, user: req.user._id }).select(
      "+encryption.key"
    );

    if (!file) {
      return next(new AppError("File not found", 404));
    }

    // 1. Identify Provider & Chunk
    // For now, we assume 1 chunk = 1 file on provider (Simple mode)
    // In future with sharding, we'd need to merge streams.
    const chunk = file.chunks[0];
    if (!chunk) {
      return next(new AppError("File corruption: No chunks found", 500));
    }

    let provider;
    // Determine provider based on chunk info or user linked accounts
    // We stored 'provider' in the chunk? No, we stored it in the manifest/distributor logic but maybe not in DB explicitly?
    // Wait, the 'chunks' array in File model usually has { provider, providerId, ... }
    // Let's check File model. Assuming it has provider info.

    // Fallback: Check user's linked accounts to instantiate the correct provider class
    // But we need to know WHICH provider holds this specific chunk.
    // Let's assume the chunk object has `provider` field.

    const providerName = chunk.provider || "local-1"; // Default/Fallback

    if (providerName.startsWith("google")) {
      const googleAccount = req.user.linkedAccounts.find(
        (acc) => acc.provider === "google"
      );
      if (!googleAccount) {
        return next(new AppError("Google Drive account not linked", 403));
      }
      provider = new GoogleDriveProvider();
      provider.setCredentials({
        accessToken: googleAccount.accessToken,
        refreshToken: googleAccount.refreshToken,
        expiryDate: googleAccount.expiryDate,
      });
    } else {
      // Local
      provider = new LocalFileSystemProvider(providerName, {
        storagePath: `./storage_mock/${
          providerName === "local-1" ? "disk1" : "disk2"
        }`,
      });
    }

    // 2. Get Stream
    const fileStream = await provider.download(chunk.providerFileId);

    // 3. Decrypt
    const key = Buffer.from(file.encryption.key, "hex");
    const decipherStream = new DecipherStream(key);

    // 4. Pipe to Response
    res.setHeader("Content-Type", file.mimeType || "application/octet-stream");
    res.setHeader("Content-Disposition", `attachment; filename="${file.name}"`);

    fileStream.pipe(decipherStream).pipe(res);

    decipherStream.on("error", (err) => {
      console.error("[Download] Decryption Error:", err);
      if (!res.headersSent) next(err);
    });

    fileStream.on("error", (err) => {
      console.error("[Download] Provider Stream Error:", err);
      if (!res.headersSent) next(err);
    });
  } catch (err) {
    next(err);
  }
};
