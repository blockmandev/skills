# 🧠 A.I. Smart-Router

**Intelligent model routing for multi-provider AI setups.** Automatically selects the optimal AI model for each request using tiered classification — analyzing intent, complexity, and cost to route simple questions to fast/cheap models and complex tasks to powerful ones. Works transparently by default; users just chat normally and get the best model for their needs.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| **Tiered Classification** | Three-step decision process: Intent Detection → Complexity Estimation → Model Selection |
| **Automatic Fallbacks** | If a model fails (timeout, rate limit, error), automatically cascades to the next best option |
| **Token Exhaustion Handling** | Automatically switches models when token quota is exhausted, with user notification |
| **Transparent Notifications** | Users are informed when a model switch occurs, including which model completed their request |
| **Cost Optimization** | Simple tasks use budget models ($); complex tasks unlock premium models ($$$) |
| **Dynamic Discovery** | Auto-detects configured providers at runtime — no hardcoded assumptions |
| **Transparent Mode** | Works silently by default; optional verbose mode shows routing decisions |
| **Multi-Provider** | Supports Anthropic (Claude), OpenAI (GPT), Google (Gemini), and xAI (Grok) |
| **Portable** | Install on any OpenClaw workspace regardless of which providers you have |

---

## 🚀 Quick Start

### 1. Install the Skill

Copy the `smart-router` folder to your OpenClaw workspace skills directory:

```bash
# From your workspace root
mkdir -p skills
cp -r /path/to/smart-router skills/
```

Or clone directly:
```bash
cd ~/.openclaw/workspace/skills
git clone https://github.com/c0nSpIc0uS7uRk3r/smart-router.git
```

### 2. Configure Providers

