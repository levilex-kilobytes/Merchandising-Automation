FROM node:20-alpine AS builder

ARG SERVICE_NAME
RUN test -n "$SERVICE_NAME" || (echo "SERVICE_NAME build arg is required" && exit 1)

WORKDIR /app

COPY package.json package-lock.json* ./
COPY tsconfig.json ./
COPY packages ./packages
COPY apps ./apps

RUN npm install --workspaces --include-workspace-root
RUN npm run build --workspace=@mfa/${SERVICE_NAME}

FROM node:20-alpine

ARG SERVICE_NAME
ENV NODE_ENV=production

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/apps/${SERVICE_NAME} ./apps/${SERVICE_NAME}

WORKDIR /app/apps/${SERVICE_NAME}

CMD ["sh", "-c", "node dist/apps/${SERVICE_NAME}/scripts/migrate.js && node dist/apps/${SERVICE_NAME}/src/server.js"]
