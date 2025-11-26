/**
 * Abstract Base Class for Cloud Storage Providers.
 * All providers (Google Drive, Dropbox, MEGA) must extend this class
 * and implement these methods.
 */
class CloudProvider {
  constructor(name) {
    if (this.constructor === CloudProvider) {
      throw new Error(
        "Abstract class 'CloudProvider' cannot be instantiated directly."
      );
    }
    this.name = name;
  }

  /**
   * Authenticate with the provider.
   * @returns {string} The authorization URL or status.
   */
  async authenticate() {
    throw new Error("Method 'authenticate()' must be implemented.");
  }

  /**
   * Exchange the authorization code for access/refresh tokens.
   * @param {string} code - The authorization code from the callback.
   * @returns {Promise<object>} The token data (accessToken, refreshToken, expiryDate).
   */
  async exchangeCode(code) {
    throw new Error("Method 'exchangeCode()' must be implemented.");
  }

  /**
   * Validate and refresh the access token if necessary.
   * @param {object} tokenData - The stored token data.
   * @returns {Promise<string>} The valid access token.
   */
  async validateToken(tokenData) {
    throw new Error("Method 'validateToken()' must be implemented.");
  }

  /**
   * Upload a file stream to the provider.
   * @param {ReadableStream} fileStream - The file stream to upload.
   * @param {object} metadata - File metadata (name, size, mimeType).
   * @returns {Promise<object>} The uploaded file details (id, webViewLink, etc.).
   */
  async upload(fileStream, metadata) {
    throw new Error("Method 'upload()' must be implemented.");
  }

  /**
   * Download a file from the provider.
   * @param {string} fileId - The ID of the file to download.
   * @returns {Promise<ReadableStream>} The file download stream.
   */
  async download(fileId) {
    throw new Error("Method 'download()' must be implemented.");
  }

  /**
   * Delete a file from the provider.
   * @param {string} fileId - The ID of the file to delete.
   * @returns {Promise<boolean>} True if successful.
   */
  async delete(fileId) {
    throw new Error("Method 'delete()' must be implemented.");
  }

  /**
   * Get the user's storage quota and usage.
   * @param {object} tokenData - The stored token data.
   * @returns {Promise<object>} { total, used, available } in bytes.
   */
  async getQuota(tokenData) {
    throw new Error("Method 'getQuota()' must be implemented.");
  }
}

module.exports = CloudProvider;