Add API keys for the providers you want to use (see [Configuration](#-configuration)).

### 3. Start Using

That's it! The router works automatically. Send messages normally and the best model is selected for each task.

Optional: Enable verbose mode to see routing decisions:
```
/router verbose on
```

---

## ⚙️ Configuration

### Required: At Least One Provider

The router requires at least one AI provider configured. Add any combination:

| Provider | Environment Variable | OpenClaw Auth Profile |
|----------|---------------------|----------------------|
| **Anthropic** | `ANTHROPIC_API_KEY` | `anthropic:default` |
| **OpenAI** | `OPENAI_API_KEY` | `openai-codex:default` |
| **Google** | `GOOGLE_API_KEY` | `google:manual` |
| **xAI** | `XAI_API_KEY` | `xai:manual` |

#### Option A: Environment Variables

Add to your shell profile (`~/.bashrc`, `~/.zshrc`):
```bash
export ANTHROPIC_API_KEY="sk-ant-..."
export GOOGLE_API_KEY="AIza..."
export XAI_API_KEY="xai-..."
```

#### Option B: OpenClaw Auth Profiles

```bash
openclaw auth add anthropic
openclaw auth add google --manual
openclaw auth add xai --manual
```

### Adding/Removing Providers

Simply add or remove the API key — the router auto-detects changes within 5 minutes.

Force immediate refresh:
```
/router refresh
```

### Minimum Viable Setup

The router works with just **one provider**. Example with only Anthropic:
- All tasks route to Claude models (Opus/Sonnet/Haiku)
- Warnings shown for missing capabilities (real-time, long context)
- No errors, just graceful degradation

---

## 📋 Commands

| Command | Description |
|---------|-------------|
| `/router` | Show brief status (configured providers, available models) |
| `/router status` | Full status with last 5 routing decisions |
| `/router verbose` | Toggle verbose mode (show routing for all messages) |
| `/router verbose on` | Enable verbose mode |
| `/router verbose off` | Disable verbose mode (default) |
| `/router refresh` | Force re-discover configured providers |

### Model Overrides

Force a specific model by prefixing your message:

```
use opus: Write a complex authentication system
use sonnet: Explain how this code works
use haiku: What's 2+2?
use gpt: Give me an alternative perspective
use gemini: Analyze this 200-page document
use flash: Translate this to Spanish
use grok: What's trending on X right now?
```

### Per-Message Routing Visibility

Add `[show routing]` to any message to see the routing decision:

```
[show routing] What's the capital of France?
```

Output:
```
[Routed → Haiku | Reason: CONVERSATION + SIMPLE complexity, cost-optimized]

The capital of France is Paris.
```

---

## 🌳 Routing Decision Tree

```
                         ┌─────────────────────┐
                         │   Incoming Request  │
                         └──────────┬──────────┘
                                    │
                    ┌───────────────▼───────────────┐
                    │  STEP 0: SPECIAL CASE CHECK   │
                    └───────────────┬───────────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              │                     │                     │
              ▼                     ▼                     ▼
    ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
    │ User specified  │  │ Tokens > 128K?  │  │ Needs real-time │
    │ model override? │  │                 │  │ data?           │
    └────────┬────────┘  └────────┬────────┘  └────────┬────────┘
             │YES                 │YES                 │YES
             ▼                    ▼                    ▼
       Use requested        Gemini Pro              Grok
          model              (forced)             (forced)
             │                    │                    │
             └────────────────────┴────────────────────┘
                                  │NO (none matched)
                                  ▼
                    ┌─────────────────────────────┐
                    │   STEP 1: INTENT DETECTION  │
                    │                             │
                    │  CODE      → coding tasks   │
                    │  ANALYSIS  → research/eval  │
                    │  CREATIVE  → writing/ideas  │
                    │  CONVO     → chat/Q&A       │
                    │  DOCUMENT  → long text      │
                    │  RESEARCH  → fact-finding   │
                    │  MATH      → calculations   │
                    └──────────────┬──────────────┘
                                   │
                                   ▼
                    ┌─────────────────────────────┐
                    │ STEP 2: COMPLEXITY ESTIMATE │
                    │                             │
                    │  SIMPLE  → <50 words, 1 Q   │
                    │  MEDIUM  → 50-200 words     │
                    │  COMPLEX → >200w, multi-part│
                    └──────────────┬──────────────┘
                                   │
                                   ▼
                    ┌─────────────────────────────┐
                    │ STEP 3: COST-AWARE SELECTION│
                    │                             │
                    │  SIMPLE  → $ tier only      │
                    │  MEDIUM  → $ or $$ tier     │
                    │  COMPLEX → any tier         │
                    └──────────────┬──────────────┘
                                   │
                                   ▼
                    ┌─────────────────────────────┐
                    │  STEP 4: MODEL MATRIX LOOKUP│
                    └──────────────┬──────────────┘
                                   │
          ┌────────────────────────┼────────────────────────┐
          │                        │                        │
          ▼                        ▼                        ▼
   ┌─────────────┐         ┌─────────────┐         ┌─────────────┐
   │   SIMPLE    │         │   MEDIUM    │         │   COMPLEX   │
   ├─────────────┤         ├─────────────┤         ├─────────────┤
   │ Flash    $  │         │ Sonnet  $$  │         │ Opus  $$$$  │
   │ Haiku    $  │         │ GPT-5   $$  │         │ GPT-5  $$$  │
   │ Grok-2   $  │         │ Grok-3  $$  │         │ Gemini $$$  │
   └─────────────┘         └─────────────┘         └─────────────┘
          │                        │                        │
          └────────────────────────┼────────────────────────┘
                                   │
                                   ▼
                    ┌─────────────────────────────┐
                    │   STEP 5: FALLBACK CHAIN    │
                    │                             │
                    │  If model fails → try next  │
                    │  Log failure → cascade      │
                    └─────────────────────────────┘
```

### Model Selection Matrix

| Intent | Simple ($) | Medium ($$) | Complex ($$$$) |
|--------|------------|-------------|---------------|
| **CODE** | Sonnet | Sonnet | Opus |
| **ANALYSIS** | Flash | Sonnet/GPT-5 | Opus |
| **CREATIVE** | Sonnet | Sonnet | Opus |
| **CONVERSATION** | Haiku/Flash | Sonnet | Sonnet |
| **DOCUMENT** | Flash | Gemini Pro | Gemini Pro |
| **RESEARCH** | Grok | GPT-5 | Opus |
| **MATH/LOGIC** | Sonnet | Opus | Opus |

### Fallback Chains

| Task Type | Fallback Order |
|-----------|----------------|
| Complex Reasoning | Opus → GPT-5 → Grok 3 → Sonnet |
| Code Generation | Opus → GPT-5 → Sonnet → Grok 3 |
| Fast/Simple | Haiku → Flash → Grok 2 → Sonnet |
| Large Context | Gemini Pro → GPT-5 → Opus |
| Creative Writing | Opus → Sonnet → GPT-5 → Grok 3 |

---

## 🔄 Token Exhaustion & Model Switching

When you run out of tokens on a model (quota exhausted, rate limited), the router **automatically switches to the next best available model** and notifies you.

### What Happens

1. You send a request
2. Primary model fails (token quota exhausted)
3. Router automatically tries the next model in the fallback chain
4. You receive a notification + the completed response

### Notification Example

```
⚠️ MODEL SWITCH NOTICE

Your request could not be completed on claude-opus-4-5
(reason: token quota exhausted).

✅ Request completed using: anthropic/claude-sonnet-4-5

The response below was generated by the fallback model.

---

[Your actual response here]
```

### Switch Reasons

| Reason | What It Means |
|--------|---------------|
| `token quota exhausted` | Daily/monthly token limit reached for this model |
| `rate limit exceeded` | Too many requests per minute |
| `context window exceeded` | Your input was too large for this model |
| `API timeout` | Model took too long to respond |
| `API error` | Provider returned an error |
| `model unavailable` | Model is temporarily offline |

### When All Models Fail

If all available models are exhausted, you'll see:

```
❌ REQUEST FAILED

Unable to complete your request. All available models have been exhausted.

Models attempted: claude-opus-4-5, claude-sonnet-4-5, gpt-5

What you can do:
1. Wait — Token quotas typically reset hourly or daily
2. Simplify — Try a shorter or simpler request
3. Check status — Run /router status to see model availability
```

### Why This Matters

- **No silent failures** — You always know what happened
- **Transparent attribution** — You know which model generated your response
- **Quality expectations** — If Opus fails and Sonnet completes, you know the response came from a less capable model
- **Continuity** — Your workflow isn't interrupted by token limits

---

## 🎨 Customization

### Modifying Routing Preferences

Edit `SKILL.md` and update the `ROUTING_PREFERENCES` dictionary:

```python
ROUTING_PREFERENCES = {
    ("CODE", "SIMPLE"):   ["sonnet", "gpt-5", "flash"],  # Add/remove/reorder
    ("CODE", "MEDIUM"):   ["opus", "sonnet", "gpt-5"],   # Your preferences
    # ...
}
```

### Adjusting Cost Tiers

Edit `references/models.md` to change tier assignments:

```python
COST_TIERS = {
    "flash": "$",      # Budget
    "haiku": "$",      # Budget
    "sonnet": "$$",    # Standard
    "opus": "$$$$",    # Premium
    # ...
}
```

### Adding New Models

1. Add the model to `PROVIDER_REGISTRY` in SKILL.md
2. Add pricing to `references/models.md`
3. Update routing preferences as desired
4. Run `/router refresh`

### Changing Fallback Timeout

Edit the timeout constant in SKILL.md:

```python
TIMEOUT_MS = 30000  # 30 seconds (default)
```

---

## 📁 Skill Structure

```
smart-router/
├── SKILL.md              # Main skill definition + routing logic
├── README.md             # This file
├── LICENSE               # MIT License
└── references/
    ├── models.md         # Model capabilities, pricing, cost tiers
    └── security.md       # Security guidelines
```

---

## 🔒 Security

- API keys are never logged or exposed in routing output
- Sensitive requests are not sent to untrusted models
- All provider communication uses official SDKs/APIs
- Input sanitization before any model API call
- No arbitrary code execution paths
- See `references/security.md` for full security guidelines

---

## 📊 Cost Optimization

The router is designed to minimize costs without sacrificing quality:

| Model | Cost/1M Input | Used For |
|-------|---------------|----------|
| Flash | $0.075 | Simple Q&A, translations |
| Haiku | $0.25 | Quick responses |
| Grok 2 | $0.20 | Real-time queries |
| Sonnet | $3.00 | Most tasks (best value) |
| GPT-5 | Subscription | Fallback (no per-token) |
| Gemini Pro | $1.25 | Large documents |
| Opus | $15.00 | Complex tasks only |

**Rule**: Simple tasks NEVER use premium models. A "what's 2+2?" query costs $0.000075, not $0.015.

---

## 🔧 Troubleshooting

### Common Issues

| Problem | Cause | Solution |
|---------|-------|----------|
| "No models available" | No providers configured | Add at least one API key |
| Always routes to same model | Only one provider active | Add more providers for variety |
| Expensive model for simple query | Complexity mis-detected | Use `[show routing]` to debug |
| Real-time query not using Grok | Grok not configured | Add xAI API key |
| Large document fails | Context exceeded | Check if Gemini Pro available |

### Debugging Routing Decisions

1. **Add `[show routing]` to your message:**
   ```
   [show routing] Your question here
   ```

2. **Check provider status:**
   ```
   /router status
   ```

3. **Force refresh providers:**
   ```
   /router refresh
   ```

### Model Not Responding

If a model times out or errors:
1. Router automatically tries fallback chain
2. Check `/router status` for recent failures
3. Verify API key is valid
4. Check provider status page (Anthropic, OpenAI, etc.)

### Unexpected Model Selection

If routing seems wrong:
1. Check intent detection — is it classifying correctly?
2. Check complexity — short queries = SIMPLE = cheap models
3. Check special cases — context size, real-time needs
4. Override manually: `use opus: your query`

### Cost Higher Than Expected

1. Check if queries are being classified as COMPLEX
2. Use `[show routing]` to see why
3. Simplify queries for simple tasks
4. Add budget models (Flash, Haiku) if missing

---

## 🤝 Contributing

Contributions welcome! Areas of interest:
- Additional provider support
- Improved intent classification
- Better complexity estimation heuristics
- Performance optimizations

---

## 📄 License

MIT License — see [LICENSE](LICENSE)

---

## 🙏 Acknowledgments

- Built for [OpenClaw](https://github.com/openclaw/openclaw)
- Inspired by the need to stop paying $15/1M tokens for "what's 2+2?"
