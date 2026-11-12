import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import express from "express";
import cors from "cors";
import { randomUUID } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { overthinkStart } from "./tools/start.js";
import { overthinkInvestigate } from "./tools/investigate.js";
import { overthinkDiagnose } from "./tools/diagnose.js";
import { overthinkPlan } from "./tools/plan.js";
import { overthinkNextAction } from "./tools/next-action.js";
import { overthinkCheckProgress } from "./tools/progress.js";
import { overthinkVerify } from "./tools/verify.js";
import { overthinkFinish } from "./tools/finish.js";
import { overthinkGuard } from "./tools/guard.js";
import { disciplineBanner } from "./core/action-guard.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadTextResource(...parts: string[]): string {
  const candidates = [
    join(__dirname, "..", ...parts),
    join(__dirname, ...parts),
    join(process.cwd(), ...parts),
  ];
  for (const p of candidates) {
    if (existsSync(p)) return readFileSync(p, "utf-8");
  }
  return "";
}

const CORE_POLICY = `
OVERTHINK CORE POLICY (STRICT)

You are under a hard discipline layer. Violating these wastes the user's time.

MUST:
1. Call overthink_start before other work on a task.
2. Call overthink_next_action and do ONLY that one action.
3. Before shell commands that install packages, sleep, scrape, or scan the whole repo — call overthink_guard.
4. After every action call overthink_check_progress. Obey force_stop / repeated / BLOCKED.
5. Minimal change. Fix the symptom's cause, not the whole architecture.
6. Short user replies: decisions + evidence only. No essay reasoning.

MUST NOT:
- sleep as debugging
- pip/npm install as first response to UI/image bugs
- BeautifulSoup/Selenium for "check if images load"
- Repeat the same search/curl after it failed once
- Create helper scripts unless the task requires a durable script
- Claim success without overthink_verify with real executed checks

Image / "not showing" bugs:
→ Identify correct URL/port → find FAILED src → fix path. Stop.

${disciplineBanner()}
`.trim();

const HEINRICH_RULES =
  loadTextResource("src", "resources", "heinrich-rules.txt") ||
  loadTextResource("resources", "heinrich-rules.txt") ||
  CORE_POLICY;

