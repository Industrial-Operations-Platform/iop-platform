FROM node:24.21.0-bookworm-slim AS build
WORKDIR /app
RUN npm install --global npm@10.9.2
COPY package.json package-lock.json ./
RUN npm ci --workspaces=false
COPY infra/database/tsconfig.json infra/database/*.ts infra/database/
RUN npm run db:build
RUN npm prune --omit=dev --workspaces=false

FROM node:24.21.0-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/infra/database/dist ./infra/database/dist
COPY infra/database/migrations ./infra/database/migrations
USER node
ENTRYPOINT ["node", "infra/database/dist/cli.js"]
