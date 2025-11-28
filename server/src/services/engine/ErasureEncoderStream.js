const { Transform } = require("stream");

/**
 * ErasureEncoderStream (RAID 5 / XOR Parity)
 *
 * Buffers N data chunks and generates 1 parity chunk.
 * Parity = Chunk1 ^ Chunk2 ^ ... ^ ChunkN
 *
 * Output: Emits N data chunks followed by 1 parity chunk.
 */
class ErasureEncoderStream extends Transform {
  constructor(dataShards = 4, options = {}) {
    super({ ...options, objectMode: true });
    this.dataShards = dataShards;
    this.buffer = [];
  }

  _transform(chunkObj, encoding, callback) {
    // chunkObj is { index, data }
    this.buffer.push(chunkObj);

    // If buffer is full, process the group
    if (this.buffer.length === this.dataShards) {
      this._processBuffer();
    }

    callback();
  }

  _flush(callback) {
    // Process any remaining chunks in the buffer
    if (this.buffer.length > 0) {
      this._processBuffer();
    }
    callback();
  }

  _processBuffer() {
    // 1. Calculate Parity
    // Find the max length to pad smaller chunks if necessary (though ShardStream usually makes equal chunks except last)
    const maxLength = Math.max(...this.buffer.map((c) => c.data.length));
    const parityData = Buffer.alloc(maxLength);

    this.buffer.forEach((chunk) => {
      for (let i = 0; i < chunk.data.length; i++) {
        parityData[i] ^= chunk.data[i];
      }
    });

    // 2. Emit Data Chunks
    this.buffer.forEach((chunk) => {
      this.push({
        ...chunk,
        type: "data",
      });
    });

    // 3. Emit Parity Chunk
    // We need a unique index for parity. Let's use a convention or separate field.
    // DistributorStream expects 'index'.
    // Let's append parity after the group.
    // But index needs to be unique for the file.
    // ShardStream gives sequential indices 0, 1, 2...
    // We should probably keep the original index for data chunks.
    // For parity, we can use a special index or just a high number?
    // Better: Add `isParity: true` and let Distributor handle it.
    // But Distributor uses index for naming `part${index}`.
    // We can name parity chunks `part${groupIndex}_parity`.

    // Actually, let's just emit it. The Distributor will upload it.
    // We need to give it an index.
    // If we have chunks 0, 1, 2, 3. Parity could be "0-3-parity".
    // But Distributor expects integer index? No, it uses it for string template.

    const groupStart = this.buffer[0].index;
    const groupEnd = this.buffer[this.buffer.length - 1].index;

    this.push({
      index: `${groupStart}-${groupEnd}-parity`,
      data: parityData,
      type: "parity",
      group: [groupStart, groupEnd],
    });

    // Clear buffer
    this.buffer = [];
  }
}

module.exports = ErasureEncoderStream;
