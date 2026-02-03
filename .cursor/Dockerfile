FROM node:20-alpine

# Install development dependencies for native modules
RUN apk add --no-cache git python3 make g++ gcc libc6-compat bash

# Create non-root user (Cursor recommends USER and WORKDIR in home directory)
RUN adduser -D -h /home/agent agent
USER agent
WORKDIR /home/agent

# Pre-install yarn globally for faster agent setup
RUN npm install -g yarn
