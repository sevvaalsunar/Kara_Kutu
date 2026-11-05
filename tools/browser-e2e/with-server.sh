#!/usr/bin/env bash
# Uygulamayı başlatır, hazır olmasını bekler, verilen komutu çalıştırır, sunucuyu kapatır.
# Kullanım: tools/browser-e2e/with-server.sh node run.mjs [suite ...]
#   PROD=1 → üretim derlemesi (dist/, GitHub Pages ile aynı) Express ile sunulur.
set -u
HERE="$(cd "$(dirname "$0")" && pwd)"
APP="$HERE/../../app"
PORT="${PORT:-3000}"
if curl -s -o /dev/null "http://localhost:$PORT/"; then
  echo "Port $PORT zaten kullanımda; eski bir sunucuya karşı test koşturulmaz. Önce onu kapatın."
  exit 2
fi
cd "$APP"
if [ "${PROD:-0}" = "1" ]; then
  npm run build > /tmp/kara-kutu-build.log 2>&1 || { echo "Derleme başarısız"; cat /tmp/kara-kutu-build.log; exit 2; }
  PORT=$PORT NODE_ENV=production setsid npx tsx server.ts > /tmp/kara-kutu-server.log 2>&1 < /dev/null &
else
  PORT=$PORT setsid npm run dev > /tmp/kara-kutu-server.log 2>&1 < /dev/null &
fi
SRV=$!   # setsid sayesinde bu PID aynı zamanda yeni süreç grubunun kimliğidir
cd "$HERE"
stop() { kill -- -"$SRV" 2>/dev/null; sleep 0.5; kill -9 -- -"$SRV" 2>/dev/null; }
trap stop EXIT
for i in $(seq 1 60); do
  curl -sf "http://localhost:$PORT/model/config.json" > /dev/null && break
  sleep 1
done
if ! curl -sf "http://localhost:$PORT/" > /dev/null; then echo "Sunucu başlamadı"; cat /tmp/kara-kutu-server.log; exit 2; fi
"$@"
