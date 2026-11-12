# Overthink

**An MCP Server for Intelligent AI Problem Solving**

> Think clearly. Act efficiently. Verify everything.

Overthink is a **model-independent intelligence and execution discipline layer** for AI coding agents. It is not another model — it is a control layer that turns verbose, unpredictable assistants into disciplined engineering problem solvers.

It works with Claude, GPT, Qwen, Gemini, Mistral, Nemotron, local models, FreeLLMAPI and other MCP-compatible coding agents (Cursor, Windsurf, Claude Code, etc.).

## The problem it solves

Powerful models still fail at process:

- Excessive reasoning without progress
- Over-planning simple tasks
- Repeated explanations and searches
- Fixing symptoms instead of root causes
- Claiming success without running tests
- Unnecessary code changes and refactors

Overthink addresses these at the **workflow level** with structured tools, budgets, evidence requirements and verification gates.

## Core principles

| Principle | Meaning |
|-----------|--------|
| Proportional reasoning | L0–L3 levels matched to task complexity |
| Evidence before assumptions | Confirmed / Likely / Possible / Unknown |
| One useful action at a time | Single primary next action |
| Minimal changes | Prefer the smallest correct fix |
| Verify before claiming | Tests must actually run and pass |
| Stop conditions | No infinite investigation loops |

## Architecture

```
AI Coding Agent (Claude / GPT / Qwen / Cursor / …)
        ↓
OVERTHINK MCP SERVER
  ├─ Reasoning Engine      (depth & planning limits)
  ├─ Investigation Engine  (progressive, targeted search)
  ├─ Planning Engine       (proportionate plans)
  ├─ Execution Engine      (next action, anti-repetition)
  ├─ Diagnosis Engine      (root-cause hypotheses)
  └─ Verification Engine   (real test/build results)
        ↓
Evidence-backed result · Minimal changes · Short report
```

## Quick start

### Requirements

- Node.js ≥ 18
- An MCP-compatible client (Cursor, Claude Code, Windsurf, …)

### Install & build

```bash
git clone https://github.com/missarii/overthink.git
cd overthink
npm install
npm run build
```

### Run (stdio)

```bash
npm start
# or
node dist/index.js
```

### MCP client configuration example

```json
{
  "mcpServers": {
    "overthink": {
      "command": "node",
      "args": ["/absolute/path/to/overthink/dist/index.js"]
    }
  }
}
```

## MCP tools

| Tool | Purpose |
|------|--------|
| `overthink_start` | Classify task, set reasoning level & budgets |
| `overthink_investigate` | Progressive evidence collection |
| `overthink_diagnose` | Ranked hypotheses + confirmation discipline |
| `overthink_plan` | Proportionate plan (0–8 steps by level) |
| `overthink_next_action` | Single best next action + what to avoid |
| `overthink_check_progress` | Repetition & stagnation detection |
| `overthink_verify` | Evaluate real test/build outcomes |
| `overthink_finish` | Concise completion report |

## Reasoning levels

| Level | When | Behavior |
|-------|------|----------|
| **L0** | Trivial (label, color, typo) | Direct change, no formal plan |
| **L1** | Normal bug / small feature | Focused investigation, few files |
| **L2** | Non-trivial / multi-file | Short structured plan |
| **L3** | Architecture, security, outages | Deep but still bounded |

## Example flow

```text
User: POST /api/auth/login returns HTTP 500

1. overthink_start
   → complexity: normal, level: L1, budget set

2. overthink_investigate
   → scope: auth routes, services, db client
   → collect observations & evidence

3. overthink_diagnose
   → hypothesis: DB connection timeout (0.92)
   → recommended test: verify connectivity

4. overthink_next_action
   → "Implement minimal fix for confirmed root cause"

5. overthink_check_progress  (after each step)

6. overthink_verify
   → integration test + build

7. overthink_finish
   → short verified report
```

## Configuration

Policies live under `policies/` (YAML). Default behaviour is adaptive:

- Minimal changes
- Evidence required
- Duplicate-search detection
- Verification before completion
- Concise communication

Override by pointing the server at a custom policy file (future CLI flag) or by editing `policies/default.yaml`.

## Project structure

```
overthink/
├── src/
│   ├── index.ts              # Entrypoint
│   ├── server.ts             # MCP server + tools + resources
│   ├── core/                 # Task manager, classifier, budgets, progress
│   ├── engines/              # Six intelligence engines
│   ├── tools/                # MCP tool implementations
│   └── types/
├── policies/                 # YAML policies
├── package.json
└── README.md
```

## Roadmap (high level)

| Phase | Focus |
|-------|--------|
| **0.1** (current) | Core MCP, classification, engines, anti-overthinking, verification |
| **0.2** | Richer investigation (ripgrep adapter), session persistence |
| **0.3** | Benchmarks & model quality scoring |
| **0.4** | Optional model routing profiles |
| **1.0** | Adaptive policies, history learning, multi-agent coordination |

## Safety

- Never auto-delete user data
- Never claim success without evidence
- Respect workspace boundaries
- No silent dependency or config changes
- Explicit tool permissions via MCP

## License

MIT © 2026 missarii

---

**Overthink** — Intelligent engineering discipline for AI coding agents.
