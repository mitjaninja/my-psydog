#!/usr/bin/env bash
# Установка «Пушка» на чистый VPS с Ubuntu 22.04/24.04 (РФ).
# Запуск из корня репозитория:  sudo bash deploy/install.sh
# Повторный запуск безопасен: существующий .env не перезаписывается.
set -euo pipefail

cd "$(dirname "$0")/.."
say() { printf '\n\033[1m==> %s\033[0m\n' "$*"; }
warn() { printf '\033[33m[!] %s\033[0m\n' "$*"; }

[ "$(id -u)" -eq 0 ] || { echo "Запусти через sudo: sudo bash deploy/install.sh"; exit 1; }

say "Пакеты: Docker из репозитория Ubuntu (download.docker.com из РФ может быть недоступен)"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq docker.io docker-compose-v2 git curl openssl ufw >/dev/null
systemctl enable --now docker >/dev/null

say "Зеркало Docker Hub (из РФ Docker Hub отвечает нестабильно)"
MIRROR="${DOCKER_MIRROR:-https://mirror.gcr.io}"
if [ ! -f /etc/docker/daemon.json ]; then
  printf '{ "registry-mirrors": ["%s"] }\n' "$MIRROR" > /etc/docker/daemon.json
  systemctl restart docker
  echo "registry-mirrors: $MIRROR"
else
  echo "/etc/docker/daemon.json уже есть — не трогаю"
fi

say "Swap 2 ГБ, если памяти меньше 3 ГБ (сборка web требует памяти)"
mem_mb=$(awk '/MemTotal/ {print int($2/1024)}' /proc/meminfo)
if [ "$mem_mb" -lt 3000 ] && ! swapon --show | grep -q /swapfile; then
  fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile >/dev/null && swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
  echo "swap включён"
else
  echo "памяти ${mem_mb} МБ — swap не нужен или уже есть"
fi

say "Файрвол: открыты только SSH, 80 и 443"
ufw allow OpenSSH >/dev/null && ufw allow 80/tcp >/dev/null && ufw allow 443 >/dev/null
ufw --force enable >/dev/null && ufw status | head -5

say "Связь с Telegram и Let's Encrypt"
curl -s -m 10 -o /dev/null https://api.telegram.org && echo "api.telegram.org — доступен" \
  || warn "api.telegram.org недоступен с этого сервера: бот и уведомления работать не будут"
curl -s -m 10 -o /dev/null https://acme-v02.api.letsencrypt.org/directory && echo "Let's Encrypt — доступен" \
  || warn "Let's Encrypt недоступен: HTTPS-сертификат не выпустится"

say "Настройки (.env)"
if [ -f .env ]; then
  echo ".env уже есть — оставляю как есть"
else
  read -rp "Домен Mini App (например app.example.ru): " DOMAIN
  read -rp "Username бота без @ [pushok_care_bot]: " BOT_USERNAME
  BOT_USERNAME=${BOT_USERNAME:-pushok_care_bot}
  read -rsp "Токен бота от @BotFather (ввод скрыт): " BOT_TOKEN; echo
  [ -n "$DOMAIN" ] && [ -n "$BOT_TOKEN" ] || { echo "Домен и токен обязательны"; exit 1; }
  umask 077
  cat > .env <<ENV
NODE_ENV=production
DOMAIN=$DOMAIN
WEBAPP_URL=https://$DOMAIN
BOT_TOKEN=$BOT_TOKEN
BOT_USERNAME=$BOT_USERNAME
POSTGRES_PASSWORD=$(openssl rand -hex 24)
# Ключ шифрования заметок: НЕ терять и НЕ менять, иначе старые заметки не расшифровать
NOTES_ENCRYPTION_KEY=$(openssl rand -base64 32)
ENV
  echo ".env создан (права 600). Сохрани копию NOTES_ENCRYPTION_KEY в надёжном месте."
fi

DOMAIN=$(grep '^DOMAIN=' .env | cut -d= -f2)
ip=$(curl -s -m 10 https://ifconfig.me || true)
resolved=$(getent hosts "$DOMAIN" | awk '{print $1}' | head -1 || true)
if [ -n "$ip" ] && [ "$resolved" != "$ip" ]; then
  warn "$DOMAIN указывает на '${resolved:-ничего}', а IP сервера — $ip. Проверь A-запись, иначе сертификат не выпустится."
fi

say "Сборка и запуск (первый раз — несколько минут)"
docker compose up -d --build

say "Проверка"
for i in $(seq 1 60); do
  if curl -sf -m 5 "https://$DOMAIN/api/health" >/dev/null; then
    echo "https://$DOMAIN/api/health — ok"
    echo
    echo "Готово. Осталось в @BotFather: /myapps → бот → Edit Web App URL → https://$DOMAIN"
    exit 0
  fi
  sleep 5
done
warn "За 5 минут https://$DOMAIN/api/health не ответил. Логи: docker compose logs --tail=100 api caddy"
exit 1
