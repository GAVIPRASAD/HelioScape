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
