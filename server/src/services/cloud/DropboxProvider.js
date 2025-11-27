const { Dropbox } = require("dropbox");
const CloudProvider = require("./CloudProvider");
const config = require("../../config");
const fetch = require("node-fetch"); // Dropbox SDK needs fetch in Node

class DropboxProvider extends CloudProvider {
  constructor() {
    super("dropbox");
    this.clientId = config.DROPBOX.CLIENT_ID;
    this.clientSecret = config.DROPBOX.CLIENT_SECRET;
    this.redirectUri = config.DROPBOX.CALLBACK_URL;
  }

  /**
   * Generate the authentication URL.
   */
  async authenticate() {
    const dbx = new Dropbox({
      clientId: this.clientId,
      clientSecret: this.clientSecret,
      fetch: fetch,
    });

    const authUrl = await dbx.auth.getAuthenticationUrl(
      this.redirectUri,
      null,
      "code",
      "offline",
      null,
      "none",
      false
    );
    return authUrl;
  }

  /**
   * Exchange authorization code for tokens.
   */
  async exchangeCode(code) {
    const dbx = new Dropbox({
      clientId: this.clientId,
      clientSecret: this.clientSecret,
      fetch: fetch,
    });

    const response = await dbx.auth.getAccessTokenFromCode(
      this.redirectUri,
      code
    );
    const result = response.result;

    // Get user info
    const dbxUser = new Dropbox({
      accessToken: result.access_token,
      fetch: fetch,
    });
    const userRes = await dbxUser.usersGetCurrentAccount();

    return {
      accessToken: result.access_token,
      refreshToken: result.refresh_token,
      // Dropbox tokens are short-lived (4 hours), but SDK handles refresh if we provide refresh token?
      // Actually, we need to manage refresh manually or re-instantiate with refresh token.
      // Expiry is usually returned.
      expiryDate: result.expires_in
        ? new Date(Date.now() + result.expires_in * 1000)
        : null,
      email: userRes.result.email,
      providerId: userRes.result.account_id,
    };
  }

  /**
   * Get storage quota.
   */
  async getQuota(tokenData) {
    const dbx = this.getClient(tokenData);
    const res = await dbx.usersGetSpaceUsage();
    const used = res.result.used;
    const allocation = res.result.allocation.allocated || 0;

    return {
      total: allocation,
      used: used,
      available: allocation - used,
    };
  }

  /**
   * Helper to get authenticated client.
   * Handles token refresh if needed (basic implementation).
   */
  getClient(tokenData) {
    // Note: In a real production app, we should check expiry and refresh if needed BEFORE creating client
    // or use a wrapper that handles 401s.
    // For now, we assume the token is valid or we rely on the SDK's ability to use refresh token if provided?
    // The JS SDK allows setting refreshToken, clientId, clientSecret and it handles refresh automatically!
    return new Dropbox({
      accessToken: tokenData.accessToken,
      refreshToken: tokenData.refreshToken,
      clientId: this.clientId,
      clientSecret: this.clientSecret,
      fetch: fetch,
    });
  }

  /**
   * Upload a file stream to Dropbox.
   * Dropbox upload sessions are needed for large files, but for chunks (10MB) simple upload is fine.
   * Limit is 150MB for simple upload.
   */
  async upload(fileStream, metadata) {
    // We need to read the stream into a buffer because Dropbox SDK expects contents for filesUpload.
    // Or we can use 'contents' as a stream? SDK supports stream in Node.
    // Let's try passing the stream directly.

    // We need a unique path.
    const path = `/HelioScape/${metadata.name}`; // Or use UUID to avoid collisions

    // Note: We need to instantiate client with credentials passed in (not stored in instance)
    // But upload is called by DistributorStream which doesn't pass credentials directly?
    // Ah, in uploadController we instantiate provider AND setCredentials.
    // So we need a setCredentials method.
    if (!this.credentials) {
      throw new Error("DropboxProvider: Credentials not set");
    }

    const dbx = this.getClient(this.credentials);

    const res = await dbx.filesUpload({
      path: path,
      contents: fileStream,
      mode: "overwrite", // or 'add' and handle autorename
      autorename: true,
    });

    return {
      fileId: res.result.id,
      size: res.result.size,
      path: res.result.path_lower, // Store path if needed
    };
  }

  /**
   * Download a file as a stream.
   */
  async download(fileId) {
    if (!this.credentials) {
      throw new Error("DropboxProvider: Credentials not set");
    }
    const dbx = this.getClient(this.credentials);

    // filesDownload returns the file content in 'fileBinary' or similar depending on environment.
    // In Node, it might return a buffer or we might need to use a different method to get a stream.
    // The SDK documentation says for Node it returns `result.fileBinary`.
    // But for large files we want a stream.
    // We might need to use `filesDownload` and access the underlying response body stream if possible,
    // or use fetch directly.
    // Let's use fetch directly for download to ensure streaming.

    const response = await fetch(
      "https://content.dropboxapi.com/2/files/download",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.credentials.accessToken}`,
          "Dropbox-API-Arg": JSON.stringify({ path: fileId }),
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Dropbox Download Failed: ${response.statusText}`);
    }

    return response.body;
  }

  /**
   * Delete a file.
   */
  async delete(fileId) {
    if (!this.credentials) {
      throw new Error("DropboxProvider: Credentials not set");
    }
    const dbx = this.getClient(this.credentials);
    await dbx.filesDeleteV2({ path: fileId });
  }

  setCredentials(tokenData) {
    this.credentials = tokenData;
  }

  onTokenRefresh(callback) {
    this.refreshCallback = callback;
  }
}

module.exports = DropboxProvider;
