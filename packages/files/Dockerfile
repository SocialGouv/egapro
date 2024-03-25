FROM node:20
RUN mkdir -p /home/node && chown 1000:1000 /home/node
WORKDIR /home/node
USER 1000
COPY package.json yarn.lock
COPY --chown=1000:1000 .yarn .yarn
RUN yarn
COPY index.js .
CMD [ "node", "index.js" ]
