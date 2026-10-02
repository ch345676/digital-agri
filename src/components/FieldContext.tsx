import { useState } from 'react'
import { ArrowUpRight, Layers3, MapPin } from 'lucide-react'
import { FIELDS, useStore } from '../store'
import { ALERTS } from '../agronomy'
import { ledgerTotals } from '../workflow-model'
import { Modal } from './bits'

export default function FieldContext() {
  const { context, selectField, selectDate, tasks, workflow, openField, alertStatus } = useStore()
  const [open, setOpen] = useState(false)
  const field = FIELDS.find(f => f.id === context.fieldId)
  const events = workflow.events.filter(e => e.fieldId === context.fieldId).sort((a,b) => b.at.localeCompare(a.at))
  const linked = tasks.filter(t => t.fieldId === context.fieldId)
  const risks = ALERTS.filter(a => a.field === context.fieldId && alertStatus(a.id) !== '已解决')
  const totals = ledgerTotals(workflow.ledger.filter(e => e.fieldId === context.fieldId), field?.area || 0)
  const go = (page: Parameters<typeof openField>[0], id = '') => { setOpen(false); openField(page, context.fieldId, id) }
  return <>
    <div className="field-context-bar" aria-label="全站地块上下文">
      <label><MapPin size={15}/><span>工作范围</span><select aria-label="全站地块" value={context.fieldId} onChange={e => selectField(e.target.value)}><option value="">全部地块</option>{FIELDS.map(f => <option key={f.id} value={f.id}>{f.id} · {f.crop}</option>)}</select></label>
      <label className="context-date"><span>观察日期</span><input aria-label="观察日期" type="date" value={context.date} onChange={e => selectDate(e.target.value)}/></label>
      <button className="text-btn" disabled={!field} onClick={() => setOpen(true)}><Layers3 size={15}/>地块档案 <ArrowUpRight size={14}/></button>
    </div>
    <Modal open={open && !!field} title="地块关联档案" onClose={() => setOpen(false)} width="w-[600px]">
      {field && <div className="field-dossier"><span className="insight-kicker">{field.variety} · {field.area} 亩</span><h2>{field.id} · {field.crop}</h2><p>同一地块的任务、风险、采样与投入，在这里连续查看。</p>
        <div className="dossier-stats"><button onClick={() => go('tasks')}><b>{linked.filter(t => t.status !== 'done').length}</b><span>待办作业</span></button><button onClick={() => go('alerts')}><b>{risks.length}</b><span>待复核风险</span></button><button onClick={() => go('analytics')}><b>¥{totals.cost.toFixed(0)}</b><span>已记录投入</span></button></div>
        <div className="context-links">{([['map','地图定位'],['soil','土壤报告'],['history','事件复盘'],['devices','关联设备']] as const).map(([page,label]) => <button className="secondary-btn" key={page} onClick={() => go(page)}>{label}<ArrowUpRight size={13}/></button>)}</div>
        <h3>最近发生</h3><ol className="field-event-list">{events.slice(0,6).map(e => <li key={e.id}><time>{e.at.slice(0,16).replace('T',' ')}</time><b>{e.title}</b><p>{e.detail}</p><small>{e.origin === 'demo' ? '示例事件' : '本机记录'}</small></li>)}</ol>
      </div>}
    </Modal>
  </>
}
