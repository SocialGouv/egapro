FROM node:20
COPY package.json yarn.lock
COPY .yarn .yarn
RUN yarn
COPY index.js .
CMD [ "node", "index.js" ]
USER 1000
