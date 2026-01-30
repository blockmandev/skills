# Clawdbot Integration for Web App Data

## The Challenge

Telegram sends `web_app_data` callbacks when users complete Mini App interactions, but Clawdbot's current Telegram channel may not expose this data in the message context you see.

## How Web App Data Arrives

When a user completes verification in the Mini App and it calls `Telegram.WebApp.sendData()`, Telegram sends a message like:

```json
{
  "message_id": 123,
  "from": { "id": 6333195764, "first_name": "Jeff", ... },
  "chat": { "id": 6333195764, ... },
  "date": 1706567890,
  "web_app_data": {
    "data": "{\"address\":\"xch1...\",\"signature\":\"...\",\"publicKey\":\"...\",...}",
    "button_text": "🔗 Connect Sage Wallet"
  }
}
```

## Integration Options

### Option 1: Agent Detection (If web_app_data is visible)

If you can see `web_app_data` in incoming messages, add this to your agent logic:

```javascript
// In your message handler
if (message.web_app_data) {
  const { handleWebAppData } = require('./skills/chia-walletconnect/handlers/web-app-data');
  
  const webAppData = {
    data: message.web_app_data.data,
    from: message.from,
    chat: message.chat
  };
  
  const result = await handleWebAppData(webAppData, message);
  // Message tool is passed as second argument
}
```

### Option 2: Webhook Proxy (Recommended if web_app_data not visible)

Run a lightweight proxy that:
1. Receives ALL Telegram updates via webhook
2. Filters for `web_app_data` messages
3. Handles verification
4. Passes everything else to Clawdbot

This doesn't interfere with Clawdbot - it just adds a layer that catches web_app_data before Clawdbot sees it.

```bash
# Start the proxy
cd ~/clawd/skills/chia-walletconnect
TELEGRAM_BOT_TOKEN="your-token" node telegram-webhook-proxy.js
```

The proxy will:
- Handle web_app_data → verify and respond
- Forward regular messages → to Clawdbot's webhook

### Option 3: Check Next Message

When you send the verification link, the signature data might arrive as the user's *next message* in some format. Check the console logs to see what Clawdbot receives after a user completes verification.

## Testing

1. **Send the link** to a user: https://webapp-gold-sigma.vercel.app
2. **User completes verification**
3. **Check Clawdbot logs** - what message arrives?
   - If you see JSON with `address`, `signature`, `publicKey` → parse and verify
   - If you see `web_app_data` → use the handler directly
   - If you see nothing → need webhook proxy (Option 2)

## Current Setup

For now, the **standalone bot** (`telegram-webhook.js`) is the simplest solution that works independently of Clawdbot's internals.

**To make it fully integrated**, we need to:
1. Check what Clawdbot's Telegram plugin exposes
2. Either modify the plugin to pass web_app_data to the agent
3. Or run the webhook proxy alongside Clawdbot

---

**Want to test right now?**

Try this:
1. Send verification link to yourself
2. Complete verification  
3. Check what message you (the agent) receive
4. We'll handle it from there! 🖖
