# Chia Wallet Connect - Project Status

## ✅ What's Working

### Mini App (100% Complete)
- **URL (Working):** https://webapp-qo6kswnal-dracattus-projects.vercel.app
- **URL (Cached):** https://webapp-gold-sigma.vercel.app (CDN cache issue)
- **Features:**
  - ✅ WalletConnect v2 integration
  - ✅ Sage Wallet support
  - ✅ CHIP-0002 compliant signing
  - ✅ Public key fetching
  - ✅ Challenge message generation
  - ✅ MintGarden signature verification
  - ✅ Automatic localStorage cleanup (no stale sessions)
  - ✅ Error handling & timeouts

### Verification Handlers
- ✅ `handlers/web-app-data.js` - Signature verification logic
- ✅ `handlers/verify-command.js` - /verify command handler
- ✅ MintGarden API integration
- ✅ Timestamp validation
- ✅ Storage placeholders

## ❌ What's Blocked

### Clawdbot Integration
**Issue:** Clawdbot's Telegram plugin doesn't handle `web_app_data` callbacks.

**Root Cause:**  
File: `/dist/telegram/bot-handlers.js`  
Missing: `bot.on("web_app_data", ...)` handler

**Impact:**  
When users complete verification in the Mini App, the signature data is sent via `Telegram.WebApp.sendData()` but Clawdbot (me) never receives it.

## 📋 Documentation Created

1. **CLAWDBOT-FEATURE-REQUEST.md** - Full feature request for web_app_data support
2. **TELEGRAM-SETUP.md** - Standalone bot setup (Option B)
3. **CLAWDBOT-INTEGRATION.md** - Integration approaches
4. **INTEGRATION.md** - General integration guide
5. **STATUS.md** - This file

## 🛠️ Workaround Options

### Option A: Simple Verification Server (Recommended)
**File:** `simple-verifier.js`  
**How it works:**
1. Mini App POSTs verification data to local HTTP server
2. Server verifies signature via MintGarden
3. Stores results in `pending-verifications.json`
4. Clawdbot can check status via HTTP or file

**Start:**
```bash
cd ~/clawd/skills/chia-walletconnect
node simple-verifier.js
```

**Check status:**
```bash
curl http://127.0.0.1:18790/status/<telegram_user_id>
```

**Cons:**
- Mini App can't reach localhost from user's phone
- Needs public URL (ngrok/cloudflare tunnel)

### Option B: Standalone Telegraf Bot
**File:** `telegram-webhook.js`  
**How it works:**
- Separate Node.js process using same bot token
- Handles ONLY web_app_data callbacks
- Clawdbot handles everything else

**Cons:**
- ❌ **Conflicts with Clawdbot** (Telegram allows only one getUpdates consumer)
- Would need webhook mode instead of polling

### Option C: Wait for Clawdbot Update
**Pros:**
- Clean, native solution
- No workarounds needed

**Cons:**
- Requires Clawdbot maintainers to implement
- Unknown timeline

### Option D: Patch Clawdbot Locally
**How:**
- Edit `/dist/telegram/bot-handlers.js`
- Add web_app_data handler
- Reapply after each Clawdbot update

**Cons:**
- Fragile (breaks on updates)
- Not recommended for production

## 🎯 Next Steps

### Immediate (To Test Full Flow)
1. Choose Option A or expose simple-verifier via ngrok/cloudflare
2. Update webapp to POST to public URL
3. Test end-to-end verification
4. Confirm signature verification works

### Short-term (Feature Request)
1. Submit feature request to Clawdbot GitHub
2. Include code from CLAWDBOT-FEATURE-REQUEST.md
3. Link to this project as use case

### Long-term (Production)
1. Wait for Clawdbot native support
2. Remove workarounds
3. Use native web_app_data handling

## 📊 Commits

- Initial skill creation
- WalletConnect integration
- Vite build setup
- LocalStorage clearing fix
- CDN cache troubleshooting
- Telegram integration handlers
- Feature request documentation
- Workaround implementations

## 🔗 Key Files

**Mini App:**
- `webapp/app.js` - Main application logic
- `webapp/index.html` - UI
- `webapp/styles.css` - Styling
- `webapp/vite.config.js` - Build config

**Handlers:**
- `handlers/web-app-data.js` - Verification logic
- `handlers/verify-command.js` - Command handler

**Integration:**
- `telegram-webhook.js` - Standalone bot
- `simple-verifier.js` - HTTP verification server
- `message-handlers/chia-wallet-verify.js` - Clawdbot message handler

**Documentation:**
- `SKILL.md` - Main skill documentation
- `INTEGRATION.md` - Integration guide
- `TELEGRAM-SETUP.md` - Telegram setup steps
- `CLAWDBOT-INTEGRATION.md` - Integration options
- `CLAWDBOT-FEATURE-REQUEST.md` - Feature request
- `STATUS.md` - This status document

---

**Last Updated:** 2026-01-29  
**Status:** Blocked on Clawdbot web_app_data support  
**Workarounds:** Available but not ideal  
**Recommendation:** Submit feature request and use Option A temporarily
