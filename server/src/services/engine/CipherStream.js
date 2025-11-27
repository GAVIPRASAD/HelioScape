const { Transform } = require("stream");
const crypto = require("crypto");

/**
 * CipherStream
 *
 * A Transform stream that encrypts data using AES-256-GCM.
 *
 * Key Features:
 * 1. Generates a unique IV (Initialization Vector) for each stream.
 * 2. Prepends the IV to the output stream (so it can be read during decryption).
 * 3. Appends the Auth Tag to the end of the output stream (for integrity verification).
 *
 * Output Format: [IV (12-16 bytes)] + [Encrypted Data] + [Auth Tag (16 bytes)]
 */
class CipherStream extends Transform {
  /**
   * @param {Buffer} key - The 32-byte encryption key.
   */
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
