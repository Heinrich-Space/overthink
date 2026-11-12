<p align="center">
  <img src="src/overthink-logo.png" alt="Overthink Logo" width="180" />
  &nbsp;&nbsp;&nbsp;
  <img src="heinrich-logo.png" alt="Heinrich AI Logo" width="180" />
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
  <a href="https://www.linkedin.com/company/heinrich-ai">
    <img src="https://img.shields.io/badge/Follow-Heinrich%20AI-0A66C2?style=for-the-badge&logo=linkedin" alt="Follow Heinrich AI on LinkedIn" />
  </a>
  <img src="https://img.shields.io/badge/version-0.3.0-blue?style=for-the-badge" alt="Version 0.3.0" />
  <img src="https://img.shields.io/badge/license-MIT-green?style=for-the-badge" alt="MIT License" />
</p>

---

## What is this?

**Overthink** is a **Model Context Protocol (MCP) server** that adds real engineering discipline to AI coding agents.

It is **not** another LLM.  
It is a control layer that forces the agent to:

- Triage first  
- Investigate with evidence  
- Take one useful action at a time  
- Avoid loops and side-paths  
- Verify before claiming success  
- Finish on time  

It works with any MCP-compatible client, but it is **purpose-built for Heinrich AI**.

<img src="heinrich-logo.png" alt="Heinrich AI" width="120" align="left" />
<br clear="left" />

### What is Heinrich AI?

