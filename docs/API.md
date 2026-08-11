# HelioScape — REST API Reference

Complete reference for the HelioScape backend. All routes are mounted under `/api` (see [server/src/index.js](../server/src/index.js)).

> The canonical, always-in-sync spec is the **Swagger UI at `http://localhost:5000/api-docs`** (generated from `swagger-jsdoc` annotations in the route files). This document is a human-readable companion.

- [Conventions](#conventions)
- [Authentication](#authentication)
- [Auth endpoints](#auth-endpoints)
- [User endpoints](#user-endpoints)
- [OAuth / Account linking](#oauth--account-linking)
- [Files](#files)
- [Folders](#folders)
- [Providers](#providers)
- [Error format](#error-format)

---

## Conventions

| Property | Value |
| :--- | :--- |
| Base URL | `http://localhost:5000/api` (configurable via `VITE_API_URL`) |
| Content type | `application/json` unless noted (uploads use `multipart/form-data`) |
| Auth scheme | `Authorization: Bearer <JWT>` |
| Success envelope | Most JSON responses use `{ "status": "success", "data": { ... } }` |
| Token lifetime | JWT valid for **10 days** |
| Body size limit | **500 MB** (Express `json`/`urlencoded`) |

Route prefixes:

| Prefix | Router |
| :--- | :--- |
| `/api/auth` | `authRoutes.js` |
| `/api/users` | `userRoutes.js` |
| `/api/oauth` | `oauthRoutes.js` |
| `/api/files` | `uploadRoutes.js` |
| `/api/folders` | `folderRoutes.js` |
| `/api/providers` | `providerRoutes.js` |

---

## Authentication

HelioScape uses stateless **JWT** auth. Obtain a token by registering + verifying (or logging in + verifying, if login OTP is required), then send it as a Bearer header on every protected route.

All routes are protected **except** the public auth endpoints: `register`, `login`, `verify-email`, `verify-login`, `forgot-password`, `reset-password`, and the OAuth `:provider/callback`.

---

## Auth endpoints

Base: `/api/auth`

### `POST /register`
Register a new user. Triggers an email-verification OTP.

```json
{ "email": "demo@helio.com", "password": "password123" }
```
- **201** — created; an OTP is emailed (or printed to server logs if SMTP is unset).
- **400** — duplicate email / validation error.

### `POST /login`
Authenticate with email + password.

```json
{ "email": "demo@helio.com", "password": "password123" }
```
- **200** — returns `{ token }` (or prompts for an OTP via `verify-login`, depending on verification state).
- **401** — incorrect email or password.

### `POST /verify-email`
Confirm a new account with the 6-digit OTP (valid 10 minutes).

```json
{ "email": "demo@helio.com", "otp": "123456" }
```
- **200** — `{ token, data: { user } }`.
- **400** — invalid/expired OTP.

### `POST /verify-login`
Complete an OTP-gated login.

```json
{ "email": "demo@helio.com", "otp": "123456" }
```
- **200** — login verified, returns a token. **400** — invalid OTP.

### `POST /forgot-password`
Request a password-reset OTP.

```json
{ "email": "demo@helio.com" }
```
- **200** — OTP sent. **404** — user not found.

### `POST /reset-password`
Set a new password using the reset OTP.

```json
{ "email": "demo@helio.com", "otp": "123456", "password": "newPassword123" }
```
- **200** — password reset. **400** — invalid OTP.

### `GET /me` 🔒
Return the authenticated user's profile.
- **200** — `{ status, data: { user } }`.

---

## User endpoints

Base: `/api/users` — **all protected** 🔒

### `PATCH /updateMe`
Update profile fields (e.g. `name`, `email`).

```json
{ "name": "Ada Lovelace", "email": "ada@helio.com" }
```

### `PATCH /updateMyPassword`
Change password while logged in.

```json
{ "passwordCurrent": "old", "password": "new", "passwordConfirm": "new" }
```

### `GET /me`
Alias of the auth profile endpoint. Returns the current user.

---

## OAuth / Account linking

Base: `/api/oauth`

### `GET /:provider` 🔒
Initiate an OAuth flow. `:provider` ∈ `google`, `dropbox`. Redirects (**302**) to the provider's consent screen.

### `GET /:provider/callback`
OAuth redirect target. Exchanges the `code` for tokens and links the account. **Public** (the provider calls it).

### `POST /:provider/link` 🔒
Client-side link flow — exchange an authorization `code` obtained by the browser.

```json
{ "code": "<oauth-code>", "redirectUri": "http://localhost:5173/oauth/callback" }
```
> ⚠️ The client's `OAuthCallback.jsx` currently hardcodes the provider to `"google"` (there's a `TODO` to derive it from the OAuth `state`). See [FAQ Q30](FAQ.md#30-i-noticed-two-upload-stores--an-oauth-callback-hardcoded-to-google-are-those-bugs).

### `POST /mega/login` 🔒
Link a MEGA account with email + password (the "credentials proxy" — see [PROVIDERS.md](PROVIDERS.md#mega)).

```json
{ "email": "you@example.com", "password": "your-mega-password" }
```
- **200** — MEGA account linked (credentials encrypted at rest).

### `DELETE /:provider/:providerId` 🔒
Unlink a specific linked account.
- **204** — unlinked.
- **Blocked** if that account still holds file shards (delete those files first). See [FAQ Q28](FAQ.md#28-i-cant-unlink-a-cloud-account--why).

---

## Files

Base: `/api/files` — **all protected** 🔒

### `GET /`
List files. Optional query: `folderId` (filter by folder), plus pagination (`page`, `limit`) handled by the controller.
- **200** — list of file documents.

### `POST /`
Upload a file. **`multipart/form-data`** with:

| Field | Meaning |
| :--- | :--- |
| `file` | the binary file (required) |
| `folderId` | target folder id, or `null`/omitted for root |

- **201** — `{ file }` with the saved manifest. Full pipeline in [UPLOAD-FLOW.md](UPLOAD-FLOW.md).

```bash
curl -X POST http://localhost:5000/api/files \
  -H "Authorization: Bearer <JWT>" \
  -F "file=@./photo.png" -F "folderId=null"
```

### `GET /media`
List media files (images/videos) — powers the Media gallery.

### `GET /search?q=<query>`
Search files by name. `q` is required.

### `GET /stats`
Aggregate storage statistics for the user.

### `GET /:id`
Get a single file's metadata.

### `GET /:id/download`
Stream the reassembled, decrypted file back. Sets `Content-Disposition` and `Content-Length = size − 32` (strips the 16-byte IV + 16-byte GCM tag). Full path in [DOWNLOAD-FLOW.md](DOWNLOAD-FLOW.md).

```bash
curl -H "Authorization: Bearer <JWT>" -o photo.png \
  "http://localhost:5000/api/files/<id>/download"
```

### `DELETE /:id`
Delete a file and remove every shard from its providers.
- **204** — deleted.

### `PATCH /:id/rename`
```json
{ "name": "new-name.png" }
```

### `PATCH /:id/move`
```json
{ "folderId": "<targetFolderId or null>" }
```

---

## Folders

Base: `/api/folders` — **all protected** 🔒

| Method & path | Purpose | Body |
| :--- | :--- | :--- |
| `GET /` | List folders (query `parentId`, defaults to root) | — |
| `POST /` | Create a folder | `{ "name": "...", "parentId": "..." }` |
| `GET /:id` | Get one folder | — |
| `DELETE /:id` | Delete folder + contents | — |
| `PATCH /:id/rename` | Rename | `{ "name": "..." }` |
| `PATCH /:id/move` | Move under a new parent | `{ "parentId": "<id or null>" }` |

> Moving a folder into itself (or a descendant) returns **400**.

---

## Providers

Base: `/api/providers` — **all protected** 🔒

### `GET /quota`
Aggregate storage quota across all linked providers.

```json
{
  "total": 123456789,
  "used": 42000000,
  "providers": [
    { "name": "google-<id>", "total": 16106127360, "used": 1048576 },
    { "name": "dropbox-<id>", "total": 2147483648, "used": 524288 }
  ]
}
```

---

## Error format

Errors flow through a central handler ([utils/errorHandler](../server/src/utils/errorHandler.js)) and use `AppError`. Typical shape:

```json
{ "status": "fail" | "error", "message": "Human-readable description" }
```

| Status | When |
| :--- | :--- |
| `400` | Validation error, bad OTP, invalid move |
| `401` | Missing/invalid JWT, wrong credentials |
| `404` | Resource not found / not owned by the user |
| `500` | Unexpected server error, `File corruption: No chunks found` |

> Downloads stream the body directly; if an error occurs **after** headers are sent, the stream is destroyed and a clean JSON error can no longer be returned (see [DOWNLOAD-FLOW.md — Failure Modes](DOWNLOAD-FLOW.md#8-failure-modes)).
