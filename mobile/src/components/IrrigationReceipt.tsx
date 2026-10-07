import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, FileText, History } from 'lucide-react'
import { CountUp } from './anim'
import { SuccessMark } from './motion'
import { useStore } from '../store'
import { fieldLabel, type FarmEvent } from '../workflow-model'

export default function IrrigationReceipt({ events }: { events: FarmEvent[] }) {
  const { setScreen } = useStore(), reduced = useReducedMotion()
  if (!events.length) return null
  const water = events.reduce((n, e) => n + (e.irrigation?.waterTonnes || 0), 0)
  return <motion.section className="irrigation-receipt" aria-label="灌溉结果" initial={{ opacity: 0, y: reduced ? 0 : 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduced ? 0 : .45 }}>
    <header><SuccessMark size={38}/><div><h2>这次灌溉，已记录</h2><p>{new Date(events[0].at).toLocaleString('zh-CN', { hour12: false })} · 完成时阀门已关闭</p></div></header>
    <div className="receipt-total"><span>{events.length} 块田 · 最近一次完成结果</span><b><CountUp to={water} decimals={2}/><small>吨 / 演示用水</small></b></div>
    {events.map((event, i) => <div key={event.id}><div className="receipt-row"><span>{fieldLabel(event.fieldId)}</span><span><small>{event.irrigation!.before.toFixed(1)}%</small><ArrowRight size={11}/><b>{event.irrigation!.after.toFixed(1)}%</b></span></div><div className="receipt-bar"><motion.i initial={{ scaleX: reduced ? 1 : 0 }} animate={{ scaleX: event.irrigation!.after / 100 }} transition={{ delay: reduced ? 0 : .1 + i * .07, duration: reduced ? 0 : .6 }}/></div></div>)}
    <div className="work-actions"><button onClick={() => setScreen('history')}><History size={14}/>作业记录</button><button onClick={() => setScreen('reports')}><FileText size={14}/>生成报告</button></div><p className="receipt-label">墒情与用水量为演示结果，已与地块档案和报告同步。</p>
  </motion.section>
}
