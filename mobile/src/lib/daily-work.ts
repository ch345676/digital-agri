import { FIELDS } from '../farm-data'
import { fieldLabel, type FarmState } from '../workflow-model'
import { localDate } from './local-date'
export { localDate } from './local-date'

export interface DailyAction {
  id: string
  fieldId: string
  title: string
  detail: string
  label: string
  kind: 'task' | 'incident' | 'water'
  target: string
  priority: number
}

// These thresholds belong to the demonstration, not a real irrigation prescription.
export function dailyWork(state: FarmState, now = new Date()) {
  const date = localDate(now)
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const pending = state.tasks.filter(t => t.status !== '已完成' && (t.due <= date || t.status === '待验收' || t.status === '执行中'))
  const actions: DailyAction[] = pending.map(t => ({
    id: `task-${t.id}`, fieldId: t.fieldId, title: t.title,
    detail: `${fieldLabel(t.fieldId)} · ${t.assignee || '尚未分派'} · ${t.due}`,
    label: t.due < date ? '已逾期' : t.status,
    kind: 'task', target: t.id,
    priority: t.due < date ? 0 : t.status === '待验收' ? 1 : t.status === '执行中' ? 3 : 4,
  }))
  const linked = new Set(pending.map(t => t.incidentId).filter(Boolean))
  for (const incident of state.incidents.filter(i => i.status !== '已解决' && !linked.has(i.id))) {
    actions.push({ id: `incident-${incident.id}`, fieldId: incident.fieldId, title: incident.title,
      detail: `${fieldLabel(incident.fieldId)} · ${incident.status}`, label: '待关注',
      kind: 'incident', target: incident.taskId || incident.id, priority: 2 })
  }
  const dry = FIELDS.filter(f => state.moisture[f.id] < 60)
  for (const field of dry) {
    if (actions.some(a => a.fieldId === field.id && /水|墒情|灌溉/.test(a.title))) continue
    actions.push({ id: `water-${field.id}`, fieldId: field.id, title: `${field.id} 墒情偏低`,
      detail: `${field.crop} · 当前 ${state.moisture[field.id].toFixed(0)}% · 演示阈值 60%`,
      label: '查看地块', kind: 'water', target: field.id, priority: 5 })
  }
  actions.sort((a, b) => a.priority - b.priority || a.detail.localeCompare(b.detail, 'zh-CN') || a.id.localeCompare(b.id))
  return { actions, pending: pending.length, dry: dry.length,
    completed: state.tasks.filter(t => t.status === '已完成' && t.updatedAt >= start && t.updatedAt <= now.getTime()).length }
}
