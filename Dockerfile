# ==========================================
# Build Stage
# ==========================================
FROM node:22-slim AS builder

WORKDIR /app

# Copy dependency specifications
COPY package*.json ./

# Install dependencies cleanly
RUN npm ci

# Copy source code and config files
COPY . .

# Build the production bundle into /app/dist
RUN npm run build

# ==========================================
# Production Runtime Stage (Node + GCS State API)
# ==========================================
FROM node:22-slim

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080
ENV GCS_STATE_BUCKET=op-hack-001
ENV GCS_STATE_OBJECT=slaypadel/tuesslay-state.json

# Install only production runtime dependencies (@google-cloud/storage)
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled frontend assets and API server
COPY --from=builder /app/dist ./dist
COPY server.mjs ./server.mjs
COPY server ./server

# Cloud Run listens on 0.0.0.0:$PORT (8080)
EXPOSE 8080

CMD ["node", "server.mjs"]
