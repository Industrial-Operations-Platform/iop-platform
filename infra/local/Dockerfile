FROM node:24.21.0-bookworm-slim AS build
WORKDIR /app
RUN npm install --global npm@10.9.2
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm ci --workspace @iop/api --include-workspace-root=true
COPY apps/api/tsconfig*.json apps/api/
COPY apps/api/src apps/api/src
COPY infra/database/tsconfig.json infra/database/*.ts infra/database/
RUN npm run build --workspace @iop/api && npm run db:build
RUN npm prune --omit=dev --workspace @iop/api --include-workspace-root=true

FROM node:24.21.0-bookworm-slim
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/infra/database/dist ./infra/database/dist
COPY infra/database/migrations ./infra/database/migrations
COPY scripts/local/initialize.cjs scripts/local/bootstrap-access.cjs scripts/local/workforce-demo.cjs scripts/local/
USER node
CMD ["node", "scripts/local/initialize.cjs"]
