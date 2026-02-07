#!/bin/bash

# OrionMaps Deployment Script
# Usage: ./deploy.sh

set -e

echo "🚀 OrionMaps Deployment Script"
echo "================================"
echo ""

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found!"
    echo "Install it with: npm install -g firebase-tools"
    exit 1
fi

# Check if logged in to Firebase
if ! firebase projects:list &> /dev/null; then
    echo "🔐 Please login to Firebase..."
    firebase login
fi

echo "📦 Building frontend..."
cd client
npm install
npm run build
cd ..

echo "✅ Frontend built successfully!"
echo ""

echo "🌐 Deploying to Firebase Hosting..."
firebase deploy --only hosting

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📍 Your app is live at:"
echo "   https://orion-81736.web.app"
echo ""
echo "🔗 To connect custom domain (orionmaps.xyz):"
echo "   1. Go to Firebase Console: https://console.firebase.google.com/project/orion-81736/hosting"
echo "   2. Click 'Add custom domain'"
echo "   3. Follow the instructions to verify your domain"
echo ""
echo "🎯 Next steps:"
echo "   1. Deploy backend to Render (see FIREBASE_DEPLOYMENT.md)"
echo "   2. Update VITE_API_URL in client/.env.production"
echo "   3. Configure Google OAuth with production URLs"
echo "   4. Rebuild and redeploy: ./deploy.sh"
echo ""
