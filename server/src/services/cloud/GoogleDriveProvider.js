const { google } = require("googleapis");
const CloudProvider = require("./CloudProvider");
const config = require("../../config");

class GoogleDriveProvider extends CloudProvider {
  constructor() {
    super("google");
    this.oauth2Client = new google.auth.OAuth2(
      config.GOOGLE.CLIENT_ID,
      config.GOOGLE.CLIENT_SECRET,
      config.GOOGLE.CALLBACK_URL
    );

    // Listen for token updates (refresh)
    this.oauth2Client.on("tokens", (tokens) => {
      if (this.refreshCallback) {
        this.refreshCallback(tokens);
      }
    });
  }

  /**
   * Generate the authentication URL.
   */
  async authenticate() {
    const scopes = [
      "https://www.googleapis.com/auth/drive.appdata", // Access only hidden app data folder
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: "offline", // Request refresh token
      scope: scopes,
      prompt: "consent", // Force consent to ensure refresh token is returned
    });
  }

  /**
   * Exchange authorization code for tokens.
   */
  async exchangeCode(code) {
    const { tokens } = await this.oauth2Client.getToken(code);
    this.oauth2Client.setCredentials(tokens);

    // Get user info to identify the account
    const oauth2 = google.oauth2({ version: "v2", auth: this.oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiryDate: new Date(tokens.expiry_date),
      email: userInfo.data.email,
      providerId: userInfo.data.id,
    };
  }

  /**
   * Get storage quota.
   */
  async getQuota(tokenData) {
    this.setCredentials(tokenData);
    const drive = google.drive({ version: "v3", auth: this.oauth2Client });

    const res = await drive.about.get({
      fields: "storageQuota",
    });

    const quota = res.data.storageQuota;
    return {
      total: parseInt(quota.limit, 10),
      used: parseInt(quota.usage, 10),
      available: parseInt(quota.limit, 10) - parseInt(quota.usage, 10),
    };
  }

  /**
   * Register a callback for token refresh events.
   * @param {Function} callback - Function to handle new tokens (tokens) => void
   */
  onTokenRefresh(callback) {
    this.refreshCallback = callback;
  }

  /**
   * Helper to set credentials from stored token data.
   */
  setCredentials(tokenData) {
    this.oauth2Client.setCredentials({
      access_token: tokenData.accessToken,
      refresh_token: tokenData.refreshToken,
      expiry_date: new Date(tokenData.expiryDate).getTime(),
    });
  }

  /**
   * Validate the token by making a lightweight API call.
   */
  async validateToken(tokenData) {
    try {
      this.setCredentials(tokenData);
      const drive = google.drive({ version: "v3", auth: this.oauth2Client });
      await drive.about.get({ fields: "user" });
      return true;
    } catch (error) {
      console.error("[GoogleDrive] Token validation failed:", error.message);
      return false;
    }
  }

  /**
   * Upload a file stream to Google Drive.
   */
  async upload(fileStream, metadata) {
    const drive = google.drive({ version: "v3", auth: this.oauth2Client });

    const fileMetadata = {
      name: metadata.name,
      parents: ["appDataFolder"], // Store in hidden app folder
    };

    const media = {
      mimeType: metadata.mimeType || "application/octet-stream",
      body: fileStream,
    };

    const res = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: "id, size",
    });

    return {
      fileId: res.data.id,
      size: parseInt(res.data.size, 10),
    };
  }

  /**
   * Download a file as a stream.
   */
  async download(fileId) {
    try {
      const drive = google.drive({ version: "v3", auth: this.oauth2Client });

      const res = await drive.files.get(
        { fileId: fileId, alt: "media" },
        { responseType: "stream" }
      );

      return res.data;
    } catch (error) {
      // console.error(
      //   "[GoogleDrive] Download Error:",
      //   error.response ? error.response.data : error.message
      // );
      throw error;
    }
  }

  /**
   * Delete a file.
   */
  async delete(fileId) {
    const drive = google.drive({ version: "v3", auth: this.oauth2Client });
    await drive.files.delete({ fileId: fileId });
  }
}

module.exports = GoogleDriveProvider;
