ARG NODE_VERSION=10.15.3

FROM node:${NODE_VERSION}

ENV API_PORT=4000

COPY . /app

WORKDIR /app
RUN yarn
RUN yarn build

EXPOSE ${API_PORT}

CMD [ "yarn", "start"]
