import { isDebugMode, isDemoMode } from '@/lib/demo-mode'

/** Chỉ báo nhỏ LIVE/DEMO — chỉ hiện khi có ?debug=1 */
export function DebugBadge() {
  if (!isDebugMode()) return null
  const demo = isDemoMode()
  return (
    <div className="fixed bottom-3 left-3 z-[100] rounded-full px-3 py-1 text-[11px] font-bold text-white shadow-float" style={{ background: demo ? 'var(--msb-warning)' : 'var(--msb-success)' }}>
      {demo ? 'DEMO' : 'LIVE'}
    </div>
  )
}
