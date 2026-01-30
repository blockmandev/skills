#!/usr/bin/env node

/**
 * Check if a Telegram user has a pending wallet verification
 * Usage: node check-verification.js <telegram_user_id>
 */

const fs = require('fs');
const path = require('path');

const PENDING_FILE = path.join(__dirname, 'pending-verifications.json');

function checkVerification(userId) {
  if (!fs.existsSync(PENDING_FILE)) {
    return { found: false, error: 'No verifications file' };
  }
  
  const pending = JSON.parse(fs.readFileSync(PENDING_FILE, 'utf8') || '{}');
  const verification = pending[userId];
  
  if (!verification) {
    return { found: false };
  }
  
  return {
    found: true,
    status: verification.status,
    address: verification.address,
    publicKey: verification.publicKey,
    verifiedAt: verification.verifiedAt,
    receivedAt: verification.receivedAt
  };
}

// CLI usage
if (require.main === module) {
  const userId = process.argv[2];
  
  if (!userId) {
    console.error('Usage: node check-verification.js <telegram_user_id>');
    process.exit(1);
  }
  
  const result = checkVerification(userId);
  console.log(JSON.stringify(result, null, 2));
}

module.exports = { checkVerification };
