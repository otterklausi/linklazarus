require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const { Queue } = require('bullmq');
const IORedis = require('ioredis');

const authRoutes = require('./routes/auth');
const jobRoutes = require('./routes/jobs');
const creditRoutes = require('./routes/credits');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware - CORS erlaubt alle Origins (für MVP)
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

// Database - SSL für Railway
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/linklazarus',
  ssl: process.env.DATABASE_URL?.includes('railway') ? { rejectUnauthorized: false } : false
});

// Redis for Queue
const redis = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379');
const crawlQueue = new Queue('crawl-jobs', { connection: redis });

// Make db and queue available in routes
app.use((req, res, next) => {
  req.db = pool;
  req.queue = crawlQueue;
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/credits', creditRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 LinkLazarus API running on port ${PORT}`);
});

module.exports = { pool, crawlQueue };