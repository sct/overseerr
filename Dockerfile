FROM node:14.16-alpine AS BUILD_IMAGE

ARG COMMIT_TAG
ENV COMMIT_TAG=${COMMIT_TAG}

COPY . /app
WORKDIR /app

RUN yarn --frozen-lockfile && \
  yarn build

# remove development dependencies
RUN yarn install --production --ignore-scripts --prefer-offline

RUN rm -rf src && \
  rm -rf server

RUN touch config/DOCKER

RUN echo "{\"commitTag\": \"${COMMIT_TAG}\"}" > committag.json


FROM node:14.16-alpine

RUN apk add --no-cache tzdata tini

# copy from build image
COPY --from=BUILD_IMAGE /app /app
WORKDIR /app

ENTRYPOINT [ "/sbin/tini", "--" ]
CMD [ "yarn", "start" ]

EXPOSE 5055
