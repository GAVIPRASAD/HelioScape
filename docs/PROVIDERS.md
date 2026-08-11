# HelioScape — Cloud Providers

How each storage backend is integrated, and step-by-step instructions to obtain the API keys needed to link real accounts.

- [The adapter pattern](#the-adapter-pattern)
- [Provider comparison](#provider-comparison)
- [Google Drive](#google-drive)
- [Dropbox](#dropbox)
- [MEGA](#mega)
- [Local mock (no setup)](#local-mock-no-setup)
- [How a shard's provider is recorded](#how-a-shards-provider-is-recorded)
- [A note on OneDrive & S3](#a-note-on-onedrive--s3)

---

## The adapter pattern

Every backend implements the same abstract interface, [`CloudProvider`](../server/src/services/cloud/CloudProvider.js):

```mermaid
classDiagram
    class CloudProvider {
        <<abstract>>
        +string name
        +authenticate()
        +exchangeCode(code)
        +validateToken(tokenData)
        +upload(fileStream, metadata) : {fileId, size}
        +download(fileId) : ReadableStream
        +delete(fileId)
        +getQuota(tokenData) : {total, used, available}
    }
    CloudProvider <|-- GoogleDriveProvider
    CloudProvider <|-- DropboxProvider
    CloudProvider <|-- MegaProvider
    CloudProvider <|-- LocalFileSystemProvider
```

Because the streaming engine (`DistributorStream`) only ever calls `upload()` / `download()` / `delete()`, adding a new provider means writing one class — nothing in the pipeline changes. This is the key extensibility point of the system (see [ARCHITECTURE.md](ARCHITECTURE.md)).

Two auth styles exist:
- **OAuth providers** (Google, Dropbox): `authenticate()` returns a consent URL; `exchangeCode()` swaps the returned code for `{ accessToken, refreshToken, expiryDate, email, providerId }`.
- **Credentials proxy** (MEGA): `login(email, password)` verifies immediately and returns a credentials blob that gets encrypted at rest.

---

## Provider comparison

| | Google Drive | Dropbox | MEGA | Local mock |
| :--- | :--- | :--- | :--- | :--- |
| Auth | OAuth 2.0 | OAuth 2.0 | email + password | none |
| Token refresh | auto (`googleapis`), persisted via `onTokenRefresh` | auto (SDK, given refresh token) | n/a (re-login each op) | n/a |
| Storage location | hidden `appDataFolder` | `/HelioScape_Vault_DO_NOT_DELETE` | `HelioScape_Vault_DO_NOT_DELETE` | `storage_mock/disk1`,`disk2` |
| File id stored | Drive file id | Dropbox file id (path used for download) | node handle | absolute file path |
| Quota source | `drive.about.storageQuota` | `usersGetSpaceUsage` | `getAccountInfo` | mocked (100 GB) |
| Setup required | `.env` keys | `.env` keys | entered in UI | none |

---

## Google Drive

**Adapter:** [GoogleDriveProvider.js](../server/src/services/cloud/GoogleDriveProvider.js)

- Uploads land in the hidden **`appDataFolder`** — invisible in the user's normal Drive UI, so the vault doesn't clutter their account.
- Requests `access_type: "offline"` and `prompt: "consent"` to guarantee a **refresh token**.
- On token refresh, the `googleapis` client emits a `tokens` event; HelioScape's `onTokenRefresh` callback persists the new tokens back to the `User` document.
- Scopes requested: `drive.appdata`, `drive.metadata.readonly`, `userinfo.email`, `userinfo.profile`.

### Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/) → create/select a project.
2. **APIs & Services → Library** → enable the **Google Drive API**.
3. **APIs & Services → OAuth consent screen** → configure (External is fine for testing) and add your Google account as a **test user**.
4. **APIs & Services → Credentials → Create Credentials → OAuth client ID** → type **Web application**.
5. Add an **Authorized redirect URI**:
   ```
   http://localhost:5000/api/oauth/google/callback
   ```
6. Copy the **Client ID** and **Client Secret** into your root `.env`:
   ```dotenv
   GOOGLE_CLIENT_ID=your_client_id
   GOOGLE_CLIENT_SECRET=your_client_secret
   GOOGLE_CALLBACK_URL=http://localhost:5000/api/oauth/google/callback
   ```
7. Restart the server and link the account from **Settings → Cloud Accounts**.

---

## Dropbox

**Adapter:** [DropboxProvider.js](../server/src/services/cloud/DropboxProvider.js)

- Shards are written to **`/HelioScape_Vault_DO_NOT_DELETE`** (Dropbox auto-creates the parent folder).
- Uses OAuth with `token_access_type=offline` to receive a refresh token; the SDK auto-refreshes when given `clientId` + `clientSecret` + `refreshToken`.
- Simple upload is used per shard (10 MB is well under Dropbox's 150 MB simple-upload limit).
- Download uses a direct `fetch` to `content.dropboxapi.com` to guarantee a **streaming** body rather than buffering.

### Setup

1. Go to the [Dropbox App Console](https://www.dropbox.com/developers/apps) → **Create app**.
2. Choose **Scoped access** and **Full Dropbox** (or App folder) access.
3. Under **Permissions**, enable at least: `files.content.write`, `files.content.read`, `account_info.read`. Submit.
4. Under **Settings → OAuth 2 → Redirect URIs**, add:
   ```
   http://localhost:5000/api/oauth/dropbox/callback
   ```
5. Copy the **App key** and **App secret** into `.env`:
   ```dotenv
   DROPBOX_CLIENT_ID=your_app_key
   DROPBOX_CLIENT_SECRET=your_app_secret
   DROPBOX_CALLBACK_URL=http://localhost:5000/api/oauth/dropbox/callback
   ```
6. Restart the server and link from **Settings → Cloud Accounts**.

---

## MEGA

**Adapter:** [MegaProvider.js](../server/src/services/cloud/MegaProvider.js)

MEGA is genuinely **zero-knowledge**: the account password *is* the decryption key, so there is no OAuth token that would let the server read or write files. HelioScape solves this with a **"credentials proxy"**:

```mermaid
sequenceDiagram
    participant UI as Settings UI
    participant API as POST /oauth/mega/login
    participant M as MegaProvider
    participant DB as MongoDB (User)

    UI->>API: { email, password }
    API->>M: login(email, password)
    M->>M: new Storage({email,password}); await ready  (verifies)
    M-->>API: JSON.stringify({email, password})
    API->>DB: save on User (encrypted at rest via mongoose-field-encryption)
    Note over M,DB: On each later op, credentials are<br/>decrypted and MEGA logs in "on the fly"
```

- Vault folder: **`HelioScape_Vault_DO_NOT_DELETE`** in the account root, created on first upload.
- Files are addressed by their MEGA **node handle**, stored in the manifest.
- If the stored session is invalid, the adapter throws a clear *"Please Unlink and Re-connect"* error, which triggers download failover or upload rollback.

### Setup

No `.env` keys or developer app required. In the app: **Settings → Cloud Accounts → Link MEGA**, enter your MEGA email and password. (The `MEGA_EMAIL` / `MEGA_PASSWORD` env vars exist only for optional server-side mock defaults and are not part of the user flow.)

> ⚠️ **Trust note:** because MEGA has no token model, HelioScape stores your MEGA **password** (encrypted at rest with `mongoose-field-encryption`, keyed by `JWT_SECRET`). Understand this before linking a real MEGA account. See [SECURITY.md](SECURITY.md).

---

## Local mock (no setup)

**Adapter:** [LocalFileSystemProvider.js](../server/src/services/cloud/LocalFileSystemProvider.js)

When a user has **no linked accounts**, the upload controller instantiates two local providers so the pipeline always has somewhere to write:

| Id | Path |
| :--- | :--- |
| `local-1` | `server/storage_mock/disk1` |
| `local-2` | `server/storage_mock/disk2` |

- `fileId` is the absolute path on disk; `download()` returns a `fs.createReadStream`.
- `getQuota()` returns a mocked 100 GB total.
- This makes the entire app — encrypt, shard, distribute, reassemble, decrypt — fully testable with **zero external credentials**.

---

## How a shard's provider is recorded

Each shard's `provider` field in the manifest is a tagged id so downloads can find the exact account and fail over to siblings:

| Format | Example | Resolves to |
| :--- | :--- | :--- |
| `google-<providerId>` | `google-108…` | that Google account, then other Google accounts |
| `dropbox-<providerId>` | `dropbox-dbid:AAB…` | that Dropbox account, then other Dropbox accounts |
| `mega-<providerId>` | `mega-<handle-scope>` | that MEGA account, then other MEGA accounts |
| `local-1` / `local-2` | `local-1` | the matching mock disk |

The download path parses this prefix in `getCandidateProviders()` — see [DOWNLOAD-FLOW.md — Provider Resolution & Failover](DOWNLOAD-FLOW.md#5-provider-resolution--failover).

---

## A note on OneDrive & S3

Earlier documentation referenced **OneDrive** and **S3-compatible** providers. **These adapters are not implemented** in the current codebase — only Google Drive, Dropbox, MEGA, and the local mock exist. (The OAuth route's enum still lists `onedrive` as a placeholder, but there is no `OneDriveProvider`.) Implementing one is a matter of extending `CloudProvider` and registering it in the upload controller's provider-selection logic — a good contribution starting point.
