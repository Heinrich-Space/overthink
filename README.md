<p align="center">
  <img src="src/overthink-logo.png" alt="Overthink Logo" width="220" />
</p>

<h1 align="center">Overthink</h1>

<p align="center">
  <strong>Strict MCP discipline layer for AI coding agents</strong><br/>
  Fast triage · Anti-loop · Time pressure · No side-paths · Evidence first
</p>

<p align="center">
  <a href="https://marketplace.visualstudio.com/items?itemName=heinrich-ai.heinrich-ai">
    <img src="https://img.shields.io/badge/Made%20for-Heinrich%20AI-blueviolet?style=for-the-badge&logo=visualstudiocode" alt="Made for Heinrich AI" />
  </a>
  <img src="https://img.shields.io/badge/version-0.3.0-blue?style=for-the-badge" alt="Version 0.3.0" />
  <img src="https://img.shields.io/badge/license-MIT-green?style=for-the-badge" alt="MIT License" />
  <img src="https://img.shields.io/badge/MCP-Model%20Context%20Protocol-orange?style=for-the-badge" alt="MCP" />
</p>

<p align="center">
  <em>This MCP server is purpose-built for
  <a href="https://marketplace.visualstudio.com/items?itemName=heinrich-ai.heinrich-ai"><strong>Heinrich AI</strong></a>
  — the VS Code / Cursor extension that turns AI coding agents into disciplined engineers.</em>
</p>

---

## Why Overthink?

Powerful models still fail at **process**:

- Excessive reasoning without progress  
- Over-planning simple tasks  
- Repeated explanations and searches  
- Fixing symptoms instead of root causes  
- Claiming success without running tests  
- Unnecessary refactors and side-paths  

**Overthink** is not another model.  
It is a **model-independent intelligence & execution discipline layer** that sits between your AI coding agent and the work.

It works with Claude, GPT, Qwen, Gemini, Mistral, local models, FreeLLMAPI, and any MCP-compatible client (Cursor, Windsurf, Claude Code, VS Code via Heinrich AI, etc.).


## Core principles

| Principle | Meaning |
|-----------|--------|
| **Proportional reasoning** | L0–L3 levels matched to real task complexity |
| **Evidence before assumptions** | Confirmed / Likely / Possible / Unknown |
| **One useful action at a time** | Single primary next action — no multitasking theater |
| **Minimal changes** | Prefer the smallest correct fix |
| **Verify before claiming** | Tests must actually run and pass |
| **Hard stop conditions** | No infinite investigation loops |
| **Time pressure** | Time-box + finish bias under urgency |
| **Anti side-path** | Blocks sleep, drive-by installs, whole-repo finds, premature full suites |

## Architecture

```
AI Coding Agent (Claude / GPT / Qwen / Cursor / Heinrich AI / …)
        ↓
┌─────────────────────────────────────────────────────────┐
│                   OVERTHINK MCP SERVER                  │
│                                                         │
│  • Fast Triage          • Action Guard                  │
│  • Reasoning Engine     • Investigation Engine          │
│  • Planning Engine      • Diagnosis Engine              │
│  • Execution Engine     • Verification Engine           │
│  • Progress Tracker     • Budget Controller             │
│  • Policy Engine (YAML)                                 │
└─────────────────────────────────────────────────────────┘
        ↓
Evidence-backed result · Minimal changes · Short report
```

## Made for Heinrich AI

