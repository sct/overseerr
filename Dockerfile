FROM golang:1.21-alpine as build-backend
RUN apk add git
ADD .. /build
WORKDIR /build

RUN go mod download
RUN go get -u github.com/natewong1313/go-react-ssr
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags "-w -X main.APP_ENV=production" -a -o main


FROM node:lts-alpine as build-frontend

RUN apk add python3 make g++
ADD ./src /src
ADD ./package.json /src/package.json
WORKDIR /src

RUN npm install

# if tailwind is enabled, use "FROM node:16-alpine" instead
FROM alpine:latest
COPY --from=build-backend /build/main ./app/main
COPY --from=build-frontend /src ./app/frontend

WORKDIR /app
RUN chmod +x ./main
EXPOSE 8080
CMD ["./main"]
