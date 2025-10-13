#!/bin/bash

# Start the frontend development server
echo "Starting SCORM Frontend Server..."
echo "Port: 3001"
echo "Environment: Development"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Start the development server
npm run dev

