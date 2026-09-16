# MSB AI Financial Guardian — Web Demo

Web app demo cho hackathon nội bộ MSB: **Financial Copilot** (quản lý tiền) + **Scam Shield** (bảo vệ tiền), kèm **Ops Dashboard** vận hành nội bộ.

## Chạy

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # build production
npm run preview  # chạy bản build
```

> Yêu cầu Node ≥ 20.19 (đã pin Vite 6 để chạy được trên Node 22.11).

## Routes

| Route | Màn hình | Khung |
|---|---|---|
| `/login` | Đăng nhập (nền chiến dịch, card kính mờ, nút gold) | Điện thoại |
| `/` | Home Mobile Banking (M-FIRST GOLD, bot AI nổi, pill nav) | Điện thoại |
| `/copilot` | Financial Copilot — Tổng quan | Điện thoại |
| `/copilot/chat` | Chat với AI (streaming + mini-chart) | Điện thoại |
| `/transfer/review` | Scam Shield — Cảnh báo chặn giao dịch ⭐ | Điện thoại |
| `/transfer/review/why` | Giải thích rủi ro (explainability) | Điện thoại |
| `/safety-center` | Trung tâm an toàn | Điện thoại |
| `/ops` | Ops Dashboard — Giám sát Scam Shield | Desktop |
| `/ops/alerts/ALT-4092` | Chi tiết case | Desktop |

**Đăng nhập/đăng xuất:** các màn khách hàng yêu cầu đăng nhập — chưa có phiên sẽ tự chuyển về `/login`; phiên giữ qua reload (localStorage); Đăng xuất nằm trong pill nav **Cài đặt** trên Home. Riêng `/ops` là màn nội bộ, không qua đăng nhập khách hàng.

**Luồng demo chính:** `/login` → "Đăng nhập" → Home → bấm "Chuyển tiền" → màn phân tích ~2s → Cảnh báo 87/100 → "Vì sao chúng tôi cảnh báo?" → quay lại → "Huỷ giao dịch" → màn đã bảo vệ → Trung tâm an toàn. Bot AI nổi trên Home dẫn sang Financial Copilot. Sau đó mở `/ops` cho phần vận hành.

## Demo mode

- Mặc định **BẬT** — mọi dữ liệu từ `src/data/demo-scenarios.ts`, độ trễ giả lập 300–900ms, chat phát lại kiểu streaming ~25ms/token.
- `?demo=0` — gọi FastAPI thật tại `localhost:8000` (proxy `/api` trong `vite.config.ts`). Backend lỗi/timeout 6s → tự fallback demo, không hiện lỗi.
- `?debug=1` — hiện chỉ báo nhỏ LIVE/DEMO góc màn hình.

## Quy ước

- **Màu**: chỉ khai báo trong `src/design/tokens.css` — không hardcode hex trong component.
- **Số liệu**: chỉ khai báo trong `src/data/demo-scenarios.ts` — mọi màn đọc từ đây để nhất quán tuyệt đối (Nguyễn Minh Anh · **** 4821 · 47.820.000 ₫ · risk 87 · 85.000.000 ₫).
- **Format**: qua `src/lib/format.ts` (`formatVnd`, `formatDate`…), không format tay.
- Font Be Vietnam Pro self-host qua `@fontsource` — chạy offline hoàn toàn, không request internet.

## Cấu trúc

```
src/
  app/        router, providers
  design/     tokens.css (nguồn màu duy nhất)
  shell/      MobileFrame, BottomNav, MobileHeader, DesktopShell
  features/   home/ copilot/ scamshield/ ops/
  data/       types.ts, demo-scenarios.ts (nguồn số liệu duy nhất)
  lib/        api.ts, demo-mode.ts, format.ts, store.ts
  components/ ui primitives + shared
design-ref/   export từ Claude Design để đối chiếu
```

## Triển khai

Image là nginx phục vụ thư mục `dist` đã build sẵn — không có Node lúc chạy.

```bash
docker build -t msb-guardian-fe:local .
docker run --rm -p 8080:8080 msb-guardian-fe:local   # http://localhost:8080
```

| Đường dẫn | Hành vi |
|---|---|
| `/healthz` | Trả `ok`, dùng cho probe Kubernetes — không chạm backend |
| `/assets/*` | Cache 1 năm (`immutable`), vì tên file đã có hash |
| `/index.html` | `no-cache`, để lần deploy sau không bị trình duyệt giữ bản cũ |
| mọi route khác | Trả `index.html` cho react-router xử lý |
| `/api/*` | Proxy sang `API_UPSTREAM`; chưa đặt biến này thì trả 502 kèm lý do |

**`VITE_DEMO_MODE` là quyết định lúc build, không phải lúc chạy.** Vite thay
`import.meta.env.*` bằng hằng số ngay khi build, nên muốn tắt demo mode phải
build lại image với `--build-arg VITE_DEMO_MODE=false`. Mặc định để bật: app
chạy đủ luồng demo mà không cần backend nào.

**`API_UPSTREAM` thì ngược lại — đọc lúc container khởi động.** Khi đã có
gateway phục vụ `/api/copilot`, `/api/risk`, `/api/ops`, bỏ comment khối `env`
trong `k8s/msb-guardian-fe.yaml` và trỏ tới nó.

### Kubernetes

`k8s/msb-guardian-fe.yaml` tạo Deployment + Service `ClusterIP` trong namespace
`finance-demo`, cùng chỗ với 5 service backend. Không mở ra Internet — vào bằng:

```bash
kubectl -n finance-demo port-forward svc/msb-guardian-fe 8080:80
```

### CI/CD

`.github/workflows/msb-guardian-fe.yml` chạy khi push vào `main` (trừ `README.md`
và `design-ref/`), hoặc bấm tay qua *Run workflow*:

| Job | Nội dung |
|---|---|
| `test` | `npm ci`, `npm run build` (gồm `tsc`), kiểm tra `dist` có sản phẩm thật |
| `build-and-push` | Build image, push vCR với tag commit SHA và `latest` |
| `deploy` | Tạo imagePullSecret, apply manifest ghim theo commit SHA, chờ rollout |

Ba secret cần có trong repo: `VCR_USERNAME`, `VCR_PASSWORD`, `KUBE_CONFIG`
(kubeconfig đã base64). Không giá trị nào được commit.