**[Heinrich AI](https://marketplace.visualstudio.com/items?itemName=heinrich-ai.heinrich-ai)** is a VS Code / Cursor extension that turns AI coding agents into disciplined engineers.  
The Heinrich logo represents the product — a focused, no-nonsense AI coding companion that prioritizes finishing real work over endless reasoning.

Overthink is the intelligence backend that powers Heinrich’s strict workflow.

**Stay tuned with Heinrich AI** →  
<a href="https://www.linkedin.com/company/heinrich-ai">
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linkedin/linkedin-original.svg" width="22" height="22" alt="LinkedIn" style="vertical-align: middle;" />
  &nbsp;Follow Heinrich AI on LinkedIn
</a>

---

## Why Overthink?

Even the strongest models still fail at **process**:

| Common failure | What Overthink does |
|----------------|---------------------|
| Endless reasoning without progress | Fast triage + time boxes |
| Over-planning simple tasks | Proportional reasoning (L0–L3) |
| Repeated searches & explanations | Action Guard + progress tracking |
| Fixing symptoms instead of root causes | Diagnosis engine + evidence levels |
| Claiming success without tests | Mandatory verification gate |
| Unnecessary refactors & side-paths | Hard blocks on waste patterns |

---

## How to connect Overthink MCP to Heinrich AI

### 1. Install & build Overthink

```bash
git clone https://github.com/missarii/overthink.git
cd overthink
npm install
npm run build
```

### 2. Get the absolute path to the server

After building, the entry point is:

```
/absolute/path/to/overthink/dist/index.js
```

Example (macOS / Linux):
```bash
echo "$(pwd)/dist/index.js"
```

### 3. Configure Heinrich AI / VS Code / Cursor

Open your MCP settings (Heinrich AI settings, or Cursor/VS Code MCP config) and add:

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

> Replace `/absolute/path/to/overthink/dist/index.js` with the real path from step 2.

### 4. Restart the client

Restart Heinrich AI / Cursor / VS Code so it picks up the new MCP server.

### 5. Verify it is connected

In the agent chat you should see the Overthink tools available:

- `overthink_start`
- `overthink_guard`
- `overthink_next_action`
- `overthink_check_progress`
- `overthink_verify`
- `overthink_finish`
- …and the rest

Heinrich AI will automatically prefer the forced workflow defined in the `heinrich-rules` resource.

---

## Alternative: HTTP mode

If you prefer HTTP transport:

```bash
npm run start:http
# → http://127.0.0.1:3921/mcp
# Health check: http://127.0.0.1:3921/health
```

Then configure the client to use the HTTP endpoint (if the client supports Streamable HTTP).

---

## Architecture

```
AI Coding Agent (Heinrich AI / Cursor / Claude Code / …)
        ↓
┌─────────────────────────────────────────────────────────┐
│                   OVERTHINK MCP SERVER                  │
│                                                         │
│  • Fast Triage          • Action Guard                  │
│  • Reasoning Engine     • Investigation Engine          │
│  • Planning Engine      • Diagnosis Engine              │
│  • Execution Engine     • Verification Engine           │
│  • Progress Tracker     • Budget Controller             │
└─────────────────────────────────────────────────────────┘
        ↓
Evidence-backed result · Minimal changes · Short report
```

---

## MCP Tools (full list)

| Tool | When to use | What it does |
|------|-------------|--------------|
| `overthink_start` | **Always first** | Fast triage, complexity, reasoning level, time box, budgets, hard limits |
| `overthink_guard` | Before risky commands | Blocks sleep, installs, scrapers, whole-repo finds, full suites, side-paths |
| `overthink_investigate` | When gathering evidence | Targeted evidence only (no broad scanning) |
| `overthink_diagnose` | After observations | Ranked hypotheses — never treats guesses as facts |
| `overthink_plan` | When a plan is needed | Short proportionate plan based on reasoning level |
| `overthink_next_action` | After start / between steps | Single best next action under time pressure |
| `overthink_check_progress` | After every action | Detects similar actions, fail-loops, stagnation → can force stop |
| `overthink_verify` | Before claiming done | Only accepts **real** executed test/build results |
| `overthink_finish` | At the end | Concise completion report |

---

## Resources (rules injected into the agent)

| URI | Purpose |
|-----|--------|
| `overthink://rules/core` | Core discipline policy (time + loop rules) |
| `overthink://rules/heinrich` | Heinrich mandatory workflow (forced tool order + finish bias) |
| `overthink://rules/debugging` | Root-cause diagnostic method |

---

## Reasoning levels

| Level | Typical tasks | Behavior |
|-------|---------------|----------|
| **L0** | Label, color, typo, one-liner | Direct change, no formal plan |
| **L1** | Normal bug / small feature | Focused investigation, few files |
| **L2** | Multi-file / non-trivial | Short structured plan |
| **L3** | Architecture, security, outages | Deep but still bounded |

---

## Fast triage & budgets

On every `overthink_start` the server runs **fast triage** to detect the failure class (asset path, UI/copy/style, logic error, etc.) and applies a **time box**.

Default budgets (editable in `policies/default.yaml`):

| Complexity | Max actions | Max retries | Planning | Investigation |
|------------|-------------|-------------|----------|---------------|
| simple     | 4           | 1           | 5 s      | 10 s          |
| normal     | 6           | 2           | 8 s      | 15 s          |
| complex    | 12          | 3           | 20 s     | 40 s          |
| critical   | 18          | 3           | 30 s     | 60 s          |

Simple UI/asset tasks are automatically tightened further.

---

## Action Guard — what gets blocked

The guard actively prevents common time-wasters:

- `sleep N`
- Drive-by package installs (`npm install`, `pip install`, …)
- Heavy browser automation just to check a simple UI issue
- Unbounded `find /` or deep whole-repo searches
- Running the entire test suite before a focused check
- Infra commands (Docker, kubectl, Terraform) unless the task is actually infra
- Redesign / rewrite / migrate on pure UI or image tasks

Near-duplicate actions are also blocked to kill fail-loops.

---

## Example workflow

```text
User: POST /api/auth/login returns HTTP 500

1. overthink_start
   → complexity: normal · level: L1 · time_box applied · hard limits set

2. overthink_next_action
   → single primary action (inspect auth route + recent error)

3. overthink_guard          ← before any risky shell command

4. overthink_investigate / overthink_diagnose
   → targeted evidence + ranked hypotheses

5. overthink_check_progress  ← after every step
   → detects similar/fail_loop → can force_stop

6. Apply minimal fix

7. overthink_verify          ← only real test/build results

8. overthink_finish
   → short verified report
```

---

## Configuration

Policies live in `policies/` (YAML):

| File | Style |
|------|-------|
| `default.yaml` | Strict — full budgets + anti-loop |
| `coding.yaml` | Lighter adaptive coding defaults |
| `debugging.yaml` | Investigation-focused |

Edit these files to change behaviour.

---

## Project structure

```
overthink/
├── heinrich-logo.png            # Heinrich AI official logo
├── src/
│   ├── overthink-logo.png       # Overthink official logo
│   ├── index.ts                 # Entrypoint (stdio / HTTP)
│   ├── server.ts                # MCP server + tools + resources
│   ├── core/                    # Task manager, triage, guard, budgets…
│   ├── engines/                 # Reasoning, investigation, diagnosis…
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

---

## Safety guarantees

- Never auto-deletes user data  
- Never claims success without evidence  
- Respects workspace boundaries  
- No silent dependency or config changes  
- Explicit tool permissions via MCP  
- Hard blocks on wasteful and off-path actions  

---

## License

MIT © 2026 missarii

---

<p align="center">
  <img src="src/overthink-logo.png" alt="Overthink" width="90" />
  &nbsp;&nbsp;
  <img src="heinrich-logo.png" alt="Heinrich AI" width="90" />
  <br/><br/>
  <strong>Overthink</strong> — Intelligent engineering discipline for AI coding agents<br/>
  Built for <a href="https://marketplace.visualstudio.com/items?itemName=heinrich-ai.heinrich-ai">Heinrich AI</a>
  <br/><br/><br/>
  <a href="https://www.linkedin.com/company/heinrich-ai" style="display: inline-flex; flex-direction: column; align-items: center; gap: 6px; text-decoration: none; color: inherit;">
    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linkedin/linkedin-original.svg" width="32" height="32" alt="LinkedIn" />
    <span>Follow Heinrich AI on LinkedIn</span>
</a>
</p>
