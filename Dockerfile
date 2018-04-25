# build swingletree
FROM node:8-alpine as build

ARG NPM_REGISTRY=https://registry.npmjs.org/

COPY . /usr/src/swingletree
WORKDIR /usr/src/swingletree

RUN npm set registry "${NPM_REGISTRY}"
RUN npm i
RUN npm run build

# swingletree container image
FROM node:8-alpine

ENV REDIS_HOST "http://redis"

COPY --from=build /usr/src/swingletree/dist .
COPY --from=build /usr/src/swingletree/node_modules .

ENTRYPOINT [ "node", "main.js" ]