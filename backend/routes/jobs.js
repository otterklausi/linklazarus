const express = require('express');
const axios = require('axios');
const router = express.Router();

// Auth middleware
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.userId = decoded.userId;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Create new job
router.post('/', authMiddleware, async (req, res) => {
  const { keyword, region = 'de' } = req.body;
  
  try {
    // Check credits
    const userResult = await req.db.query('SELECT credits FROM users WHERE id = $1', [req.userId]);
    const credits = userResult.rows[0]?.credits || 0;
    
    if (credits < 1) {
      return res.status(403).json({ error: 'Insufficient credits' });
    }
    
    // Deduct credit
    await req.db.query('UPDATE users SET credits = credits - 1 WHERE id = $1', [req.userId]);
    
    // Create job
    const jobResult = await req.db.query(
      'INSERT INTO jobs (user_id, keyword, region, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.userId, keyword, region, 'pending']
    );
    const job = jobResult.rows[0];
    
    // Add to queue
    await req.queue.add('crawl-job', {
      jobId: job.id,
      keyword,
      region,
      userId: req.userId
    });
    
    res.json({ job, message: 'Job queued successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's jobs
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await req.db.query(
      'SELECT * FROM jobs WHERE user_id = $1 ORDER BY created_at DESC',
      [req.userId]
    );
    res.json({ jobs: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get job results
router.get('/:id/results', authMiddleware, async (req, res) => {
  try {
    const result = await req.db.query(
      'SELECT * FROM results WHERE job_id = $1',
      [req.params.id]
    );
    res.json({ results: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;