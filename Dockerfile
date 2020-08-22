FROM node:12.18-alpine

COPY . /app
WORKDIR /app

RUN yarn && \
  yarn build

CMD yarn start
