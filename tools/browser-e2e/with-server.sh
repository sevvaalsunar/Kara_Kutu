#!/usr/bin/env bash
# Uygulamayı (npm run dev) başlatır, hazır olmasını bekler, verilen komutu çalıştırır, sunucuyu kapatır.
# Kullanım: tools/browser-e2e/with-server.sh node run.mjs [suite ...]
set -u
HERE="$(cd "$(dirname "$0")" && pwd)"
APP="$HERE/../../app"
PORT="${PORT:-3000}"
cd "$APP" && PORT=$PORT setsid npm run dev > /tmp/kara-kutu-dev.log 2>&1 < /dev/null &
SRV=$!
cd "$HERE"
for i in $(seq 1 60); do
  curl -sf "http://localhost:$PORT/model/config.json" > /dev/null && break
  sleep 1
done
if ! curl -sf "http://localhost:$PORT/" > /dev/null; then echo "Sunucu başlamadı"; cat /tmp/kara-kutu-dev.log; kill -- -$SRV; exit 2; fi
"$@"
CODE=$?
kill -- -$SRV 2>/dev/null
wait $SRV 2>/dev/null
exit $CODE
