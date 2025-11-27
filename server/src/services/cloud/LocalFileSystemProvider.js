const fs = require("fs");
const path = require("path");
const CloudProvider = require("./CloudProvider");

class LocalFileSystemProvider extends CloudProvider {
  constructor(name = "local", config = {}) {
    super(name);
    this.storagePath =
      config.storagePath || path.join(__dirname, "../../../storage_mock");

    // Ensure storage directory exists
    if (!fs.existsSync(this.storagePath)) {
      fs.mkdirSync(this.storagePath, { recursive: true });
    }
  }

  async authenticate() {
    // No-op for local filesystem
    return true;
  }

  async upload(fileStream, metadata) {
    const filePath = path.join(this.storagePath, metadata.name);
    const writeStream = fs.createWriteStream(filePath);

    return new Promise((resolve, reject) => {
      fileStream.pipe(writeStream);

      writeStream.on("finish", () => {
        resolve({
          fileId: filePath, // Standardized key
          name: metadata.name,
          size: writeStream.bytesWritten,
          provider: this.name,
        });
      });

      writeStream.on("error", (err) => {
        reject(err);
      });
    });
  }

  async download(fileId) {
    // fileId is the full path in this mock implementation
    if (!fs.existsSync(fileId)) {
      throw new Error("File not found");
    }
    return fs.createReadStream(fileId);
  }

  async delete(fileId) {
    if (fs.existsSync(fileId)) {
      await fs.promises.unlink(fileId);
      return true;
    }
    return false;
  }

  async getQuota() {
    // Mock quota
    return {
      total: 100 * 1024 * 1024 * 1024, // 100GB
      used: 0, // Not calculating actual usage for mock
      trash: 0,
    };
  }
}

module.exports = LocalFileSystemProvider;
