#!/bin/bash

echo "Starting SMS Academy Management System..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Error: .env file not found!"
    exit 1
fi

# Check if node_modules exists
if [ ! -d node_modules ]; then
    echo "Installing dependencies..."
    npm install
fi

# Start the development server
echo "Starting server on port 5051..."
NODE_ENV=development npx tsx server/index.ts