---
name: openclaw-mem
description: "Intelligent auto-journaling and memory retention system. Summarizes raw daily logs into structured journals and prunes old data to keep context clean and efficient. Use when closing a session, starting a new day, or when memory hygiene is needed."
---

# OpenClaw Memory Librarian

This skill manages the transition from short-term raw logs to long-term curated knowledge.

## Workflow

1.  **Read** recent daily logs (`memory/YYYY-MM-DD.md`).
2.  **Summarize** valuable information into a monthly Journal (`memory/journal/YYYY-MM.md`).
3.  **Prune** raw logs that are older than 14 days.

## 1. Journaling Strategy

When summarizing logs, do **NOT** copy the chat. Extract the **Signal**.

### Structure (Append to `memory/journal/YYYY-MM.md`)

```markdown
## YYYY-MM-DD Summary

### 🧠 Decisions
- [Decision 1]
- [Decision 2]

### 🛠️ Changes
- Installed: [Tool/Skill]
- Configured: [Setting]
- Refactored: [File]

### 🚫 Blockers & Errors
- [Error description] -> [Solution/Workaround]

### 💡 Insights
- [Lesson learned]
- [User preference discovered]
Noise Filter Rules

• IGNORE: Greetings ("Hi", "Hello"), confirmations ("Okay", "Done"), intermediate errors that were immediately fixed.
• KEEP: Final outcomes, architectural decisions, new capabilities, security changes.
• LINK: Always link to relevant files (e.g., (see skills/openclaw-mem/SKILL.md)).
2. Retention Policy (The Pruner)

After journaling is complete and verified:

• Identify memory/YYYY-MM-DD.md files older than 14 days.
• DELETE them to free up context search space.
• Safety Check: Ensure the date is actually >14 days in the past relative to today.
Usage

To run the cycle:
"Run openclaw-mem to organize my logs."

To just summarize (no delete):
"Run openclaw-mem but keep the raw files."