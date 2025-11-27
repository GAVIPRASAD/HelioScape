const File = require("../models/File");
const GoogleDriveProvider = require("../services/cloud/GoogleDriveProvider");
const DropboxProvider = require("../services/cloud/DropboxProvider");
const MegaProvider = require("../services/cloud/MegaProvider");
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
          console.log(`[FileService] Chunk ${chunk._id} is on Google Drive.`);
          const providerId = providerName.replace("google-", "");
          let googleAccount = user.linkedAccounts.find(
            (acc) => acc.provider === "google" && acc.providerId === providerId
          );

          // Fallback for legacy
          if (!googleAccount) {
            console.log(
              "[FileService] Exact Google account match not found, trying fallback."
            );
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
          } else {
            console.warn(
              "[FileService] Google account not found for deletion."
            );
          }
        } else if (providerName.startsWith("dropbox")) {
          console.log(`[FileService] Chunk ${chunk._id} is on Dropbox.`);
          const providerId = providerName.replace("dropbox-", "");
          let account = user.linkedAccounts.find(
            (acc) => acc.provider === "dropbox" && acc.providerId === providerId
          );

          if (!account) {
            console.log(
              `[FileService] Exact Dropbox account (${providerId}) not found, trying fallback.`
            );
            account = user.linkedAccounts.find(
              (acc) => acc.provider === "dropbox"
            );
          }

          if (account) {
            provider = new DropboxProvider();
            provider.setCredentials({
              accessToken: account.accessToken,
              refreshToken: account.refreshToken,
              expiryDate: account.expiryDate,
            });
          } else {
            console.warn(
              `[FileService] Dropbox account not found for deletion.`
            );
          }
        } else if (providerName.startsWith("mega")) {
          console.log(`[FileService] Chunk ${chunk._id} is on MEGA.`);
          const providerId = providerName.replace("mega-", "");
          let account = user.linkedAccounts.find(
            (acc) => acc.provider === "mega" && acc.providerId === providerId
          );

          if (!account) {
            console.log(
              `[FileService] Exact MEGA account (${providerId}) not found, trying fallback.`
            );
            account = user.linkedAccounts.find(
              (acc) => acc.provider === "mega"
            );
          }

          if (account) {
            provider = new MegaProvider();
            provider.setCredentials({
              accessToken: account.accessToken,
              email: account.email,
            });
          } else {
            console.warn(`[FileService] MEGA account not found for deletion.`);
          }
        } else {
          console.log(`[FileService] Chunk ${chunk._id} is on Local Storage.`);
          provider = new LocalFileSystemProvider(providerName, {
            storagePath: `./storage_mock/${
              providerName === "local-1" ? "disk1" : "disk2"
            }`,
          });
        }

        if (provider) {
          console.log(
            `[FileService] Attempting to delete chunk ${chunk.providerFileId} from ${providerName}...`
          );
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
