# Clawdbot Integration Guide

## Quick Start

Your Chia WalletConnect Mini App is deployed at:
**https://webapp-gold-sigma.vercel.app**

Here's how to integrate it into your Telegram bot via Clawdbot.

---

## Step 1: Register with BotFather

1. Message [@BotFather](https://t.me/BotFather) on Telegram
2. Send `/myapps`
3. Select your bot
4. Choose **"Edit Web App URL"** or **"Add Web App"**
5. Enter: `https://webapp-gold-sigma.vercel.app`
6. Set short name: `verify` (creates link: `t.me/YourBot/verify`)

---

## Step 2: Send Verification Button

When a user sends `/verify`, respond with a Mini App button:

```javascript
// Using Clawdbot's message tool
await message({
  action: 'send',
  channel: 'telegram',
  target: chatId,
  message: '🌱 **Verify Your Chia Wallet**\n\nConnect your Sage Wallet to prove ownership.',
  buttons: [[{
    text: '🔗 Connect Sage Wallet',
    web_app: { url: 'https://webapp-gold-sigma.vercel.app' }
  }]]
});
```

Or use the pre-built handler:

```javascript
const { handleVerifyCommand } = require('./skills/chia-walletconnect/handlers/verify-command');

// In your message router
if (message.text === '/verify') {
  await handleVerifyCommand(message, message);
}
```

---

## Step 3: Handle Signature Response

When the user completes verification in the Mini App, Telegram sends a `web_app_data` callback.

**With Clawdbot:** You'll receive this as a message event with `web_app_data` metadata.

```javascript
const { handleWebAppData } = require('./skills/chia-walletconnect/handlers/web-app-data');

// In your Telegram message handler
if (message.web_app_data) {
  const result = await handleWebAppData(message.web_app_data, message);
  
  if (result.success) {
    console.log(`✅ User ${message.from.id} verified wallet: ${result.address}`);
    // Grant access, update permissions, etc.
  }
}
```

---

## Complete Example

### Example: NFT-Gated Telegram Group

```javascript
const { handleVerifyCommand } = require('./skills/chia-walletconnect/handlers/verify-command');
const { handleWebAppData, verifySignature } = require('./skills/chia-walletconnect/handlers/web-app-data');

// Command: /verify
async function onVerifyCommand(msg) {
  await handleVerifyCommand(msg, message);
}

// Callback: web_app_data
async function onWebAppData(msg) {
  const result = await handleWebAppData(msg.web_app_data, message);
  
  if (result.success) {
    // Check if wallet owns required NFT
    const nfts = await getNFTsForAddress(result.address);
    const hasAccess = nfts.some(nft => nft.collection_id === 'col1required...');
    
    if (hasAccess) {
      // Grant access to private group
      await inviteUserToGroup(msg.from.id);
      await message({
        action: 'send',
        channel: 'telegram',
        target: msg.chat.id,
        message: '🎉 Access granted! Check your invites.'
      });
    } else {
      await message({
        action: 'send',
        channel: 'telegram',
        target: msg.chat.id,
        message: '❌ You need a Wojak NFT to join this group.'
      });
    }
  }
}
```

---

## Message Routing in Clawdbot

### Option A: Direct Integration (Recommended)

Add handlers to your agent's message routing:

```javascript
// In your Clawdbot message handler
async function handleTelegramMessage(msg) {
  // Command routing
  if (msg.text === '/verify') {
    const { handleVerifyCommand } = require('./skills/chia-walletconnect/handlers/verify-command');
    return await handleVerifyCommand(msg, message);
  }
  
  // web_app_data callback
  if (msg.web_app_data) {
    const { handleWebAppData } = require('./skills/chia-walletconnect/handlers/web-app-data');
    return await handleWebAppData(msg.web_app_data, message);
  }
  
  // Other message handling...
}
```

### Option B: CLI Testing

Test handlers directly:

```bash
# Test verify button
node skills/chia-walletconnect/handlers/verify-command.js 123456

# Test web_app_data handler
node skills/chia-walletconnect/handlers/web-app-data.js
```

---

## Storage Setup (Required for Production)

The handlers include a `storeVerification()` placeholder. Implement actual storage:

### Option 1: JSON File (Simple)

```javascript
const fs = require('fs');
const VERIFICATIONS_FILE = './verifications.json';

async function storeVerification(telegramUserId, walletAddress, metadata = {}) {
  const verifications = JSON.parse(
    fs.readFileSync(VERIFICATIONS_FILE, 'utf8') || '{}'
  );
  
  verifications[telegramUserId] = {
    address: walletAddress,
    verifiedAt: Date.now(),
    ...metadata
  };
  
  fs.writeFileSync(VERIFICATIONS_FILE, JSON.stringify(verifications, null, 2));
}

function getVerification(telegramUserId) {
  const verifications = JSON.parse(
    fs.readFileSync(VERIFICATIONS_FILE, 'utf8') || '{}'
  );
  return verifications[telegramUserId];
}
```

### Option 2: SQLite (Better)

```bash
npm install better-sqlite3
```

```javascript
const Database = require('better-sqlite3');
const db = new Database('./verifications.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS verifications (
    telegram_user_id INTEGER PRIMARY KEY,
    wallet_address TEXT NOT NULL,
    public_key TEXT,
    signature TEXT NOT NULL,
    challenge_message TEXT NOT NULL,
    verified_at INTEGER DEFAULT (unixepoch())
  )
`);

