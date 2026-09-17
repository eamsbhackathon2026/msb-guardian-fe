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
| `/ops/login` | Đăng nhập nội bộ Ops (tài khoản vận hành, không phải tài khoản khách) | Desktop |
| `/ops` | Ops Dashboard — Giám sát Scam Shield | Desktop |
| `/ops/alerts/ALT-4092` | Chi tiết case | Desktop |
| `/ops/cases` | Case vận hành — danh sách, lọc theo trạng thái | Desktop |
| `/ops/scenarios` | Kịch bản lừa đảo — playbook đang áp dụng | Desktop |
| `/ops/model` | Mô hình & ngưỡng — cấu hình engine, chỉ đọc | Desktop |
| `/ops/audit` | Nhật ký quyết định AI — mọi lượt gọi mô hình | Desktop |

Sáu mục trong sidebar Ops trỏ tới sáu màn thật; ô tìm kiếm trên thanh đầu trang
lọc ngay trên danh sách cảnh báo đã tải và nhảy thẳng tới case, còn "Xuất báo
cáo" tải về CSV đúng những dòng đang hiện (đã qua bộ lọc và ô tìm kiếm).

**Đăng nhập/đăng xuất (khách hàng):** các màn khách hàng yêu cầu đăng nhập — chưa có phiên sẽ tự chuyển về `/login`; phiên giữ qua reload (localStorage); Đăng xuất nằm trong pill nav **Cài đặt** trên Home.

**Đăng nhập/đăng xuất (Ops):** sáu màn `/ops`, `/ops/alerts/:id`, `/ops/cases`,
`/ops/scenarios`, `/ops/model`, `/ops/audit` yêu cầu phiên nội bộ riêng
(`src/lib/ops-auth.ts`, key localStorage `msb-guardian-ops-auth`) — **tách hẳn**
phiên khách hàng ở trên: đăng xuất bên khách không đá chuyên viên ra khỏi Ops và
ngược lại. Chưa đăng nhập thì tự chuyển về `/ops/login`, đăng nhập xong quay lại
đúng trang vừa định mở. Đăng xuất nằm cạnh tên chuyên viên ở chân sidebar Ops.

Đăng nhập Ops gọi `POST /api/ops/login`: gateway xác thực qua identity-service
rồi từ chối mọi tài khoản không có quyền vận hành (`ops.dashboard.read`), kể cả
đúng mật khẩu — tài khoản khách hàng không vào được `/ops`.

> **Giới hạn đã biết, không phải bug:** hệ thống hiện không có token phiên ở
> tầng API. Đăng nhập Ops chỉ chặn được người đi qua giao diện — ai biết thẳng
> URL `/api/ops/*` vẫn gọi được mà không cần đăng nhập trước. Sửa việc này cần
> thêm cơ chế xác thực request (token/session) ở gateway, nằm ngoài phạm vi bản
> demo này. Tương tự, dữ liệu hiện có chỉ phân biệt được một vai trò nội bộ
> (BACKOFFICE) nên không tách được analyst/manager/auditor — mọi tài khoản vận
> hành đăng nhập đều hiện cùng một nhãn vai trò "Fraud Ops".

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
