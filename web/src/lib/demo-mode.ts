/*
 * Lớp bọc mọi lời gọi backend.
 * - DEMO_MODE đọc từ env (VITE_DEMO_MODE), bật/tắt runtime qua ?demo=1 / ?demo=0
 * - Khi BẬT: trả dữ liệu demo với độ trễ giả lập 300–900ms
 * - Khi TẮT: gọi FastAPI thật; lỗi hoặc timeout > 6s thì TỰ ĐỘNG fallback demo
 * Cả hai nhánh trả về cùng kiểu dữ liệu — component không cần biết đang ở chế độ nào.
 */

const LIVE_TIMEOUT_MS = 6_000

function readQueryFlag(name: string): boolean | null {
  if (typeof window === 'undefined') return null
  const value = new URLSearchParams(window.location.search).get(name)
  if (value === null) return null
  return value === '1' || value === 'true'
}

const envDefault = import.meta.env.VITE_DEMO_MODE !== 'false' // mặc định BẬT cho demo hackathon

export function isDemoMode(): boolean {
  return readQueryFlag('demo') ?? envDefault
}

export function isDebugMode(): boolean {
  return readQueryFlag('debug') === true
}

function randomBetween(min: number, max: number): number {
  return Math.round(min + Math.random() * (max - min))
}

export function demoDelay(minMs = 300, maxMs = 900): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, randomBetween(minMs, maxMs)))
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timeout sau ${ms}ms`)), ms)
    promise.then(
      (v) => {
        clearTimeout(timer)
        resolve(v)
      },
      (e) => {
        clearTimeout(timer)
        reject(e)
      },
    )
  })
}

interface CallOptions {
  /** Độ trễ giả lập riêng (vd: assessRisk cần ~2s cho nhịp trình bày) */
  demoDelayMs?: [number, number]
}

/**
 * Gọi backend qua lớp demo-mode.
 * `live` là hàm gọi FastAPI thật, `demo` trả dữ liệu từ demo-scenarios.
 */
export async function guardedCall<T>(name: string, live: () => Promise<T>, demo: () => T, options?: CallOptions): Promise<T> {
  const [min, max] = options?.demoDelayMs ?? [300, 900]
  if (isDemoMode()) {
    console.info(`[demo-mode] ${name}: DEMO`)
    await demoDelay(min, max)
    return demo()
  }
  try {
    const result = await withTimeout(live(), LIVE_TIMEOUT_MS)
    console.info(`[demo-mode] ${name}: LIVE`)
    return result
  } catch (error) {
    console.warn(`[demo-mode] ${name}: backend lỗi/timeout → fallback DEMO`, error)
    return demo()
  }
}

/** Phát lại text kiểu streaming từng token (~25ms) để nhìn y hệt LLM thật. */
export async function replayAsStream(text: string, onToken: (token: string) => void, msPerToken = 25): Promise<void> {
  const tokens = text.split(/(\s+)/).filter((t) => t.length > 0)
  for (const token of tokens) {
    onToken(token)
    await new Promise((resolve) => setTimeout(resolve, msPerToken))
  }
}