async function storeVerification(telegramUserId, walletAddress, metadata) {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO verifications 
    (telegram_user_id, wallet_address, public_key, signature, challenge_message)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  stmt.run(
    telegramUserId,
    walletAddress,
    metadata.publicKey,
    metadata.signature,
    metadata.message
  );
}

function getVerification(telegramUserId) {
  const stmt = db.prepare('SELECT * FROM verifications WHERE telegram_user_id = ?');
  return stmt.get(telegramUserId);
}
```

---

## Testing Checklist

- [ ] **Register Mini App URL with BotFather**
- [ ] **Test /verify command** → button appears
- [ ] **Tap button** → Mini App opens
- [ ] **Connect Sage Wallet** → QR code scannable
- [ ] **Sign challenge** → signature sent back
- [ ] **Verify signature** → success message appears
- [ ] **Check storage** → verification saved
- [ ] **Test expiry** → old signatures rejected

---

## Security Best Practices

1. **Rate limiting:** Max 3 verification attempts per user per hour
2. **Timestamp validation:** Reject signatures older than 5 minutes
3. **Nonce tracking:** Store used nonces to prevent replay attacks
4. **User ID linking:** Always link `telegram_user_id` to `wallet_address`
5. **HTTPS only:** Telegram requires HTTPS for Mini Apps (already enforced)

---

## Troubleshooting

### Mini App doesn't open
- Verify URL registered with BotFather
- Check HTTPS (HTTP won't work)
- Test URL directly in browser

### QR code blocked by loading spinner
- Already fixed in latest deployment
- Loading overlay now hides when modal opens

### Signature verification fails
- Check MintGarden API status
- Verify public key was included in signing request
- Ensure challenge message format matches exactly

### web_app_data not received
- Check Telegram channel configuration in Clawdbot
- Verify callback handler is registered
- Check Clawdbot logs for routing errors

---

## Next Steps

1. ✅ **Mini App deployed:** https://webapp-gold-sigma.vercel.app
2. ✅ **Handlers created:** `verify-command.js`, `web-app-data.js`
3. ⏳ **Register with BotFather**
4. ⏳ **Integrate handlers into message routing**
5. ⏳ **Set up verification storage**
6. ⏳ **Test end-to-end flow**
7. ⏳ **Add NFT ownership checks (optional)**
8. ⏳ **Deploy to production**

---

**Questions?**
- Telegram Mini Apps: https://core.telegram.org/bots/webapps
- CHIP-0002 Spec: https://github.com/Chia-Network/chips/blob/main/CHIPs/chip-0002.md
- MintGarden API: https://api.mintgarden.io/docs
