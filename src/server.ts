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
const VERSION = "0.3.0";

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
OVERTHINK CORE POLICY v0.3 (STRICT + TIME)

Finish on time. No loops. No side-paths.

MUST:
1. overthink_start before other work.
2. overthink_next_action → do ONLY that action.
3. overthink_guard before sleep/install/scrape/whole-repo find/full suite.
4. overthink_check_progress after every action. Obey force_stop / similar / fail_loop.
5. Use triage failure_class and time_box from start.
6. Minimal fix. Short user replies (≤6 lines).

MUST NOT:
- Repeat the same command family after it failed
- Sleep, drive-by installs, scrapers for simple UI checks
- Refactor/redesign/migrate unless the user asked
- Explore when urgency is high/critical — fix or report

Image/UI bugs: failing src/CSS only. Stop.

${disciplineBanner()}
`.trim();

const HEINRICH_RULES =
  loadTextResource("src", "resources", "heinrich-rules.txt") ||
  loadTextResource("resources", "heinrich-rules.txt") ||
  CORE_POLICY;

export function createServer() {
  const server = new McpServer({
    name: "overthink",
    version: VERSION,
  });

  server.registerResource(
    "core-rules",
    "overthink://rules/core",
    {
      title: "Overthink Core Policy",
      description: "Strict time + loop discipline",
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
      description: "Forced tool order + finish bias",
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
      description: "Root-cause method",
      mimeType: "text/plain",
    },
    async () => ({
      contents: [
        {
          uri: "overthink://rules/debugging",
          mimeType: "text/plain",
          text: `DIAGNOSTIC\n1 Symptom 2 Localize 3 One hypothesis 4 Cheapest test 5 Confirm 6 Minimal fix 7 Verify once`,
        },
      ],
    })
  );

  server.registerTool(
    "overthink_start",
    {
      title: "Start Task",
      description:
        "REQUIRED first. Fast triage, time box, strict budgets, failure class.",
      inputSchema: {
        task: z.string().describe("User task"),
        workspace: z.string().optional(),
        mode: z.string().optional(),
      },
    },
    async (args) => {
      const result = overthinkStart({
        task: args.task,
        workspace: args.workspace,
        mode: args.mode ?? "auto",
      });
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.registerTool(
    "overthink_guard",
    {
      title: "Guard Action",
      description:
        "Blocks loops, waste, side-paths. Call before risky shell commands.",
      inputSchema: {
        proposed_action: z.string(),
        task_id: z.string().optional(),
        task_hint: z.string().optional(),
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
      description: "Targeted evidence only",
      inputSchema: {
        task_id: z.string(),
        error: z.string().optional(),
        scope: z.array(z.string()).optional(),
        observations: z.array(z.string()).optional(),
        relevant_files: z.array(z.string()).optional(),
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
      description: "Rank hypotheses; guesses are not facts",
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
      description: "Short plan only",
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
        "Single best action under triage + time pressure. Prefer finish when urgency high.",
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
        "Detect similar actions, fail-loops, stagnation. force_stop = hard stop.",
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
      description: "Only real executed checks",
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
      description: "Fast triage debug",
      argsSchema: { issue: z.string() },
    },
    async ({ issue }) => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: `${CORE_POLICY}\n\nIssue:\n${issue}\n\nCall overthink_start now.`,
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
    res.json({ ok: true, name: "overthink", version: VERSION });
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
