FROM node:22-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@9

# Copy workspace files
COPY package.json pnpm-workspace.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/web/package.json ./apps/web/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source
COPY packages/shared ./packages/shared/
COPY apps/web ./apps/web/

# Build
RUN pnpm --filter @myblog/web build

# Production image
FROM node:22-alpine AS runner

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@9

# Create non-root user
RUN addgroup -S nodejs && adduser -S webuser -G nodejs

# Copy necessary files
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/node_modules ./node_modules/
COPY --from=builder /app/packages/shared ./packages/shared/
COPY --from=builder /app/apps/web/.next ./apps/web/.next/
COPY --from=builder /app/apps/web/package.json ./apps/web/
COPY --from=builder /app/apps/web/public ./apps/web/public/

# Create log directory
RUN mkdir -p /app/logs/web && chown -R webuser:nodejs /app/logs

USER webuser

EXPOSE 3000

CMD ["pnpm", "--filter", "@myblog/web", "start"]
