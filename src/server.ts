import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import express from "express";
import cors from "cors";
import { randomUUID } from "node:crypto";

import { overthinkStart } from "./tools/start.js";
import { overthinkInvestigate } from "./tools/investigate.js";
import { overthinkDiagnose } from "./tools/diagnose.js";
import { overthinkPlan } from "./tools/plan.js";
import { overthinkNextAction } from "./tools/next-action.js";
import { overthinkCheckProgress } from "./tools/progress.js";
import { overthinkVerify } from "./tools/verify.js";
import { overthinkFinish } from "./tools/finish.js";

const CORE_POLICY = `
OVERTHINK CORE POLICY

You are operating under the Overthink intelligence and execution discipline layer.

Rules:
1. Identify the actual objective before acting.
2. Investigate with evidence. Prefer progressive, targeted search over broad repository scans.
3. Use proportional reasoning (L0–L3). Do not over-plan simple tasks.
4. Prefer minimal code changes. Avoid unrelated refactors and unnecessary abstractions.
5. One primary useful action at a time.
6. Never present a hypothesis as a confirmed root cause without direct evidence.
7. Detect and avoid repeated unsuccessful actions.
8. Verify before claiming completion. Only report tests as passed if they actually ran and succeeded.
9. Communicate concisely. Report decisions, evidence, assumptions and conclusions — not long chain-of-thought narration.
10. Stop when the root cause is confirmed, the fix is implemented and verified, or no new evidence is being produced.

Do not spend more effort thinking about a problem than the problem requires.
`.trim();

export function createServer() {
  const server = new McpServer({
    name: "overthink",
    version: "0.1.2",
  });

  // ---- Resources (URI templates / static) ----
  server.registerResource(
    "core-rules",
    "overthink://rules/core",
    {
      title: "Overthink Core Policy",
      description: "Fundamental engineering discipline rules",
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
1. Symptom identification — What exactly is failing?
2. Failure localization — Which component or layer?
3. Hypothesis generation — Most plausible explanations
4. Hypothesis testing — Cheapest distinguishing test
5. Root-cause confirmation — Direct evidence required
6. Targeted correction — Fix only the confirmed issue
7. Regression verification — Ensure nothing else broke

Never present a hypothesis as a confirmed root cause.
`.trim(),
        },
      ],
    })
  );

  // ---- Tools (shape objects only — no z.object wrapper, no .default in shape) ----
  server.registerTool(
    "overthink_start",
    {
      title: "Start Task",
      description:
        "Initialize a task, classify complexity, select reasoning level and budgets",
      inputSchema: {
        task: z.string().describe("The engineering task or problem description"),
        workspace: z
          .string()
          .optional()
          .describe("Workspace / project root path"),
        mode: z
          .string()
          .optional()
          .describe("Mode: auto | coding | debugging | architecture"),
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
    "overthink_investigate",
    {
      title: "Investigate",
      description:
        "Guide targeted evidence collection and progressive investigation",
      inputSchema: {
        task_id: z.string().describe("Task id from overthink_start"),
        error: z.string().optional().describe("Error message or symptom"),
        scope: z
          .array(z.string())
          .optional()
          .describe("Optional path scopes to limit search"),
        observations: z
          .array(z.string())
          .optional()
          .describe("New observations to record"),
        relevant_files: z
          .array(z.string())
          .optional()
          .describe("Files identified as relevant"),
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
      description:
        "Identify likely root causes from observations; never treat untested hypotheses as facts",
      inputSchema: {
        task_id: z.string().describe("Task id"),
        observations: z
          .array(z.string())
          .describe("Observations used for diagnosis"),
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
      description: "Generate a proportionate execution plan based on reasoning level",
      inputSchema: {
        task_id: z.string().describe("Task id"),
      },
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
        "Determine the single best next action, why it matters, and what to avoid",
      inputSchema: {
        task_id: z.string().describe("Task id"),
      },
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
        "Detect repetition, stagnation and lack of progress after an action",
      inputSchema: {
        task_id: z.string().describe("Task id"),
        action: z.string().describe("Action that was just performed"),
        result: z.string().describe("Outcome / result of the action"),
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
      description:
        "Evaluate actual test/build results before allowing completion claims",
      inputSchema: {
        task_id: z.string().describe("Task id"),
        checks: z
          .array(
            z.object({
              name: z.string(),
              executed: z.boolean(),
              passed: z.boolean(),
              details: z.string().optional(),
            })
          )
          .describe("List of verification checks with real outcomes"),
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
      description: "Produce a concise completion report with verification status",
      inputSchema: {
        task_id: z.string().describe("Task id"),
        summary: z
          .string()
          .optional()
          .describe("Short human summary of what was done"),
      },
    },
    async (args) => {
      const result = overthinkFinish(args);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  // ---- Prompts ----
  server.registerPrompt(
    "solve_task",
    {
      title: "Solve Task",
      description: "Solve an engineering task under Overthink discipline",
      argsSchema: {
        task: z.string().describe("The task to solve"),
      },
    },
    async ({ task }) => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: `${CORE_POLICY}\n\nTask:\n${task}\n\nStart with overthink_start, then follow the recommended next_action.`,
          },
        },
      ],
    })
  );

  server.registerPrompt(
    "debug_issue",
    {
      title: "Debug Issue",
      description: "Debug an issue with evidence-first diagnosis",
      argsSchema: {
        issue: z.string().describe("The issue to debug"),
      },
    },
    async ({ issue }) => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: `${CORE_POLICY}\n\nIssue to debug:\n${issue}\n\nUse overthink_start → overthink_investigate → overthink_diagnose. Confirm root cause before fixing.`,
          },
        },
      ],
    })
  );

  return server;
}

/** Local stdio mode (Cursor, Claude Code, etc.) */
export async function startServer() {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Overthink MCP server running on stdio");
}

/**
 * HTTP / Streamable HTTP mode for Heinrich and other remote MCP clients.
 */
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
    res.json({ ok: true, name: "overthink", version: "0.1.2" });
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
