// MOCK CŨ: import { isDebugMode, isDemoMode } from '@/lib/demo-mode'
import { isDebugMode } from '@/lib/demo-mode'

/**
 * Chỉ báo nhỏ LIVE/DEMO — chỉ hiện khi có ?debug=1
 *
 * Từ khi mock chuyển sang backend, FE luôn gọi guardian-gateway nên badge luôn
 * là LIVE. Giữ lại vì nó vẫn cho biết trang đang chạy bản có debug bật.
 * Nhánh DEMO cũ:
 *   const demo = isDemoMode()
 *   ... demo ? 'DEMO' : 'LIVE'
 */
export function DebugBadge() {
  if (!isDebugMode()) return null
  return (
    <div
      className="fixed bottom-3 left-3 z-[100] rounded-full px-3 py-1 text-[11px] font-bold text-white shadow-float"
      style={{ background: 'var(--msb-success)' }}
    >
      LIVE
    </div>
  )
}
