FROM node:24
WORKDIR /app
RUN npm install -g pnpm
COPY package.json ./
RUN pnpm install
COPY index.js .htpasswd ./
CMD [ "node", "index.js" ]
USER 1000
