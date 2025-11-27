const File = require("../models/File");
const GoogleDriveProvider = require("../services/cloud/GoogleDriveProvider");
const LocalFileSystemProvider = require("../services/cloud/LocalFileSystemProvider");

class FileService {
  /**
   * Deletes a file and its chunks from all providers.
   * @param {string} fileId - The ID of the file to delete.
   * @param {object} user - The user object (req.user) for auth credentials.
   */
  static async deleteFile(fileId, user) {
    const file = await File.findOne({ _id: fileId, user: user._id });

    if (!file) {
      throw new Error("File not found");
    }

    console.log(`[FileService] Deleting file: ${file.name} (${fileId})`);

    // Delete chunks from providers
    const deletePromises = file.chunks.map(async (chunk) => {
      try {
        let provider;
        const providerName = chunk.provider || "local-1";

        if (providerName.startsWith("google")) {
          const providerId = providerName.replace("google-", "");
          let googleAccount = user.linkedAccounts.find(
            (acc) => acc.provider === "google" && acc.providerId === providerId
          );

          // Fallback for legacy
          if (!googleAccount) {
            googleAccount = user.linkedAccounts.find(
              (a) => a.provider === "google"
            );
          }

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
            `[FileService] Deleted chunk from ${providerName}: ${chunk.providerFileId}`
          );
        }
      } catch (err) {
        console.error(
          `[FileService] Failed to delete chunk from ${chunk.provider}:`,
          err.message
        );
        // Continue deleting other chunks even if one fails
      }
    });

    await Promise.all(deletePromises);

    // Delete from DB
    await File.deleteOne({ _id: fileId });
    return true;
  }
}

module.exports = FileService;
