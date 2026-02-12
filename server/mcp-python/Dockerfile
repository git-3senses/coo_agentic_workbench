# ─── NPA MCP Tools Server ─────────────────────────────────────
# Python 3.11 FastAPI server exposing 71 MCP tools via REST API
# ──────────────────────────────────────────────────────────────
FROM python:3.11-slim

LABEL maintainer="NPA Workbench Team" \
      description="MCP Tools REST API for NPA Multi-Agent Workbench" \
      version="1.0.0"

# Security: run as non-root
RUN groupadd -r appuser && useradd -r -g appuser -d /app -s /sbin/nologin appuser

WORKDIR /app

# Install dependencies first (layer caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY *.py ./
COPY tools/ ./tools/

# Non-root user
RUN chown -R appuser:appuser /app
USER appuser

# Expose REST API port
EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD python3 -c "import urllib.request; urllib.request.urlopen('http://localhost:3002/health')" || exit 1

# Start the REST server
CMD ["python3", "rest_server.py"]
