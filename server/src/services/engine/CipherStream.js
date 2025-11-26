const { Transform } = require("stream");
const crypto = require("crypto");

class CipherStream extends Transform {
  constructor(key, options = {}) {
    super(options);
    this.algorithm = "aes-256-gcm";
    this.key = key; // Must be 32 bytes
    this.iv = crypto.randomBytes(16); // Initialization Vector
    this.cipher = crypto.createCipheriv(this.algorithm, this.key, this.iv);

    // Push IV first so we can decrypt later
    this.push(this.iv);

    this.cipher.on("error", (err) => {
      this.emit("error", err);
    });
  }

  _transform(chunk, encoding, callback) {
    try {
      const encrypted = this.cipher.update(chunk);
      if (encrypted.length) {
        this.push(encrypted);
      }
      callback();
    } catch (err) {
      callback(err);
    }
  }

  _flush(callback) {
    try {
      const final = this.cipher.final();
      if (final.length) {
        this.push(final);
      }
      // For GCM, we must append the auth tag at the end
      const authTag = this.cipher.getAuthTag();
      this.push(authTag);
      callback();
    } catch (err) {
      callback(err);
    }
  }
}

module.exports = CipherStream;
