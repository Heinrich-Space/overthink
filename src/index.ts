#!/usr/bin/env node
import { startServer, startHttpServer } from "./server.js";

function parseArgs(argv: string[]) {
  const args = argv.slice(2);
  const http = args.includes("--http");
  const portIdx = args.indexOf("--port");
  const port =
    portIdx !== -1 && args[portIdx + 1]
      ? Number(args[portIdx + 1])
      : Number(process.env.PORT || 3921);
  return { http, port: Number.isFinite(port) ? port : 3921 };
}

const { http, port } = parseArgs(process.argv);

const runner = http ? startHttpServer(port) : startServer();

runner.catch((err) => {
  console.error("Failed to start Overthink MCP server:", err);
  process.exit(1);
});
