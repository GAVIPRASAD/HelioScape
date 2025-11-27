const { Writable } = require("stream");
const { Readable } = require("stream");

/**
 * DistributorStream
 *
 * A Writable stream that receives file chunks and uploads them to cloud providers.
 *
 * Features:
 * - Round-Robin Distribution: Distributes chunks evenly across available providers.
 * - Manifest Generation: Tracks where each chunk is stored (Provider + File ID).
 * - Backpressure Handling: Waits for uploads to complete before processing more chunks.
 */
class DistributorStream extends Writable {
  /**
   * @param {Array<Object>} providers - List of initialized CloudProvider instances.
   * @param {Object} fileMetadata - Metadata about the file being uploaded.
   * @param {string} fileMetadata.name - The original name of the file.
   * @param {number} fileMetadata.size - The total size of the file in bytes.
   * @param {string} [fileMetadata.type] - The MIME type of the file.
   * @param {Object} [options={}] - Options for the Writable stream.
   */
  constructor(providers, fileMetadata, options = {}) {
    super({ ...options, objectMode: true });
    this.providers = providers;
    this.fileMetadata = fileMetadata; // { name, size, type, etc. }
    this.uploadedChunks = [];
    this.currentProviderIndex = 0;
  }

  _write(chunkObj, encoding, callback) {
    // chunkObj is { index, data } from ShardStream
    const { index, data } = chunkObj;

    // Select provider (Round Robin)
    const provider = this.providers[this.currentProviderIndex];
    this.currentProviderIndex =
      (this.currentProviderIndex + 1) % this.providers.length;

    // Create a stream from the buffer for the provider's upload method
    const chunkStream = Readable.from(data);

    // Metadata for this specific chunk
    const chunkMetadata = {
      name: `${this.fileMetadata.name}.part${index}`,
      originalName: this.fileMetadata.name,
      chunkIndex: index,
      size: data.length,
      mimeType: "application/octet-stream",
    };

    // console.log(
    //   `[Distributor] Uploading chunk ${index} (${data.length} bytes) to ${provider.name}...`
    // );

    provider
      .upload(chunkStream, chunkMetadata)
      .then((result) => {
        this.uploadedChunks.push({
          index,
          provider: provider.name,
          providerFileId: result.fileId,
          size: result.size,
          // Add hash/checksum here later for integrity
        });
        // console.log(`[Distributor] Chunk ${index} uploaded successfully.`);
        callback();
      })
      .catch((err) => {
        console.error(
          `[Distributor] Error uploading chunk ${index} to ${provider.name}:`,
          err
        );
        // TODO: Implement retry logic or try another provider
        callback(err);
      });
  }

  getManifest() {
    return {
      fileName: this.fileMetadata.name,
      totalSize: this.uploadedChunks.reduce(
        (acc, chunk) => acc + chunk.size,
        0
      ),
      chunks: this.uploadedChunks.sort((a, b) => a.index - b.index),
    };
  }
}

module.exports = DistributorStream;
