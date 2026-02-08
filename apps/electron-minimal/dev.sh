#!/bin/bash
# Run all services for Dispatch with minimal Electron

echo "🚀 Starting Dispatch services..."

# Check if backend is already running
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null ; then
    echo "✅ Backend already running on port 3001"
else
    echo "❌ Backend not running. Start it with: cd packages/backend && bun run dev"
    exit 1
fi

# Check if Vite is already running
if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null ; then
    echo "✅ Vite already running on port 5173"
else
    echo "❌ Vite not running. Start it with: cd apps/electron && bun run vite"
    exit 1
fi

echo "🎯 Starting minimal Electron app..."
bun run start
