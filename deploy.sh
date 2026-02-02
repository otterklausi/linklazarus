#!/bin/bash
# LinkLazarus Quick Deploy Script

echo "🚀 LinkLazarus Deployment Script"
echo "================================"

# Check if git repo exists
if [ ! -d ".git" ]; then
    echo "❌ No git repository found. Please run: git init"
    exit 1
fi

# Check for GitHub remote
if ! git remote -v > /dev/null 2>&1; then
    echo "⚠️  No GitHub remote configured."
    echo "   Create repo on GitHub and run:"
    echo "   git remote add origin https://github.com/YOUR_USERNAME/linklazarus.git"
    exit 1
fi

echo ""
echo "📦 Building Frontend..."
cd frontend
npm install
npm run build
cd ..

echo ""
echo "☁️  Deploy Options:"
echo ""
echo "1️⃣  Render (Backend + DB + Redis):"
echo "   - Go to https://dashboard.render.com/blueprint"
echo "   - Connect this GitHub repo"
echo "   - Add environment variables (see DEPLOY.md)"
echo ""
echo "2️⃣  Netlify (Frontend only):"
echo "   npm install -g netlify-cli"
echo "   netlify deploy --prod --dir=frontend/build"
echo ""
echo "3️⃣  Local Test:"
echo "   See DEPLOY.md for local setup"
echo ""

# Git commit changes
git add -A
git commit -m "Prepare for deployment"

echo "✅ Code committed. Ready to push to GitHub!"
echo ""
echo "Next step: git push origin main"