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
