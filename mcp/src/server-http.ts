import { randomUUID } from "node:crypto";
import express from "express";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { handleTool, pool, TOOLS } from "./tools.js";

const server = new Server(
  { name: "digital-garden-manager", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const result = await handleTool(request.params.name, request.params.arguments ?? {});
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
    };
  } catch (error) {
    return {
      isError: true,
      content: [{ type: "text", text: error instanceof Error ? error.message : String(error) }]
    };
  }
});

async function main() {
  await pool.query("SELECT 1");
  console.error("Digital Garden MCP connected to database");

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID()
  });
  await server.connect(transport);

  const app = express();

  app.get("/health", (_request, response) => {
    response.json({ ok: true });
  });

  app.all("/mcp", async (request, response) => {
    try {
      if (request.method === "POST") {
        const chunks: Buffer[] = [];
        for await (const chunk of request) chunks.push(Buffer.from(chunk));
        const body = Buffer.concat(chunks).toString("utf8");
        await transport.handleRequest(request, response, body ? JSON.parse(body) : undefined);
        return;
      }

      if (request.method === "GET") {
        await transport.handleRequest(request, response);
        return;
      }

      response.status(405).json({ error: "Method not allowed" });
    } catch (error) {
      console.error("MCP HTTP error:", error);
      if (!response.headersSent) {
        response.status(500).json({ error: error instanceof Error ? error.message : String(error) });
      }
    }
  });

  const port = Number(process.env.PORT || 3100);
  app.listen(port, "0.0.0.0", () => {
    console.error(`Digital Garden MCP listening on http://0.0.0.0:${port}/mcp`);
  });
}

main().catch((error) => {
  console.error("MCP fatal error:", error);
  process.exit(1);
});
