const Busboy = require("busboy");
const crypto = require("crypto");
const File = require("../models/File");
const CipherStream = require("../services/engine/CipherStream");
const ShardStream = require("../services/engine/ShardStream");
const DistributorStream = require("../services/engine/DistributorStream");
const LocalFileSystemProvider = require("../services/cloud/LocalFileSystemProvider");
const GoogleDriveProvider = require("../services/cloud/GoogleDriveProvider");
const DropboxProvider = require("../services/cloud/DropboxProvider");
const MegaProvider = require("../services/cloud/MegaProvider");
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

  let currentFolderId = null;

  busboy.on("field", (fieldname, val) => {
    if (fieldname === "folderId") {
      currentFolderId = val === "null" || val === "undefined" ? null : val;
    }
  });

  busboy.on("file", async (fieldname, file, info) => {
    const { filename, mimeType } = info;
    console.log(`[Upload] Starting upload for: ${filename}`);

    // We need to capture the folderId from the fields, but busboy processes fields separately.
    // Since 'file' event might fire before or after 'field' events depending on client order,
    // we usually need to ensure fields are sent BEFORE files in the FormData on client side.
    // OR we can store the file stream and wait for fields?
    // A simpler way with Busboy is to just assume fields come first if client behaves,
    // OR use a variable that is populated by the 'field' event.
    // Let's add a listener for fields.

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
                (a) =>
                  a.provider === "google" && a.providerId === account.providerId
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
          } else if (account.provider === "dropbox") {
            const provider = new DropboxProvider();
            provider.setCredentials({
              accessToken: account.accessToken,
              refreshToken: account.refreshToken,
              expiryDate: account.expiryDate,
            });
            provider.id = `dropbox-${account.providerId}`;
            providers.push(provider);
          } else if (account.provider === "mega") {
            const provider = new MegaProvider();
            provider.setCredentials({
              accessToken: account.accessToken, // This is the session dump
              email: account.email,
            });
            provider.id = `mega-${account.providerId}`;
            providers.push(provider);
          }
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

      // Check for High Redundancy Preference
      const isRedundancyEnabled = req.user.preferences?.highRedundancyEnabled;
      let erasureStream = null;

      if (isRedundancyEnabled) {
        const ErasureEncoderStream = require("../services/engine/ErasureEncoderStream");
        erasureStream = new ErasureEncoderStream(4); // 4 Data + 1 Parity (RAID 5)
        console.log("[Upload] High Redundancy Enabled (RAID 5)");
      }

      // 3. Run Pipeline
      if (erasureStream) {
        file
          .pipe(cipherStream)
          .pipe(shardStream)
          .pipe(erasureStream)
          .pipe(distributorStream);
      } else {
        file.pipe(cipherStream).pipe(shardStream).pipe(distributorStream);
      }

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
          folder: currentFolderId,
          encryption: {
            algorithm: "aes-256-gcm",
            // TODO: Encrypt this key with user's master key before saving!
            // For prototype, we might just store it (INSECURE) or not store it (User needs it)
            // Let's store it hex encoded for now to verify flow
            key: key.toString("hex"),
          },
          erasureCoding: {
            enabled: isRedundancyEnabled,
            algorithm: isRedundancyEnabled ? "raid5-xor" : undefined,
            dataShards: isRedundancyEnabled ? 4 : undefined,
            parityShards: isRedundancyEnabled ? 1 : undefined,
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

/**
 * Lists files for the current user.
 * Supports filtering by folder, provider, and pagination.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 */
exports.listFiles = async (req, res, next) => {
  try {
    const { folderId, provider, page = 1, limit = 50 } = req.query;
    const query = { user: req.user._id };

    // Folder filter
    if (folderId !== "all") {
      query.folder = folderId || null;
    }

    // Provider filter (for account details view)
    if (provider) {
      // Support comma-separated list for explicit legacy handling (e.g. "google-123,google")
      const providers = provider.split(",");
      query["chunks.provider"] = { $in: providers };
    }

    const skip = (page - 1) * limit;

    const [files, total] = await Promise.all([
      File.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      File.countDocuments(query),
    ]);

    res.status(200).json({
      status: "success",
      results: files.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
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

    // Prepare Response Headers
    res.setHeader("Content-Type", file.mimeType || "application/octet-stream");
    res.setHeader("Content-Disposition", `attachment; filename="${file.name}"`);

    if (file.size && file.size > 32) {
      res.setHeader("Content-Length", file.size - 32);
    }

    // Initialize Decipher
    const key = Buffer.from(file.encryption.key, "hex");
    const decipherStream = new DecipherStream(key);

    // Pipe Decipher -> Response
    decipherStream.pipe(res);

    // Handle Decipher Errors
    decipherStream.on("error", (err) => {
      console.error("[Download] Decryption Error:", err);
    });

    // Helper: Stream to Buffer
    const streamToBuffer = async (stream) => {
      return new Promise((resolve, reject) => {
        const chunks = [];
        stream.on("data", (chunk) => chunks.push(chunk));
        stream.on("end", () => resolve(Buffer.concat(chunks)));
        stream.on("error", reject);
      });
    };

    // Helper to get ALL candidate providers for a chunk
    const getCandidateProviders = (chunk) => {
      const providerName = chunk.provider || "local-1";
      const candidates = [];

      if (providerName.startsWith("google")) {
        const providerId = providerName.replace("google-", "");
        const specific = req.user.linkedAccounts.find(
          (acc) => acc.provider === "google" && acc.providerId === providerId
        );
        if (specific) candidates.push(createGoogleProvider(specific));
        const others = req.user.linkedAccounts.filter(
          (acc) => acc.provider === "google" && acc.providerId !== providerId
        );
        others.forEach((acc) => candidates.push(createGoogleProvider(acc)));
      } else if (providerName.startsWith("dropbox")) {
        const providerId = providerName.replace("dropbox-", "");
        const specific = req.user.linkedAccounts.find(
          (acc) => acc.provider === "dropbox" && acc.providerId === providerId
        );
        if (specific) {
          const p = new DropboxProvider();
          p.setCredentials({
            accessToken: specific.accessToken,
            refreshToken: specific.refreshToken,
            expiryDate: specific.expiryDate,
          });
          candidates.push(p);
        }
        const others = req.user.linkedAccounts.filter(
          (acc) => acc.provider === "dropbox" && acc.providerId !== providerId
        );
        others.forEach((acc) => {
          const p = new DropboxProvider();
          p.setCredentials({
            accessToken: acc.accessToken,
            refreshToken: acc.refreshToken,
            expiryDate: acc.expiryDate,
          });
          candidates.push(p);
        });
      } else if (providerName.startsWith("mega")) {
        const providerId = providerName.replace("mega-", "");
        const specific = req.user.linkedAccounts.find(
          (acc) => acc.provider === "mega" && acc.providerId === providerId
        );
        if (specific) {
          const p = new MegaProvider();
          p.setCredentials({
            accessToken: specific.accessToken,
            email: specific.email,
          });
          candidates.push(p);
        }
        const others = req.user.linkedAccounts.filter(
          (acc) => acc.provider === "mega" && acc.providerId !== providerId
        );
        others.forEach((acc) => {
          const p = new MegaProvider();
          p.setCredentials({ accessToken: acc.accessToken, email: acc.email });
          candidates.push(p);
        });
      } else {
        candidates.push(
          new LocalFileSystemProvider(providerName, {
            storagePath: `./storage_mock/${
              providerName === "local-1" ? "disk1" : "disk2"
            }`,
          })
        );
      }
      return candidates;
    };

    const createGoogleProvider = (account) => {
      const provider = new GoogleDriveProvider();
      provider.setCredentials({
        accessToken: account.accessToken,
        refreshToken: account.refreshToken,
        expiryDate: account.expiryDate,
      });
      return provider;
    };

    // --- High Redundancy Logic ---
    if (file.erasureCoding?.enabled) {
      console.log("[Download] Using High Redundancy Recovery (RAID 5)");
      const ErasureDecoderStream = require("../services/engine/ErasureDecoderStream");
      const erasureDecoder = new ErasureDecoderStream(
        file.erasureCoding.dataShards || 4
      );

      // Pipe Erasure -> Decipher
      erasureDecoder.pipe(decipherStream);

      // Group chunks
      const dataShards = file.erasureCoding.dataShards || 4;
      const chunks = file.chunks;
      const maxIndex = Math.max(
        ...chunks.filter((c) => typeof c.index === "number").map((c) => c.index)
      );
      const totalGroups = Math.floor(maxIndex / dataShards) + 1;

      for (let g = 0; g < totalGroups; g++) {
        const groupStart = g * dataShards;
        const groupEnd = groupStart + dataShards - 1; // Inclusive
        console.log(
          `[Download] Processing Group ${g} (Indices ${groupStart}-${groupEnd})`
        );

        // Identify chunks in this group
        const groupDataChunks = [];
        for (let i = groupStart; i <= groupEnd; i++) {
          const chunk = chunks.find((c) => c.index === i);
          if (chunk) groupDataChunks.push(chunk);
        }

        // Find parity chunk
        // Parity index format: "start-end-parity" (e.g., "0-3-parity")
        // But wait, the last group might be smaller?
        // ErasureEncoderStream uses groupStart-groupEnd-parity.
        // We need to find a chunk with type='parity' and matching range.
        // Or just search by string index.
        // Let's search loosely for parity in this group.
        const parityChunk = chunks.find(
          (c) => c.type === "parity" && c.index.startsWith(`${groupStart}-`)
        );

        // Attempt to download data chunks
        const downloadedChunks = [];
        let missingCount = 0;

        for (let i = groupStart; i <= groupEnd; i++) {
          const chunk = groupDataChunks.find((c) => c.index === i);

          if (!chunk) {
            // Chunk record missing from DB? Treat as missing data.
            console.warn(`[Download] Chunk record missing for index ${i}`);
            missingCount++;
            continue;
          }

          try {
            const providers = getCandidateProviders(chunk);
            let buffer = null;
            for (const provider of providers) {
              try {
                const stream = await provider.download(chunk.providerFileId);
                if (stream) {
                  buffer = await streamToBuffer(stream);
                  break;
                }
              } catch (e) {
                /* ignore */
              }
            }

            if (buffer) {
              downloadedChunks.push({ index: i, data: buffer, type: "data" });
            } else {
              console.warn(`[Download] Failed to download chunk ${i}`);
              missingCount++;
            }
          } catch (err) {
            console.error(`[Download] Error processing chunk ${i}:`, err);
            missingCount++;
          }
        }

        // If missing data, try to get parity
        if (missingCount > 0) {
          console.log(
            `[Download] Missing ${missingCount} chunks in group ${g}. Fetching parity...`
          );
          if (parityChunk) {
            try {
              const providers = getCandidateProviders(parityChunk);
              let buffer = null;
              for (const provider of providers) {
                try {
                  const stream = await provider.download(
                    parityChunk.providerFileId
                  );
                  if (stream) {
                    buffer = await streamToBuffer(stream);
                    break;
                  }
                } catch (e) {
                  /* ignore */
                }
              }

              if (buffer) {
                downloadedChunks.push({
                  index: parityChunk.index,
                  data: buffer,
                  type: "parity",
                });
              } else {
                console.error(
                  `[Download] Failed to download parity chunk for group ${g}`
                );
              }
            } catch (err) {
              console.error(`[Download] Error fetching parity:`, err);
            }
          } else {
            console.error(`[Download] No parity chunk found for group ${g}`);
          }
        }

        // Push to decoder
        // We must push ALL chunks for the group, even if we only have some.
        // The decoder handles the logic of checking if enough are present.
        downloadedChunks.forEach((c) => erasureDecoder.write(c));
      }

      erasureDecoder.end();
    } else {
      // --- Standard Logic (Sequential Stream) ---
      const sortedChunks = file.chunks.sort((a, b) => a.index - b.index);

      const streamChunks = async () => {
        try {
          for (const chunk of sortedChunks) {
            // ... (existing logic)
            const providers = getCandidateProviders(chunk);
            if (providers.length === 0)
              throw new Error(`No linked account found for ${chunk.provider}`);

            let chunkStream = null;
            let lastError = null;

            for (const provider of providers) {
              try {
                chunkStream = await provider.download(chunk.providerFileId);
                if (chunkStream) break;
              } catch (err) {
                lastError = err;
              }
            }

            if (!chunkStream)
              throw (
                lastError ||
                new Error(`Failed to download chunk ${chunk.index}`)
              );

            await new Promise((resolve, reject) => {
              chunkStream.pipe(decipherStream, { end: false });
              chunkStream.on("end", resolve);
              chunkStream.on("error", reject);
            });
          }
          decipherStream.end();
        } catch (err) {
          console.error("[Download] Stream Error:", err);
          if (!res.headersSent) next(err);
          else decipherStream.destroy(err);
        }
      };

      await streamChunks();
    }
  } catch (err) {
    console.error("[Download] Controller Exception:", err);
    next(err);
  }
};

const FileService = require("../services/FileService");

/**
 * Aggregates storage usage statistics per provider.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 */
exports.getStorageStats = async (req, res, next) => {
  try {
    const stats = await File.aggregate([
      { $match: { user: req.user._id } },
      { $unwind: "$chunks" },
      {
        $group: {
          _id: "$chunks.provider",
          totalSize: { $sum: "$chunks.size" },
          count: { $sum: 1 },
        },
      },
    ]);

    const statsMap = stats.reduce((acc, curr) => {
      acc[curr._id] = curr.totalSize;
      return acc;
    }, {});

    res.status(200).json({
      status: "success",
      data: { stats: statsMap },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Retrieves metadata for a specific file.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 */
exports.getFile = async (req, res, next) => {
  try {
    const { id } = req.params;
    const file = await File.findOne({ _id: id, user: req.user._id });

    if (!file) {
      return next(new AppError("File not found", 404));
    }

    res.status(200).json({
      status: "success",
      data: { file },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Deletes a file and its chunks from cloud providers.
 * Uses FileService for the deletion logic.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 */
exports.deleteFile = async (req, res, next) => {
  try {
    const { id } = req.params;

    try {
      await FileService.deleteFile(id, req.user);
    } catch (err) {
      if (err.message === "File not found") {
        return next(new AppError("File not found", 404));
      }
      throw err;
    }

    res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Renames a file.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 */
exports.renameFile = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name) {
      return next(new AppError("New name is required", 400));
    }

    const file = await File.findOne({ _id: id, user: req.user._id });

    if (!file) {
      return next(new AppError("File not found", 404));
    }

    file.name = name;
    await file.save();

    res.status(200).json({
      status: "success",
      data: { file },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Moves a file to a different folder.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 */
exports.moveFile = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { folderId } = req.body; // folderId can be null for root

    const file = await File.findOne({ _id: id, user: req.user._id });

    if (!file) {
      return next(new AppError("File not found", 404));
    }

    // Verify target folder exists if not root
    if (folderId) {
      const folder = await require("../models/Folder").findOne({
        _id: folderId,
        user: req.user._id,
      });
      if (!folder) {
        return next(new AppError("Target folder not found", 404));
      }
    }

    file.folder = folderId || null;
    await file.save();

    res.status(200).json({
      status: "success",
      data: { file },
    });
  } catch (err) {
    next(err);
  }
};
/**
 * Lists media files with pagination and filtering.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 */
exports.listMedia = async (req, res, next) => {
  try {
    const { type, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const query = { user: req.user._id };

    if (type === "photos") {
      query.mimeType = { $regex: "^image/" };
    } else if (type === "videos") {
      query.mimeType = { $regex: "^video/" };
    } else if (type === "audio") {
      query.mimeType = { $regex: "^audio/" };
    } else {
      // All media
      query.mimeType = { $regex: "^(image|video|audio)/" };
    }

    const [files, total] = await Promise.all([
      File.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select("name size mimeType createdAt updatedAt"), // Select only necessary fields
      File.countDocuments(query),
    ]);

    res.status(200).json({
      status: "success",
      results: files.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: { files },
    });
  } catch (err) {
    next(err);
  }
};

exports.searchFiles = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(200).json({
        status: "success",
        data: { files: [], folders: [] },
      });
    }

    const regex = new RegExp(q, "i"); // Case-insensitive search

    // Parallel search
    const [files, folders] = await Promise.all([
      File.find({ user: req.user._id, name: regex }).sort({ createdAt: -1 }),
      require("../models/Folder")
        .find({ user: req.user._id, name: regex })
        .sort({ createdAt: -1 }),
    ]);

    res.status(200).json({
      status: "success",
      results: files.length + folders.length,
      data: { files, folders },
    });
  } catch (err) {
    next(err);
  }
};
