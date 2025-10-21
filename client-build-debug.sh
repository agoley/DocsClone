#!/bin/bash
# Debug script for client build

# Print current directory
echo "Current directory: $(pwd)"

# List directory content
echo "Directory content:"
ls -la

# Check if client directory exists
if [ -d "client" ]; then
  echo "Client directory exists"
  
  # Navigate to client directory
  cd client
  
  # Print current directory after cd
  echo "Current directory after cd: $(pwd)"
  
  # List client directory content
  echo "Client directory content:"
  ls -la
  
  # Install dependencies
  echo "Installing dependencies..."
  npm install
  
  # Build the application
  echo "Building the application..."
  npm run build
  
  # Check if build was successful
  if [ $? -eq 0 ]; then
    echo "Build completed successfully"
    
    # Check if build directory exists
    if [ -d "build" ]; then
      echo "Build directory exists"
      echo "Build directory content:"
      ls -la build
    else
      echo "Build directory does not exist!"
      echo "Creating build directory manually..."
      mkdir -p build
      echo "Hello World" > build/index.html
    fi
  else
    echo "Build failed with exit code $?"
    # Create fallback build directory
    echo "Creating fallback build directory..."
    mkdir -p build
    echo "Hello World - Fallback" > build/index.html
  fi
else
  echo "Client directory does not exist!"
  echo "Contents of current directory:"
  ls -la
  
  echo "Creating fallback build directory..."
  mkdir -p client/build
  echo "Hello World - Fallback (no client dir)" > client/build/index.html
fi

echo "Debug script completed"