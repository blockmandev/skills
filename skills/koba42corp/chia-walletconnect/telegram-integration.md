# Telegram Mini App Integration

## Step 1: Register with BotFather

1. Open Telegram and message [@BotFather](https://t.me/BotFather)
2. Send `/myapps`
3. Select your bot
4. Choose "Edit Web App URL"
5. Enter: `https://webapp-gold-sigma.vercel.app`
6. **Short name:** `verify` (for direct link: `t.me/YourBot/verify`)

## Step 2: Set Up Menu Button (Optional)

To make the webapp accessible via the bot's menu button:

1. In BotFather, send `/setmenubutton`
2. Select your bot
3. **Button text:** "🌱 Verify Wallet"
4. **Web App URL:** `https://webapp-gold-sigma.vercel.app`

## Step 3: Implement Bot Handlers

### Using Clawdbot Message Tool

For Clawdbot, you don't need a separate bot - use the `message` tool:

#### Send /verify command response:

```javascript
// When user sends /verify
message({
  action: 'send',
  channel: 'telegram',
  target: chatId,
  message: '🌱 Verify your Chia wallet ownership:',
  buttons: [[{
    text: '🔗 Connect Sage Wallet',
    web_app: { url: 'https://webapp-gold-sigma.vercel.app' }
  }]]
});
```

#### Handle web_app_data callback:

This needs to be set up at the channel/gateway level to route `web_app_data` events.

Clawdbot should receive these as incoming messages with special metadata.

## Step 4: Verification Handler Example

```javascript
// Example handler for web_app_data callback
async function handleWalletVerification(webAppData) {
  const data = JSON.parse(webAppData);
  const { address, message, signature, publicKey, userId } = data;
  
  // Verify signature via MintGarden API
  const response = await fetch('https://api.mintgarden.io/address/verify_signature', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      address,
      message,
      signature,
      pubkey: publicKey
    })
  });
  
  const result = await response.json();
  
  if (result.verified) {
    // SUCCESS!
    await message({
      action: 'send',
      channel: 'telegram',
      target: userId,
      message: `✅ Wallet verified!\n\n**Address:** \`${address}\`\n\nYou now have access to gated content.`
    });
    
    // Store verification
    await storeVerification(userId, address);
    
  } else {
    await message({
      action: 'send',
      channel: 'telegram',
      target: userId,
      message: '❌ Verification failed. Please try again.'
    });
  }
}
```

## Step 5: Test Flow

1. User sends `/verify` to your bot
2. Bot responds with inline button "🔗 Connect Sage Wallet"
3. User taps button → Mini App opens
4. User connects wallet via WalletConnect QR code
5. User signs challenge message
6. Webapp sends data back via `Telegram.WebApp.sendData()`
7. Bot receives `web_app_data` callback
8. Bot verifies signature with MintGarden
9. Bot confirms success

## Commands to Add

### /verify
Opens the wallet verification webapp

### /status
Shows user's current verification status (if verified)

### /disconnect
Clears user's verification (optional)

## Security Considerations

1. **Link userId to verification** — Store `telegram_user_id → wallet_address`
2. **Timestamp validation** — Reject signatures older than 5 minutes
3. **Rate limiting** — Max 3 verification attempts per hour
4. **Nonce tracking** — Prevent replay attacks (store used nonces)

## Database Schema (Example)

```sql
CREATE TABLE wallet_verifications (
  id SERIAL PRIMARY KEY,
  telegram_user_id BIGINT NOT NULL UNIQUE,
  wallet_address VARCHAR(62) NOT NULL,
  public_key VARCHAR(96),
  signature TEXT NOT NULL,
  challenge_message TEXT NOT NULL,
  verified_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP -- Optional: re-verify after X days
);

CREATE INDEX idx_telegram_user ON wallet_verifications(telegram_user_id);
CREATE INDEX idx_wallet_address ON wallet_verifications(wallet_address);
```

## Next Steps

1. ✅ Webapp deployed: https://webapp-gold-sigma.vercel.app
2. ⏳ Register with BotFather
3. ⏳ Implement /verify command handler
4. ⏳ Implement web_app_data callback handler
5. ⏳ Set up verification storage
6. ⏳ Test end-to-end flow

---

**Need help?**
- [Telegram Mini Apps Docs](https://core.telegram.org/bots/webapps)
- [Clawdbot Message Tool](../../docs/tools/message.md)
- [MintGarden API](https://api.mintgarden.io/docs)
