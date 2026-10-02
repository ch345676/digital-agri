export type EventKind = 'irrigation' | 'fertilizer' | 'sample' | 'alert' | 'task' | 'review' | 'harvest' | 'material' | 'labor' | 'device'
export interface FarmEvent { id: string; fieldId: string; at: string; kind: EventKind; title: string; detail: string; sourceId?: string; origin: 'demo' | 'local' }
export interface AlertReview { id: string; alertId: string; taskId: string; taskRevision?: number; fieldId: string; at: string; reviewer: string; treatment: string; result: string; passed: boolean }
export interface SampleRecord { id: string; fieldId: string; at: string; values: number[]; note: string; origin: 'demo' | 'local' }
export type LedgerKind = 'material' | 'stock-in' | 'harvest' | 'labor' | 'water'
export interface LedgerEntry { id: string; fieldId: string; date: string; kind: LedgerKind; title: string; quantity: number; unit: string; unitPrice: number; loss: number; taskId?: string; inventoryId?: string; stockDelta?: number; origin: 'demo' | 'local' }
export interface SavedScenario { id: string; name: string; at: string; period: string; water: number; fertilizer: number; waterPrice: number; fertilizerPrice: number; waterReduction: number; fertilizerReduction: number }
export type CommandPhase = 'sending' | 'confirmed' | 'executing' | 'done' | 'failed'
export interface DeviceCommand { id: string; deviceId: string; target: boolean; phase: CommandPhase; at: string; steps: { phase: CommandPhase; at: string }[]; message: string }
export interface WorkflowState { version: 1; events: FarmEvent[]; reviews: AlertReview[]; samples: SampleRecord[]; ledger: LedgerEntry[]; scenarios: SavedScenario[]; commands: DeviceCommand[] }
export const EVENT_NAMES: Record<EventKind, string> = { irrigation: '灌溉', fertilizer: '施肥', sample: '采样', alert: '预警', task: '农事', review: '复核', harvest: '采收', material: '领料', labor: '工时', device: '设备' }
export const LEDGER_NAMES: Record<LedgerKind, string> = { material: '领料投入', 'stock-in': '入库', harvest: '采收实重', labor: '人工工时', water: '灌溉用水' }
export const COMMAND_NAMES: Record<CommandPhase, string> = { sending: '正在发送', confirmed: '模拟回执已确认', executing: '正在执行', done: '执行完成', failed: '执行失败' }
export const FIELD_IDS = ['A1', 'A2', 'B1', 'B2', 'C1']
export const SAMPLE_NAMES = ['温度', '水分', 'EC 值', 'pH 值', '氮含量', '磷含量', '钾含量', '有机质']
export const SAMPLE_UNITS = ['°C', '%', 'mS/cm', '', 'mg/kg', 'mg/kg', 'mg/kg', '%']
export const SAMPLE_LIMITS = [[-20, 70], [0, 100], [0, 30], [0, 14], [0, 3000], [0, 3000], [0, 5000], [0, 100]]
export function validSample(values: number[]) { return values.length === 8 && values.every((v, i) => Number.isFinite(v) && v >= SAMPLE_LIMITS[i][0] && v <= SAMPLE_LIMITS[i][1]) }
export function offsetDate(date: string, days: number) { const d = new Date(date + 'T12:00:00'); d.setDate(d.getDate() + days); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }
export function validDate(date: string) { return /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(new Date(date + 'T12:00:00').getTime()) && offsetDate(date, 0) === date }
export function validLedger(e: Omit<LedgerEntry, 'id' | 'origin'>) { return FIELD_IDS.includes(e.fieldId) && validDate(e.date) && !!e.title.trim() && Number.isFinite(e.quantity) && e.quantity > 0 && e.quantity <= 1e7 && Number.isFinite(e.unitPrice) && e.unitPrice >= 0 && e.unitPrice <= 1e7 && Number.isFinite(e.loss) && e.loss >= 0 && e.loss <= e.quantity }
export function ledgerTotals(entries: LedgerEntry[], area: number) {
  const cost = entries.filter(e => !['stock-in', 'harvest'].includes(e.kind)).reduce((n, e) => n + e.quantity * e.unitPrice, 0)
  const harvest = entries.filter(e => e.kind === 'harvest').reduce((n, e) => n + e.quantity - e.loss, 0)
  const loss = entries.filter(e => e.kind === 'harvest').reduce((n, e) => n + e.loss, 0)
  return { cost, harvest, loss, perMu: area ? cost / area : 0, perKg: harvest ? cost / harvest : null }
}
export function reviewStatus(alertId: string, tasks: { id: string; sourceId?: string; status: string; revision?: number }[], reviews: AlertReview[]) {
  const task = tasks.find(t => t.sourceId === alertId)
  if (!task) return '待处置'
  const review = reviews.find(r => r.alertId === alertId && r.taskId === task.id && (r.taskRevision || 0) === (task.revision || 0))
  return task.status !== 'done' ? '处理中' : review?.passed ? '已解决' : review ? '需再处理' : '待复核'
}
export function createWorkflow(today: string): WorkflowState {
  const values = [[22.6,82,1.21,6.2,110,42,210,3.2],[24.1,56,1.86,6.5,98,38,185,2.6],[20.8,61,1.22,6.8,90,45,200,2.8],[23.4,66,1.34,6,106,41,220,3.1],[21.6,49,1.08,6.4,72,32,160,2.3]]
  const samples: SampleRecord[] = FIELD_IDS.flatMap((fieldId, i) => [7, 0].map(back => ({ id: `seed-sample-${fieldId}-${back}`, fieldId, at: `${offsetDate(today, -back)}T08:30`, values: values[i].map((v,j) => +Math.max(0, v + (back ? [1.2,-2,.08,.1,-4,2,-5,-.1][j] : 0)).toFixed(2)), note: '示范采样记录，非现场测量', origin: 'demo' as const })))
  const events: FarmEvent[] = FIELD_IDS.flatMap((fieldId, i) => [
    { id: `seed-water-${fieldId}`, fieldId, at: `${offsetDate(today, -4)}T09:00`, kind: 'irrigation' as const, title: '灌溉作业记录', detail: '示例记录：检查灌区并完成补水。仅用于时序对照。', origin: 'demo' as const },
    { id: `seed-feed-${fieldId}`, fieldId, at: `${offsetDate(today, -2)}T14:00`, kind: 'fertilizer' as const, title: '水肥作业记录', detail: '示例记录：核对施肥用量，完成田间巡查。', origin: 'demo' as const },
    { id: `seed-alert-${fieldId}`, fieldId, at: `${today}T07:${String(i * 10).padStart(2, '0')}`, kind: 'alert' as const, title: '待人工复核的监测预警', detail: '结合采样条件与现场记录复核。', sourceId: `A0${i+1}`, origin: 'demo' as const },
  ])
  for (const s of samples) events.push({ id: `event-${s.id}`, fieldId: s.fieldId, at: s.at, kind: 'sample', title: '土壤八项采样', detail: s.note, sourceId: s.id, origin: s.origin })
  return { version: 1, events, reviews: [], samples, ledger: [], scenarios: [], commands: [] }
}
