# ─── Stage 1: Build Angular ──────────────────────────────────────────────────
FROM node:20-alpine AS angular-build

WORKDIR /app

# Install Angular dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Build Angular for production (no base-href since Express serves at root)
COPY . .
RUN npx ng build --configuration production \
    && ls -la dist/agent-command-hub-angular/browser/index.html \
    && echo "✅ Angular build verified"

# ─── Stage 2: Production server ─────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

# Install Express server dependencies only
COPY server/package.json server/package-lock.json ./server/
RUN cd server && npm ci --omit=dev

# Copy Express server source
COPY server/ ./server/

# Copy Angular build output from stage 1
COPY --from=angular-build /app/dist ./dist

# Verify Angular dist exists in final image
RUN ls -la dist/agent-command-hub-angular/browser/index.html \
    && echo "✅ Angular dist verified in production stage"

# Railway sets PORT via env var
EXPOSE 3000

WORKDIR /app/server
CMD ["node", "index.js"]
