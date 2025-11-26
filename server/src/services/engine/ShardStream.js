const { Transform } = require("stream");

class ShardStream extends Transform {
  constructor(chunkSize = 10 * 1024 * 1024, options = {}) {
    // Default 10MB
    super({ ...options, readableObjectMode: true });
    this.chunkSize = chunkSize;
    this.buffer = Buffer.alloc(0);
    this.chunkIndex = 0;
  }

  _transform(chunk, encoding, callback) {
    try {
      // Append new chunk to buffer
      this.buffer = Buffer.concat([this.buffer, chunk]);

      // While we have enough data for a full chunk
      while (this.buffer.length >= this.chunkSize) {
        const shard = this.buffer.slice(0, this.chunkSize);
        this.buffer = this.buffer.slice(this.chunkSize);

        this.push({
          index: this.chunkIndex++,
          data: shard,
        });
      }

      callback();
    } catch (err) {
      callback(err);
    }
  }

  _flush(callback) {
    try {
      // Push remaining data as the last chunk
      if (this.buffer.length > 0) {
        this.push({
          index: this.chunkIndex++,
          data: this.buffer,
        });
      }
      callback();
    } catch (err) {
      callback(err);
    }
  }
}

module.exports = ShardStream;
