/**
 * Vercel Serverless Function
 * Receives verification from Mini App, verifies signature, notifies bot
 */

// fetch is built-in to Node 18+ (Vercel default runtime)
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const MINTGARDEN_API = 'https://api.mintgarden.io/address/verify_signature';

async function verifySignature(address, message, signature, publicKey) {
  try {
    const response = await fetch(MINTGARDEN_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address,
        message,
        signature,
        pubkey: publicKey
      })
    });
    
    if (!response.ok) {
      return { verified: false, error: `API error: ${response.status}` };
    }
    
    const result = await response.json();
    return { verified: result.verified === true };
    
  } catch (error) {
    return { verified: false, error: error.message };
  }
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { address, message, signature, publicKey, userId } = req.body;
    
    console.log('📱 Received verification:', { address, userId });
    
    // Verify signature via MintGarden
    const result = await verifySignature(address, message, signature, publicKey);
    
    if (!result.verified) {
      return res.status(400).json({ 
        verified: false, 
        error: result.error || 'Signature invalid' 
      });
    }
    
    // Send message to Telegram chat
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    const telegramMessage = `✅ **Wallet Verified!**\n\nAddress: \`${address}\`\nCode: \`${code}\`\n\nVerification complete!`;
    
    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: userId,
          text: telegramMessage,
          parse_mode: 'Markdown'
        })
      }
    );
    
    if (!telegramResponse.ok) {
      console.error('❌ Failed to send Telegram message:', await telegramResponse.text());
    }
    
    return res.status(200).json({ 
      verified: true, 
      address,
      code
    });
    
  } catch (error) {
    console.error('❌ Verification error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
