const { Worker } = require('bullmq');
const axios = require('axios');
const cheerio = require('cheerio');
const { Pool } = require('pg');
const IORedis = require('ioredis');

const redis = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/linklazarus'
});

// DataForSEO API
const DATAFORSEO_AUTH = Buffer.from(`${process.env.DATAFORSEO_LOGIN || 'hello@karimyahia.de'}:${process.env.DATAFORSEO_PASSWORD || 'ad8c35fb616f182c'}`).toString('base64');

// Hunter.io API
const HUNTER_API_KEY = process.env.HUNTER_API_KEY || 'd6c20928375c258669e781ae177a92d9a8c894e7';

const worker = new Worker('crawl-jobs', async (job) => {
  const { jobId, keyword, region, userId } = job.data;
  
  console.log(`🕷️ Processing job ${jobId}: ${keyword} (${region})`);
  
  try {
    // Update status to processing
    await pool.query("UPDATE jobs SET status = 'processing' WHERE id = $1", [jobId]);
    
    // 1. Get SERP results from DataForSEO
    const serpResults = await fetchSerpResults(keyword, region);
    console.log(`📊 Found ${serpResults.length} SERP results`);
    
    // 2. Crawl each URL and find broken links
    const brokenLinks = [];
    
    for (const url of serpResults.slice(0, 20)) { // Top 20 for MVP
      try {
        const links = await crawlPage(url);
        
        for (const link of links) {
          const isBroken = await checkLinkStatus(link.url);
          if (isBroken) {
            brokenLinks.push({
              sourceUrl: url,
              brokenUrl: link.url,
              anchorText: link.anchorText,
              statusCode: isBroken
            });
          }
        }
      } catch (error) {
        console.error(`Error crawling ${url}:`, error.message);
      }
    }
    
    console.log(`💔 Found ${brokenLinks.length} broken links`);
    
    // 3. Save results to database
    for (const link of brokenLinks) {
      await pool.query(
        `INSERT INTO results (job_id, source_url, broken_url, anchor_text, status_code) 
         VALUES ($1, $2, $3, $4, $5)`,
        [jobId, link.sourceUrl, link.brokenUrl, link.anchorText, link.statusCode]
      );
    }
    
    // 4. Update job status
    await pool.query(
      "UPDATE jobs SET status = 'completed', result_count = $1 WHERE id = $2",
      [brokenLinks.length, jobId]
    );
    
    console.log(`✅ Job ${jobId} completed with ${brokenLinks.length} broken links`);
    
  } catch (error) {
    console.error(`❌ Job ${jobId} failed:`, error);
    await pool.query("UPDATE jobs SET status = 'failed' WHERE id = $1", [jobId]);
    throw error;
  }
}, { connection: redis });

// Fetch SERP results from DataForSEO
async function fetchSerpResults(keyword, region) {
  const response = await axios.post(
    'https://api.dataforseo.com/v3/serp/google/organic/live/advanced',
    [{
      keyword,
      location_code: region === 'de' ? 2756 : 2840, // Germany or USA
      language_code: region === 'de' ? 'de' : 'en',
      depth: 30
    }],
    {
      headers: {
        'Authorization': `Basic ${DATAFORSEO_AUTH}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  const tasks = response.data.tasks || [];
  const results = [];
  
  for (const task of tasks) {
    const items = task.result?.[0]?.items || [];
    for (const item of items) {
      if (item.url && !isFilteredDomain(item.url)) {
        results.push(item.url);
      }
    }
  }
  
  return [...new Set(results)]; // Remove duplicates
}

// Filter out social media and big platforms
function isFilteredDomain(url) {
  const filtered = [
    'facebook.com', 'twitter.com', 'x.com', 'instagram.com',
    'pinterest.com', 'linkedin.com', 'youtube.com',
    'amazon.com', 'amazon.de', 'ebay.com', 'ebay.de',
    'wikipedia.org', 'reddit.com', 'quora.com'
  ];
  
  return filtered.some(domain => url.includes(domain));
}

// Crawl a page and extract external links
async function crawlPage(url) {
  try {
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const $ = cheerio.load(response.data);
    const links = [];
    const baseDomain = new URL(url).hostname;
    
    $('a[href]').each((_, element) => {
      const href = $(element).attr('href');
      const anchorText = $(element).text().trim().substring(0, 100);
      
      if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;
      
      try {
        const absoluteUrl = new URL(href, url).href;
        const linkDomain = new URL(absoluteUrl).hostname;
        
        // Only external links
        if (linkDomain !== baseDomain && !isFilteredDomain(absoluteUrl)) {
          links.push({ url: absoluteUrl, anchorText });
        }
      } catch {
        // Invalid URL, skip
      }
    });
    
    return links;
  } catch (error) {
    console.error(`Error fetching ${url}:`, error.message);
    return [];
  }
}

// Check if link is broken (404, 410, etc.)
async function checkLinkStatus(url) {
  try {
    const response = await axios.head(url, {
      timeout: 5000,
      maxRedirects: 2,
      validateStatus: () => true // Don't throw on error status
    });
    
    if (response.status === 404 || response.status === 410) {
      return response.status;
    }
    
    return null; // Link is OK
  } catch (error) {
    // DNS errors or timeouts = treat as broken
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return 0; // DNS/Connection error
    }
    return null;
  }
}

// Fetch email from Hunter.io
async function fetchEmail(domain) {
  try {
    const response = await axios.get(
      `https://api.hunter.io/v2/domain-search?domain=${domain}&api_key=${HUNTER_API_KEY}`
    );
    
    const emails = response.data.data?.emails || [];
    if (emails.length > 0) {
      return {
        email: emails[0].value,
        confidence: emails[0].confidence
      };
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching email for ${domain}:`, error.message);
    return null;
  }
}

console.log('🕷️ Crawler worker started');

module.exports = worker;