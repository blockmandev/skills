# Contributing to Chia WalletConnect

We welcome contributions! This skill is a template, and we'd love to see:
- Real-world use case implementations
- Integration examples
- Bug fixes
- Documentation improvements
- Feature enhancements

## How to Contribute

### 1. Fork & Clone

```bash
git clone https://github.com/yourusername/chia-walletconnect-skill.git
cd chia-walletconnect-skill
```

### 2. Install Dependencies

```bash
cd webapp
npm install
```

### 3. Make Your Changes

Some ideas:
- Add a new integration example
- Improve error handling
- Add TypeScript types
- Write tests
- Improve documentation
- Add database storage example

### 4. Test Locally

```bash
# Start dev server
npm run dev

# Or test with Vercel CLI
vercel dev
```

### 5. Submit PR

- Clear description of what you changed
- Why the change is useful
- Any breaking changes noted
- Screenshots if UI changes

## Areas We Need Help

### Integration Examples

We'd love to see real implementations:
- NFT gating with collection checks
- DAO voting with token balance
- Airdrop eligibility tracking
- Multi-group access management
- Custom verification workflows

### Storage Solutions

Examples using:
- SQLite
- PostgreSQL
- MongoDB
- Redis
- Supabase
- Firebase

### Advanced Features

- Rate limiting implementation
- Verification expiry
- Admin dashboard
- Analytics
- Logging/monitoring
- Error tracking

### Testing

- Unit tests for handlers
- E2E tests for Mini App
- Integration tests for API
- Load testing

### Documentation

- Video tutorials
- Step-by-step guides
- Troubleshooting FAQ
- Architecture diagrams
- Security best practices

## Code Style

- Use ESM (import/export)
- Async/await over promises
- Clear variable names
- Comments for complex logic
- Error handling everywhere

## Commit Messages

Format: `type: description`

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Formatting, no code change
- `refactor`: Code change that neither fixes nor adds feature
- `test`: Adding tests
- `chore`: Maintenance

Examples:
```
feat: add NFT ownership check example
fix: handle missing public key gracefully
docs: add setup video tutorial
```

## Questions?

- Open an issue for discussion
- Join the community chat (if available)
- Check existing issues first

## License

By contributing, you agree your contributions will be licensed under the MIT License.

---

**Thank you for helping make this template better!** 🌱
