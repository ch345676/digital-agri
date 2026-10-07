import { FIELDS } from '../farm-data'
import { fieldLabel, type FarmState } from '../workflow-model'
import { localDate } from './daily-work'

export type ReportPeriod = 'today' | 'week' | 'all'
export function farmReport(state: FarmState, field: string, period: ReportPeriod, now: Date) {
  const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  if (period === 'week') startDate.setDate(startDate.getDate() - 6)
  const start = period === 'all' ? 0 : startDate.getTime()
  const end = now.getTime()
  const inField = (id: string) => field === 'all' || id === field
  const events = state.events.filter(e => inField(e.fieldId) && e.at >= start && e.at <= end).sort((a, b) => b.at - a.at)
  const tasks = state.tasks.filter(t => inField(t.fieldId))
  const completed = tasks.filter(t => t.status === '已完成' && t.updatedAt >= start && t.updatedAt <= end)
  const photos = events.filter(e => e.photo).filter((e, i, all) => all.findIndex(p => p.photo === e.photo) === i)
  const waterRecords = events.filter(e => e.kind === 'irrigation' && e.irrigation)
  return {
    field, fields: FIELDS.filter(f => inField(f.id)), moisture: { ...state.moisture },
    scope: field === 'all' ? '全场 · 五地块' : fieldLabel(field),
    period, label: period === 'today' ? localDate(now) : period === 'week' ? `${localDate(startDate)} — ${localDate(now)}` : '全部保留记录',
    generatedAt: end, events, completed, photos,
    water: waterRecords.reduce((n, e) => n + e.irrigation!.waterTonnes, 0),
    pending: tasks.filter(t => t.status !== '已完成'),
    incidents: state.incidents.filter(i => inField(i.fieldId) && i.status !== '已解决'),
    eventCount: events.length,
  }
}
export type FarmReport = ReturnType<typeof farmReport>
