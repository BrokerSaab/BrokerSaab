# ── Stage 1: Build ──────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /usr/src/app

RUN apk add --no-cache openssl

COPY package*.json ./
COPY tsconfig.json ./
COPY prisma ./prisma/

RUN npm install --legacy-peer-deps

RUN npx prisma generate

COPY src ./src
RUN npm run build

# ── Stage 2: Production image ────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /usr/src/app

RUN apk add --no-cache openssl

# Copy only what the runtime needs
COPY package*.json ./
RUN npm install --omit=dev --legacy-peer-deps

# Prisma client + schema (generate already baked into node_modules from builder)
COPY --from=builder /usr/src/app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /usr/src/app/node_modules/@prisma ./node_modules/@prisma
COPY prisma ./prisma/

# Compiled JS
COPY --from=builder /usr/src/app/dist ./dist

EXPOSE 10000

# Run migration first (best-effort), then always start the server.
# If migrate fails (e.g. DB not ready yet), the server still starts
# and Render's health check passes. Retry migrations on next deploy.
CMD ["sh", "-c", "npx prisma migrate deploy || echo '[warn] Migration failed — starting server anyway'; node dist/app.js"]
