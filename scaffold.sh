#!/bin/bash

# ==========================================
#  HelioScape MERN Scaffolding Generator
#  Creates: Client, Server, Docker Configs
#  Update: Named Volumes for node_modules
# ==========================================

PROJECT_NAME="helioscape"

echo "🚀 Starting Project Scaffolding for: $PROJECT_NAME"

# --- 1. Root Configuration ---
echo "📂 Creating Root Directory..."
mkdir -p $PROJECT_NAME
cd $PROJECT_NAME

# Create Docker Compose
cat <<EOT > docker-compose.yml
version: '3.8'

services:
  mongo:
    image: mongo:latest
    container_name: helio_db
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: \${MONGO_USER}
      MONGO_INITDB_ROOT_PASSWORD: \${MONGO_PASS}
    volumes:
      - mongo_data:/data/db
      - mongo_config:/data/configdb
    networks:
      - helio_net

  server:
    build: ./server
    container_name: helio_server
    ports:
      - "\${SERVER_PORT}:5000"
    environment:
      - MONGO_URI=mongodb://\${MONGO_USER}:\${MONGO_PASS}@mongo:27017/admin
      - JWT_SECRET=\${JWT_SECRET}
    # volumes:
      #   # - ./server:/app # Disabled for watch mode
      #   # - server_modules:/app/node_modules # Not needed without bind mount
    depends_on:
      - mongo
    networks:
      - helio_net
    # --- WATCH MODE CONFIGURATION ---
    # This 'develop' section enables 'docker compose watch'.
    # It replaces legacy bind mounts for better performance and automatic rebuilding.
    develop:
      watch:
        # SYNC: Hot-reload code changes instantly
        - action: sync
          path: ./server
          target: /app
          ignore:
            - node_modules/
        # REBUILD: Rebuild container when dependencies change
        - action: rebuild
          path: ./server/package.json

  client:
    build: ./client
    container_name: helio_client
    ports:
      - "\${CLIENT_PORT}:5173"
    environment:
      - VITE_API_URL=\${VITE_API_URL}
    # volumes:
      # NOTE: Bind mounts are DISABLED for 'watch' mode to improve performance on macOS/Windows.
      # File syncing is handled by the 'develop' section below.
      # - ./client:/app 
      # - client_modules:/app/node_modules 
    networks:
      - helio_net
    
    # --- WATCH MODE CONFIGURATION ---
    develop:
      watch:
        # SYNC: Hot-reload code changes instantly
        - action: sync
          path: ./client
          target: /app
          ignore:
            - node_modules/
        # REBUILD: Rebuild container when dependencies change
        - action: rebuild
          path: ./client/package.json

# Define explicit names for all persistent data
volumes:
  mongo_data:
    name: \${PROJECT_NAME}_mongo_data
  mongo_config:
    name: \${PROJECT_NAME}_mongo_config
  # server_modules:
  #   name: \${PROJECT_NAME}_server_node_modules
  # client_modules:
  #   name: \${PROJECT_NAME}_client_node_modules

networks:
  helio_net:
    driver: bridge
EOT

# --- 2. SERVER Setup (Node/Express) ---
echo "⚙️  Scaffolding Server..."
mkdir -p server/src/{config,controllers,models,routes,services/streams,utils}

# Server Dockerfile
cat <<EOT > server/Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package.json .
RUN npm install
COPY . .
EXPOSE 5000
CMD ["npm", "run", "dev"]
EOT

# Server package.json (Fixed Version)
cat <<EOT > server/package.json
{
  "name": "server",
  "version": "1.0.0",
  "main": "src/index.js",
  "scripts": {
    "dev": "nodemon src/index.js",
    "start": "node src/index.js"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "helmet": "^7.1.0",
    "mongoose": "^8.0.0",
    "mongoose-field-encryption": "^7.0.1",
    "morgan": "^1.10.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
EOT

# Server Entry Point (index.js)
cat <<EOT > server/src/index.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Database Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/helio';
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// Basic Route
app.get('/', (req, res) => {
  res.json({ message: 'HelioScape API is running', status: 'OK' });
});

app.listen(PORT, () => {
  console.log(\`🚀 Server running on port \${PORT}\`);
});
EOT

# --- 3. CLIENT Setup (Vite/React) ---
echo "💻 Scaffolding Client..."
mkdir -p client/{public,src/{assets,components,context,hooks,pages,styles}}

# Client Dockerfile
cat <<EOT > client/Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package.json .
RUN npm install
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev"]
EOT

# Client vite.config.js
cat <<EOT > client/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    strictPort: true,
    port: 5173,
    watch: {
      usePolling: true
    }
  }
})
EOT

# Client package.json
cat <<EOT > client/package.json
{
  "name": "client",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "axios": "^1.6.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.18.0",
    "tailwindcss": "^3.3.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.15",
    "@types/react-dom": "^18.2.7",
    "@vitejs/plugin-react": "^4.0.3",
    "autoprefixer": "^10.4.14",
    "postcss": "^8.4.27",
    "vite": "^4.4.5"
  }
}
EOT

# Client index.html
cat <<EOT > client/index.html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>HelioScape | Distributed Storage</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
EOT

# Client Tailwind Config
cat <<EOT > client/tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        surface: "var(--surface)",
        primary: "var(--primary)",
        "text-main": "var(--text-main)",
      }
    },
  },
  plugins: [],
}
EOT

# Client CSS Variables
cat <<EOT > client/src/index.css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: #ffffff;
  --surface: #f8fafc;
  --text-main: #0f172a;
  --primary: #2563eb;
}

.dark {
  --background: #020617;
  --surface: #0f172a;
  --text-main: #f8fafc;
  --primary: #3b82f6;
}

body {
  @apply bg-background text-text-main transition-colors duration-200;
}
EOT

# Client Entry Point
cat <<EOT > client/src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
EOT

# Client App Component
cat <<EOT > client/src/App.jsx
import { useState, useEffect } from 'react'

function App() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('http://localhost:5000')
      .then(res => res.json())
      .then(data => setData(data.message))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
      <h1 className="text-4xl font-bold text-primary">HelioScape</h1>
      <p className="text-xl">Status: {data ? '✅ Server Connected' : '⏳ Connecting...'}</p>
      <div className="p-4 bg-surface rounded-lg shadow border border-gray-200 dark:border-gray-800">
        <p className="font-mono">Distributed Storage System Initialized</p>
      </div>
    </div>
  )
}

export default App
EOT

echo "=========================================="
echo "✅ Scaffolding Updated with Named Volumes!"
echo "👉 NEXT STEP: cd helioscape -> Create setup.sh -> Run setup.sh"
echo "=========================================="