export function createServer() {
  const server = new McpServer({
    name: "overthink",
    version: "0.2.0",
  });

  server.registerResource(
    "core-rules",
    "overthink://rules/core",
    {
      title: "Overthink Core Policy",
      description: "Strict engineering discipline — read at task start",
      mimeType: "text/plain",
    },
    async () => ({
      contents: [
        {
          uri: "overthink://rules/core",
          mimeType: "text/plain",
          text: CORE_POLICY,
        },
      ],
    })
  );

  server.registerResource(
    "heinrich-rules",
    "overthink://rules/heinrich",
    {
      title: "Heinrich Mandatory Workflow",
      description: "Forced tool order for Heinrich AI agent",
      mimeType: "text/plain",
    },
    async () => ({
      contents: [
        {
          uri: "overthink://rules/heinrich",
          mimeType: "text/plain",
          text: HEINRICH_RULES,
        },
      ],
    })
  );

  server.registerResource(
    "debugging-rules",
    "overthink://rules/debugging",
    {
      title: "Diagnostic Method",
      description: "Root-cause diagnostic methodology",
      mimeType: "text/plain",
    },
    async () => ({
      contents: [
        {
          uri: "overthink://rules/debugging",
          mimeType: "text/plain",
          text: `
DIAGNOSTIC METHOD
1. Symptom — what fails exactly?
2. Localize — which file/URL/layer?
3. One hypothesis
4. Cheapest test
5. Confirm with evidence
6. Minimal fix
7. Verify once
Never present a guess as confirmed root cause.
`.trim(),
        },
      ],
    })
  );

  server.registerTool(
    "overthink_start",
    {
      title: "Start Task",
      description:
        "REQUIRED first tool. Classifies task, sets strict budgets, returns discipline rules.",
      inputSchema: {
        task: z.string().describe("The engineering task or problem description"),
        workspace: z.string().optional().describe("Workspace / project root path"),
        mode: z.string().optional().describe("auto | coding | debugging | architecture"),
      },
    },
    async (args) => {
      const result = overthinkStart({
        task: args.task,
        workspace: args.workspace,
        mode: args.mode ?? "auto",
      });
      const payload = {
        ...result,
        discipline: disciplineBanner(),
        mandatory_next: "Call overthink_next_action with this task_id. Do nothing else first.",
        hard_limits: {
          max_actions: result.budget.max_actions,
          max_retries: result.budget.max_retries,
          no_sleep: true,
          no_install_before_diagnose: true,
          one_action_at_a_time: true,
        },
      };
      return {
        content: [{ type: "text" as const, text: JSON.stringify(payload, null, 2) }],
      };
    }
  );

  server.registerTool(
    "overthink_guard",
    {
      title: "Guard Action",
      description:
        "BLOCK wasteful actions (sleep, installs, scrapers, broad scans). Call before risky shell commands.",
      inputSchema: {
        proposed_action: z
          .string()
          .describe("The next command or step the agent wants to take"),
        task_id: z.string().optional().describe("Task id if available"),
        task_hint: z.string().optional().describe("Original user task if no task_id"),
      },
    },
    async (args) => {
      const result = overthinkGuard(args);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.registerTool(
    "overthink_investigate",
    {
      title: "Investigate",
      description: "Targeted evidence collection only — progressive, not whole-repo",
      inputSchema: {
        task_id: z.string().describe("Task id from overthink_start"),
        error: z.string().optional().describe("Error message or symptom"),
        scope: z.array(z.string()).optional().describe("Path scopes"),
        observations: z.array(z.string()).optional().describe("New observations"),
        relevant_files: z.array(z.string()).optional().describe("Relevant files"),
      },
    },
    async (args) => {
      const result = overthinkInvestigate(args);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.registerTool(
    "overthink_diagnose",
    {
      title: "Diagnose",
      description: "Rank hypotheses; never treat untested guesses as facts",
      inputSchema: {
        task_id: z.string(),
        observations: z.array(z.string()),
      },
    },
    async (args) => {
      const result = overthinkDiagnose(args);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.registerTool(
    "overthink_plan",
    {
      title: "Plan",
      description: "Short plan only; simple tasks get almost no plan",
      inputSchema: { task_id: z.string() },
    },
    async (args) => {
      const result = overthinkPlan(args);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.registerTool(
    "overthink_next_action",
    {
      title: "Next Action",
      description:
        "Single best next action + hard avoid list. Call after start and after each progress check.",
      inputSchema: { task_id: z.string() },
    },
    async (args) => {
      const result = overthinkNextAction(args);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.registerTool(
    "overthink_check_progress",
    {
      title: "Check Progress",
      description:
        "Detect repetition/stagnation. force_stop=true means hard stop — no more exploration.",
      inputSchema: {
        task_id: z.string(),
        action: z.string(),
        result: z.string(),
      },
    },
    async (args) => {
      const result = overthinkCheckProgress(args);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.registerTool(
    "overthink_verify",
    {
      title: "Verify",
      description: "Only pass checks that actually ran",
      inputSchema: {
        task_id: z.string(),
        checks: z.array(
          z.object({
            name: z.string(),
            executed: z.boolean(),
            passed: z.boolean(),
            details: z.string().optional(),
          })
        ),
      },
    },
    async (args) => {
      const result = overthinkVerify(args);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.registerTool(
    "overthink_finish",
    {
      title: "Finish",
      description: "Short completion report",
      inputSchema: {
        task_id: z.string(),
        summary: z.string().optional(),
      },
    },
    async (args) => {
      const result = overthinkFinish(args);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.registerPrompt(
    "solve_task",
    {
      title: "Solve Task",
      description: "Strict Overthink workflow",
      argsSchema: { task: z.string() },
    },
    async ({ task }) => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: `${CORE_POLICY}\n\nTask:\n${task}\n\nCall overthink_start now.`,
          },
        },
      ],
    })
  );

  server.registerPrompt(
    "debug_issue",
    {
      title: "Debug Issue",
      description: "Evidence-first debug under strict budgets",
      argsSchema: { issue: z.string() },
    },
    async ({ issue }) => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: `${CORE_POLICY}\n\nIssue:\n${issue}\n\nCall overthink_start now. No installs, no sleep.`,
          },
        },
      ],
    })
  );

  return server;
}

export async function startServer() {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Overthink MCP server running on stdio");
}

export async function startHttpServer(port = 3921) {
  const app = express();
  app.use(
    cors({
      origin: true,
      exposedHeaders: ["Mcp-Session-Id"],
    })
  );
  app.use(express.json({ limit: "4mb" }));

  const sessions = new Map<
    string,
    { server: McpServer; transport: StreamableHTTPServerTransport }
  >();

  app.get("/health", (_req, res) => {
    res.json({ ok: true, name: "overthink", version: "0.2.0" });
  });

  app.all("/mcp", async (req, res) => {
    try {
      const sessionId = req.headers["mcp-session-id"] as string | undefined;

      if (sessionId && sessions.has(sessionId)) {
        const { transport } = sessions.get(sessionId)!;
        await transport.handleRequest(req, res, req.body);
        return;
      }

      if (req.method === "POST") {
        const server = createServer();
        const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          onsessioninitialized: (id) => {
            sessions.set(id, { server, transport });
          },
        });

        transport.onclose = () => {
          const id = transport.sessionId;
          if (id) sessions.delete(id);
        };

        await server.connect(transport);
        await transport.handleRequest(req, res, req.body);
        return;
      }

      res.status(400).json({
        jsonrpc: "2.0",
        error: { code: -32000, message: "Bad Request: No valid session" },
        id: null,
      });
    } catch (err) {
      console.error("MCP HTTP error:", err);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: { code: -32603, message: "Internal server error" },
          id: null,
        });
      }
    }
  });

  await new Promise<void>((resolve) => {
    app.listen(port, "127.0.0.1", () => {
      console.error(
        `Overthink MCP HTTP server listening on http://127.0.0.1:${port}/mcp`
      );
      console.error(`Health check: http://127.0.0.1:${port}/health`);
      resolve();
    });
  });
}
