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
