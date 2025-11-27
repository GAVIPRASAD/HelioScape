const { Storage } = require("megajs");
const CloudProvider = require("./CloudProvider");
const config = require("../../config");

class MegaProvider extends CloudProvider {
  constructor() {
    super("mega");
    // No default credentials
  }

  /**
   * Authenticate with Email/Password.
   *
   * SECURITY IMPLEMENTATION: "Credentials Proxy"
   * MEGA uses Zero-Knowledge Encryption, meaning the password IS the decryption key.
   * We cannot use a standard OAuth token because the server needs the password to decrypt files.
   *
   * Flow:
   * 1. Verify credentials by logging in immediately.
   * 2. If successful, store the credentials as a JSON string.
   * 3. This string is ENCRYPTED by the User model (using mongoose-field-encryption) before saving to DB.
   * 4. On subsequent requests, we decrypt the credentials and log in "on the fly" to perform operations.
   */
  async login(email, password) {
    const storage = new Storage({
      email: email,
      password: password,
    });

    await storage.ready;

    // If login succeeds, we return the credentials as the "token"
    // The User model will encrypt this string.
    return JSON.stringify({ email, password });
  }

  /**
   * Mock Authentication for MEGA (using env vars).
   * Returns a direct callback URL since we don't need user interaction.
   */
  async authenticate() {
    // This is not used for user-login flow, but kept for interface compatibility
    // We could throw error or return null
    throw new Error("MEGA uses direct login, not OAuth URL.");
  }

  /**
   * Exchange "code" (dummy) for session.
   */
  async exchangeCode(code) {
    throw new Error("MEGA uses direct login, not OAuth code exchange.");
  }

  /**
   * Get storage quota.
   */
  async getQuota(tokenData) {
    const storage = await this.getStorage(tokenData);
    const info = await storage.getAccountInfo();

    return {
      total: info.spaceTotal,
      used: info.spaceUsed,
      available: info.spaceTotal - info.spaceUsed,
    };
  }

  /**
   * Helper to restore storage session.
   */
  async getStorage(tokenData) {
    try {
      let storage;
      const tokenString = tokenData.accessToken;

      // Check if it's a JSON string (Credentials Proxy)
      if (tokenString.startsWith("{")) {
        const creds = JSON.parse(tokenString);
        storage = new Storage({
          email: creds.email,
          password: creds.password,
        });
      } else {
        // Assume it's a session dump (Legacy/Fallback)
        const sessionBuffer = Buffer.from(tokenString, "base64");
        storage = new Storage(sessionBuffer);
      }

      await storage.ready;
      return storage;
    } catch (error) {
      console.error("MEGA Session Restore Error:", error);
      throw new Error(
        "MEGA session expired or invalid. Please Unlink and Re-connect your account in Settings."
      );
    }
  }

  /**
   * Upload a file stream to MEGA.
   */
  async upload(fileStream, metadata) {
    if (!this.credentials) {
      throw new Error("MegaProvider: Credentials not set");
    }
    const storage = await this.getStorage(this.credentials);

    // Upload to root or specific folder?
    // Let's upload to a "HelioScape" folder.
    // Finding folder by name is async.
    // For simplicity, upload to root first.
    // storage.upload returns a Writable stream? No, it takes options.
    // `storage.upload(options, [buffer/stream], [cb])`

    // We need to handle the stream.
    // megajs upload supports stream.

    const name = `${metadata.name}`; // Unique name needed?

    // Create upload stream
    const uploadStream = storage.upload(
      {
        name: name,
        size: metadata.size, // Optional but good if known. If unknown, might be issue?
        // If size is unknown (streaming encryption), megajs might buffer?
        // "If you don't specify the size, the data is buffered in memory." -> BAD for large files.
        // We DO NOT know the size of encrypted chunks beforehand easily unless we calculate it.
        // ShardStream knows chunk size (10MB) except for last one.
        // DistributorStream passes `metadata` which has `size`?
        // In `uploadController`, `fileMetadata` has size 0 initially.
        // But `DistributorStream` receives chunks.
        // Wait, `DistributorStream` calls `provider.upload(chunkStream, chunkMetadata)`.
        // We should ensure `chunkMetadata` has the chunk size!
        // I need to check `DistributorStream` implementation.
      },
      fileStream
    );

    const file = await uploadStream.complete;

    console.log(
      "[MegaProvider] Upload complete. File keys:",
      Object.keys(file)
    );
    console.log("[MegaProvider] File nodeId:", file.nodeId);
    console.log("[MegaProvider] File handle:", file.handle);

    const fileId = file.nodeId || file.handle;

    if (!fileId) {
      throw new Error("MegaProvider: Failed to retrieve file ID after upload.");
    }

    return {
      fileId: fileId,
      size: file.size,
      path: name,
    };
  }

  /**
   * Download a file as a stream.
   */
  async download(fileId) {
    if (!this.credentials) {
      throw new Error("MegaProvider: Credentials not set");
    }
    const storage = await this.getStorage(this.credentials);

    // Get file by handle
    // We need to find the file object.
    // `storage.files` is a map or object?
    // `storage.files` is an object where keys are handles.
    const file = storage.files[fileId];

    if (!file) {
      throw new Error(`MEGA File not found: ${fileId}`);
    }

    return file.download();
  }

  /**
   * Delete a file.
   */
  async delete(fileId) {
    if (!this.credentials) {
      throw new Error("MegaProvider: Credentials not set");
    }
    const storage = await this.getStorage(this.credentials);
    const file = storage.files[fileId];
    if (file) {
      await file.delete();
    }
  }

  setCredentials(tokenData) {
    this.credentials = tokenData;
  }

  onTokenRefresh(callback) {
    // MEGA sessions don't refresh in the same way
  }
}

module.exports = MegaProvider;
