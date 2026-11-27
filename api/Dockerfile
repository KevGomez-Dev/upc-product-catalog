FROM node:22.19.0-bookworm-slim AS workspace
WORKDIR /app
COPY package.json package-lock.json ./
COPY api/package.json ./api/package.json
COPY web/package.json ./web/package.json

FROM workspace AS build
RUN npm ci --workspace api --include-workspace-root=false --no-audit --no-fund
COPY api/nest-cli.json api/tsconfig.json ./api/
COPY api/src ./api/src
RUN npm run build --workspace api

FROM workspace AS runtime
ENV NODE_ENV=production
RUN npm ci --workspace api --include-workspace-root=false --omit=dev --no-audit --no-fund \
  && npm cache clean --force
COPY --from=build /app/api/dist ./api/dist
USER node
EXPOSE 3000
CMD ["node", "api/dist/main.js"]
