"""
MCP SSE Server — Port 3001
Exposes all NPA tools via Model Context Protocol (SSE transport).
Mirrors server/mcp/src/index.ts exactly.
"""
import os
import sys
import json

from mcp.server.fastmcp import FastMCP

# Ensure tools/ is importable
sys.path.insert(0, os.path.dirname(__file__))

from registry import registry  # noqa: E402

# Import all tool modules so they self-register
import tools  # noqa: E402, F401

MCP_PORT = int(os.getenv("MCP_PORT", "3001"))

# Create the FastMCP server
mcp_server = FastMCP(
    name="npa-workbench-mcp",
    host="0.0.0.0",
    port=MCP_PORT,
)

# Register every tool from the registry into FastMCP
for tool_def in registry.get_all():
    # Capture tool_def in closure
    def _make_handler(td):
        async def handler(**kwargs):
            try:
                result = await td.handler(kwargs)
                # FastMCP wraps the return value as TextContent(type="text", text=...).
                # Return compact JSON (no indent) to minimize response size.
                # Dify's MCP plugin reads the text field and parses it.
                d = {"success": result.success}
                if result.data is not None:
                    d["data"] = result.data
                if result.error is not None:
                    d["error"] = result.error
                return json.dumps(d, default=str)
            except Exception as e:
                return json.dumps({"success": False, "error": str(e)})
        # Set function metadata for FastMCP
        handler.__name__ = td.name
        handler.__doc__ = td.description
        return handler

    # Build the tool's parameter annotations from JSON Schema for FastMCP
    mcp_server.tool(name=tool_def.name, description=tool_def.description)(
        _make_handler(tool_def)
    )


def start_mcp_sse_server():
    """Start the MCP SSE server on the configured port."""
    print(f"[MCP SSE] Server running on http://localhost:{MCP_PORT}")
    print(f"[MCP SSE] {registry.count()} tools registered across {len(registry.get_categories())} categories")
    print(f"[MCP SSE] Categories: {', '.join(registry.get_categories())}")
    mcp_server.run(transport="sse")


if __name__ == "__main__":
    start_mcp_sse_server()
