#!/bin/sh
# Sinh khối /api trước khi nginx khởi động.
#
# App bật demo mode sẵn nên không cần backend để chạy. Khi nào có gateway thật
# thì đặt API_UPSTREAM (ví dụ http://guardian-gateway) là nginx proxy sang.
# Không đặt thì trả 502 kèm lý do — rõ ràng hơn là để try_files nuốt request
# rồi trả index.html cho một lời gọi JSON.
set -e

if [ -n "${API_UPSTREAM:-}" ]; then
  echo "[entrypoint] /api -> ${API_UPSTREAM}"
  cat > /tmp/nginx-api.conf <<CONF
location /api/ {
  proxy_pass ${API_UPSTREAM};
  proxy_http_version 1.1;
  proxy_set_header Host              \$host;
  proxy_set_header X-Real-IP         \$remote_addr;
  proxy_set_header X-Forwarded-For   \$proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto \$scheme;

  # Chat dùng SSE: phải tắt buffer, nếu không token bị giữ lại đến hết response
  # và hiệu ứng streaming biến mất.
  proxy_buffering off;
  proxy_cache off;
  proxy_read_timeout 300s;
}
CONF
else
  echo "[entrypoint] API_UPSTREAM chua dat — /api tra 502, app chay bang demo mode"
  cat > /tmp/nginx-api.conf <<'CONF'
location /api/ {
  default_type application/json;
  return 502 '{"error":"API_UPSTREAM chua duoc cau hinh tren deployment"}';
}
CONF
fi

exec "$@"
