FROM node:12.18-alpine

COPY . /app
WORKDIR /app

RUN yarn --frozen-lockfile && \
  yarn build

# remove development dependencies
RUN yarn install --production --ignore-scripts --prefer-offline
RUN yarn cache clean

CMD yarn start
