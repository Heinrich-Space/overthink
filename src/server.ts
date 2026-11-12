import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { overthinkStart, startSchema } from "./tools/start.js";
import { overthinkInvestigate, investigateSchema } from "./tools/investigate.js";
import { overthinkDiagnose, diagnoseSchema } from "./tools/diagnose.js";
import { overthinkPlan, planSchema } from "./tools/plan.js";
import { overthinkNextAction, nextActionSchema } from "./tools/next-action.js";
import { overthinkCheckProgress, progressSchema } from "./tools/progress.js";
import { overthinkVerify, verifySchema } from "./tools/verify.js";
import { overthinkFinish, finishSchema } from "./tools/finish.js";

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
    version: "0.1.0",
  });

  // Resources
  server.resource(
    "overthink://rules/core",
    "overthink://rules/core",
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

  server.resource(
    "overthink://rules/debugging",
    "overthink://rules/debugging",
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

  // Tools
  server.tool(
    "overthink_start",
    "Initialize a task, classify complexity, select reasoning level and budgets",
    startSchema.shape,
    async (args) => {
      const result = overthinkStart(startSchema.parse(args));
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.tool(
    "overthink_investigate",
    "Guide targeted evidence collection and progressive investigation",
    investigateSchema.shape,
    async (args) => {
      const result = overthinkInvestigate(investigateSchema.parse(args));
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.tool(
    "overthink_diagnose",
    "Identify likely root causes from observations; never treat untested hypotheses as facts",
    diagnoseSchema.shape,
    async (args) => {
      const result = overthinkDiagnose(diagnoseSchema.parse(args));
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.tool(
    "overthink_plan",
    "Generate a proportionate execution plan based on reasoning level",
    planSchema.shape,
    async (args) => {
      const result = overthinkPlan(planSchema.parse(args));
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.tool(
    "overthink_next_action",
    "Determine the single best next action, why it matters, and what to avoid",
    nextActionSchema.shape,
    async (args) => {
      const result = overthinkNextAction(nextActionSchema.parse(args));
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.tool(
    "overthink_check_progress",
    "Detect repetition, stagnation and lack of progress after an action",
    progressSchema.shape,
    async (args) => {
      const result = overthinkCheckProgress(progressSchema.parse(args));
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.tool(
    "overthink_verify",
    "Evaluate actual test/build results before allowing completion claims",
    verifySchema.shape,
    async (args) => {
      const result = overthinkVerify(verifySchema.parse(args));
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.tool(
    "overthink_finish",
    "Produce a concise completion report with verification status",
    finishSchema.shape,
    async (args) => {
      const result = overthinkFinish(finishSchema.parse(args));
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  // Prompts
  server.prompt(
    "solve_task",
    "Solve an engineering task under Overthink discipline",
    { task: z.string() },
    async ({ task }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `${CORE_POLICY}\n\nTask:\n${task}\n\nStart with overthink_start, then follow the recommended next_action.`,
          },
        },
      ],
    })
  );

  server.prompt(
    "debug_issue",
    "Debug an issue with evidence-first diagnosis",
    { issue: z.string() },
    async ({ issue }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `${CORE_POLICY}\n\nIssue to debug:\n${issue}\n\nUse overthink_start → overthink_investigate → overthink_diagnose. Confirm root cause before fixing.`,
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
