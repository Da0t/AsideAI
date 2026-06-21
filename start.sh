#!/usr/bin/env bash
#
# Start the whole thing with one command: the laptop backend + the Aside phone app.
#
#   ./start.sh                 # webcam + phone, narrates continuously
#   ./start.sh --mic           # also listen to the mic (ambient audio)
#   ./start.sh --mic --play    # also speak out loud on the laptop
#
# Any extra args are passed through to `python -m backend.main --serve`.
# Scan the Expo QR with Expo Go on a phone joined to the SAME Wi-Fi.
#
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

# --- detect this laptop's LAN IP (macOS Wi-Fi en0, then en1; Linux fallback) ---
IP="$(ipconfig getifaddr en0 2>/dev/null \
   || ipconfig getifaddr en1 2>/dev/null \
   || hostname -I 2>/dev/null | awk '{print $1}' \
   || echo localhost)"
[ -z "$IP" ] && IP="localhost"

WS_PORT="${PHONE_WS_PORT:-8780}"
export EXPO_PUBLIC_BACKEND_WS="ws://${IP}:${WS_PORT}"

echo "──────────────────────────────────────────────────────────"
echo "  Aside — starting backend + app"
echo "  Laptop IP : ${IP}"
echo "  Phone WS  : ${EXPO_PUBLIC_BACKEND_WS}"
echo "  Backend   : python -m backend.main --serve $*"
echo "  Logs      : backend.log   (tail -f backend.log to watch narration)"
echo "──────────────────────────────────────────────────────────"
if [ "$IP" = "localhost" ]; then
  echo "  ⚠  No LAN IP found — a physical phone won't reach the backend."
  echo "     Turn on Wi-Fi, or use the iOS simulator."
fi

# --- start the backend (laptop orchestrator) in the background ---
# Logs go to a file so they don't scribble over Expo's QR/Metro UI.
python -m backend.main --serve "$@" > backend.log 2>&1 &
BACKEND_PID=$!

cleanup() {
  echo
  echo "stopping backend (pid ${BACKEND_PID})…"
  kill "$BACKEND_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

# give the backend a moment; if it died immediately, surface why
sleep 2
if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
  echo "✗ backend exited on startup — last lines of backend.log:"
  tail -n 20 backend.log
  exit 1
fi
echo "✓ backend running (pid ${BACKEND_PID}). Starting the app…"
echo

# --- start the Expo app in the foreground (Ctrl-C stops everything) ---
cd frontend
exec npx expo start
