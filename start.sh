#!/bin/bash

# Start the backend server
echo "Starting SCORM Backend Server..."
echo "Port: 3000"
echo "Environment: Development"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Start the server
npm run dev

