# build swingletree
FROM node:8-alpine as build

ARG NPM_REGISTRY=https://registry.npmjs.org/

COPY . /usr/src/swingletree
WORKDIR /usr/src/swingletree

RUN npm set registry "${NPM_REGISTRY}"
RUN npm i
RUN npm run build
RUN npm prune --production

# swingletree container image
FROM node:8-alpine

ENV NODE_ENV "production"
ENV REDIS_HOST "http://redis"

RUN mkdir -p /opt/swingletree
WORKDIR /opt/swingletree

# add build artifacts from builder image
COPY --from=build /usr/src/swingletree/bin .
COPY --from=build /usr/src/swingletree/node_modules ./node_modules

# add misc files like views or configurations
COPY views ./views
COPY static ./static
COPY templates ./templates
COPY swingletree.conf.yaml .

# add entrypoint script
COPY docker/entrypoint.sh .

ENTRYPOINT [ "/bin/sh", "entrypoint.sh" ]
