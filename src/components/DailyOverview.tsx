import { ArrowUpRight } from 'lucide-react'
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
    { title: '管理面积', value: area, unit: '亩', detail: `${fieldCount} 个在管地块`, page: 'map', decimals: 1 },
    { title: '待处置预警', value: alerts, unit: '条', detail: `${highRisk} 条高风险需优先处理`, page: 'alerts', tone: 'attention' },
    { title: '可采摘面积', value: harvestArea, unit: '亩', detail: '查看采收窗口', page: 'harvest', decimals: 1 },
  ]
  return <section className="daily-overview" aria-label="今日农场概览">
    <button className="daily-focus" onClick={() => setPage('tasks')}>
      <div className="farm-metric-label"><span>今日作业</span><ArrowUpRight size={16}/></div>
      <div className="farm-metric-value"><Count value={completedTasks}/><small>/ {totalTasks} 项</small></div>
      <div className="daily-progress-heading"><span>已完成 {progress}%</span><span>{remaining} 项待处理</span></div>
      <div className="daily-progress" role="progressbar" aria-label="今日任务完成率" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}><i style={{ width: `${progress}%` }}/></div>
    </button>
    {metrics.map(m => <button className={`farm-metric ${m.tone ?? ''}`} key={m.title} onClick={() => setPage(m.page as PageKey)}>
      <div className="farm-metric-label"><span>{m.title}</span><ArrowUpRight size={16}/></div>
      <div className="farm-metric-value"><Count value={m.value} decimals={m.decimals ?? 0}/><small>{m.unit}</small></div>
      <p>{m.detail}</p>
    </button>)}
  </section>
}
