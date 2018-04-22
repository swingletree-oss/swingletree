ARG SWINGLETREE_HOME=/opt/swingletree

# build swingletree
FROM node:8-alpine as build
COPY . /usr/src/swingletree
WORKDIR /usr/src/swingletree
RUN npm i
RUN npm run build


FROM node:8-alpine

COPY --from=build /usr/src/swingletree/dist ${SWINGLETREE_HOME}
COPY --from=build /usr/src/swingletree/node_modules ${SWINGLETREE_HOME}
WORKDIR ${SWINGLETREE_HOME}

ENTRYPOINT [ "node", "main.js" ]