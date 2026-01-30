# Telegram Integration Setup

Your Chia Wallet Verification Mini App needs to receive `web_app_data` callbacks from Telegram when users complete verification. Since Clawdbot's built-in Telegram channel doesn't handle `web_app_data` yet, we have two options:

## Option 1: Standalone Bot (Recommended)

Run a lightweight Node.js script that handles **only** the wallet verification flow.

### Setup:

1. **Get your bot token** from BotFather (you already have this)

2. **Set environment variable:**
```bash
export TELEGRAM_BOT_TOKEN="your-bot-token-here"
```

3. **Start the verification bot:**
```bash
cd ~/clawd/skills/chia-walletconnect
node telegram-webhook.js
```

4. **Test it:**
   - Send `/verify` to your bot
   - Click the link
   - Complete verification
   - Bot should receive the signature and verify it

### Run as Service (pm2):

```bash
# Install pm2 globally
npm install -g pm2

# Start the bot
cd ~/clawd/skills/chia-walletconnect
pm2 start telegram-webhook.js --name chia-verify-bot

# View logs
pm2 logs chia-verify-bot

# Stop
pm2 stop chia-verify-bot
```

### What It Does:

- ✅ Listens for `/verify` commands → sends webapp link
- ✅ Receives `web_app_data` callbacks → verifies signature via MintGarden
- ✅ Sends success/failure messages
- ✅ Stores verifications (you'll need to implement storage)

---

## Option 2: Integrate into Clawdbot (Advanced)

If you want Clawdbot to handle web_app_data directly, we need to:

1. **Add web_app_data support** to Clawdbot's Telegram plugin
2. **Create a message router** that intercepts web_app_data messages
3. **Wire up the handlers**

This requires modifying Clawdbot's core or creating a plugin system.

**For now, Option 1 is simpler and cleaner.** 🖖

---

## Storage Setup

The verification handler includes a placeholder `storeVerification()` function. Implement actual storage:

### SQLite Example:

```javascript
const Database = require('better-sqlite3');
const db = new Database('./verifications.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS verifications (
    telegram_user_id INTEGER PRIMARY KEY,
    wallet_address TEXT NOT NULL,
    public_key TEXT,
    signature TEXT,
    verified_at INTEGER DEFAULT (unixepoch())
  )
`);

async function storeVerification(telegramUserId, walletAddress, metadata) {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO verifications 
    (telegram_user_id, wallet_address, public_key, signature)
    VALUES (?, ?, ?, ?)
  `);
  
  stmt.run(
    telegramUserId,
    walletAddress,
    metadata.publicKey,
    metadata.signature
  );
}
```

Add this to `handlers/web-app-data.js` to persist verifications.

---

## Next Steps

1. ✅ Mini App deployed and working
2. ⏳ Run `telegram-webhook.js` with your bot token
3. ⏳ Test end-to-end verification flow
4. ⏳ Implement storage (SQLite/JSON/database)
5. ⏳ Add business logic (grant access, check NFT ownership, etc.)

---

**Questions?** Check the handlers code in `handlers/` for implementation details.
