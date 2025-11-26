const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const CipherStream = require("./CipherStream");
const ShardStream = require("./ShardStream");
const DistributorStream = require("./DistributorStream");
const LocalFileSystemProvider = require("../cloud/LocalFileSystemProvider");

async function runTest() {
  console.log("Starting Pipeline Test...");

  // 1. Setup Mock Providers
  const localProvider1 = new LocalFileSystemProvider("local-1", {
    storagePath: path.join(__dirname, "../../../storage_mock/disk1"),
  });
  const localProvider2 = new LocalFileSystemProvider("local-2", {
    storagePath: path.join(__dirname, "../../../storage_mock/disk2"),
  });
  const providers = [localProvider1, localProvider2];

  // 2. Create Dummy Input File (25MB)
  const inputFilePath = path.join(__dirname, "test_input.dat");
  if (!fs.existsSync(inputFilePath)) {
    console.log("Creating dummy file (25MB)...");
    const buffer = crypto.randomBytes(25 * 1024 * 1024);
    fs.writeFileSync(inputFilePath, buffer);
  }

  // 3. Setup Streams
  const readStream = fs.createReadStream(inputFilePath);

  // Encryption Key (32 bytes for AES-256)
  const key = crypto.randomBytes(32);
  const cipherStream = new CipherStream(key);

  // Shard Stream (10MB chunks)
  const shardStream = new ShardStream(10 * 1024 * 1024);

  // Distributor Stream
  const fileMetadata = { name: "test_input.dat", size: 25 * 1024 * 1024 };
  const distributorStream = new DistributorStream(providers, fileMetadata);

  // 4. Run Pipeline
  console.log("Pipeline started...");

  readStream.pipe(cipherStream).pipe(shardStream).pipe(distributorStream);

  distributorStream.on("finish", () => {
    console.log("Pipeline finished successfully!");
    const manifest = distributorStream.getManifest();
    console.log("Manifest:", JSON.stringify(manifest, null, 2));

    // Cleanup
    // fs.unlinkSync(inputFilePath);
  });

  distributorStream.on("error", (err) => {
    console.error("Pipeline failed:", err);
  });
}

runTest();
