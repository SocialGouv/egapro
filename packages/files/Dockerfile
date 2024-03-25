FROM node:20
USER 1000
COPY package.json yarn.lock
COPY .yarn .yarn
RUN yarn
COPY index.js .
CMD [ "node", "index.js" ]
