# ── Stage 1: Install dependencies ──────────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

ARG TARGETPLATFORM
ENV TARGETPLATFORM=${TARGETPLATFORM:-linux/amd64}

RUN \
  case "${TARGETPLATFORM}" in \
  'linux/arm64' | 'linux/arm/v7') \
  apk update && \
  apk add --no-cache python3 make g++ gcc libc6-compat bash && \
  yarn global add node-gyp \
  ;; \
  esac

COPY package.json yarn.lock ./
RUN CYPRESS_INSTALL_BINARY=0 yarn install --frozen-lockfile --network-timeout 1000000

# ── Stage 2a: Build Next.js client ────────────────────────────────────────────
FROM deps AS build-client

COPY . ./

ARG COMMIT_TAG=local
ENV COMMIT_TAG=${COMMIT_TAG}

RUN yarn build:next

# ── Stage 2b: Build Express server (runs in parallel with client build) ───────
FROM deps AS build-server

COPY . ./

ARG COMMIT_TAG=local
ENV COMMIT_TAG=${COMMIT_TAG}

RUN yarn build:server

# ── Stage 3: Assemble production image ────────────────────────────────────────
FROM deps AS production-deps

# Strip dev dependencies for a smaller final image
RUN yarn install --production --ignore-scripts --prefer-offline

FROM node:20-alpine

WORKDIR /app

ARG COMMIT_TAG=local

RUN apk add --no-cache tzdata tini ca-certificates shadow su-exec && rm -rf /tmp/*

# Copy production node_modules
COPY --from=production-deps /app/node_modules ./node_modules
COPY --from=production-deps /app/package.json /app/yarn.lock ./

# Copy built client from build-client stage
COPY --from=build-client /app/.next ./.next
COPY --from=build-client /app/public ./public
COPY --from=build-client /app/next.config.js ./

# Copy built server from build-server stage
COPY --from=build-server /app/dist ./dist

# Copy necessary config/static files
COPY overseerr-api.yml ./
COPY config ./config

RUN touch config/DOCKER
RUN echo "{\"commitTag\": \"${COMMIT_TAG}\"}" > committag.json

# PUID/PGID support: create overseerr user with configurable UID/GID
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

ENTRYPOINT [ "/sbin/tini", "--", "/docker-entrypoint.sh" ]
CMD [ "node", "dist/index.js" ]

EXPOSE 5055

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget -qO- http://localhost:5055/api/v1/health || exit 1

LABEL maintainer="overseerr"
