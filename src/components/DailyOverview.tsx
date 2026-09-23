import { ArrowUpRight, Bot, Cherry, ClipboardList, ScanLine, ShieldAlert } from 'lucide-react'
import { useStore, type PageKey } from '../store'
import { Count } from './Motion'

interface DailyOverviewProps {
  totalTasks: number
  completedTasks: number
  area: number
  fieldCount: number
  alerts: number
  highRisk: number
  harvestArea: number
}

export default function DailyOverview({ totalTasks, completedTasks, area, fieldCount, alerts, highRisk, harvestArea }: DailyOverviewProps) {
  const { setPage } = useStore()
  const remaining = totalTasks - completedTasks
  const progress = totalTasks ? Math.round(completedTasks / totalTasks * 100) : 0
  const metrics = [
    { title: '管理面积', value: area, unit: '亩', detail: `${fieldCount} 个在管地块`, icon: ScanLine, page: 'map', decimals: 1 },
    { title: '待处置预警', value: alerts, unit: '条', detail: `${highRisk} 条高风险需优先处理`, icon: ShieldAlert, page: 'alerts', tone: 'attention' },
    { title: '巡检机器人', value: 3, unit: '台', detail: '在线 · 仿真演示', icon: Bot, page: 'inspection' },
    { title: '可采摘面积', value: harvestArea, unit: '亩', detail: '查看采收窗口', icon: Cherry, page: 'harvest', decimals: 1 },
  ]
  return <section className="daily-overview" aria-label="今日农场概览">
    <div className="daily-focus" data-motion-item="daily-focus">
      <svg className="daily-field-art" viewBox="0 0 300 220" aria-hidden="true"><path d="M110 220C55 120 230 120 200 0M140 220C85 120 260 120 230 0M170 220C115 120 290 120 260 0M200 220C145 120 320 120 290 0M230 220C175 120 350 120 320 0" fill="none" stroke="currentColor"/><path d="M75 202L265 17M87 217L283 25" fill="none" stroke="currentColor"/></svg>
      <div className="daily-focus-heading"><h2><ClipboardList size={18}/>今日农事</h2><span>{totalTasks ? '今日进度' : '等待安排'}</span></div>
      <div className="daily-pending"><strong><Count value={remaining}/></strong><span>{remaining ? '项待完成' : totalTasks ? '今日已完成' : '项待安排'}</span></div>
      <div className="daily-progress-heading"><span>已完成 {completedTasks} / {totalTasks} 项</span><b>{progress}%</b></div>
      <div className="daily-progress" role="progressbar" aria-label="今日任务完成率" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}><i style={{width:`${progress}%`}}/></div>
      <button onClick={()=>setPage('tasks')}>{remaining ? '继续处理今日任务' : '查看与安排农事'}<ArrowUpRight size={17}/></button>
    </div>
    <div className="farm-metrics" aria-label="农场关键指标">{metrics.map(m=><button className={`farm-metric ${m.tone??''}`} key={m.title} onClick={()=>setPage(m.page as PageKey)}><div className="farm-metric-label"><m.icon size={17}/><span>{m.title}</span><ArrowUpRight className="metric-link" size={14}/></div><div className="farm-metric-value"><Count value={m.value} decimals={m.decimals??0}/><small>{m.unit}</small></div><p>{m.detail}</p></button>)}</div>
  </section>
}
