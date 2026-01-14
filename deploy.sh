#!/bin/bash
set -e

# 1. Tambahkan PATH agar Bun dan PM2 dikenali
export PATH="$HOME/.bun/bin:$PATH"
export PATH="$(npm prefix -g)/bin:$PATH"

echo "🚀 Starting Deployment..."

# 2. Sinkronisasi Git
echo "🧹 Cleaning local changes..."
git fetch --all
git reset --hard origin/$(git branch --show-current)

# 3. Ambil kode terbaru
echo "📦 Pulling latest code..."
git pull origin $(git branch --show-current)

# 4. Install dependencies
echo "📦 Installing dependencies..."
bun install

# 5. Database Sync
echo "🗄️ Syncing Database Schema..."
cd packages/database
bun x prisma generate
cd ../..

# 6. Build Frontend
echo "🏗️ Building Web App..."
cd apps/web
bun run build
cd ../..

# 7. Restart PM2
if [[ "$(pwd)" == *"/LokaPay"* ]]; then
  echo "♻️ Restarting Lisk Services..."
  pm2 restart lokapay-api lokapay-web lokapay-worker
else
  echo "♻️ Restarting Mantle Services..."
  pm2 restart mantle-api mantle-web mantle-worker
fi

echo "✅ Deployment Successful!"