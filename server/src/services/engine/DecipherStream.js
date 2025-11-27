const { Transform } = require("stream");
const crypto = require("crypto");

/**
 * DecipherStream
 *
 * A Transform stream that decrypts AES-256-GCM data.
 *
 * Logic Flow:
 * 1. Reads the IV from the beginning of the stream.
 * 2. Decrypts the body of the stream.
 * 3. Extracts the Auth Tag from the end of the stream.
 * 4. Verifies the Auth Tag to ensure data integrity.
 *
 * Input Format: [IV] + [Encrypted Data] + [Auth Tag]
 */
class DecipherStream extends Transform {
  /**
   * @param {Buffer} key - The 32-byte encryption key.
   */
  constructor(key, options = {}) {
    super(options);
    this.algorithm = "aes-256-gcm";
    this.key = key; // Must be 32 bytes
    this.iv = null;
    this.authTag = null;
    this.decipher = null;

    this.ivLength = 16;
    this.authTagLength = 16;

    this.buffer = Buffer.alloc(0);
    this.isIvRead = false;
  }

  _transform(chunk, encoding, callback) {
    try {
      this.buffer = Buffer.concat([this.buffer, chunk]);

      // 1. Read IV if not yet read
      if (!this.isIvRead) {
        if (this.buffer.length >= this.ivLength) {
          this.iv = this.buffer.slice(0, this.ivLength);
          this.buffer = this.buffer.slice(this.ivLength);
          this.isIvRead = true;

          this.decipher = crypto.createDecipheriv(
            this.algorithm,
            this.key,
            this.iv
          );

          this.decipher.on("error", (err) => {
            this.emit("error", err);
          });
        } else {
          // Not enough data for IV yet
          return callback();
        }
      }

      // 2. Process Encrypted Data (keeping space for Auth Tag)
      // We need to always keep at least 'authTagLength' bytes in the buffer
      // because the last 16 bytes of the ENTIRE stream are the Auth Tag.
      if (this.buffer.length > this.authTagLength) {
        const dataToDecrypt = this.buffer.slice(
          0,
          this.buffer.length - this.authTagLength
        );
        this.buffer = this.buffer.slice(
          this.buffer.length - this.authTagLength
        );

        const decrypted = this.decipher.update(dataToDecrypt);
        if (decrypted.length) {
          this.push(decrypted);
        }
      }

      callback();
    } catch (err) {
      callback(err);
    }
  }

  _flush(callback) {
    try {
      if (!this.decipher) {
        // Stream ended before IV was read? Empty file?
        return callback();
      }

      // The remaining buffer should be the Auth Tag
      if (this.buffer.length !== this.authTagLength) {
        return callback(
          new Error(
            `Invalid stream length. Expected ${this.authTagLength} bytes for Auth Tag, got ${this.buffer.length}`
          )
        );
      }

      this.authTag = this.buffer;
      this.decipher.setAuthTag(this.authTag);

      const final = this.decipher.final();
      if (final.length) {
        this.push(final);
      }
      callback();
    } catch (err) {
      callback(err);
    }
  }
}

module.exports = DecipherStream;
