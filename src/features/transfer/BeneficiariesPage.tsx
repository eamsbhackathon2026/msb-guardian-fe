import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowUpRight, CalendarClock, QrCode, Search, UserRoundPlus, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getTransferBeneficiaries } from '@/lib/api'
import { MobileFrame } from '@/shell/MobileFrame'
import { MobileHeader } from '@/shell/MobileHeader'

const blockVariants = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.35, ease: 'easeOut' as const } }),
}

export interface Beneficiary {
  id: string
  name: string
  bank: string
  account: string
  /** true → chuyển thẳng, không cần Scam Shield (stk quen, tin cậy). */
  trusted?: boolean
  /** Mã ngân hàng để gọi precheck (VCB/ACB/MSB…); mặc định dùng `bank`. */
  bankCode?: string
  /** Nhóm quan hệ: FAMILY | FRIEND | EMPLOYER | MERCHANT | SELF | UNKNOWN */
  relationship?: string
  /** true → hiện trong nhóm Yêu thích trên cùng (danh bạ hay chuyển nhất) */
  favorite?: boolean
}

/** Danh bạ thụ hưởng demo — theo ben.jpg */
export const favoriteBeneficiaries: Beneficiary[] = [
  { id: 'b1', name: 'LongNV Hạ Tầng', bank: 'MSB', account: '0982541740', trusted: true, relationship: 'FRIEND', favorite: true },
  { id: 'b2', name: 'LongPD MSB', bank: 'MSB', account: '03301011939831', trusted: true, relationship: 'FRIEND', favorite: true },
  { id: 'b3', name: 'MSB Thái', bank: 'MSB', account: '03101016725958', trusted: true, relationship: 'FRIEND', favorite: true },
  { id: 'b4', name: 'My Account', bank: 'Techcombank', account: '19025711047011', trusted: true, relationship: 'SELF', favorite: true },
  { id: 'b5', name: 'Do Van Duc', bank: 'MSB', account: '0362554873', trusted: false, relationship: 'UNKNOWN' },
]

/** Thứ tự và nhãn tiếng Việt của các nhóm trên màn danh bạ — Yêu thích trên cùng */
const RELATIONSHIP_GROUPS: { key: string; label: string }[] = [
  { key: 'FAVORITE', label: 'Yêu thích' },
  { key: 'FAMILY', label: 'Người thân' },
  { key: 'FRIEND', label: 'Bạn bè' },
  { key: 'EMPLOYER', label: 'Công việc' },
  { key: 'MERCHANT', label: 'Dịch vụ & cửa hàng' },
  { key: 'SELF', label: 'Tài khoản của tôi' },
  { key: 'UNKNOWN', label: 'Khác' },
]


