#!/usr/bin/env node

/**
 * Chia Wallet Verification - web_app_data Handler
 * 
 * Receives signature data from the Telegram Mini App and verifies it
 * via the MintGarden API.
 * 
 * Usage:
 *   - Integrate into Clawdbot's Telegram message routing
 *   - Handles web_app_data callback from Mini Apps
 */

const fetch = require('node-fetch');

const MINTGARDEN_API = 'https://api.mintgarden.io/address/verify_signature';
const SIGNATURE_MAX_AGE_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Verify signature via MintGarden API
 * @param {string} address - Chia wallet address
 * @param {string} message - Challenge message that was signed
 * @param {string} signature - Signature hex string
 * @param {string} publicKey - Public key hex string (optional)
 * @returns {Promise<{verified: boolean, error?: string}>}
 */
async function verifySignature(address, message, signature, publicKey) {
  try {
    const response = await fetch(MINTGARDEN_API, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'User-Agent': 'Clawdbot-ChiaWalletConnect/1.0'
      },
      body: JSON.stringify({
        address,
        message,
        signature,
        pubkey: publicKey
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ MintGarden API error:', response.status, errorText);
      return { 
        verified: false, 
        error: `API error: ${response.status}` 
      };
    }
    
    const result = await response.json();
    return { 
      verified: result.verified === true,
      error: result.verified ? null : 'Signature invalid'
    };
    
  } catch (error) {
    console.error('❌ Verification request failed:', error);
    return { 
      verified: false, 
      error: error.message 
    };
  }
}

/**
 * Validate challenge message timestamp
 * @param {number} timestamp - Unix timestamp from challenge
 * @returns {boolean} True if timestamp is recent enough
 */
function validateTimestamp(timestamp) {
  const now = Date.now();
  const age = now - timestamp;
  return age >= 0 && age <= SIGNATURE_MAX_AGE_MS;
}

/**
 * Store verification in database/memory
 * @param {number} telegramUserId - Telegram user ID
 * @param {string} walletAddress - Verified Chia wallet address
 * @param {Object} metadata - Additional verification data
 */
async function storeVerification(telegramUserId, walletAddress, metadata = {}) {
  // TODO: Implement actual storage (database, file, etc.)
  console.log('💾 Storing verification:', {
    telegramUserId,
    walletAddress,
    verifiedAt: new Date().toISOString(),
    ...metadata
  });
  
  // Example: Write to JSON file
  // const verifications = require('./verifications.json');
  // verifications[telegramUserId] = {
  //   address: walletAddress,
  //   verifiedAt: Date.now(),
  //   ...metadata
  // };
  // fs.writeFileSync('./verifications.json', JSON.stringify(verifications, null, 2));
}

/**
 * Handle web_app_data callback from Telegram Mini App
 * @param {Object} webAppData - Telegram web_app_data object
 * @param {Function} messageTool - Clawdbot message tool
 */
async function handleWebAppData(webAppData, messageTool) {
  try {
    // Parse data from Mini App
    const data = JSON.parse(webAppData.data);
    const { 
      address, 
      message, 
      signature, 
      publicKey, 
      userId, 
      timestamp 
    } = data;
    
    const telegramUserId = webAppData.from.id;
    const chatId = webAppData.chat.id;
    
    console.log('📱 Web App data received:', {
      telegramUserId,
      address,
      hasSignature: !!signature,
      hasPublicKey: !!publicKey,
      timestamp
    });
    
    // Validate timestamp
    if (!validateTimestamp(timestamp)) {
      console.warn('⚠️ Signature timestamp expired');
      await messageTool({
        action: 'send',
        channel: 'telegram',
        target: chatId,
        message: '⏰ Verification expired. Please try again.'
      });
      return { success: false, reason: 'expired' };
    }
    
    // Verify signature with MintGarden
    console.log('🔍 Verifying signature with MintGarden...');
    const result = await verifySignature(address, message, signature, publicKey);
    
    if (result.verified) {
      // SUCCESS!
      console.log('✅ Signature verified successfully');
      
      // Store verification
      await storeVerification(telegramUserId, address, {
        publicKey,
        signature,
        message,
        timestamp
      });
      
      // Send success message
      await messageTool({
        action: 'send',
        channel: 'telegram',
        target: chatId,
        message: `✅ **Wallet Verified!**\n\n**Address:** \`${address}\`\n\nYou now have access to gated content and features.\n\n🔐 Cryptographically verified via CHIP-0002`
      });
      
      return { success: true, address };
      
    } else {
      // Verification failed
      console.error('❌ Signature verification failed:', result.error);
      
      await messageTool({
        action: 'send',
        channel: 'telegram',
        target: chatId,
        message: `❌ **Verification Failed**\n\n${result.error || 'Invalid signature'}\n\nPlease try again.`
      });
      
      return { success: false, reason: result.error };
    }
    
  } catch (error) {
    console.error('❌ Failed to process web app data:', error);
    
    await messageTool({
      action: 'send',
      channel: 'telegram',
      target: webAppData.chat.id,
      message: '❌ Failed to process verification. Please try again.'
    });
    
    return { success: false, reason: error.message };
  }
}

module.exports = {
  verifySignature,
  validateTimestamp,
  storeVerification,
  handleWebAppData
};

// CLI testing
if (require.main === module) {
  const testData = {
    data: JSON.stringify({
      address: 'xch1test...',
      message: 'Test message',
      signature: 'test_sig',
      publicKey: 'test_pubkey',
      userId: 'telegram_123',
      timestamp: Date.now()
    }),
    from: { id: 123 },
    chat: { id: 456 }
  };
  
  const mockMessageTool = async (opts) => {
    console.log('📤 Would send:', JSON.stringify(opts, null, 2));
  };
  
  handleWebAppData(testData, mockMessageTool)
    .then(result => console.log('Result:', result))
    .catch(err => console.error('Error:', err));
}
