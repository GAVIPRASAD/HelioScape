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

  async _write(chunkObj, encoding, callback) {
    const { index, data } = chunkObj;

    // Metadata for this specific chunk
    const chunkMetadata = {
      name: `${this.fileMetadata.name}.part${index}`,
      originalName: this.fileMetadata.name,
      chunkIndex: index,
      size: data.length,
      mimeType: "application/octet-stream",
    };

    // Try to upload to providers in Round-Robin order, but failover if needed
    let attempts = 0;
    const maxAttempts = this.providers.length;
    let success = false;
    let lastError = null;

    // Start with the current provider index
    let providerIndex = this.currentProviderIndex;

    while (attempts < maxAttempts) {
      const provider = this.providers[providerIndex];

      try {
        // console.log(`[Distributor] Attempting upload chunk ${index} to ${provider.name}...`);

        // Create a fresh stream for each attempt
        const chunkStream = Readable.from(data);

        const result = await provider.upload(chunkStream, chunkMetadata);

        this.uploadedChunks.push({
          index,
          provider: provider.name,
          providerId: provider.id, // Store specific provider instance ID
          providerFileId: result.fileId,
          size: result.size,
        });

        success = true;
        // Update global index for next chunk to maintain round-robin from this successful provider
        this.currentProviderIndex = (providerIndex + 1) % this.providers.length;
        break; // Success!
      } catch (err) {
        console.warn(
          `[Distributor] Failed to upload chunk ${index} to ${provider.name}: ${err.message}`
        );
        lastError = err;
        attempts++;
        // Move to next provider
        providerIndex = (providerIndex + 1) % this.providers.length;
      }
    }

    if (success) {
      callback();
    } else {
      console.error(
        `[Distributor] All providers failed for chunk ${index}. Initiating Rollback.`
      );
      await this.rollback();
      callback(
        new Error(
          `Upload failed for chunk ${index} after trying all providers. Last error: ${lastError?.message}`
        )
      );
    }
  }

  /**
   * Rollback: Delete all uploaded chunks for this file.
   */
  async rollback() {
    console.log("[Distributor] Rolling back uploads...");
    const deletions = this.uploadedChunks.map(async (chunk) => {
      try {
        // Find the provider instance
        // We stored provider.name, but we need the instance.
        // If we have multiple accounts of same provider, name might be ambiguous?
        // We should store provider.id in uploadedChunks! (Added above)
        const provider =
          this.providers.find((p) => p.id === chunk.providerId) ||
          this.providers.find((p) => p.name === chunk.provider);

        if (provider) {
          await provider.delete(chunk.providerFileId);
          console.log(
            `[Distributor] Rolled back chunk ${chunk.index} from ${provider.name}`
          );
        }
      } catch (err) {
        console.error(
          `[Distributor] Failed to rollback chunk ${chunk.index}:`,
          err
        );
      }
    });

    await Promise.allSettled(deletions);
    this.uploadedChunks = [];
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
