#!/bin/bash

# Deploy Firebase Storage Rules
echo "🚀 Deploying Firebase Storage rules..."

# Deploy only storage rules
firebase deploy --only storage

if [ $? -eq 0 ]; then
    echo "✅ Firebase Storage rules deployed successfully!"
    echo "🔧 Storage uploads should now work properly."
else
    echo "❌ Failed to deploy Firebase Storage rules."
    echo "📝 Please run 'firebase deploy --only storage' manually."
fi