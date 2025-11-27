# HelioScape Architecture Guide

## Overview

HelioScape is a distributed cloud storage aggregator. It allows users to combine multiple free cloud storage accounts (Google Drive, Dropbox, etc.) into a single, secure, and large virtual drive.

## Core Concepts

### 1. The "Engine" (Stream Pipeline)

The heart of HelioScape is its streaming pipeline, which processes files on-the-fly without storing them permanently on the server.

**Upload Flow:**
`Client` -> `Busboy (Parse)` -> `CipherStream (Encrypt)` -> `ShardStream (Split)` -> `DistributorStream (Upload)` -> `Cloud Providers`

**Download Flow:**
`Cloud Providers` -> `Provider Stream` -> `DecipherStream (Decrypt)` -> `Client`

### 2. Security (Encryption)

- **Algorithm**: AES-256-GCM (Authenticated Encryption).
- **Key Management**: Each file has a unique 32-byte key generated at upload.
- **IV (Initialization Vector)**: A unique IV is generated for each file/stream. It is prepended to the encrypted data.
- **Auth Tag**: The GCM authentication tag is appended to the end of the stream to verify integrity.

### 3. Data Model

- **User**: Stores authentication info and linked cloud accounts (OAuth tokens).
- **File**: Stores metadata (name, size, mimeType) and the "manifest" of chunks.
  - `encryption.key`: The file-specific encryption key (stored securely).
  - `chunks`: Array of chunk metadata (provider, fileId, size).

## Project Structure

### Server (`/server`)

- **`src/services/engine/`**: The core streaming logic.
  - `CipherStream.js`: Encrypts data.
  - `DecipherStream.js`: Decrypts data.
  - `ShardStream.js`: Splits data into chunks (e.g., 10MB).
  - `DistributorStream.js`: Routes chunks to available cloud providers.
- **`src/services/cloud/`**: Cloud provider integrations.
  - `GoogleDriveProvider.js`: Google Drive API implementation.
  - `LocalFileSystemProvider.js`: Local disk storage (for testing/dev).
- **`src/controllers/`**: Request handlers.
  - `uploadController.js`: Orchestrates the upload/download pipelines.
  - `authController.js`: Handles user registration/login.

### Client (`/client`)

- **`src/pages/`**: Main application views (Dashboard, Files, Settings).
- **`src/hooks/`**: Custom React hooks (Data fetching).
- **`src/store/`**: Global state management (Zustand).
  - `useAuthStore.js`: Handles auth tokens with local storage encryption.

## Key Workflows

### Uploading a File

1.  User uploads a file via the Dashboard.
2.  Server generates a random encryption key.
3.  File is encrypted -> split into 10MB chunks.
4.  Chunks are round-robin distributed to linked providers (e.g., Chunk 1 -> Google, Chunk 2 -> Dropbox).
5.  Database stores the file map (which chunk is where).

### Downloading a File

1.  User requests a file download.
2.  Server looks up the file and its chunks.
3.  Server fetches the encrypted stream from the provider.
4.  Server decrypts the stream using the stored key.
5.  Decrypted data is streamed directly to the user's browser.
