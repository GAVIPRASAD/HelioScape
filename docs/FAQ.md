# HelioScape — Frequently Asked Questions

30 answered questions grouped by topic. Answers reflect the **actual behavior of the code** in this repository, including its current limitations.

- [General & Concept](#general--concept)
- [Storage & Providers](#storage--providers)
- [Security & Privacy](#security--privacy)
- [Uploads, Downloads & Redundancy](#uploads-downloads--redundancy)
- [Accounts & Authentication](#accounts--authentication)
- [Setup & Operations](#setup--operations)
- [Development](#development)

---

## General & Concept

### 1. What exactly is HelioScape?
A "meta-cloud" storage aggregator. It combines the free storage of several cloud accounts (Google Drive, Dropbox, MEGA) into one large virtual drive by encrypting your files, splitting them into shards, and spreading those shards across your linked accounts. No single provider ever holds a complete, readable file.

### 2. Why would I want this instead of just using Google Drive?
Two reasons: **capacity** (pool many free tiers into one bigger drive) and **privacy through fragmentation** (each provider only stores encrypted fragments, not your whole file). It's also a strong demonstration of streaming, encryption, and distributed-systems engineering.

### 3. Is this production-ready?
No. HelioScape is a portfolio / educational project. It runs in Docker dev mode, has a known key-storage limitation (see [Q13](#13-is-helioscape-really-zero-knowledge)), and hasn't been security-audited. Don't store irreplaceable or sensitive data in it.

### 4. What does "RAID for the cloud" mean here?
By default, shards are **striped** round-robin across providers (RAID-0 style) to maximize capacity. Optionally you can enable **RAID-5 mode**, which adds an XOR parity shard per group so a file survives the loss of one shard per group.

### 5. What's the tech stack in one line?
React 18 + Vite + Tailwind + Zustand + React Query on the front; Node.js + Express + Mongoose + native `stream`/`crypto` on the back; MongoDB for data; Docker Compose to run it all.

### 6. Where's the "brain" of the system?
[`server/src/controllers/uploadController.js`](../server/src/controllers/uploadController.js) orchestrates both the upload and download pipelines, and [`server/src/services/engine/`](../server/src/services/engine/) contains the streaming components that do the encryption, sharding, distribution, and recovery.

---

## Storage & Providers

### 7. Which cloud providers are actually supported?
In the current code: **Google Drive**, **Dropbox**, and **MEGA**, plus a **local filesystem mock** used as a fallback. (Older docs mentioned OneDrive and S3-compatible providers; those adapters are **not** implemented.)

### 8. What happens if I don't link any cloud accounts?
HelioScape falls back to two local mock "disks" (`server/storage_mock/disk1` and `disk2`) and stripes shards across them. This makes the app fully usable for testing without any external API keys.

### 9. How big are the shards?
**10 MB** each (the last shard of a file may be smaller). This is defined in `ShardStream` and `CHUNK_SIZE`.

### 10. Where on each provider do my shards go?
- **Google Drive**: a hidden `appDataFolder` (not visible in your normal Drive UI).
- **Dropbox**: a folder named `/HelioScape_Vault_DO_NOT_DELETE`.
- **MEGA**: a folder named `HelioScape_Vault_DO_NOT_DELETE`.
- **Local**: `storage_mock/disk1` and `disk2`.

### 11. Can I use multiple accounts from the same provider?
Yes. Each linked account is tracked separately as `google-<id>`, `dropbox-<id>`, etc., and the manifest records exactly which account holds each shard. Downloads can even fail over to your *other* accounts of the same provider.

### 12. How do I see how my data is distributed?
Three places: **/visualizer** (animated network topology), **/distribution/files** (a per-file bar showing which providers hold its shards), and **/distribution/accounts** (per-account usage vs. real cloud quota).

---

## Security & Privacy

### 13. Is HelioScape really "zero-knowledge"?
**Not currently.** Files are encrypted with AES-256-GCM, and providers only ever see encrypted shards — but the **per-file encryption key is stored in the database in plaintext hex** (the code marks this with a `TODO`/`INSECURE` note). So the server can decrypt your files. It is accurate to call it *encryption-at-provider*, not end-to-end zero-knowledge. See [SECURITY.md](SECURITY.md).

### 14. What encryption is used?
**AES-256-GCM** with a unique random 32-byte key per file, a 16-byte IV prepended to the stream, and a 16-byte authentication tag appended. GCM means integrity is verified on download — tampered data fails to decrypt.

### 15. How are my cloud credentials stored?
OAuth access/refresh tokens and MEGA credentials are stored on the `User` document and **encrypted at rest** using `mongoose-field-encryption`. The encryption secret is currently `JWT_SECRET`.

### 16. Why does MEGA need my password when Google/Dropbox use OAuth?
MEGA is genuinely zero-knowledge: the account **password is the decryption key**. There's no OAuth token that would let the server read/write files. So HelioScape uses a "credentials proxy" — it stores your MEGA email+password (encrypted at rest) and logs in on the fly for each operation.

### 17. Is my login password safe?
Passwords are hashed with **bcrypt** (cost factor 12) and never stored in plaintext. The password field is excluded from queries by default (`select: false`).

### 18. Is the JWT in my browser safe?
The JWT is stored in `localStorage` but **AES-encrypted with crypto-js** before being written. Caveat: the encryption key comes from `VITE_STORAGE_KEY` and falls back to a **hardcoded literal** if that env var is unset, which weakens the protection. This is client-side obfuscation, not a hard guarantee.

### 19. Can a hacked provider read my files?
No — a single provider only holds encrypted shards of your data, not the whole file and not the key. However, anyone with **database access** could recover both the manifest and the keys (see [Q13](#13-is-helioscape-really-zero-knowledge)).

### 20. What's the single most important security fix on the roadmap?
Encrypt the per-file keys before storing them — ideally deriving a master key from the user's password so the server never persists a usable decryption key. This is what would make the "zero-knowledge" claim true. See [SECURITY.md](SECURITY.md#roadmap).

---

## Uploads, Downloads & Redundancy

### 21. How does HelioScape handle huge files without running out of memory?
Everything is **streamed**. The file flows through `Cipher → Shard → Distributor` in ~10 MB windows; the server never buffers the whole file. Combined with backpressure in the distributor, memory stays roughly constant regardless of file size.

### 22. What happens if one provider fails during an upload?
The `DistributorStream` **fails over** to the next provider for that shard. If *every* provider fails for a shard, it **rolls back** — deleting all shards already uploaded for that file — so you're never left with a half-uploaded, orphaned mess.

### 23. What does "High Redundancy" mode do?
It enables **RAID-5 XOR parity**: for every 4 data shards, a 5th parity shard is computed and distributed. If you later lose one shard in a group (e.g., a provider deletes it), HelioScape reconstructs it from the parity. Cost: ~25% extra storage.

### 24. How many shards can I lose and still recover my file?
With RAID-5 mode: **one shard per group of 4**. Lose two or more in the same group and that file becomes unrecoverable. Without redundancy: losing *any* shard loses the file.

### 25. How does download reassembly work?
The server reads the file's **manifest** (`chunks`), fetches each shard from its provider (sorted by index), pipes them sequentially into a `DecipherStream`, and streams the decrypted result to your browser. In RAID-5 mode it processes group-by-group and reconstructs any single missing shard first.

### 26. Does the upload progress bar reflect distribution to providers?
No — the browser progress bar tracks bytes uploaded **to the HelioScape server**. The encryption, sharding, and provider distribution happen server-side after those bytes arrive.

---

## Accounts & Authentication

### 27. Why did I get an OTP code instead of logging straight in?
HelioScape uses **email OTP verification**. New accounts must verify their email; unverified users are prompted to enter a 6-digit code (valid 10 minutes) before a session is issued. Password reset works the same way. If no SMTP server is configured, the code is printed to the **server logs**.

### 28. I can't unlink a cloud account — why?
For safety, HelioScape **blocks unlinking an account that still holds file shards**. Delete the files stored on that account first, then unlink it. This prevents orphaning data you can no longer retrieve.

---

## Setup & Operations

### 29. How do I run it, and what URLs do I get?
Run `./setup.sh` (or `docker compose up -d --build`). Then: frontend at **:5173**, API at **:5000**, Swagger docs at **:5000/api-docs**, and Mongo Express DB admin at **:8081**. Full instructions are in the [README](../README.md#quick-start).

---

## Development

### 30. I noticed two upload stores / an OAuth callback hardcoded to Google. Are those bugs?
They're rough edges of an evolving codebase, documented here for honesty:
- **Two transfer stores exist**: `useTransferStore` + `TransferManager` is the **live** path (mounted in `Layout`); `useUploadStore` + `UploadManager` is an earlier variant that isn't mounted.
- **`OAuthCallback.jsx` hardcodes the provider to `"google"`** (with a `TODO` to derive it from the OAuth `state` parameter), so the client-side link flow currently assumes Google.
- **`authService.js` reads `VITE_API_URL` with no fallback**, while `constants.js` falls back to `http://localhost:5000/api` — so auth calls can hit `undefined/...` if the env var is missing. Set `VITE_API_URL` to be safe.

These are good starter tasks if you want to contribute.

---

## Still have questions?

- System design → [ARCHITECTURE.md](ARCHITECTURE.md)
- The write path → [UPLOAD-FLOW.md](UPLOAD-FLOW.md)
- The read path → [DOWNLOAD-FLOW.md](DOWNLOAD-FLOW.md)
- Trust model → [SECURITY.md](SECURITY.md)
- Provider setup → [PROVIDERS.md](PROVIDERS.md)
- REST endpoints → [API.md](API.md)
