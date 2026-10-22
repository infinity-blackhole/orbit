#!/usr/bin/env bash
# Start the Temporal dev server and the orbit worker. Ctrl-C stops both.
set -euo pipefail
cd "$(dirname "$0")/.."

temporal server start-dev --db-filename ./.temporal-dev.db &
server_pid=$!
trap 'kill "$server_pid" 2>/dev/null || true' EXIT

for _ in $(seq 1 30); do
  if temporal operator namespace describe default >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

pnpm worker
