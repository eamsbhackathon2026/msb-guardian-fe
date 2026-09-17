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

const LAST_NAMES = ['NGUYEN', 'TRAN', 'LE', 'PHAM', 'HOANG', 'VU', 'DANG', 'BUI', 'DO', 'NGO', 'DINH', 'TRINH']
// Đệm + tên tách theo giới để không sinh combo lệch kiểu "NGUYEN THI HUNG"
const MALE_MIDDLE = ['VAN', 'DUC', 'MINH', 'QUOC', 'HUU', 'THANH', 'XUAN', 'CONG', 'TUAN', 'DINH']
const MALE_FIRST = ['ANH', 'BINH', 'CUONG', 'DAT', 'DUNG', 'HAI', 'HIEU', 'HUNG', 'KHOA', 'LONG', 'NAM', 'PHONG', 'QUAN', 'SON', 'THANG', 'TRUNG', 'TUAN', 'VIET']
const FEMALE_MIDDLE = ['THI', 'NGOC', 'THU', 'HONG', 'PHUONG', 'THUY', 'KIM', 'MY']
const FEMALE_FIRST = ['ANH', 'CHAU', 'CHI', 'DUNG', 'HA', 'HANH', 'HUE', 'HUONG', 'LAN', 'LINH', 'MAI', 'NGA', 'NHUNG', 'OANH', 'PHUONG', 'THAO', 'TRANG', 'TRINH', 'YEN']

/** Băm chuỗi đơn giản (djb2) — đủ để phân bố tên đều, không cần mật mã. */
function hash(input: string): number {
  let h = 5381
  for (let i = 0; i < input.length; i++) h = (h * 33) ^ input.charCodeAt(i)
  return h >>> 0
}

/**
 * Trả tên chủ tài khoản sau ~700ms như một cuộc gọi mạng thật.
 * `account` nhận cả chuỗi có khoảng trắng — tự chuẩn hoá trước khi băm.
 *
 * LƯU Ý dùng dịch bit KHÔNG DẤU (>>>) khi lấy chỉ số: hash là số 32-bit, dùng
 * `>>` với hash có bit cao bật sẽ ra số âm → chỉ số âm → phần tử undefined —
 * chính là lỗi tên hiện "undefined" trước đây.
 */
export function lookupAccountHolder(bankCode: string, account: string): Promise<string> {
  const acc = account.replace(/\D/g, '')
  const pinned = PINNED_ACCOUNTS[acc]
  const h = hash(`${bankCode}:${acc}`)
  const isMale = (h & 1) === 0
  const middles = isMale ? MALE_MIDDLE : FEMALE_MIDDLE
  const firsts = isMale ? MALE_FIRST : FEMALE_FIRST
  const name =
    pinned ??
    `${LAST_NAMES[(h >>> 2) % LAST_NAMES.length]} ${middles[(h >>> 8) % middles.length]} ${firsts[(h >>> 16) % firsts.length]}`
  return new Promise((resolve) => setTimeout(() => resolve(name), 700))
}
