FROM node:20
WORKDIR /app
COPY package.json ../pnpm-lock.yaml ../pnpm-workspace.yaml ./
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile
COPY index.js .htpasswd ./
CMD [ "node", "index.js" ]
USER 1000
