#!/bin/sh
set -eu
if [ "$(id -u)" = "0" ]; then
  if [ "${RAILWAY_VOLUME_MOUNT_PATH:-}" = "/data" ]; then
    mkdir -p /data/locator
    chown node:node /data /data/locator
    find /data/locator -xdev \( -type d -o -type f \) -exec chown node:node {} +
  fi
  exec setpriv --reuid=node --regid=node --init-groups "$@"
fi
exec "$@"
