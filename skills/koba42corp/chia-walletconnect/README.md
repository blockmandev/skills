# Chia WalletConnect - Telegram Mini App Verification

**Status:** ✅ Fully Functional Template  
**Version:** 1.0.0  
**Author:** Koba42 Corp  
**License:** MIT

## Overview

A complete Telegram Mini App for cryptographic Chia wallet verification via WalletConnect and Sage Wallet. Users can prove wallet ownership through CHIP-0002 compliant signatures, verified against the MintGarden API.

**This skill is a working template** - it successfully connects wallets, generates signatures, and verifies them. What it *doesn't* include is the post-verification logic (what to do once someone is verified). That's where you come in!

## What's Included

### ✅ Fully Working Components

1. **Telegram Mini App** (webapp/)
   - WalletConnect v2 integration
   - Sage Wallet support via QR code
   - CHIP-0002 compliant message signing
   - Public key fetching
   - Challenge message generation
   - Clean UI with loading states

2. **Verification API** (webapp/api/verify.js)
   - Vercel serverless function
   - MintGarden signature verification
   - Telegram Bot API integration
   - Sends success messages to users

3. **Documentation**
   - Complete setup guides
   - Integration examples
   - Troubleshooting tips
   - Feature request for Clawdbot

### ❌ What You Need to Build

**Post-Verification Handler** - What happens after verification succeeds?

Examples:
- Grant access to private Telegram groups
- Check NFT ownership for gating
- Airdrop eligibility tracking
- DAO voting authentication
- Role assignment in Discord
- Database record creation
- Loyalty program enrollment

## Architecture

```
┌─────────────┐
│   User      │
│  (Telegram) │
└──────┬──────┘
       │ Opens Mini App
       ▼
┌─────────────────────┐
│   Mini App (Vercel) │
│  WalletConnect UI   │
└──────┬──────────────┘
       │ User signs message
       ▼
┌──────────────────────┐
│ API Endpoint         │
│ /api/verify          │
│ - Verify signature   │
│ - Send Telegram msg  │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ Telegram Chat        │
│ "✅ Wallet Verified!"│
└──────────────────────┘
```

## Quick Start

### 1. Deploy the Mini App

```bash
cd skills/chia-walletconnect/webapp

# Install dependencies
npm install

# Add bot token to Vercel
vercel env add TELEGRAM_BOT_TOKEN production
# Paste your token: 123456:ABC-DEF...

# Deploy to production
vercel --prod
```

You'll get a URL like: `https://your-app.vercel.app`

### 2. Register with BotFather