Overthink is the official discipline backend for **[Heinrich AI](https://marketplace.visualstudio.com/items?itemName=heinrich-ai.heinrich-ai)**.

Heinrich AI forces a strict tool order and finish bias. Overthink supplies the intelligence behind that order:

1. `overthink_start` → triage + time box + hard limits  
2. `overthink_next_action` → do **only** the primary action  
3. `overthink_guard` before risky commands  
4. `overthink_check_progress` after every action  
5. Obey `force_stop` / fail-loop / similar-action signals  
6. `overthink_verify` (real results) → `overthink_finish`

The `heinrich-rules` resource and core policy are baked in so Heinrich agents stay on the rails.

## Quick start

### Requirements

- Node.js ≥ 18
- An MCP-compatible client (Heinrich AI recommended, also Cursor, Claude Code, Windsurf, …)

### Install & build

```bash
git clone https://github.com/missarii/overthink.git
cd overthink
npm install
npm run build
```

### Run (stdio — recommended for most clients)

```bash
npm start
# or
node dist/index.js
```

### Run (HTTP)

```bash
npm run start:http
# listens on http://127.0.0.1:3921/mcp
# health: http://127.0.0.1:3921/health
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

For Heinrich AI, point the extension at the built server (or use the published package when available).

## MCP tools

| Tool | Purpose |
|------|--------|
| `overthink_start` | **Required first.** Fast triage, complexity, reasoning level, time box, budgets, hard limits |
| `overthink_guard` | Blocks loops, waste, and side-paths. Call before sleep / install / scrape / whole-repo find / full suite |
| `overthink_investigate` | Targeted evidence collection only |
| `overthink_diagnose` | Ranked hypotheses — guesses are never facts |
| `overthink_plan` | Short proportionate plan (by reasoning level) |
| `overthink_next_action` | Single best next action under triage + time pressure. Prefer finish when urgency is high |
| `overthink_check_progress` | Detect similar actions, fail-loops, stagnation. `force_stop` = hard stop |
| `overthink_verify` | Evaluate **real** executed test/build outcomes only |
| `overthink_finish` | Concise completion report (≤6 lines style) |

## Resources (rules)

| URI | Content |
|-----|--------|
| `overthink://rules/core` | Strict time + loop discipline policy |
| `overthink://rules/heinrich` | Heinrich mandatory workflow (forced tool order + finish bias) |
| `overthink://rules/debugging` | Root-cause diagnostic method |

## Reasoning levels

| Level | When | Behavior |
|-------|------|----------|
| **L0** | Trivial (label, color, typo) | Direct change, no formal plan |
| **L1** | Normal bug / small feature | Focused investigation, few files |
| **L2** | Non-trivial / multi-file | Short structured plan |
| **L3** | Architecture, security, outages | Deep but still bounded |

## Fast triage & budgets

On `overthink_start` the server runs **fast triage** to detect failure class (e.g. asset path, UI/copy/style, etc.) and sets a **time box**. Budgets are further tightened automatically for simple asset/UI cases.

Default policy budgets (overridable via `policies/`):

| Complexity | Max actions | Max retries | Planning | Investigation |
|------------|-------------|-------------|----------|---------------|
| simple     | 4           | 1           | 5s       | 10s           |
| normal     | 6           | 2           | 8s       | 15s           |
| complex    | 12          | 3           | 20s      | 40s           |
| critical   | 18          | 3           | 30s      | 60s           |

## Action Guard (anti side-path)

The guard blocks common time-wasters:

- `sleep N`
- Drive-by `npm/pip/apt/brew install`
- Heavy scrapers (BeautifulSoup, Selenium, Playwright install) for simple checks
- Unbounded `find /` or deep whole-repo searches
- Premature full test suites
- Infra commands (docker/kubectl/terraform) unless the task is infra
- Redesign/refactor/migrate on pure UI/image tasks

Near-duplicate actions are also blocked to kill fail-loops.

## Example flow

```text
User: POST /api/auth/login returns HTTP 500

1. overthink_start
   → complexity: normal, level: L1, time_box set, hard_limits applied

2. overthink_next_action
   → single primary action (e.g. inspect auth route + error log)

3. overthink_guard  (before any risky shell)

4. overthink_investigate / overthink_diagnose
   → targeted evidence + ranked hypotheses

5. overthink_check_progress  (after every step)
   → detects similar/fail_loop → force_stop if needed

6. Minimal fix → overthink_verify (real tests)

7. overthink_finish
   → short verified report
```

## Configuration

Policies live under `policies/` (YAML):

- `default.yaml` — strict mode with full budgets and anti-loop settings  
- `coding.yaml` — lighter adaptive coding defaults  
- `debugging.yaml` — investigation-focused defaults  

Edit `policies/default.yaml` or switch policies to change behaviour.

## Project structure

```
overthink/
├── src/
│   ├── index.ts                 # Entrypoint (stdio / HTTP)
│   ├── server.ts                # MCP server, tools, resources, prompts
│   ├── overthink-logo.png       # Official logo
│   ├── core/
│   │   ├── action-guard.ts      # Waste & side-path blocker
│   │   ├── budget-controller.ts
│   │   ├── decision-engine.ts
│   │   ├── fast-triage.ts
│   │   ├── policy-engine.ts
│   │   ├── progress-tracker.ts
│   │   ├── task-classifier.ts
│   │   └── task-manager.ts
│   ├── engines/
│   │   ├── diagnosis.engine.ts
│   │   ├── execution.engine.ts
│   │   ├── investigation.engine.ts
│   │   ├── planning.engine.ts
│   │   ├── reasoning.engine.ts
│   │   └── verification.engine.ts
│   ├── tools/                   # MCP tool implementations
│   ├── resources/
│   │   ├── core-policy.txt
│   │   └── heinrich-rules.txt
│   └── types/
├── policies/
│   ├── default.yaml
│   ├── coding.yaml
│   └── debugging.yaml
├── package.json
└── README.md
```

## Safety

- Never auto-delete user data  
- Never claim success without evidence  
- Respect workspace boundaries  
- No silent dependency or config changes  
- Explicit tool permissions via MCP  
- Hard blocks on wasteful and off-path actions  

## License

MIT © 2026 missarii

---

<p align="center">
  <img src="src/overthink-logo.png" alt="Overthink" width="100" />
  <br/>
  <strong>Overthink</strong> — Intelligent engineering discipline for AI coding agents.<br/>
  <em>Built for <a href="https://marketplace.visualstudio.com/items?itemName=heinrich-ai.heinrich-ai">Heinrich AI</a></em>
</p>
