# 🚀 LinkLazarus Deployment Guide

## Option 1: Render (Empfohlen für Backend)

### Schritt 1: Repository auf GitHub pushen
```bash
# Auf deinem lokalen Rechner:
git clone https://github.com/karimyahia/linklazarus.git
# oder erstelle neues Repo und push:
git remote add origin https://github.com/DEIN_USERNAME/linklazarus.git
git push -u origin main
```

### Schritt 2: Render.com Setup
1. Gehe zu [render.com](https://render.com)
2. Click "New +" → "Blueprint"
3. Connect GitHub repo
4. Render erkennt `render.yaml` automatisch
5. Füge Environment Variables hinzu:
   - `DATAFORSEO_LOGIN`: hello@karimyahia.de
   - `DATAFORSEO_PASSWORD`: ad8c35fb616f182c
   - `HUNTER_API_KEY`: d6c20928375c258669e781ae177a92d9a8c894e7
   - `JWT_SECRET`: (generiere mit `openssl rand -base64 32`)
6. Deploy!

**Render erstellt automatisch:**
- PostgreSQL Database
- Redis Instance
- Web Service (Backend)

## Option 2: Netlify (Frontend)

```bash
cd frontend
npm install
npm run build

# Installiere Netlify CLI:
npm install -g netlify-cli

# Deploy:
netlify deploy --prod --dir=build
```

Oder verbinde GitHub Repo mit Netlify für Auto-Deploy.

## Option 3: Lokaler Test

```bash
# 1. PostgreSQL & Redis starten
brew services start postgresql
brew services start redis

# 2. Datenbank erstellen
createdb linklazarus
psql linklazarus < backend/schema.sql

# 3. Environment
cp .env.example .env
# Bearbeite .env mit API Keys

# 4. Backend starten (Terminal 1)
cd backend
npm install
npm run dev

# 5. Worker starten (Terminal 2)
cd backend
node worker.js

# 6. Frontend starten (Terminal 3)
cd frontend
npm install
npm start
```

App läuft auf http://localhost:3000

## 🔑 API Keys (Bereits konfiguriert)

| Service | Key | Status |
|---------|-----|--------|
| DataForSEO | hello@karimyahia.de / ad8c35fb616f182c | ✅ Ready |
| Hunter.io | d6c20928375c258669e781ae177a92d9a8c894e7 | ✅ Ready |

## 📊 Nach dem Deploy

1. **Registrieren** auf der Login-Seite
2. **10 Free Credits** automatisch
3. **Keyword eingeben** z.B. "Paleo Diät"
4. **Warten** (2-5 Minuten)
5. **Ergebnisse ansehen** 💔

## 💰 Stripe Integration (Optional)

Für echte Zahlungen:
1. Stripe Account erstellen
2. `STRIPE_SECRET_KEY` in Render Environment
3. Stripe Webhook einrichten
4. Preise definieren in `backend/routes/credits.js`

---

**Fertig!** Die App ist production-ready. 🚀
