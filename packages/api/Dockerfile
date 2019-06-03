ARG NODE_VERSION=10.15.3

FROM node:${NODE_VERSION}

ENV PORT=4000

WORKDIR /app

COPY yarn.lock .
COPY packages/api .

RUN yarn
RUN yarn build

EXPOSE ${PORT}

CMD [ "yarn", "start"]
