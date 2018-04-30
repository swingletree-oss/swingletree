# build swingletree
FROM node:8-alpine as build

ARG NPM_REGISTRY=https://registry.npmjs.org/

COPY . /usr/src/swingletree
WORKDIR /usr/src/swingletree

RUN npm set registry "${NPM_REGISTRY}"
RUN npm i -g npm@6
RUN npm ci --production
RUN npm run build

# swingletree container image
FROM node:8-alpine

ENV REDIS_HOST "http://redis"

RUN mkdir /opt/swingletree
WORKDIR /opt/swingletree

COPY --from=build /usr/src/swingletree/bin .
COPY --from=build /usr/src/swingletree/node_modules ./node_modules
COPY swingletree.conf.yaml .
COPY docker/entrypoint.sh .

ENTRYPOINT [ "/bin/sh", "entrypoint.sh" ]