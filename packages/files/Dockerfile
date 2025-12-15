FROM node:20
WORKDIR /app
COPY package.json ./
RUN npm install
COPY index.js .htpasswd ./
CMD [ "node", "index.js" ]
USER 1000
