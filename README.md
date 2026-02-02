# LinkLazarus MVP

**Broken Link Building Automation Tool**

Transform dead links into backlinks. Automatically find broken links on top-ranking pages and discover contact information for outreach.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL
- Redis

### 1. Clone & Install
```bash
git clone https://github.com/karim/linklazarus.git
cd linklazarus

# Backend
cd backend
npm install

# Frontend  
cd ../frontend
npm install
```

### 2. Environment Setup
```bash
cp .env.example .env
# Edit .env with your API keys
```

### 3. Database Setup
```bash
# Create PostgreSQL database
createdb linklazarus

# Run schema
psql linklazarus < backend/schema.sql
```

### 4. Start Development
```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Worker
cd backend
node worker.js

# Terminal 3: Frontend
cd frontend
npm start
```

## 🛠️ Tech Stack

| Component | Technology |
|-----------|-----------|
| Frontend | React 18 |
| Backend | Node.js + Express |
| Database | PostgreSQL |
| Queue | Redis + BullMQ |
| SERP API | DataForSEO |
| Email API | Hunter.io |

## 📊 Features

- ✅ Keyword-based SERP analysis
- ✅ Automatic broken link detection
- ✅ Email contact discovery
- ✅ Credit-based usage (Pay-per-use)
- ✅ Real-time job status
- ✅ Beautiful dashboard

## 🔑 API Credentials

### DataForSEO
- Login: hello@karimyahia.de
- Password: (in .env)

### Hunter.io
- API Key: (in .env)

## 🚀 Deployment

### Frontend (Netlify)
```bash
npm run build
netlify deploy --prod
```

### Backend (Render)
```bash
git push origin main
# Auto-deploys via render.yaml
```

## 📄 License

MIT