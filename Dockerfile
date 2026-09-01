# --- Build stage ---
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# --- Runtime stage ---
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./
COPY server.js ./
COPY data ./data
COPY public ./public

EXPOSE 3000

# Basic healthcheck so Kubernetes can tell if the app is alive
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget -qO- http://localhost:3000/api/menu > /dev/null || exit 1

CMD ["node", "server.js"]
