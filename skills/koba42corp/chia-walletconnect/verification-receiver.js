#!/usr/bin/env node

/**
 * Simple HTTP server to receive verification data from the Mini App
 * This is a workaround since Clawdbot can't see web_app_data yet
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 18790; // Different from Clawdbot's port
const LOG_FILE = path.join(__dirname, 'verifications.jsonl');

const server = http.createServer(async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  if (req.method === 'POST' && req.url === '/verify') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        console.log('📱 Received verification:', {
          address: data.address,
          userId: data.userId,
          timestamp: new Date(data.timestamp).toISOString()
        });
        
        // Log to file
        const logEntry = JSON.stringify({
          ...data,
          receivedAt: Date.now()
        }) + '\n';
        
        fs.appendFileSync(LOG_FILE, logEntry);
        
        // TODO: Verify signature via MintGarden here
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
        
      } catch (error) {
        console.error('❌ Error processing verification:', error);
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Invalid request' }));
      }
    });
    
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`✅ Verification receiver running on http://127.0.0.1:${PORT}`);
  console.log(`📝 Logging to: ${LOG_FILE}`);
  console.log('🌱 Waiting for verifications...');
});
