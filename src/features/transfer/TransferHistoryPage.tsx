import { useQuery } from '@tanstack/react-query'
import { ReceiptText } from 'lucide-react'
import { getTransferHistory } from '@/lib/api'
import { formatDateTime, formatVnd } from '@/lib/format'
import { useGuardianStore } from '@/lib/store'
import { MobileFrame } from '@/shell/MobileFrame'
import { MobileHeader } from '@/shell/MobileHeader'

/** Bảng lịch sử giao dịch chuyển tiền — đọc từ transaction_history (3 tháng
 *  gần nhất) qua gateway; gateway lỗi thì rơi về các giao dịch trong phiên. */
export function TransferHistoryPage() {
  const localTransactions = useGuardianStore((s) => s.transactions)
  const { data: serverTransactions } = useQuery({
    queryKey: ['transfer-history'],
    queryFn: getTransferHistory,
    // Giao dịch vừa thực hiện phải hiện ngay khi mở màn này
    staleTime: 0,
    refetchOnMount: 'always',
  })
  const transactions = serverTransactions && serverTransactions.length > 0 ? serverTransactions : localTransactions

  return (
    <MobileFrame statusBar="dark">
      <MobileHeader title="Lịch sử giao dịch" backTo="/" />
      <div className="no-scrollbar flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 pb-6 pt-2">
        {transactions.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-card bg-surface px-6 py-10 text-center shadow-card">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-soft text-primary">
              <ReceiptText size={26} strokeWidth={1.6} />
            </span>
            <span className="text-[15px] font-semibold">Chưa có giao dịch nào</span>
            <span className="text-[13px] leading-[18px] text-muted">Các lệnh chuyển tiền thành công sẽ hiện ở đây.</span>
          </div>
        ) : (
          <div className="flex flex-col rounded-card bg-surface shadow-card">
            {transactions.map((t, i) => (
              <div key={t.id} className={`flex items-start gap-3 px-4 py-3.5 ${i > 0 ? 'border-t border-divider' : ''}`}>
                <span className="mt-0.5 flex h-10 w-10 flex-none items-center justify-center rounded-full bg-orange-soft text-primary">
                  <ReceiptText size={19} strokeWidth={1.7} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-semibold leading-5 text-ink">{t.name}</span>
                  <span className="block text-[12px] leading-[17px] text-muted">
                    {t.bank} · {t.account}
                  </span>
                  {t.note && <span className="block truncate text-[12px] leading-[17px] text-muted">{t.note}</span>}
                  <span className="block text-[11px] leading-4 text-muted">{formatDateTime(t.datetime)}</span>
                </span>
                <span className="flex-none text-right text-[15px] font-bold text-danger">-{formatVnd(t.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </MobileFrame>
  )
}