1. Message [@BotFather](https://t.me/BotFather) on Telegram
2. Send `/mybots`
3. Select your bot
4. Choose **"Bot Settings"** → **"Menu Button"**
5. Button text: `🌱 Verify Wallet`
6. Web App URL: `https://your-app.vercel.app`

### 3. Test It

Open your bot in Telegram, tap the menu button (≡), and complete a wallet verification!

## How It Works

### Step 1: User Opens Mini App
- User taps button in Telegram
- Mini App loads in-app browser
- WalletConnect initializes

### Step 2: Connect Wallet
- QR code displayed
- User scans with Sage Wallet
- WalletConnect session established
- Public key fetched via `chip0002_getPublicKeys`

### Step 3: Sign Challenge
- Challenge message generated (includes nonce, timestamp, user ID)
- User signs via `chip0002_signMessage`
- Signature returned to Mini App

### Step 4: Verify Signature
- Mini App POSTs to `/api/verify`
- API verifies signature via MintGarden
- Success message sent to Telegram chat
- User sees confirmation

### Step 5: Your Logic Here! 🎯
This is where you add your use case:
- Check wallet NFTs
- Grant group access
- Record verification
- Trigger workflows
- Update permissions

## Project Structure

```
chia-walletconnect/
├── webapp/                    # Telegram Mini App
│   ├── api/
│   │   └── verify.js         # Serverless verification endpoint
│   ├── app.js                # Main Mini App logic
│   ├── index.html            # UI
│   ├── styles.css            # Styling
│   ├── vite.config.js        # Build config
│   └── package.json          # Dependencies
│
├── handlers/                  # Node.js verification handlers
│   ├── web-app-data.js       # Signature verification logic
│   └── verify-command.js     # /verify command handler
│
├── SKILL.md                   # Skill documentation
├── README.md                  # This file
├── SOLUTION.md                # Technical solution overview
├── STATUS.md                  # Project status
└── INTEGRATION.md             # Integration guide
```

## Configuration

### Environment Variables (Vercel)

Required:
- `TELEGRAM_BOT_TOKEN` - Your Telegram bot token from BotFather

### Telegram Bot Setup

1. Get bot token from [@BotFather](https://t.me/BotFather)
2. Register Mini App URL with BotFather
3. Set menu button or inline keyboard

## Use Cases

### NFT-Gated Telegram Group

```javascript
// In your bot handler, after verification:
const { address, verified } = verificationResult;

if (verified) {
  // Check NFT ownership
  const nfts = await fetchNFTsForAddress(address);
  const hasRequiredNFT = nfts.some(nft => 
    nft.collection_id === 'col1required...'
  );
  
  if (hasRequiredNFT) {
    await inviteUserToGroup(userId, groupId);
    await sendMessage(userId, '🎉 Access granted!');
  } else {
    await sendMessage(userId, '❌ You need a Wojak NFT to join.');
  }
}
```

### Airdrop Eligibility

```javascript
if (verified) {
  // Store verification in database
  await db.verifications.insert({
    telegram_user_id: userId,
    wallet_address: address,
    verified_at: Date.now()
  });
  
  // Check eligibility
  const eligible = await checkAirdropEligibility(address);
  
  if (eligible) {
    await sendMessage(userId, '✅ You qualify for the airdrop!');
  }
}
```

### DAO Voting Authentication

```javascript
if (verified) {
  // Link wallet to Telegram user
  await dao.linkWallet(userId, address);
  
  // Check voting power
  const power = await dao.getVotingPower(address);
  
  await sendMessage(userId, 
    `✅ Wallet linked!\n\nVoting power: ${power} tokens`
  );
}
```

## Customization

### Change Challenge Message Format

Edit `webapp/app.js`:

```javascript
function generateChallenge() {
  const message = `Your custom message here:\n${currentAddress}`;
  // ...
}
```

### Customize Success Message

Edit `webapp/api/verify.js`:

```javascript
const telegramMessage = `
✅ Custom Success Message!

Address: ${address}
Your custom info here...
`;
```

### Add Custom Verification Logic

Edit `webapp/api/verify.js` after signature verification:

```javascript
if (result.verified) {
  // Your custom logic here
  await yourCustomFunction(address, userId);
  
  // Then send Telegram message
  await sendTelegramMessage(userId, 'Success!');
}
```

## Security Considerations

✅ **What's Secure**
- Signatures verified cryptographically
- Bot token stored server-side (Vercel env)
- Nonces prevent replay attacks
- Timestamps expire after 5 minutes
- No private keys requested or stored

⚠️ **What You Should Add**
- Rate limiting on verification endpoint
- User ID → wallet address mapping in database
- Verification expiry/re-verification logic
- Allowlist/denylist for addresses
- Logging and monitoring

## Known Limitations

### Clawdbot Integration

Clawdbot doesn't currently support Telegram's `web_app_data` callbacks. This skill works around it by:
1. Using a serverless function to verify signatures
2. Sending success messages via Bot API
3. The bot receives messages normally

See `CLAWDBOT-FEATURE-REQUEST.md` for details on the missing feature.

### Browser Compatibility

- Requires Telegram app (web version has limitations)
- Best on mobile (Sage Wallet integration)
- Desktop users can scan QR with mobile Sage

## Troubleshooting

### Mini App Won't Open
- Verify HTTPS URL with BotFather
- Check URL is publicly accessible
- Test URL directly in browser

### QR Code Won't Scan
- Ensure Sage Wallet is latest version
- Check WalletConnect Project ID is valid
- Try manual URI paste in Sage

### Signature Verification Fails
- Confirm MintGarden API is operational
- Verify message format matches exactly
- Check public key is included in signing request

### No Message in Telegram
- Check Vercel function logs
- Verify `TELEGRAM_BOT_TOKEN` is set
- Confirm bot has permission to message user

## Development

### Local Testing

```bash
cd webapp
npm install
npm run dev
```

### View Logs

```bash
# Vercel logs (requires deployment URL)
vercel logs https://your-deployment-url.vercel.app
```

### Deploy

```bash
vercel --prod
```

## What's Next?

This skill is **production-ready** for the verification flow. To make it useful, add:

1. **Storage** - Database to track verifications
2. **Business Logic** - What to do with verified wallets
3. **Admin Panel** - Manage verifications
4. **Analytics** - Track usage
5. **Rate Limiting** - Prevent abuse

## Contributing

This skill is a template - fork it, customize it, build amazing things!

Ideas for improvements:
- Multi-chain support (beyond Chia)
- Batch verification
- Verification expiry
- Web dashboard
- Analytics integration

## Credits

**Built by:** Koba42 Corp  
**Powered by:**
- [WalletConnect](https://walletconnect.com/) - Wallet connection protocol
- [Sage Wallet](https://www.sagewallet.io/) - Chia wallet
- [MintGarden](https://mintgarden.io/) - Signature verification API
- [Vercel](https://vercel.com/) - Serverless hosting
- [Telegram](https://telegram.org/) - Messaging platform

## License

MIT License - See LICENSE file for details

## Support

- **Documentation:** See `SKILL.md` for detailed usage
- **Technical Details:** See `SOLUTION.md` for architecture
- **Integration:** See `INTEGRATION.md` for Telegram setup
- **Status:** See `STATUS.md` for current state

---

**Ready to verify wallets?** Deploy the Mini App and start building your use case! 🌱🚀
