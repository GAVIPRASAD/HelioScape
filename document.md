# HelioScape

**Distributed Cloud Storage Aggregator (BYOS)**

HelioScape is a decentralized "Bring Your Own Storage" platform that aggregates free storage tiers from providers like Google Drive, Dropbox, and OneDrive into a single, encrypted, virtual file system. It features Zero-Knowledge Privacy by sharding and encrypting files before distribution.

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS ("Stratosphere" Theme)
- **Backend**: Node.js, Express
- **Database**: MongoDB (Metadata & Token Storage)
- **Infrastructure**: Docker, Docker Compose

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Node.js](https://nodejs.org/) (Optional, for local non-Docker dev)

## Getting Started

### Automated Setup (Recommended)

We provide a helper script to set up the environment and secrets automatically.

```bash
./setup.sh
```

This script will:

1.  Check for Docker.
2.  Generate secure secrets in `.env` (if not present).
3.  Build and start the containers.

### Manual Setup

1.  **Configure Environment**:
    Create a `.env` file in the root directory. You can use the example below as a template.

2.  **Start Services**:
    ```bash
    docker-compose up -d --build
    ```

Access the application:

- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend**: [http://localhost:5000](http://localhost:5000)

## Project Structure

```
HelioScape/
├── client/                 # React Frontend (Vite)
│   ├── src/
│   │   ├── components/     # UI Components
│   │   ├── context/        # React Context (Auth, Theme)
│   │   └── pages/          # Route Pages
│   └── Dockerfile
├── server/                 # Node.js Backend
│   ├── src/
│   │   ├── models/         # Mongoose Schemas
│   │   ├── services/       # Core Logic (Streams, Adapters)
│   │   └── routes/         # API Endpoints
│   └── Dockerfile
├── docker-compose.yml      # Container Orchestration
├── scaffold.sh             # Project Generator Script
└── setup.sh                # Environment Setup Script
```

## Configuration

The application is configured via the `.env` file.

| Variable            | Description                                      |
| :------------------ | :----------------------------------------------- |
| `PROJECT_NAME`      | Docker project name prefix (default: helioscape) |
| `SERVER_PORT`       | Port for the Express backend (default: 5000)     |
| `CLIENT_PORT`       | Port for the React frontend (default: 5173)      |
| `MONGO_USER`        | MongoDB root username                            |
| `MONGO_PASS`        | MongoDB root password                            |
| `JWT_SECRET`        | Secret key for signing JSON Web Tokens           |
| `GOOGLE_CLIENT_ID`  | OAuth Client ID for Google Drive                 |
| `DROPBOX_CLIENT_ID` | OAuth Client ID for Dropbox                      |

## Architecture

### Data Flow

1.  **Upload**: Client streams file to Server.
2.  **Processing**: Server encrypts (AES-256) and shards the stream in memory.
3.  **Distribution**: Shards are distributed to connected cloud providers.

### Security

- **Zero-Knowledge**: Cloud providers only see encrypted data chunks.
- **At-Rest Encryption**: OAuth refresh tokens are encrypted in MongoDB using `mongoose-field-encryption`.

## Deployment

### Render (Example)

- **Client**: Deploy as a Static Site. Build command: `npm run build`. Publish directory: `dist`.
- **Server**: Deploy as a Web Service. Build command: `npm install`. Start command: `npm start`.
- **Env Vars**: Ensure all `.env` variables are set in the deployment dashboard.

HelioScape Cloud Credentials Setup Guide

Version: 1.0.0
Purpose: Step-by-step instructions to obtain API keys for all supported cloud storage providers.

1. Google Drive API (OAuth 2.0)

Google requires strict configuration for Redirect URIs. You will need separate credentials (or updated URIs) for Development and Production.

Phase 1: Create Project & Enable API

Go to the Google Cloud Console.

Click Select a Project (top left) -> New Project. Name it HelioScape.

Open the Navigation Menu (☰) -> APIs & Services -> Library.

Search for Google Drive API and click Enable.

Phase 2: Configure Consent Screen

Go to APIs & Services -> OAuth consent screen.

User Type: Select External. Click Create.

App Info:

App Name: HelioScape

User Support Email: Your email.

Developer Contact: Your email.

Scopes: Add .../auth/drive.appdata, .../auth/userinfo.email, .../auth/userinfo.profile.

Test Users: (Critical for Testing Mode)

Click + ADD USERS.

Enter your personal Gmail address (e.g., your.email@gmail.com).

Note: In Production, you must click "Publish App" to remove this restriction (requires verification for wide release).

Phase 3: Create Credentials

Go to APIs & Services -> Credentials.

Click + CREATE CREDENTIALS -> OAuth client ID.

Application Type: Web application.

Name: HelioScape Client.

For Development (Localhost)

Authorized JavaScript Origins:

http://localhost:5173

http://localhost:5000

Authorized Redirect URIs:

http://localhost:5000/api/oauth/google/callback

For Production (Live Domain)

Authorized JavaScript Origins:

https://yourdomain.com

https://api.yourdomain.com

Authorized Redirect URIs:

https://api.yourdomain.com/api/oauth/google/callback

Click Create.

Copy: Client ID and Client Secret to your .env.

2. Dropbox API (OAuth 2.0)

Dropbox allows you to use the same App for both dev and prod, but it's cleaner to create two.

Steps

Go to the Dropbox App Console.

Click Create app.

Choose an API: Scoped access.

Choose the type of access: App folder (Recommended for privacy) or Full Dropbox.

Name your app: HelioScape-[Dev/Prod]-[YourName].

Click Create app.

Configuration (Settings Tab)

Redirect URIs: Add the following:

Dev: http://localhost:5000/api/oauth/dropbox/callback

Prod: https://api.yourdomain.com/api/oauth/dropbox/callback

App Key: This is your DROPBOX_CLIENT_ID.

App Secret: This is your DROPBOX_CLIENT_SECRET.

Permissions (Permissions Tab)

Check: files.content.write (Uploads).

Check: files.content.read (Downloads).

Click Submit at the bottom.

3. OneDrive / Microsoft Graph (OAuth 2.0)

This is done via the Azure Portal.

Steps

Go to Azure Portal > App Registrations.

Click + New Registration.

Name: HelioScape.

Supported Account Types: "Accounts in any organizational directory (Any Azure AD directory - Multitenant) and personal Microsoft accounts (e.g. Skype, Xbox)". (Critical for personal users).

Redirect URI (Web):

Dev: http://localhost:5000/api/oauth/onedrive/callback

Prod: https://api.yourdomain.com/api/oauth/onedrive/callback

Click Register.

Getting Keys

Application (client) ID: Copy this from the Overview page.

Client Secret:

Go to Certificates & secrets (Left Sidebar).

Click + New client secret.

Add a description and expiry.

Copy the "Value" immediately (It will be hidden later).

4. MEGA (Direct Credentials)

MEGA uses Zero-Knowledge Encryption derived from your password. It does not use OAuth.

Steps

Go to MEGA Registration.

Create a New Free Account specifically for this app (e.g., helioscape.bot@gmail.com).

Important: Do NOT enable 2FA on this account. The API library cannot handle 2FA easily.

Usage: Use the Email and Password directly in your .env file.

5. S3 Compatible Providers (Oracle, Backblaze, Cloudflare)

These use the standard S3 Access Key/Secret Key pair.

A. Cloudflare R2 (10GB Free)

Cloudflare Dash -> R2.

Manage R2 API Tokens -> Create API Token.

Permissions: Admin Read & Write.

Copy: Access Key ID, Secret Access Key, and Endpoint URL (e.g., https://<accountid>.r2.cloudflarestorage.com).

B. Backblaze B2 (10GB Free)

Backblaze Console -> App Keys.

Add a New Application Key.

Access: All Buckets.

Copy: keyID (Access Key) and applicationKey (Secret Key).

Endpoint: Go to "Buckets" to find your S3 Endpoint (e.g., s3.us-west-002.backblazeb2.com).

C. Oracle Cloud (10GB Free)

Oracle Console -> Profile -> My Profile.

Customer Secret Keys (Left/Bottom Menu).

Generate Key.

Copy: "Generated Key" (Secret) and "Access Key".

Endpoint: https://<namespace>.compat.objectstorage.<region>.oraclecloud.com.

6. Summary .env Template

# --- GOOGLE ---
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
# DEV: http://localhost:5000/api/oauth/google/callback
# PROD: [https://api.yourdomain.com/api/oauth/google/callback](https://api.yourdomain.com/api/oauth/google/callback)
GOOGLE_CALLBACK_URL=

# --- DROPBOX ---
DROPBOX_CLIENT_ID=
DROPBOX_CLIENT_SECRET=
# DEV: http://localhost:5000/api/oauth/dropbox/callback
# PROD: [https://api.yourdomain.com/api/oauth/dropbox/callback](https://api.yourdomain.com/api/oauth/dropbox/callback)
DROPBOX_CALLBACK_URL=

# --- ONEDRIVE ---
ONEDRIVE_CLIENT_ID=
ONEDRIVE_CLIENT_SECRET=
# DEV: http://localhost:5000/api/oauth/onedrive/callback
# PROD: [https://api.yourdomain.com/api/oauth/onedrive/callback](https://api.yourdomain.com/api/oauth/onedrive/callback)
ONEDRIVE_CALLBACK_URL=

# --- MEGA ---
MEGA_EMAIL=
MEGA_PASSWORD=

# --- GENERIC S3 (Oracle/Backblaze/R2) ---
S3_ACCESS_KEY=
S3_SECRET_KEY=
S3_ENDPOINT=
