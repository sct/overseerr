FROM node:12.18-alpine AS BUILD_IMAGE

ARG COMMIT_TAG
ENV COMMIT_TAG=${COMMIT_TAG}

COPY . /app
WORKDIR /app

RUN yarn --frozen-lockfile && \
  yarn build

# remove development dependencies
RUN yarn install --production --ignore-scripts --prefer-offline

RUN mkdir -p /artifact && \
  mv /app/dist /artifact && \
  mv /app/.next /artifact && \
  mv /app/node_modules /artifact


FROM node:12.18-alpine

RUN apk add --no-cache tzdata

ARG COMMIT_TAG
ENV COMMIT_TAG=${COMMIT_TAG}

COPY [^src]* /app/
WORKDIR /app

# copy from build image
COPY --from=BUILD_IMAGE /artifact /app

RUN echo "{\"commitTag\": \"${COMMIT_TAG}\"}" > committag.json

CMD yarn start

EXPOSE 5055
