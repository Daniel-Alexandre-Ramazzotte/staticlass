#!/usr/bin/env bash
# Rotina para abrir o Staticlass (backend + web + mobile) para outras
# pessoas: rede local e, opcionalmente, internet via Tailscale Funnel.
#
# Um único ponto de entrada (porta 8888) decide pelo User-Agent se quem
# acessa vai para o app web (app/web, Vite) ou para o app mobile
# (app/frontend, Expo web).
#
# Uso:
#   scripts/lan-dev.sh start   # sobe tudo (padrão)
#   scripts/lan-dev.sh stop    # derruba tudo (router, funnel, dev servers)
#   scripts/lan-dev.sh status  # mostra o que está no ar

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_DIR="/tmp/staticlass-lan-dev"
mkdir -p "$LOG_DIR"

ROUTER_PORT=8888
WEB_PORT=5173
MOBILE_PORT=8081
ROUTER_CONTAINER=staticlass-lan-router

lan_ip() {
  ip -4 -o addr show scope global 2>/dev/null \
    | grep -vE 'tailscale|docker|br-' \
    | awk '{print $4}' | cut -d/ -f1 | head -1
}

kill_port() {
  fuser -k "$1"/tcp >/dev/null 2>&1 || true
}

# Enquanto o link estiver aberto para outras pessoas, a máquina não pode
# dormir/suspender — senão o Funnel e os dev servers somem no meio do
# acesso de alguém. Mantido vivo por um processo "sleep infinity" com
# lock do systemd; morre junto com o `stop`.
start_sleep_inhibitor() {
  if [ -f "$LOG_DIR/inhibitor.pid" ] && kill -0 "$(cat "$LOG_DIR/inhibitor.pid")" 2>/dev/null; then
    return
  fi
  systemd-inhibit \
    --what=sleep:idle:handle-lid-switch \
    --who="staticlass-lan-dev" \
    --why="App aberto para outras pessoas (LAN + Tailscale Funnel)" \
    --mode=block \
    sleep infinity &
  echo $! > "$LOG_DIR/inhibitor.pid"
  disown
}

stop_sleep_inhibitor() {
  if [ -f "$LOG_DIR/inhibitor.pid" ]; then
    kill "$(cat "$LOG_DIR/inhibitor.pid")" 2>/dev/null || true
    rm -f "$LOG_DIR/inhibitor.pid"
  fi
}

start_all() {
  local ip
  ip="$(lan_ip)"
  if [ -z "$ip" ]; then
    echo "Não consegui detectar o IP da rede local." >&2
    exit 1
  fi

  echo "==> Backend + banco (docker compose)"
  (cd "$REPO_ROOT" && docker compose up -d db backend)

  echo "==> Web app (app/web, Vite) em :$WEB_PORT"
  kill_port "$WEB_PORT"
  (cd "$REPO_ROOT/app/web" \
    && nohup npm run dev > "$LOG_DIR/vite.log" 2>&1 &
   echo $! > "$LOG_DIR/vite.pid")

  echo "==> Mobile (app/frontend, Expo web, uso local do dev) em :$MOBILE_PORT"
  kill_port "$MOBILE_PORT"
  # /api/ relativo: o roteador nginx encaminha para o backend com a
  # mesma origem, então funciona tanto na LAN quanto pela URL pública
  # do Funnel, sem hardcodar IP.
  (cd "$REPO_ROOT/app/frontend" \
    && EXPO_PUBLIC_API_URL="/api/" nohup npx expo start --web > "$LOG_DIR/expo.log" 2>&1 &
   echo $! > "$LOG_DIR/expo.pid")

  echo "==> Mobile (build de produção para quem acessa de fora)"
  # O servidor de dev do Metro manda um bundle de ~18MB sem minificar —
  # inviável no upload de uma conexão doméstica atravessando o Tailscale
  # Funnel (demora minutos e qualquer requisição no meio parece travar).
  # Quem acessa de fora recebe este build estático e minificado em vez
  # do servidor de dev.
  (cd "$REPO_ROOT/app/frontend" \
    && EXPO_PUBLIC_API_URL="/api/" npx expo export --platform web > "$LOG_DIR/expo-export.log" 2>&1)

  echo "==> Roteador por User-Agent em :$ROUTER_PORT"
  docker rm -f "$ROUTER_CONTAINER" >/dev/null 2>&1 || true
  docker run -d \
    --name "$ROUTER_CONTAINER" \
    --network host \
    --restart unless-stopped \
    -v "$REPO_ROOT/scripts/lan-dev.nginx.conf:/etc/nginx/conf.d/default.conf:ro" \
    -v "$REPO_ROOT/app/frontend/dist:/var/www/mobile:ro" \
    nginx:alpine >/dev/null

  echo "==> Expondo à internet via Tailscale Funnel"
  tailscale funnel --bg --yes "$ROUTER_PORT" >/dev/null

  echo "==> Bloqueando sleep/suspend enquanto o link estiver aberto"
  start_sleep_inhibitor

  echo
  echo "Pronto (o app web ainda leva alguns segundos pra terminar de compilar na primeira vez)."
  echo
  echo "  Rede local:  http://$ip:$ROUTER_PORT"
  echo "  Internet:"
  tailscale funnel status 2>/dev/null | sed 's/^/    /'
  echo
  echo "Um único link para todo mundo — PC/notebook cai no app web (live,"
  echo "com hot reload), celular cai no build estático do mobile."
  echo "Detecção automática por User-Agent."
  echo
  echo "O mobile é uma foto do código no momento do 'start' — se você"
  echo "mudar algo em app/frontend, rode '$0 start' de novo pra atualizar"
  echo "o que quem está de fora vê."
  echo
  echo "Logs:   $LOG_DIR/vite.log , $LOG_DIR/expo.log , $LOG_DIR/expo-export.log"
  echo "Parar:  $0 stop"
}

stop_all() {
  echo "==> Liberando sleep/suspend"
  stop_sleep_inhibitor

  echo "==> Desligando Tailscale Funnel"
  tailscale funnel "$ROUTER_PORT" off >/dev/null 2>&1 || true

  echo "==> Removendo roteador"
  docker rm -f "$ROUTER_CONTAINER" >/dev/null 2>&1 || true

  echo "==> Parando dev servers"
  for name in vite expo; do
    if [ -f "$LOG_DIR/$name.pid" ]; then
      kill "$(cat "$LOG_DIR/$name.pid")" 2>/dev/null || true
      rm -f "$LOG_DIR/$name.pid"
    fi
  done
  kill_port "$WEB_PORT"
  kill_port "$MOBILE_PORT"

  echo "Tudo parado (backend/banco do docker compose continuam de pé)."
}

status_all() {
  echo "Bloqueio de sleep:"
  systemd-inhibit --list 2>/dev/null | grep -i staticlass-lan-dev | sed 's/^/  /' || echo "  (nenhum ativo)"
  echo "Router container:"
  docker ps --filter "name=$ROUTER_CONTAINER" --format '  {{.Names}} {{.Status}} {{.Ports}}' || true
  echo "Tailscale Funnel:"
  tailscale funnel status 2>/dev/null | sed 's/^/  /'
  echo "Portas locais:"
  ss -ltn 2>/dev/null | grep -E ":($WEB_PORT|$MOBILE_PORT|$ROUTER_PORT|5000)\b" | sed 's/^/  /'
}

case "${1:-start}" in
  start)  start_all ;;
  stop)   stop_all ;;
  status) status_all ;;
  *) echo "Uso: $0 [start|stop|status]" >&2; exit 1 ;;
esac