/** Logo ngân hàng của người thụ hưởng */
function BankAvatar({ bank }: { bank: string }) {
  if (bank === 'MSB') {
    return (
      <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full border border-line bg-surface">
        <img src="/assets/icon-logo-msb.png" alt="MSB" className="h-4 w-auto" />
      </span>
    )
  }
  // Ngân hàng khác: hiện thẳng mã (TCB/VCB/ACB/MBB…) — mỗi bank chưa cần logo riêng
  return (
    <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-[#fdecec] text-[10px] font-bold text-[#e11b22]">
      {bank.slice(0, 4).toUpperCase()}
    </span>
  )
}

function BeneficiaryRow({ b, onClick }: { b: Beneficiary; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex cursor-pointer items-center gap-3 rounded-card px-2 py-3 text-left hover:bg-app">
      <BankAvatar bank={b.bank} />
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold leading-5 text-ink">{b.name}</span>
        <span className="block text-[13px] leading-[18px] text-muted">
          {b.bank} · {b.account}
        </span>
      </span>
    </button>
  )
}

/** Màn Chuyển tiền: danh sách người thụ hưởng — theo ben.jpg, tone sáng */
export function BeneficiariesPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<'saved' | 'recent'>('saved')
  const [query, setQuery] = useState('')
  // Danh bạ thật từ gateway (kèm trusted + relationship), GỘP với danh bạ demo
  // local — loại trùng theo số tài khoản — để liệt kê toàn bộ người thụ hưởng.
  const { data: apiList } = useQuery({ queryKey: ['transfer-beneficiaries'], queryFn: getTransferBeneficiaries })
  const fromApi: Beneficiary[] = (apiList ?? []).map((b) => ({
    id: b.id, name: b.name, bank: b.bank, account: b.account,
    trusted: b.trusted, bankCode: b.bank, relationship: b.relationship,
  }))
  const apiAccounts = new Set(fromApi.map((b) => b.account.replace(/\D/g, '')))
  const savedList: Beneficiary[] = [...fromApi, ...favoriteBeneficiaries.filter((b) => !apiAccounts.has(b.account.replace(/\D/g, '')))]

  const q = query.trim().toLowerCase()
  const matches = (b: Beneficiary) => !q || b.name.toLowerCase().includes(q) || b.account.includes(q) || b.bank.toLowerCase().includes(q)
  // Chia nhóm: Yêu thích trên cùng, rồi Người thân → Bạn bè → … → Khác. Người
  // đã nằm trong Yêu thích không lặp lại ở nhóm quan hệ; nhóm rỗng tự ẩn.
  const grouped = RELATIONSHIP_GROUPS.map((g) => ({
    ...g,
    items: savedList.filter(
      (b) => (g.key === 'FAVORITE' ? b.favorite === true : !b.favorite && (b.relationship ?? 'UNKNOWN') === g.key) && matches(b),
    ),
  })).filter((g) => g.items.length > 0)
  const recents = savedList.slice(0, 2).filter(matches)

  const pick = (b: Beneficiary) => navigate('/transfer/new', { state: { beneficiary: b } })

  return (
    <MobileFrame statusBar="dark">
      <MobileHeader
        title="Chuyển tiền"
        backTo="/"
        right={
          <button type="button" aria-label="Quét QR" className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-ink hover:bg-black/5">
            <QrCode size={22} strokeWidth={1.6} />
          </button>
        }
      />

      <div className="no-scrollbar flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 pb-6 pt-2">
        {/* Hai lối tắt chuyển tiền */}
        <motion.div custom={0} variants={blockVariants} initial="hidden" animate="show" className="grid grid-cols-2 rounded-card bg-surface py-3.5 shadow-card">
          <button type="button" onClick={() => navigate('/transfer/account')} className="flex cursor-pointer flex-col items-center gap-2 px-3 text-primary">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-orange-soft">
              <ArrowUpRight size={22} strokeWidth={1.7} />
            </span>
            <span className="text-center text-[13px] font-medium leading-[17px] text-ink">Tài khoản/Số thẻ</span>
          </button>
          <button type="button" className="flex cursor-pointer flex-col items-center gap-2 border-l border-divider px-3 text-primary">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-orange-soft">
              <CalendarClock size={22} strokeWidth={1.7} />
            </span>
            <span className="text-center text-[13px] font-medium leading-[17px] text-ink">Quản lý lệnh chuyển tiền</span>
          </button>
        </motion.div>

        {/* Danh bạ thụ hưởng */}
        <motion.div custom={1} variants={blockVariants} initial="hidden" animate="show" className="flex flex-col rounded-card bg-surface shadow-card">
          <div className="flex border-b border-divider">
            {(
              [
                { key: 'saved', label: 'Đã lưu' },
                { key: 'recent', label: 'Gần đây' },
              ] as const
            ).map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`relative flex-1 cursor-pointer py-3.5 text-center text-[15px] ${
                  tab === t.key ? 'font-semibold text-primary' : 'font-medium text-muted'
                }`}
              >
                {t.label}
                {tab === t.key && <span className="absolute inset-x-8 bottom-0 h-[3px] rounded-full bg-primary" />}
              </button>
            ))}
          </div>

          {/* Tìm kiếm + thêm người thụ hưởng */}
          <div className="flex items-center gap-3 p-4 pb-2">
            <label className="flex min-w-0 flex-1 items-center gap-2.5 rounded-full bg-app px-4 py-3 text-ink">
              <Search size={18} strokeWidth={1.7} className="flex-none text-muted" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tên, số tài khoản"
                className="w-full bg-transparent text-[15px] outline-none placeholder:text-muted"
              />
              {query && (
                <button type="button" aria-label="Xóa" onClick={() => setQuery('')} className="flex-none cursor-pointer text-muted">
                  <X size={16} strokeWidth={2} />
                </button>
              )}
            </label>
            <button type="button" aria-label="Thêm người thụ hưởng" className="flex h-10 w-10 flex-none cursor-pointer items-center justify-center rounded-full text-primary hover:bg-orange-soft">
              <UserRoundPlus size={22} strokeWidth={1.7} />
            </button>
          </div>

          {tab === 'saved' ? (
            <div className="flex flex-col pb-2">
              {grouped.map((g) => (
                <div key={g.key} className="flex flex-col">
                  <span className="flex items-baseline justify-between bg-app px-4 py-2 text-[13px] font-semibold text-muted">
                    {g.label}
                    <span className="text-[11px] font-medium">{g.items.length}</span>
                  </span>
                  <div className="flex flex-col px-2">
                    {g.items.map((b) => (
                      <BeneficiaryRow key={b.id} b={b} onClick={() => pick(b)} />
                    ))}
                  </div>
                </div>
              ))}
              {grouped.length === 0 && (
                <span className="py-6 text-center text-[13px] text-muted">Không tìm thấy người thụ hưởng</span>
              )}
            </div>
          ) : (
            <div className="flex flex-col px-2 pb-2">
              {recents.length === 0 && <span className="py-6 text-center text-[13px] text-muted">Chưa có giao dịch gần đây</span>}
              {recents.map((b) => (
                <BeneficiaryRow key={b.id} b={b} onClick={() => pick(b)} />
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </MobileFrame>
  )
}
