import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowUpRight, CheckCheck, ClipboardList, Droplets, FileText, ShieldAlert } from 'lucide-react'
import { useFarm } from '../FarmContext'
import { useStore } from '../store'
import { dailyWork, type DailyAction } from '../lib/daily-work'
import { Sheet } from './workflow'
import { usePerm } from '../auth'
import { fieldLabel } from '../workflow-model'

export default function TodayWork() {
  const farm = useFarm()
  const { setScreen } = useStore()
  const reduced = useReducedMotion()
  const { needAdmin } = usePerm()
  const [incidentId, setIncidentId] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const tick = () => setNow(new Date())
    const timer = setInterval(tick, 60000)
    document.addEventListener('visibilitychange', tick)
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', tick) }
  }, [])
  const work = dailyWork(farm.state)
  const incident = farm.state.incidents.find(i => i.id === incidentId)
  const open = (item: DailyAction) => {
    if (item.kind === 'task' || farm.state.tasks.some(t => t.id === item.target)) farm.openTask(item.target)
    else if (item.kind === 'incident') setIncidentId(item.target)
    else farm.openField(item.fieldId)
  }
  return <><section className="today-work" aria-labelledby="today-work-title">
    <header><div><span className="eyebrow">TODAY / {now.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })}</span><h2 id="today-work-title">今日农事<span>{work.actions.length} 项待关注</span></h2></div><button className="today-report" onClick={() => setScreen('reports')}><FileText size={16}/>农场报告</button></header>
    <div className="today-stats"><span><b>{work.pending}</b>待办任务</span><span><b>{work.dry}</b>墒情偏低</span><span><b>{work.completed}</b>今日完成</span></div>
    <div className="today-agenda"><AnimatePresence initial={false} mode="popLayout">{(expanded ? work.actions : work.actions.slice(0, 3)).map(item => {
      const Icon = item.kind === 'water' ? Droplets : item.kind === 'incident' ? ShieldAlert : ClipboardList
      return <motion.button layout={!reduced} key={item.id} data-action-id={item.id} initial={{ opacity: 0, y: reduced ? 0 : 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: reduced ? 0 : 16 }} transition={{ duration: reduced ? 0 : .24 }} className={`agenda-row priority-${item.priority}`} onClick={() => open(item)}><span className="agenda-icon"><Icon size={17}/></span><span className="agenda-copy"><b>{item.title}</b><small>{item.detail}</small></span><span className="agenda-label">{item.label}<ArrowUpRight size={13}/></span></motion.button>
    })}</AnimatePresence></div>
    {!work.actions.length && <p className="today-clear"><CheckCheck size={21}/>今天的待办已处理，去地块看看新的长势。</p>}
    <footer><small>本机演示数据 · 按紧急程度排序</small>{work.actions.length > 3 && <button onClick={() => setExpanded(v => !v)} aria-expanded={expanded}>{expanded ? '收起清单' : `展开全部 ${work.actions.length} 项`}</button>}</footer>
  </section><Sheet open={!!incident} onClose={() => setIncidentId(null)} title="今日待关注预警">{incident && <><span className="eyebrow">{fieldLabel(incident.fieldId)}</span><h3 className="work-section-title">{incident.title}</h3><p className="muted">当前进度：{incident.status}。分派现场复核任务，上传作业照片并验收后，预警会自动归档。</p><div className="work-actions"><button onClick={() => { setIncidentId(null); farm.openField(incident.fieldId) }}>地块档案</button><button className="work-primary" onClick={() => { if (needAdmin()) { farm.dispatchIncident(incident.id); setIncidentId(null) } }}>分派处理任务</button></div></>}</Sheet></>
}
