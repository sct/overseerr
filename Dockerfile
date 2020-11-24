FROM node:12.18-alpine

COPY . /app
WORKDIR /app

RUN yarn --frozen-lockfile && \
  yarn build

# remove development dependencies
RUN npm prune --production

CMD yarn start
