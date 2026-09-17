import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { CalendarClock, Percent } from 'lucide-react'
import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, XAxis, YAxis } from 'recharts'
import { Skeleton } from '@/components/ui/skeleton'
import { MobileFrame } from '@/shell/MobileFrame'
import { MobileHeader } from '@/shell/MobileHeader'
import { getInvestRates } from '@/lib/api'
import type { InvestRates, RateRow } from '@/data/types'

/** Màu cột theo sản phẩm — sản phẩm nào cũng giữ đúng một màu ở mọi kỳ hạn. */
const PRODUCT_COLORS = ['var(--msb-primary)', '#2E7CF6', '#22A06B', '#8A5CF6', '#64748B']

/** "Tiết kiệm Măng Non 6 tháng" → "Măng Non 6 tháng" — đủ ngắn cho cột bảng và trục biểu đồ. */
function shortName(name: string): string {
  return name.replace(/^Tiết kiệm /, '').replace(/^Tài khoản /, '')
}

/** "2026-09-01" → "01/09/2026" */
function formatAsOf(asOf: string): string {
  const [y, m, d] = asOf.split('-')
  return y && m && d ? `${d}/${m}/${y}` : asOf
}

/** "5.5" → "5,5%" theo cách viết số Việt Nam */
function pct(rate: number): string {
  return `${rate.toFixed(1).replace('.', ',')}%`
}

/**
 * Biểu đồ cột ngang so sánh lãi suất các sản phẩm ở CÙNG một kỳ hạn. Cột ngang
 * thay vì cột đứng vì tên sản phẩm tiếng Việt dài — nằm ngang đọc được trọn tên.
 */
