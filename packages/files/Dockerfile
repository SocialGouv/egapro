FROM node:20
WORKDIR /app
COPY packages/files/package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile
COPY packages/files/index.js packages/files/.htpasswd ./
CMD [ "node", "index.js" ]
USER 1000
