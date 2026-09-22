FROM node:24.21.0-bookworm-slim AS build
WORKDIR /app
RUN npm install --global npm@10.9.2
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm ci --workspace @iop/web --include-workspace-root=false
COPY apps/web/tsconfig.json apps/web/vite.config.ts apps/web/index.html apps/web/
COPY apps/web/src apps/web/src
WORKDIR /app/apps/web
RUN npm run build
# Preserve dependency notices alongside the distributed browser artifact.
RUN mkdir /notices && find /app/node_modules -type f \( -iname '*license*' -o -iname '*notice*' -o -iname '*copyright*' \) -exec cp --parents '{}' /notices/ \;

FROM nginx:1.28.0-alpine AS runtime
COPY apps/web/nginx.conf /etc/nginx/nginx.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
COPY --from=build /notices /usr/share/iop-notices
USER nginx
EXPOSE 8080
ENTRYPOINT ["nginx"]
CMD ["-g", "daemon off;"]
