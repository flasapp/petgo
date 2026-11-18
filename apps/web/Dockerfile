FROM node:22-alpine AS dependencies

WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install --global pnpm@10.7.0 \
  && pnpm install --frozen-lockfile --prod

FROM node:22-alpine

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=5173

WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY package.json ./
COPY public ./public
COPY scripts ./scripts
COPY data ./data

RUN mkdir -p /app/.petgo-local && chown -R node:node /app
USER node

EXPOSE 5173
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + process.env.PORT + '/').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "scripts/dev-server.mjs"]
