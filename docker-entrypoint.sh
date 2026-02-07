#!/bin/sh
set -e

PUID="${PUID:-0}"
PGID="${PGID:-0}"
UMASK="${UMASK:-022}"

umask "$UMASK"

# If PUID/PGID are set to non-root, create/modify the overseerr user
if [ "$PUID" -ne 0 ]; then
  GROUP_NAME="overseerr"
  USER_NAME="overseerr"

  # Create group if it doesn't exist with the given PGID
  if ! getent group "$PGID" > /dev/null 2>&1; then
    addgroup -g "$PGID" "$GROUP_NAME"
  else
    GROUP_NAME=$(getent group "$PGID" | cut -d: -f1)
  fi

  # Create user if it doesn't exist with the given PUID
  if ! getent passwd "$PUID" > /dev/null 2>&1; then
    adduser -u "$PUID" -G "$GROUP_NAME" -D -h /app "$USER_NAME"
  else
    USER_NAME=$(getent passwd "$PUID" | cut -d: -f1)
  fi

  # Ensure config directory is writable
  chown -R "$PUID:$PGID" /app/config 2>/dev/null || true

  echo "Running as user $USER_NAME ($PUID:$PGID)"
  exec su-exec "$USER_NAME" "$@"
else
  echo "Running as root"
  exec "$@"
fi
