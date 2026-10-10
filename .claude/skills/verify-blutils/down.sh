#!/usr/bin/env bash
# Stop the preview server this run started. Evidence in <run-dir> is kept.
# Needs the command sandbox OFF (same as up.sh).
# Usage: down.sh <run-dir>
set -u
cd "$(git rev-parse --show-toplevel)"; . "${1:?usage: down.sh <run-dir>}/state.env"
listening() { lsof -nP -iTCP:"$PORT" -sTCP:LISTEN -t >/dev/null 2>&1; }
if ps -o command= -p "$PID" | grep -q 'scripts/preview-static.mjs'; then kill "$PID"
else echo "pid $PID already gone or not ours; nothing killed"; fi
for _ in $(seq 20); do listening || break; sleep 0.1; done
listening && { echo "port $PORT still listening; owner: $(lsof -nP -iTCP:"$PORT" -sTCP:LISTEN -t)" >&2; exit 1; }
echo "down: port $PORT free; evidence kept in $RUN:"; ls -1 "$RUN"
