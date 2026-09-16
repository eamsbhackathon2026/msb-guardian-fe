import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowUpRight, CalendarClock, QrCode, Search, UserRoundPlus, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
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
}

/** Danh bạ thụ hưởng demo — theo ben.jpg */
export const favoriteBeneficiaries: Beneficiary[] = [
  { id: 'b1', name: 'LongNV Hạ Tầng', bank: 'MSB', account: '0982541740' },
  { id: 'b2', name: 'LongPD MSB', bank: 'MSB', account: '03301011939831' },
  { id: 'b3', name: 'MSB Thái', bank: 'MSB', account: '03101016725958' },
  { id: 'b4', name: 'My Account', bank: 'Techcombank', account: '19025711047011' },
]

const otherBeneficiaries: { letter: string; items: Beneficiary[] }[] = [
  { letter: 'D', items: [{ id: 'b5', name: 'Do Van Duc', bank: 'MSB', account: '0362554873' }] },
]

const recentBeneficiaries: Beneficiary[] = [favoriteBeneficiaries[0], favoriteBeneficiaries[3]]

/** Logo ngân hàng của người thụ hưởng */
function BankAvatar({ bank }: { bank: string }) {
  if (bank === 'MSB') {
    return (
      <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full border border-line bg-surface">
        <img src="/assets/icon-logo-msb.png" alt="MSB" className="h-4 w-auto" />
      </span>
    )
  }
  return (
    <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-[#fdecec] text-[10px] font-bold text-[#e11b22]">
      TCB
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

  const q = query.trim().toLowerCase()
  const matches = (b: Beneficiary) => !q || b.name.toLowerCase().includes(q) || b.account.includes(q) || b.bank.toLowerCase().includes(q)
  const favorites = favoriteBeneficiaries.filter(matches)
  const others = otherBeneficiaries.map((g) => ({ ...g, items: g.items.filter(matches) })).filter((g) => g.items.length > 0)
  const recents = recentBeneficiaries.filter(matches)

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
          <button type="button" className="flex cursor-pointer flex-col items-center gap-2 px-3 text-primary">
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
              {favorites.length > 0 && (
                <>
                  <span className="bg-app px-4 py-2 text-[13px] font-semibold text-muted">Yêu thích</span>
                  <div className="flex flex-col px-2">
                    {favorites.map((b) => (
                      <BeneficiaryRow key={b.id} b={b} onClick={() => pick(b)} />
                    ))}
                  </div>
                </>
              )}
              {others.map((g) => (
                <div key={g.letter} className="flex flex-col">
                  <span className="bg-app px-4 py-2 text-[13px] font-semibold text-muted">{g.letter}</span>
                  <div className="flex flex-col px-2">
                    {g.items.map((b) => (
                      <BeneficiaryRow key={b.id} b={b} onClick={() => pick(b)} />
                    ))}
                  </div>
                </div>
              ))}
              {favorites.length === 0 && others.length === 0 && (
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
