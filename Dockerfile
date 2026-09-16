# --- Bước 1: build SPA ------------------------------------------------------
FROM node:22-alpine AS build

WORKDIR /app

# Cài dependency ở layer riêng: đổi code không phải cài lại toàn bộ.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Vite thay import.meta.env.* bằng hằng số ngay lúc build, nên VITE_DEMO_MODE
# là quyết định của build chứ không đọc được lúc chạy. Mặc định để demo mode
# bật — app tự chạy đủ mà không cần backend.
ARG VITE_DEMO_MODE=true
ENV VITE_DEMO_MODE=$VITE_DEMO_MODE

# Chạy luôn tsc (script build là "tsc && vite build") nên lỗi kiểu chặn được
# ngay ở đây thay vì lọt ra runtime.
RUN npm run build

# --- Bước 2: phục vụ static -------------------------------------------------
FROM nginx:1.27-alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY docker/nginx.conf    /etc/nginx/nginx.conf
COPY docker/default.conf  /etc/nginx/conf.d/default.conf
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Ảnh nginx có sẵn user 'nginx' (uid 101). Chạy bằng user thường thay vì root;
# mọi đường ghi đã trỏ về /tmp trong nginx.conf nên không cần thêm quyền nào.
USER nginx

EXPOSE 8080

ENTRYPOINT ["/entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
