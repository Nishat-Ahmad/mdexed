#!/usr/bin/env bash

# Exit immediately if a command exits with a non-zero status
set -e

# Get the directory of the script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "===================================================="
echo "MDXed Editor Server (Linux)"
echo "===================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed or not in your PATH."
    echo "Please install Node.js (e.g., via NVM or your package manager)."
    echo "===================================================="
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "ERROR: npm is not installed or not in your PATH."
    echo "===================================================="
    exit 1
fi

# Check if node_modules folder exists, if not, run npm install
if [ ! -d "node_modules" ]; then
    echo "INFO: node_modules not found. Installing dependencies..."
    echo "===================================================="
    npm install
    if [ $? -ne 0 ]; then
        echo "ERROR: npm install failed."
        exit 1
    fi
fi

# Sync blog content repo
if [ -d "src/content/blog/.git" ]; then
    echo "INFO: Updating blog content..."
    git -C src/content/blog pull origin main || true
else
    echo "INFO: Cloning blog content repo..."
    git clone https://github.com/Nishat-Ahmad/mdexed-content.git src/content/blog
fi

# Start Vite dev server and open the browser automatically
echo "Starting MDXed Server..."
echo "The editor will open in your default browser shortly."
echo "Keep this terminal open while using the editor."
echo "Press Ctrl+C to stop the server."
echo "===================================================="

# Run the dev server and open the browser
npm run dev -- --open
