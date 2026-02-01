---
name: pamela-calls
description: Make AI-powered phone calls with Pamela's voice API. The only voice AI with native phone tree navigation. Create outbound calls, register custom tools for mid-call actions, handle webhooks, and build React UIs. Use when the user wants to make phone calls, integrate voice AI, build IVR systems, navigate phone menus, or automate phone tasks.
---

# Pamela Voice API

The only voice AI that actually works with native phone tree navigation.

## Resources

- Docs: https://docs.thisispamela.com/
- Demo: https://demo.thisispamela.com/
- Example: https://github.com/ThisIsPamela/demo
- API: https://api.thisispamela.com
- Live Support: https://discord.gg/8qG32Nzv

## Getting Your API Key

1. Log in at https://app.thisispamela.com
2. Go to Settings
3. Click Enterprise Access
4. Set up billing through Stripe
5. Copy your API key (starts with `pk_live_`)

Your API key is only shown once. Store it securely.

## Installation

JavaScript/TypeScript:
```bash
npm install @thisispamela/sdk
```

Python:
```bash
pip install thisispamela
```

React:
```bash
npm install @thisispamela/react @thisispamela/sdk
```

## Quick Start

**Note**: Phone numbers must be in E.164 format (e.g., `+1234567890`).

JavaScript:
```typescript
import { PamelaClient } from '@thisispamela/sdk';

const client = new PamelaClient({ apiKey: 'pk_live_...' });

const call = await client.createCall({
  to: '+1234567890', // E.164 format required
  task: 'Call the pharmacy and check if my prescription is ready',
  voice: 'female',
  agent_name: 'Pamela',
});

const status = await client.getCall(call.id);
console.log(status.transcript);
```

Python:
```python
from pamela import PamelaClient

client = PamelaClient(api_key="pk_live_...")

call = client.create_call(
    to="+1234567890",
    task="Call the pharmacy and check if my prescription is ready",
    voice="female",
    agent_name="Pamela",
)

status = client.get_call(call["id"])
print(status["transcript"])
```

## Use Cases

- **Appointment Scheduling**: "Call the dentist and schedule a cleaning for next week"
- **Order Status**: "Call the pharmacy and check if my prescription is ready"
- **Customer Support**: Navigate IVR menus to reach the right department
- **Information Gathering**: "Call the restaurant and ask about their vegetarian options"
- **Follow-ups**: Automate callback reminders and confirmations
- **IVR Navigation**: Handle complex phone trees, holds, and transfers automatically

## Key Features

- Phone tree navigation: navigates IVR menus, holds, and transfers automatically
- Custom tools: register tools the AI can call mid-conversation
- Real-time transcripts: webhook updates as the call progresses
- React components: pre-built UI for call status and transcripts

## SDKs

- JavaScript/TypeScript: see `javascript-sdk.md`
- Python: see `python-sdk.md`
- React components: see `react-components.md`

## Webhooks

See `webhooks.md` for webhook handling and signature verification.

## Tool Execution

Register custom tools the AI can invoke during calls. See `tools.md`.

## Billing

- $0.10/minute, no upfront fees
- Minimum 1 minute per call
- Only connected calls are billed
