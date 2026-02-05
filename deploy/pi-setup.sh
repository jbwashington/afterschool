#!/bin/bash
# Raspberry Pi deployment script for Town Builders Council
# Run on the Pi after copying the project files

set -e

echo "🏗️ Setting up Town Builders Council on Raspberry Pi"

# Install Node.js LTS if not present
if ! command -v node &> /dev/null; then
    echo "📦 Installing Node.js LTS..."
    curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Install Caddy if not present
if ! command -v caddy &> /dev/null; then
    echo "📦 Installing Caddy..."
    sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
    sudo apt update
    sudo apt install caddy
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install --production

# Build client
echo "🔨 Building client..."
npm run build

# Setup systemd service for the game server
echo "⚙️ Setting up systemd service..."
sudo tee /etc/systemd/system/town-builders.service > /dev/null <<EOF
[Unit]
Description=Town Builders Council Game Server
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$(pwd)
ExecStart=/usr/bin/node server/index.js
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3001

[Install]
WantedBy=multi-user.target
EOF

# Copy Caddyfile
echo "📋 Configuring Caddy..."
sudo cp Caddyfile /etc/caddy/Caddyfile

# Start services
echo "🚀 Starting services..."
sudo systemctl daemon-reload
sudo systemctl enable town-builders
sudo systemctl start town-builders
sudo systemctl reload caddy

echo ""
echo "✅ Town Builders Council is now running!"
echo "   Access the game at: http://$(hostname -I | awk '{print $1}')"
echo ""
echo "   Useful commands:"
echo "   - View logs: journalctl -u town-builders -f"
echo "   - Restart: sudo systemctl restart town-builders"
echo "   - Stop: sudo systemctl stop town-builders"
