FROM node:22-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@9

# Copy workspace files
COPY package.json pnpm-workspace.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source
COPY packages/shared ./packages/shared/
COPY apps/api ./apps/api/
COPY prisma ./prisma/

# Generate Prisma client
RUN pnpm db:generate

# Build
RUN pnpm --filter @myblog/api build

# Production image
FROM node:22-alpine AS runner

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@9

# Create non-root user
RUN addgroup -S nodejs && adduser -S apiuser -G nodejs

# Copy necessary files
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/node_modules ./node_modules/
COPY --from=builder /app/packages/shared ./packages/shared/
COPY --from=builder /app/apps/api/dist ./apps/api/dist/
COPY --from=builder /app/apps/api/package.json ./apps/api/

# Create data directories
RUN mkdir -p /data/media /data/media-tmp /app/logs/api && \
    chown -R apiuser:nodejs /data /app/logs

USER apiuser

EXPOSE 4000

CMD ["node", "apps/api/dist/main.js"]
