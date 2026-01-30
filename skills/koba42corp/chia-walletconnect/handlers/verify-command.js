#!/usr/bin/env node

/**
 * Chia Wallet Verification - /verify Command Handler
 * 
 * This handler responds to /verify commands in Telegram
 * by sending a Mini App button that opens the verification webapp.
 * 
 * Usage:
 *   - Integrate into Clawdbot message routing
 *   - Or call directly via CLI for testing
 */

const WEBAPP_URL = 'https://webapp-gold-sigma.vercel.app';

/**
 * Send /verify command response
 * @param {string} chatId - Telegram chat ID
 * @param {Function} messageTool - Clawdbot message tool
 */
async function sendVerifyButton(chatId, messageTool) {
  return await messageTool({
    action: 'send',
    channel: 'telegram',
    target: chatId,
    message: '🌱 **Verify Your Chia Wallet**\n\nTap the button below to connect your Sage Wallet and cryptographically prove ownership.\n\n✅ Secure signature via WalletConnect\n✅ No private keys shared\n✅ Instant verification',
    buttons: [[{
      text: '🔗 Connect Sage Wallet',
      web_app: { url: WEBAPP_URL }
    }]]
  });
}

/**
 * Handle incoming /verify command
 * @param {Object} message - Telegram message object
 * @param {Function} messageTool - Clawdbot message tool
 */
async function handleVerifyCommand(message, messageTool) {
  const chatId = message.chat.id;
  const userId = message.from.id;
  
  console.log(`📱 /verify command from user ${userId} in chat ${chatId}`);
  
  try {
    await sendVerifyButton(chatId, messageTool);
    console.log('✅ Verification button sent');
  } catch (error) {
    console.error('❌ Failed to send verification button:', error);
    
    // Send error message
    await messageTool({
      action: 'send',
      channel: 'telegram',
      target: chatId,
      message: '❌ Failed to load verification interface. Please try again later.'
    });
  }
}

module.exports = {
  sendVerifyButton,
  handleVerifyCommand
};

// CLI usage
if (require.main === module) {
  const chatId = process.argv[2];
  
  if (!chatId) {
    console.error('Usage: node verify-command.js <chatId>');
    process.exit(1);
  }
  
  // Mock message tool for testing
  const mockMessageTool = async (opts) => {
    console.log('📤 Would send message:', JSON.stringify(opts, null, 2));
    return { success: true };
  };
  
  sendVerifyButton(chatId, mockMessageTool)
    .then(() => console.log('✅ Done'))
    .catch(err => {
      console.error('❌ Error:', err);
      process.exit(1);
    });
}
