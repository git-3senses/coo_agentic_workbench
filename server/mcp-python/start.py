"""
Combined launcher — starts both MCP SSE and REST API servers.

MCP SSE: http://localhost:3001 (for MCP-native clients)
REST API: http://localhost:3002 (for Dify Custom Tool import)

Mirrors server/mcp/src/start.ts exactly.
"""
import asyncio
import os
import sys
import threading

from dotenv import load_dotenv

# Load environment from project root .env
load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))

# Ensure this directory is on the path
sys.path.insert(0, os.path.dirname(__file__))

from db import health_check  # noqa: E402


async def main() -> None:
    print("=========================================")
    print("  NPA Workbench — MCP Tools Server (Python)")
    print("=========================================\n")

    # 1. Verify database connectivity
    print("[INIT] Checking database connection...")
    db_ok = await health_check()
    if not db_ok:
        print("[INIT] Database connection failed. Ensure MariaDB is running.")
        print("[INIT]    docker start npa_mariadb")
        sys.exit(1)
    print("[INIT] Database connected\n")

    # 2. Start REST API server in a background thread
    from rest_server import start_rest_server
    rest_thread = threading.Thread(target=start_rest_server, daemon=True)
    rest_thread.start()

    # 3. Start MCP SSE server (blocks in main thread)
    from main import start_mcp_sse_server
    start_mcp_sse_server()

    print("\n=========================================")
    print("  All servers started successfully!")
    print("=========================================")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n[SHUTDOWN] Servers stopped.")
    except Exception as e:
        print(f"[FATAL] {e}")
        sys.exit(1)
