FROM node:20
RUN corepack enable && corepack prepare pnpm@10.29.2 --activate
WORKDIR /app
COPY pnpm-lock.yaml ./
RUN pnpm fetch
COPY package.json ./
RUN pnpm install --offline --frozen-lockfile
COPY index.js .htpasswd ./
CMD [ "node", "index.js" ]
USER 1000
