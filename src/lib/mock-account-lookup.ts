/*
 * GIẢ LẬP tra cứu tên chủ tài khoản (giống Napas 247 inquiry) cho màn "Chuyển
 * tới số tài khoản". Backend chưa có endpoint này nên FE tự trả tên sau một
 * nhịp trễ ngắn để demo giống thật.
 *
 * Tên trả về là TẤT ĐỊNH theo (mã ngân hàng + số tài khoản): cùng một số nhập
 * lại luôn ra cùng một tên, để kịch bản demo lặp lại được. Một vài số tài khoản
 * trong demo-scenarios được ghim đúng tên chủ để khớp với dữ liệu bên Ops.
 */

/** Các stk xuất hiện trong kịch bản demo — ghim tên khớp với demo-scenarios.ts */
const PINNED_ACCOUNTS: Record<string, string> = {
  '1902664130': 'NGUYEN HUU PHUC',
  '0071220954': 'DO THI KIM NGAN',
  '8833107462': 'LUU DINH TRONG',
  '2210458771': 'HOANG MINH TUAN',
  '5504913286': 'PHAN VAN DUC',
  '0899552617': 'TRAN QUOC BAO',
}

const LAST_NAMES = ['NGUYEN', 'TRAN', 'LE', 'PHAM', 'HOANG', 'VU', 'DANG', 'BUI', 'DO', 'NGO']
const MIDDLE_NAMES = ['VAN', 'THI', 'MINH', 'QUOC', 'THANH', 'DUC', 'NGOC', 'HONG', 'XUAN', 'HUU']
const FIRST_NAMES = ['ANH', 'BINH', 'CHAU', 'DUNG', 'HA', 'HUNG', 'LAN', 'LINH', 'NAM', 'PHUONG', 'QUAN', 'SON', 'THAO', 'TRANG', 'TUAN', 'YEN']

/** Băm chuỗi đơn giản (djb2) — đủ để phân bố tên đều, không cần mật mã. */
function hash(input: string): number {
  let h = 5381
  for (let i = 0; i < input.length; i++) h = (h * 33) ^ input.charCodeAt(i)
  return h >>> 0
}

/**
 * Trả tên chủ tài khoản sau ~700ms như một cuộc gọi mạng thật.
 * `account` nhận cả chuỗi có khoảng trắng — tự chuẩn hoá trước khi băm.
 */
export function lookupAccountHolder(bankCode: string, account: string): Promise<string> {
  const acc = account.replace(/\D/g, '')
  const pinned = PINNED_ACCOUNTS[acc]
  const h = hash(`${bankCode}:${acc}`)
  const name =
    pinned ??
    `${LAST_NAMES[h % LAST_NAMES.length]} ${MIDDLE_NAMES[(h >> 4) % MIDDLE_NAMES.length]} ${FIRST_NAMES[(h >> 8) % FIRST_NAMES.length]}`
  return new Promise((resolve) => setTimeout(() => resolve(name), 700))
}
