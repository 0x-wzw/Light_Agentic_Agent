import { getMcpServer } from "@/lib/mcp/registry";
import { resolveAuthToken } from "@/lib/mcp/auth";

export interface MCPToolCallRequest {
  server_id: string;
  tool: string;
  args: Record<string, unknown>;
}

export interface MCPToolCallResponse {
  ok: boolean;
  data: unknown;
  transport: "stdio" | "https";
}

export async function executeMcpTool(request: MCPToolCallRequest): Promise<MCPToolCallResponse> {
  const server = getMcpServer(request.server_id);
  const token = resolveAuthToken(server.auth_ref);

  if (server.transport === "https") {
    return {
      ok: true,
      transport: "https",
      data: {
        stub: true,
        note: "HTTPS MCP execution is stubbed in this implementation.",
        server_id: request.server_id,
        tool: request.tool,
        args: request.args,
        auth_present: Boolean(token)
      }
    };
  }

  return {
    ok: true,
    transport: "stdio",
    data: {
      stub: true,
      note: "stdio MCP execution is stubbed in this implementation.",
      server_id: request.server_id,
      tool: request.tool,
      args: request.args,
      auth_present: Boolean(token)
    }
  };
}
