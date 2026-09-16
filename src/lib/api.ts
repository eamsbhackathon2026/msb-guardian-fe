/*
 * Client gọi FastAPI (localhost:8000, proxy qua /api trong vite.config.ts).
 * MỌI lời gọi đi qua lớp demo-mode: demo bật hoặc backend lỗi → dữ liệu demo.
 */
import {
  demoCaseTimeline,
  demoCopilotOverview,
  demoOpsAlerts,
  demoOpsMetrics,
  demoRiskAssessment,
  getScriptedReply,
} from '@/data/demo-scenarios'
import type { ChatChart, CopilotOverview, OpsDecision, OpsMetrics, RiskAssessment, ScamAlert } from '@/data/types'
import { guardedCall, isDemoMode, replayAsStream } from './demo-mode'

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`)
  return res.json() as Promise<T>
}

export function getCopilotOverview(): Promise<CopilotOverview> {
  return guardedCall(
    'getCopilotOverview',
    () => fetchJson<CopilotOverview>('/api/copilot/overview'),
    () => demoCopilotOverview,
  )
}

export interface ChatStreamResult {
  content: string
  chart?: ChatChart
}

/**
 * POST /api/copilot/chat (SSE). Demo: phát lại câu trả lời ghi sẵn ~25ms/token.
 * onToken được gọi từng chunk để UI hiện dần.
 */
export async function streamChat(question: string, onToken: (token: string) => void): Promise<ChatStreamResult> {
  const demoReply = () => getScriptedReply(question)

  if (!isDemoMode()) {
    try {
      const res = await fetch('/api/copilot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: question }),
      })
      if (!res.ok || !res.body) throw new Error(`chat → HTTP ${res.status}`)
      console.info('[demo-mode] streamChat: LIVE')
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let full = ''
      let buffer = ''
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''
        for (const line of lines) {
          if (!line.startsWith('data:')) continue
          const payload = line.slice(5).trim()
          if (payload === '[DONE]') continue
          try {
            const parsed = JSON.parse(payload) as { token?: string }
            if (parsed.token) {
              full += parsed.token
              onToken(parsed.token)
            }
          } catch {
            full += payload
            onToken(payload)
          }
        }
      }
      return { content: full }
    } catch (error) {
      console.warn('[demo-mode] streamChat: backend lỗi → fallback DEMO', error)
    }
  } else {
    console.info('[demo-mode] streamChat: DEMO')
  }

  const reply = demoReply()
  // Chờ token đầu ~600ms để UI kịp hiện typing indicator
  await new Promise((resolve) => setTimeout(resolve, 600))
  await replayAsStream(reply.content, onToken)
  return { content: reply.content, chart: reply.chart }
}

export function assessRisk(payload: { amount: number }): Promise<RiskAssessment> {
  return guardedCall(
    'assessRisk',
    () =>
      fetchJson<RiskAssessment>('/api/risk/assess', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    () => demoRiskAssessment,
    { demoDelayMs: [1_800, 2_200] }, // nhịp "Đang phân tích giao dịch..." cho lúc trình bày
  )
}

export function getOpsMetrics(): Promise<OpsMetrics> {
  return guardedCall(
    'getOpsMetrics',
    () => fetchJson<OpsMetrics>('/api/ops/metrics'),
    () => demoOpsMetrics,
  )
}

export function getOpsAlerts(): Promise<ScamAlert[]> {
  return guardedCall(
    'getOpsAlerts',
    () => fetchJson<ScamAlert[]>('/api/ops/alerts'),
    () => demoOpsAlerts,
  )
}

export function getOpsAlert(id: string): Promise<ScamAlert | undefined> {
  return guardedCall(
    `getOpsAlert(${id})`,
    () => fetchJson<ScamAlert>(`/api/ops/alerts/${id}`),
    () => demoOpsAlerts.find((a) => a.id === id),
  )
}

export function getCaseTimeline(id: string): typeof demoCaseTimeline {
  void id
  return demoCaseTimeline
}

export function postDecision(id: string, decision: OpsDecision, note: string): Promise<{ ok: boolean }> {
  return guardedCall(
    `postDecision(${id})`,
    () =>
      fetchJson<{ ok: boolean }>(`/api/ops/alerts/${id}/decision`, {
        method: 'POST',
        body: JSON.stringify({ decision, note }),
      }),
    () => ({ ok: true }),
  )
}
