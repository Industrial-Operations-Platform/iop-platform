FROM node:24.21.0-bookworm-slim AS dependencies
WORKDIR /app
RUN npm install --global npm@10.9.2
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm ci --workspace @iop/api --include-workspace-root=false

FROM dependencies AS build
COPY apps/api/tsconfig*.json apps/api/
COPY apps/api/src apps/api/src
WORKDIR /app/apps/api
RUN npm run build

FROM dependencies AS production-dependencies
RUN npm prune --omit=dev --workspace @iop/api --include-workspace-root=false

FROM node:24.21.0-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app/apps/api
COPY --from=production-dependencies /app/node_modules /app/node_modules
COPY --from=build /app/apps/api/dist ./dist
COPY apps/api/package.json ./package.json
USER node
EXPOSE 3000
CMD ["node", "dist/main.js"]
