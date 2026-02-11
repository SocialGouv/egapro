FROM node:20
RUN corepack enable && corepack prepare pnpm@10.29.2 --activate
WORKDIR /app
COPY pnpm-lock.yaml ./
RUN pnpm fetch
COPY package.json pnpm-workspace.yaml ./
COPY packages/files/package.json ./packages/files/
RUN pnpm install --offline --frozen-lockfile
COPY packages/files/index.js packages/files/.htpasswd ./packages/files/
WORKDIR /app/packages/files
CMD [ "node", "index.js" ]
USER 1000
