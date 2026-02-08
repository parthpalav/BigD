#!/bin/bash

# 🚀 Firebase Deployment Script for BigD
# This script builds and deploys the frontend to Firebase Hosting

set -e  # Exit on error

echo "🔨 Building frontend for production..."
cd client
npm run build

echo "✅ Build complete!"
echo ""
echo "📦 Build output in: client/dist"
echo ""

cd ..

echo "🚀 Deploying to Firebase Hosting..."
firebase deploy --only hosting

echo ""
echo "✅ Deployment complete!"
echo "🌐 Your app is live at: https://orion-81736.web.app"
echo ""
echo "⚠️  Remember to:"
echo "   1. Wait for Render backend to finish deploying"
echo "   2. Check that CORS is properly configured"
echo "   3. Update Google OAuth settings with production URLs"
