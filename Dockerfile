FROM node:12.18-alpine AS BUILD_IMAGE

COPY . /app
WORKDIR /app

RUN yarn --frozen-lockfile && \
  yarn build

# remove development dependencies
RUN yarn install --production --ignore-scripts --prefer-offline
RUN yarn cache clean

FROM node:12.18-alpine

ARG COMMIT_TAG
ENV COMMIT_TAG=${COMMIT_TAG}

RUN apk add tzdata

COPY . /app
WORKDIR /app

# copy from build image
COPY --from=BUILD_IMAGE /app/dist ./dist
COPY --from=BUILD_IMAGE /app/.next ./.next
COPY --from=BUILD_IMAGE /app/node_modules ./node_modules

CMD yarn start

EXPOSE 5055
