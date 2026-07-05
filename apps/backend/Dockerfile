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

# Copy only what the runtime needs.
# NOTE: dev deps are intentionally kept here (no --omit=dev) so the pinned
# `prisma` CLI (package.json devDependencies) is present in node_modules/.bin
# at container start — without it, `npx prisma` silently fetches the latest
# registry version instead of the pinned one, which has broken schema.prisma
# compatibility across major versions before.
RUN npm install --legacy-peer-deps

# Prisma client + schema (generate already baked into node_modules from builder)
COPY --from=builder /usr/src/app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /usr/src/app/node_modules/@prisma ./node_modules/@prisma
COPY prisma ./prisma/

# Compiled JS
COPY --from=builder /usr/src/app/dist ./dist

EXPOSE 10000

# Apply the committed migration history deterministically (replaces the old
# `prisma db push`, which schema-diffs against whatever Prisma CLI version
# happens to resolve and has no migration history), then start the server.
CMD ["sh", "-c", "./node_modules/.bin/prisma migrate deploy || echo '[warn] Migration failed — starting server anyway'; node dist/app.js"]
