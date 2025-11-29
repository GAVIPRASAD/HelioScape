HelioScape ☁️🛡️

Decentralized, Zero-Knowledge Cloud Storage Aggregator.
Your data is everywhere, so it is accessible to no one.

📖 Overview

HelioScape is a "Meta-Cloud" platform that aggregates free storage tiers from providers like Google Drive, Dropbox, and MEGA into a single, massive, secure virtual drive.

Unlike traditional cloud storage, HelioScape employs a Server-Side RAID-0 Architecture:

Files are streamed to the server (never buffered to disk).

They are encrypted (AES-256-GCM) and sharded into 10MB chunks in real-time.

Shards are distributed across multiple providers simultaneously.

The Result: Even if a cloud provider is hacked, they only hold encrypted binary noise. No single entity possesses your complete file except you.

🏗️ Architecture

HelioScape uses a Stream-Based Proxy Architecture to handle large files with minimal RAM usage.

graph LR
    User[Client Browser] -->|Upload Stream| Server[Node.js Server]
    
    subgraph "In-Memory Pipeline"
    Server -->|Stream| Cipher[AES-256 Encryptor]
    Cipher -->|Stream| Sharder[ShardStream Splitter]
    Sharder -->|Chunks| Distributor[Load Balancer]
    end
    
    Distributor -->|Shard 1| GDrive[Google Drive]
    Distributor -->|Shard 2| Dropbox[Dropbox]
    Distributor -->|Shard 3| MEGA[MEGA]


Key Engineering Features

Node.js Transform Streams: Processes multi-gigabyte uploads with constant O(1) memory footprint (~50MB RAM).

Backpressure Handling: Custom DistributorStream manages upload concurrency to prevent server crashes under load.

Zero-Knowledge Privacy: Encryption keys are managed securely; cloud providers never see unencrypted data.

Adapter Pattern: Uniform interface for all cloud providers (GoogleDriveAdapter, DropboxAdapter, MegaAdapter).

⚡ Tech Stack

Frontend: React 18 (Vite), Tailwind CSS ("Stratosphere" Theme), React Query.

Backend: Node.js, Express.

Database: MongoDB (Stores file metadata & fragment maps).

Security: mongoose-field-encryption (At rest), crypto (In transit).

DevOps: Docker, Docker Compose.

🚀 Getting Started

Prerequisites

Docker Desktop (Required)

Node.js 18+ (Optional, for local tooling)

Installation

Clone the Repository

git clone [https://github.com/gaviprasad/helioscape.git](https://github.com/gaviprasad/helioscape.git)
cd helioscape


Run the Setup Script
This script checks Docker status, generates secure secrets, and starts the containers.

chmod +x setup.sh
./setup.sh


Access the App

Frontend: http://localhost:5173

Backend API: http://localhost:5000

🔑 Configuration (.env)

The setup.sh script generates a .env file automatically. However, you must populate the Cloud API keys manually to enable storage features.

# --- GOOGLE DRIVE ---
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/oauth/google/callback

# --- DROPBOX ---
DROPBOX_CLIENT_ID=your_app_key
DROPBOX_CLIENT_SECRET=your_app_secret
DROPBOX_CALLBACK_URL=http://localhost:5000/api/oauth/dropbox/callback


📚 Further Documentation

For a deep dive into the system design, security model, and implementation details, please check the following documentation files included in this repository:

architecture.md: Detailed explanation of the streaming pipeline and sharding logic.

document.md: System Design Document and Master Plan.
