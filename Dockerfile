FROM node:14.17-alpine AS BUILD_IMAGE

WORKDIR /app

ARG TARGETPLATFORM
ENV TARGETPLATFORM=${TARGETPLATFORM:-linux/amd64}

RUN \
  case "${TARGETPLATFORM}" in \
    'linux/arm64') apk add --no-cache python make g++ ;; \
    'linux/arm/v7') apk add --no-cache python make g++ ;; \
  esac

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --network-timeout 1000000

COPY . ./

ARG COMMIT_TAG
ENV COMMIT_TAG=${COMMIT_TAG}

RUN yarn build

# remove development dependencies
RUN yarn install --production --ignore-scripts --prefer-offline

RUN rm -rf src server

RUN touch config/DOCKER

RUN echo "{\"commitTag\": \"${COMMIT_TAG}\"}" > committag.json


FROM node:14.17-alpine

WORKDIR /app

RUN apk add --no-cache tzdata tini

# copy from build image
COPY --from=BUILD_IMAGE /app ./

HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=10s \
    CMD wget http://localhost:5055/api/v1/status -qO /dev/null || exit 1

ENTRYPOINT [ "/sbin/tini", "--" ]
CMD [ "yarn", "start" ]

EXPOSE 5055
