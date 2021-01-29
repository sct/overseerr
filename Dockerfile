FROM node:12.18-alpine AS BUILD_IMAGE

ARG COMMIT_TAG
ENV COMMIT_TAG=${COMMIT_TAG}

COPY . /app
WORKDIR /app

RUN yarn --frozen-lockfile && \
  yarn build && \
  yarn install --production --ignore-scripts --prefer-offline && \
  yarn cache clean

FROM node:12.18-alpine

RUN apk add --update --no-cache tzdata

ARG COMMIT_TAG
ENV COMMIT_TAG=${COMMIT_TAG}

COPY . /app
WORKDIR /app

# copy from build image
COPY --from=BUILD_IMAGE /app/dist ./dist
COPY --from=BUILD_IMAGE /app/.next ./.next
COPY --from=BUILD_IMAGE /app/node_modules ./node_modules

RUN echo "{\"commitTag\": \"${COMMIT_TAG}\"}" > committag.json

CMD yarn start

EXPOSE 5055
