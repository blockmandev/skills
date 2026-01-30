#!/usr/bin/env node

/**
 * Simple Verification Server for Chia Wallet Connect
 * 
 * This is a workaround until Clawdbot supports web_app_data.
 * The Mini App POSTs verification data here instead of using sendData().
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { handleWebAppData } = require('./handlers/web-app-data');

const PORT = 18790;
const VERIFICATIONS_FILE = path.join(__dirname, 'verifications.jsonl');
const PENDING_FILE = path.join(__dirname, 'pending-verifications.json');

// Mock message tool for console output
const mockMessageTool = async ({ action, message }) => {
  console.log(`📤 Would send: ${message}`);
};

// Ensure files exist
if (!fs.existsSync(VERIFICATIONS_FILE)) {
  fs.writeFileSync(VERIFICATIONS_FILE, '');
}
if (!fs.existsSync(PENDING_FILE)) {
  fs.writeFileSync(PENDING_FILE, '{}');
}

const server = http.createServer(async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // POST /verify - Receive verification from Mini App
  if (req.method === 'POST' && req.url === '/verify') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        console.log('\n📱 Received verification from Mini App:');
        console.log(`   Address: ${data.address}`);
        console.log(`   User ID: ${data.userId}`);
        
        // Log to JSONL file
        const logEntry = JSON.stringify({
          ...data,
          receivedAt: Date.now()
        }) + '\n';
        fs.appendFileSync(VERIFICATIONS_FILE, logEntry);
        
        // Store as pending (for Clawdbot to check)
        const pending = JSON.parse(fs.readFileSync(PENDING_FILE, 'utf8') || '{}');
        pending[data.userId] = {
          ...data,
          status: 'pending',
          receivedAt: Date.now()
        };
        fs.writeFileSync(PENDING_FILE, JSON.stringify(pending, null, 2));
        
        // Verify signature via MintGarden
        const webAppData = {
          data: JSON.stringify(data),
          from: { id: data.userId },
          chat: { id: data.userId }
        };
        
        const result = await handleWebAppData(webAppData, mockMessageTool);
        
        if (result.success) {
          console.log('✅ Signature verified successfully!');
          pending[data.userId].status = 'verified';
          pending[data.userId].verifiedAt = Date.now();
        } else {
          console.log(`❌ Verification failed: ${result.reason}`);
          pending[data.userId].status = 'failed';
          pending[data.userId].error = result.reason;
        }
        
        fs.writeFileSync(PENDING_FILE, JSON.stringify(pending, null, 2));
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: result.success,
          verified: result.success,
          address: data.address
        }));
        
      } catch (error) {
        console.error('❌ Error processing verification:', error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid request' }));
      }
    });
    return;
  }
  
  // GET /status/:userId - Check verification status
  if (req.method === 'GET' && req.url.startsWith('/status/')) {
    const userId = req.url.split('/status/')[1];
    const pending = JSON.parse(fs.readFileSync(PENDING_FILE, 'utf8') || '{}');
    const verification = pending[userId];
    
    if (verification) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(verification));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
    }
    return;
  }
  
  // GET /health
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', uptime: process.uptime() }));
    return;
  }
  
  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`✅ Chia Wallet Verification Server running`);
  console.log(`📡 Local endpoint: http://127.0.0.1:${PORT}`);
  console.log(`📝 Verifications: ${VERIFICATIONS_FILE}`);
  console.log(`⏳ Pending: ${PENDING_FILE}`);
  console.log('');
  console.log('🌱 Waiting for verifications from Mini App...');
  console.log('');
  console.log('To check a verification:');
  console.log(`   curl http://127.0.0.1:${PORT}/status/<telegram_user_id>`);
  console.log('');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  server.close(() => {
    console.log('✅ Server stopped');
    process.exit(0);
  });
});
