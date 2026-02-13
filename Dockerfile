# ─── Stage 1: Build Angular ──────────────────────────────────────────────────
FROM node:20-alpine AS angular-build

WORKDIR /app

# Install Angular dependencies
COPY package.json ./
RUN npm install

# Build Angular for production (no base-href since Express serves at root)
COPY . .
RUN npx ng build --configuration production

# ─── Stage 2: Production server ─────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

# Install Express server dependencies only
COPY server/package.json ./server/
RUN cd server && npm install --omit=dev

# Copy Express server source
COPY server/ ./server/

# Copy Angular build output from stage 1
COPY --from=angular-build /app/dist ./dist

# Railway sets PORT via env var
EXPOSE 3000

WORKDIR /app/server
CMD ["node", "index.js"]
