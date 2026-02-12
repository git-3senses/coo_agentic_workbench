"""
REST API Server for Dify — Port 3002
Exposes all NPA tools as HTTP endpoints + auto-generated OpenAPI spec.
Dify imports /openapi.json as a "Custom Tool" provider.
Mirrors server/mcp/src/rest-server.ts exactly.
"""
import os
import sys
import json

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Ensure tools/ is importable
sys.path.insert(0, os.path.dirname(__file__))

from registry import registry  # noqa: E402

# Import all tool modules so they self-register
import tools  # noqa: E402, F401

REST_PORT = int(os.getenv("REST_PORT", "3002"))

app = FastAPI(
    title="NPA Workbench MCP Tools API",
    description="REST API exposing MCP tools for NPA Multi-Agent Workbench. Import this spec into Dify as a Custom Tool provider.",
    version="1.0.0",
    servers=[{"url": os.getenv("PUBLIC_URL", f"http://localhost:{REST_PORT}"), "description": os.getenv("ENV", "Local development")}],
    # Disable FastAPI's built-in /openapi.json so our custom one is served
    openapi_url=None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Custom OpenAPI spec matching TypeScript output ───────────────

@app.get("/openapi.json", include_in_schema=False)
async def openapi_spec():
    """Generate OpenAPI 3.0.3 spec identical to the TypeScript version."""
    all_tools = registry.get_all()
    paths = {}

    for td in all_tools:
        paths[f"/tools/{td.name}"] = {
            "post": {
                "operationId": td.name,
                "summary": td.description,
                "tags": [td.category],
                "requestBody": {
                    "required": True,
                    "content": {
                        "application/json": {
                            "schema": td.input_schema,
                        },
                    },
                },
                "responses": {
                    "200": {
                        "description": "Successful tool execution",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {"type": "boolean"},
                                        "data": {"type": "object"},
                                        "error": {"type": "string"},
                                    },
                                },
                            },
                        },
                    },
                },
            },
        }

    spec = {
        "openapi": "3.0.3",
        "info": {
            "title": "NPA Workbench MCP Tools API",
            "description": "REST API exposing MCP tools for NPA Multi-Agent Workbench. Import this spec into Dify as a Custom Tool provider.",
            "version": "1.0.0",
        },
        "servers": [
            {"url": os.getenv("PUBLIC_URL", f"http://localhost:{REST_PORT}"), "description": os.getenv("ENV", "Local development")},
        ],
        "paths": paths,
        "tags": [{"name": cat, "description": f"{cat} tools"} for cat in registry.get_categories()],
    }
    return JSONResponse(content=spec)


# ─── Tool listing endpoint ────────────────────────────────────────

@app.get("/tools")
async def list_tools():
    all_tools = registry.get_all()
    return {
        "tools": [{"name": t.name, "description": t.description, "category": t.category} for t in all_tools],
        "count": len(all_tools),
    }


# ─── Dynamic tool execution ──────────────────────────────────────

@app.api_route("/tools/{tool_name}", methods=["POST"], include_in_schema=False)
async def execute_tool(tool_name: str, request: Request):
    """Execute a tool by name. Matches POST /tools/{tool-name} from TypeScript."""
    td = registry.get_tool(tool_name)
    if td is None:
        return JSONResponse(status_code=404, content={"success": False, "error": f"Tool '{tool_name}' not found"})

    try:
        body = await request.json()
    except Exception:
        body = {}

    try:
        result = await td.handler(body)
        return JSONResponse(content={"success": result.success, "data": result.data, "error": result.error})
    except Exception as e:
        return JSONResponse(status_code=500, content={"success": False, "error": str(e)})


# ─── Health check ─────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "server": "REST API for Dify",
        "tools": registry.count(),
        "categories": registry.get_categories(),
        "openApiSpec": f"{os.getenv('PUBLIC_URL', f'http://localhost:{REST_PORT}')}/openapi.json",
    }


def start_rest_server():
    """Start the FastAPI REST server."""
    import uvicorn
    print(f"[REST API] Server running on http://localhost:{REST_PORT}")
    print(f"[REST API] OpenAPI spec: http://localhost:{REST_PORT}/openapi.json")
    print(f"[REST API] {registry.count()} tools exposed as POST /tools/{{name}}")
    uvicorn.run(app, host="0.0.0.0", port=REST_PORT, log_level="info")


if __name__ == "__main__":
    start_rest_server()
