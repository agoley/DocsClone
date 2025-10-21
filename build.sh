#!/bin/bash

# This script handles the build process for both client and server
# It's designed to be more robust than inline commands in render.yaml

echo "==== Starting build process ===="

# Navigate to the client directory
echo "==== Building client application ===="
cd client || { echo "Error: client directory not found"; exit 1; }

# Install client dependencies
echo "==== Installing client dependencies ===="
npm install || { echo "Error: Failed to install client dependencies"; exit 1; }

# Build the client application
echo "==== Building React application ===="
CI=false npm run build || { echo "Error: Failed to build client application"; exit 1; }

# Navigate to the server directory
echo "==== Setting up server ===="
cd ../server || { echo "Error: server directory not found"; exit 1; }

# Install server dependencies
echo "==== Installing server dependencies ===="
npm install || { echo "Error: Failed to install server dependencies"; exit 1; }

# Return to the root directory
cd ..

echo "==== Build process completed successfully ===="