#!/usr/bin/env bash
# Build dist/ and serve it on a free port for one verification run.
# Needs the command sandbox OFF: binding a port is EPERM inside it.
# Usage: up.sh [run-dir]    SKIP_BUILD=1 reuses the current dist/
set -eu  # no pipefail: `curl | grep -q` would fail on SIGPIPE once grep matches
cd "$(git rev-parse --show-toplevel)"
RUN="${1:-.verify/$(date +%Y%m%d-%H%M%S)}"; mkdir -p "$RUN"
[ "${SKIP_BUILD:-0}" = 1 ] || pnpm build > "$RUN/build.log" 2>&1 || { tail -20 "$RUN/build.log"; exit 1; }
PORT=$(node -e 'const s=require("net").createServer().listen(0,()=>{console.log(s.address().port);s.close()})')
PORT=$PORT nohup node scripts/preview-static.mjs > "$RUN/server.log" 2>&1 &
PID=$!; URL="http://127.0.0.1:$PORT"
printf 'RUN=%s\nPID=%s\nPORT=%s\nURL=%s\nCOMMIT=%s\nDIRTY=%s\n' "$RUN" "$PID" "$PORT" "$URL" "$(git rev-parse --short HEAD)" \
  "$(git status --porcelain -- src scripts index.html vite.config.ts | wc -l | tr -d ' ')" > "$RUN/state.env"
for _ in $(seq 50); do
  curl -sf "$URL/format/json" | grep -q '<title>JSON Formatter' && { echo "ready $URL pid=$PID run=$RUN"; exit 0; }
  sleep 0.1
done
echo "not ready after 5s; see $RUN/server.log" >&2; kill "$PID"; exit 1
