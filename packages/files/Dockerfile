FROM node:20
WORKDIR /app
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn .yarn
RUN yarn
COPY index.js .htpasswd ./
CMD [ "node", "index.js" ]
USER 1000
