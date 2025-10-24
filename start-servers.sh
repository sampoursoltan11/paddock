#!/bin/bash

# Load nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Switch to Node 20 (compatible with Azure Functions v4)
echo "Switching to Node.js 20..."
nvm use 20 || nvm install 20

echo "Current Node version: $(node --version)"

# Kill any existing processes on ports 3000 and 7071
echo "Killing existing processes..."
lsof -ti :3000,:7071 2>/dev/null | xargs kill -9 2>/dev/null || true

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Start backend in background
echo "Starting backend on port 7071..."
cd "$SCRIPT_DIR/backend"
npm start > "$SCRIPT_DIR/backend.log" 2>&1 &
BACKEND_PID=$!
echo "Backend started with PID: $BACKEND_PID"

# Wait a bit for backend to initialize
sleep 5

# Start frontend in background
echo "Starting frontend on port 3000..."
cd "$SCRIPT_DIR/frontend"
npm run dev > "$SCRIPT_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo "Frontend started with PID: $FRONTEND_PID"

echo ""
echo "================================"
echo "Servers started successfully!"
echo "Backend PID: $BACKEND_PID (port 7071)"
echo "Frontend PID: $FRONTEND_PID (port 3000)"
echo "================================"
echo ""
echo "To view logs:"
echo "  Backend:  tail -f backend.log"
echo "  Frontend: tail -f frontend.log"
echo ""
echo "To stop servers:"
echo "  kill $BACKEND_PID $FRONTEND_PID"