function CompareChart({ row, products }: { row: RateRow; products: InvestRates['products'] }) {
  const data = row.rates.map((cell) => {
    const idx = products.findIndex((p) => p.id === cell.productId)
    return {
      name: shortName(products[idx]?.name ?? `Sản phẩm ${cell.productId}`),
      rate: cell.ratePct,
      color: PRODUCT_COLORS[Math.max(idx, 0) % PRODUCT_COLORS.length],
    }
  })
  const max = Math.max(...data.map((d) => d.rate))

  return (
    <ResponsiveContainer width="100%" height={data.length * 52 + 8}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 44, bottom: 0, left: 0 }}>
        <XAxis type="number" domain={[0, Math.ceil(max + 1)]} hide />
        <YAxis
          type="category"
          dataKey="name"
          width={128}
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11, fill: 'var(--msb-text)' }}
        />
        <Bar dataKey="rate" radius={[0, 6, 6, 0]} barSize={22} isAnimationActive={false}>
          {data.map((d) => (
            <Cell key={d.name} fill={d.color} />
          ))}
          <LabelList dataKey="rate" position="right" formatter={(v) => (typeof v === 'number' ? pct(v) : v)} style={{ fontSize: 12, fontWeight: 700, fill: 'var(--msb-text)' }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

/**
 * Biểu lãi suất sản phẩm tiết kiệm — dữ liệu THẬT từ /api/invest/rates
 * (product × interest_rate × interest_rate_term, đợt hiệu lực mới nhất).
 * Vào từ Khám phá sản phẩm → lối tắt "Biểu lãi suất" của trợ lý đầu tư.
 */
export function InvestRatesPage() {
  const { data, isPending, isError } = useQuery({ queryKey: ['invest-rates'], queryFn: getInvestRates })
  const [termCode, setTermCode] = useState<string | null>(null)

  // Kỳ hạn được so sánh mặc định: 12 tháng nếu có, không thì kỳ hạn đông sản
  // phẩm nhất — chip chỉ hiện kỳ hạn có >= 2 sản phẩm (1 cột thì không gọi là so sánh).
  const compareRows = useMemo(() => (data?.rows ?? []).filter((r) => r.rates.length >= 2), [data])
  const selectedRow = useMemo(() => {
    if (compareRows.length === 0) return null
    return (
      compareRows.find((r) => r.term.code === termCode) ??
      compareRows.find((r) => r.term.code === 'T12') ??
      [...compareRows].sort((a, b) => b.rates.length - a.rates.length)[0]
    )
  }, [compareRows, termCode])

  return (
    <MobileFrame statusBar="dark">
      <MobileHeader title="Biểu lãi suất" backTo="/invest" />

      <div className="no-scrollbar flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 pb-6 pt-2">
        {isPending && (
          <>
            <Skeleton className="h-12 w-full rounded-card" />
            <Skeleton className="h-56 w-full rounded-card" />
            <Skeleton className="h-64 w-full rounded-card" />
          </>
        )}

        {isError && (
          <div className="rounded-card bg-surface p-4 text-center text-[14px] text-muted shadow-card">
            Chưa tải được biểu lãi suất. Kéo xuống để thử lại hoặc quay lại sau.
          </div>
        )}

        {data && (
          <>
            <div className="flex items-start gap-2 rounded-card bg-orange-soft px-4 py-3 text-[13px] leading-[18px] text-ink">
              <CalendarClock size={18} strokeWidth={1.8} className="mt-0.5 flex-none text-primary" />
              Lãi suất %/năm cho khách hàng cá nhân, áp dụng từ {formatAsOf(data.asOf)}. Lãi thực tế theo xác nhận tại thời điểm gửi.
            </div>

            {/* So sánh cùng kỳ hạn */}
            {selectedRow && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-3 rounded-card bg-surface p-4 shadow-card">
                <div className="flex items-center gap-2">
                  <Percent size={18} strokeWidth={1.8} className="flex-none text-primary" />
                  <span className="text-[16px] font-semibold text-ink">So sánh cùng kỳ hạn</span>
                </div>
                <div className="no-scrollbar flex gap-2 overflow-x-auto">
                  {compareRows.map((r) => {
                    const active = r.term.code === selectedRow.term.code
                    return (
                      <button
                        key={r.term.code}
                        type="button"
                        onClick={() => setTermCode(r.term.code)}
                        className={`flex-none cursor-pointer rounded-full px-3.5 py-1.5 text-[13px] font-medium ${
                          active ? 'bg-primary text-white' : 'bg-app text-ink'
                        }`}
                      >
                        {r.term.label}
                      </button>
                    )
                  })}
                </div>
                <CompareChart row={selectedRow} products={data.products} />
              </motion.div>
            )}

            {/* Biểu lãi suất chi tiết */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="flex flex-col gap-3 rounded-card bg-surface p-4 shadow-card">
              <span className="text-[16px] font-semibold text-ink">Biểu lãi suất chi tiết (%/năm)</span>
              <div className="no-scrollbar -mx-1 overflow-x-auto px-1">
                <table className="w-full min-w-[420px] border-collapse text-[12px]">
                  <thead>
                    <tr className="border-b border-line text-left text-muted">
                      <th className="py-2 pr-2 font-medium">Kỳ hạn</th>
                      {data.products.map((p, i) => (
                        <th key={p.id} className="px-2 py-2 text-right font-medium">
                          <span className="inline-flex items-center gap-1.5">
                            <span className="h-2 w-2 flex-none rounded-full" style={{ background: PRODUCT_COLORS[i % PRODUCT_COLORS.length] }} />
                            {shortName(p.name)}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.rows.map((row) => (
                      <tr key={row.term.code} className="border-b border-divider last:border-0">
                        <td className="py-2.5 pr-2 font-medium text-ink">{row.term.label}</td>
                        {data.products.map((p) => {
                          const cell = row.rates.find((c) => c.productId === p.id)
                          return (
                            <td key={p.id} className={`px-2 py-2.5 text-right ${cell ? 'font-semibold text-ink' : 'text-muted'}`}>
                              {cell ? pct(cell.ratePct) : '—'}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </>
        )}
      </div>
    </MobileFrame>
  )
}
