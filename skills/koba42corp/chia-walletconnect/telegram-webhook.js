#!/usr/bin/env node

/**
 * Telegram Web App Data Webhook Handler
 * 
 * This script intercepts web_app_data callbacks from Telegram
 * and verifies Chia wallet signatures via MintGarden API.
 * 
 * Usage:
 *   node telegram-webhook.js
 * 
 * Requires:
 *   - TELEGRAM_BOT_TOKEN environment variable
 *   - handlers/web-app-data.js (verification logic)
 */

const { Telegraf } = require('telegraf');
const { handleWebAppData } = require('./handlers/web-app-data');

// Bot token from environment
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN environment variable required');
  console.error('Set it to your bot token from @BotFather');
  process.exit(1);
}

// Initialize bot
const bot = new Telegraf(BOT_TOKEN);

console.log('🤖 Chia Wallet Verification Bot starting...');

// Mock message tool for Telegraf context
function createMessageTool(ctx) {
  return async function({ action, channel, target, message }) {
    if (action === 'send') {
      await ctx.reply(message, { parse_mode: 'Markdown' });
    }
  };
}

// Handle /verify command
bot.command('verify', async (ctx) => {
  const message = '🌱 **Verify Your Chia Wallet**\n\n' +
    'Connect your Sage Wallet and cryptographically prove ownership:\n\n' +
    'https://webapp-gold-sigma.vercel.app\n\n' +
    '✅ Secure signature via WalletConnect\n' +
    '✅ No private keys shared\n' +
    '✅ Instant verification';
  
  await ctx.reply(message, { parse_mode: 'Markdown' });
});

// Handle web_app_data callback
bot.on('web_app_data', async (ctx) => {
  console.log('📱 Received web_app_data from user:', ctx.from.id);
  
  const webAppData = {
    data: ctx.message.web_app_data.data,
    from: ctx.from,
    chat: ctx.chat
  };
  
  const messageTool = createMessageTool(ctx);
  
  try {
    const result = await handleWebAppData(webAppData, messageTool);
    
    if (result.success) {
      console.log('✅ Verification successful:', result.address);
    } else {
      console.log('❌ Verification failed:', result.reason);
    }
  } catch (error) {
    console.error('❌ Handler error:', error);
    await ctx.reply('❌ Failed to process verification. Please try again.');
  }
});

// Handle errors
bot.catch((err, ctx) => {
  console.error('❌ Bot error:', err);
});

// Start bot
bot.launch()
  .then(() => {
    console.log('✅ Bot started successfully');
    console.log('📱 Listening for /verify commands and web_app_data callbacks');
    console.log('🔗 Mini App URL: https://webapp-gold-sigma.vercel.app');
  })
  .catch(err => {
    console.error('❌ Failed to start bot:', err);
    process.exit(1);
  });

// Graceful shutdown
process.once('SIGINT', () => {
  console.log('\n🛑 Stopping bot...');
  bot.stop('SIGINT');
});

process.once('SIGTERM', () => {
  console.log('\n🛑 Stopping bot...');
  bot.stop('SIGTERM');
});
