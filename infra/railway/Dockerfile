FROM node:24.21.0-bookworm-slim AS build
WORKDIR /app
RUN npm install --global npm@10.9.2
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm ci
COPY apps/api/tsconfig*.json apps/api/
COPY apps/api/src apps/api/src
COPY infra/database/tsconfig.json infra/database/*.ts infra/database/
COPY apps/web/tsconfig.json apps/web/vite.config.ts apps/web/index.html apps/web/
COPY apps/web/jest.config.cjs apps/web/jest.config.cjs
COPY apps/web/test/design-boundaries.spec.ts apps/web/test/design-boundaries.spec.ts
COPY apps/web/src apps/web/src
COPY apps/web/public apps/web/public
RUN npm run build
RUN mkdir /notices && find /app/node_modules -type f \( -iname '*license*' -o -iname '*notice*' -o -iname '*copyright*' \) -exec cp --parents '{}' /notices/ \;
RUN npm prune --omit=dev

FROM node:24.21.0-bookworm-slim AS runtime
ENV NODE_ENV=production HOST=0.0.0.0 IOP_TRANSPORT=container IOP_EXECUTION_MODE=railway IOP_DATABASE_MODE=railway IOP_AUTHENTICATION=password
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/infra/database/dist ./infra/database/dist
COPY --from=build /app/apps/web/dist ./apps/web/dist
COPY infra/railway/revision.json ./apps/web/dist/build-revision.json
COPY --from=build /notices /usr/share/iop-notices
COPY infra/database/migrations ./infra/database/migrations
COPY scripts/local/initialize.cjs scripts/local/bootstrap-access.cjs scripts/local/locator-private-copy.cjs ./scripts/local/
COPY scripts/railway/*.cjs ./scripts/railway/
# Railway volumes are root-owned; only the launcher prepares the mount, then drops privileges.
COPY infra/railway/entrypoint.sh /usr/local/bin/iop-entrypoint
RUN command -v setpriv && sed -i 's/\r$//' /usr/local/bin/iop-entrypoint && chmod 755 /usr/local/bin/iop-entrypoint
ENTRYPOINT ["/usr/local/bin/iop-entrypoint"]
CMD ["node", "scripts/railway/start.cjs"]
