# See here for image contents: https://github.com/devcontainers/images/blob/main/src/typescript-node/.devcontainer/Dockerfile

# [Choice] Node.js version: none, lts/*, 16, 14, 12, 10
ARG VARIANT="16-bullseye"
FROM mcr.microsoft.com/vscode/devcontainers/typescript-node:0-${VARIANT}

RUN apt-get update \
  && apt-get install --no-install-recommends -y \
  curl \
  build-essential \
  libpq-dev \
  libwebp-dev \
  libsasl2-dev libldap2-dev libssl-dev \
  gnupg gnupg2 gnupg1

EXPOSE 5055
