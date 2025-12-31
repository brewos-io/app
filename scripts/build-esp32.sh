#!/bin/bash
# Build app for ESP32 deployment
# 
# Usage:
#   ./scripts/build-esp32.sh [ESP32_DATA_DIR]
#
# If ESP32_DATA_DIR is not provided, defaults to ../firmware/src/esp32/data

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# ESP32 data directory - can be overridden via argument or env var
ESP32_DATA_DIR="${1:-${ESP32_DATA_DIR:-../firmware/src/esp32/data}}"

# Resolve absolute path
if [[ "$ESP32_DATA_DIR" != /* ]]; then
  ESP32_DATA_DIR="$APP_DIR/$ESP32_DATA_DIR"
fi

echo "🔨 Building app for ESP32..."
echo "📦 Output directory: $ESP32_DATA_DIR"

cd "$APP_DIR"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "📥 Installing dependencies..."
  npm install
fi

# Build for ESP32
echo "🏗️  Building..."
ESP32_DATA_DIR="$ESP32_DATA_DIR" npm run build:esp32

echo ""
echo "✅ Build complete!"
echo "📊 Output directory: $ESP32_DATA_DIR"
echo ""
echo "Next steps:"
echo "  cd ../firmware/src/esp32 && pio run -t uploadfs"

