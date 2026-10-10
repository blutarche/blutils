#!/usr/bin/env bash
# Read-only: is the instance recorded in <run-dir>/state.env worth driving?
# Needs the command sandbox OFF: sandboxed curl cannot reach the local port.
# Usage: doctor.sh <run-dir>
set -u  # no pipefail: `curl | grep -q` would fail on SIGPIPE once grep matches
cd "$(git rev-parse --show-toplevel)"; . "${1:?usage: doctor.sh <run-dir>}/state.env"; ok=1
fail() { echo "FAIL $*"; ok=0; }
ps -o command= -p "$PID" | grep -q 'scripts/preview-static.mjs' || fail "pid $PID is not this run's preview server"
[ "$(lsof -nP -iTCP:"$PORT" -sTCP:LISTEN -t 2>/dev/null)" = "$PID" ] || fail "port $PORT not owned by pid $PID"
curl -sf "$URL/format/json" | grep -q '<title>JSON Formatter' || fail "$URL/format/json lacks the route's <title>"
[ "$(git rev-parse --short HEAD)" = "$COMMIT" ] || echo "WARN HEAD moved since up.sh ($COMMIT -> $(git rev-parse --short HEAD))"
[ -z "$(find src scripts index.html -newer dist/index.html -type f 2>/dev/null | head -1)" ] \
  || echo "WARN source newer than dist/: rerun up.sh without SKIP_BUILD"
[ "$ok" = 1 ] || exit 1
echo "OK $URL pid=$PID commit=$COMMIT dirty_files_at_up=$DIRTY"
