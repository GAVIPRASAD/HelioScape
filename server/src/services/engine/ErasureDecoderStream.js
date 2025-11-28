const { Transform } = require("stream");

/**
 * ErasureDecoderStream (RAID 5 / XOR Parity)
 *
 * Reconstructs missing chunks using parity.
 * Input: Chunk Objects { index, data, type }
 * Output: Buffer (Data Chunks only)
 */
class ErasureDecoderStream extends Transform {
  constructor(dataShards = 4, options = {}) {
    super({ ...options, objectMode: true });
    this.dataShards = dataShards;
    this.buffer = [];
    this.currentGroupIndex = 0;
  }

  _transform(chunkObj, encoding, callback) {
    // chunkObj: { index, data, type }
    // We group by "group index".
    // Data chunks 0-3 belong to group 0.
    // Parity chunk "0-3-parity" belongs to group 0.

    // Determine group
    let groupIndex;
    if (chunkObj.type === "parity") {
      // Parity index format: "start-end-parity"
      const parts = chunkObj.index.split("-");
      groupIndex = Math.floor(parseInt(parts[0]) / this.dataShards);
    } else {
      groupIndex = Math.floor(chunkObj.index / this.dataShards);
    }

    // If this is a new group, process the previous one
    if (groupIndex > this.currentGroupIndex) {
      this._processBuffer();
      this.currentGroupIndex = groupIndex;
    }

    this.buffer.push(chunkObj);
    callback();
  }

  _flush(callback) {
    if (this.buffer.length > 0) {
      this._processBuffer();
    }
    callback();
  }

  _processBuffer() {
    // 1. Organize chunks
    const dataChunks = new Array(this.dataShards).fill(null);
    let parityChunk = null;

    this.buffer.forEach((c) => {
      if (c.type === "parity") {
        parityChunk = c;
      } else {
        // Calculate local index within group (0 to dataShards-1)
        const localIndex = c.index % this.dataShards;
        dataChunks[localIndex] = c;
      }
    });

    // 2. Check for missing data
    const missingIndices = [];
    dataChunks.forEach((c, i) => {
      if (!c || !c.data) missingIndices.push(i);
    });

    if (missingIndices.length === 0) {
      // All data present, just emit
      dataChunks.forEach((c) => {
        if (c && c.data) this.push(c.data);
      });
      this.buffer = [];
      return;
    }

    // 3. Attempt Reconstruction
    if (missingIndices.length > 1) {
      // RAID 5 can only recover 1 missing chunk
      throw new Error(
        `ErasureDecoder: Too many missing chunks in group ${this.currentGroupIndex}. Cannot recover.`
      );
    }

    if (!parityChunk || !parityChunk.data) {
      throw new Error(
        `ErasureDecoder: Missing data chunk AND missing parity in group ${this.currentGroupIndex}. Cannot recover.`
      );
    }

    // Reconstruct the single missing chunk
    // Missing = Parity ^ Present1 ^ Present2 ...
    const missingIndex = missingIndices[0];
    console.log(
      `[ErasureDecoder] Reconstructing missing chunk at index ${missingIndex} in group ${this.currentGroupIndex}`
    );

    // We need to know the size. Assume size of parity chunk.
    const size = parityChunk.data.length;
    const reconstructedData = Buffer.alloc(size);

    // Initialize with Parity
    parityChunk.data.copy(reconstructedData);

    // XOR with all present data chunks
    dataChunks.forEach((c) => {
      if (c && c.data) {
        for (let i = 0; i < size; i++) {
          // Handle different sizes (last group might be smaller?)
          // ShardStream usually pads or we handle it.
          // For now assume equal size or handle bounds.
          if (i < c.data.length) {
            reconstructedData[i] ^= c.data[i];
          }
        }
      }
    });

    // Fill the hole
    dataChunks[missingIndex] = { data: reconstructedData };

    // Emit all
    dataChunks.forEach((c) => {
      this.push(c.data);
    });

    this.buffer = [];
  }
}

module.exports = ErasureDecoderStream;
