import { ArrowUpRight, ArrowRight, Leaf, ScanLine, Bot, ShieldAlert, Cherry, Check, ChevronRight, ClipboardList } from 'lucide-react'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from 'recharts'
import { useStore, FIELDS, todayStr } from '../store'
import { ALERTS, alertTaskTitle, HARVEST, soilHistory } from '../agronomy'
import {FarmEmpty} from '../components/AgriArtwork'
import DigitalTwinOverview from '../components/DigitalTwinOverview'
import { Count } from '../components/Motion'
import { useMotion } from '../components/motion-context'

const colors = ['#a4b69b', '#c5ad72', '#37745f', '#b36d50']
const maturity = [{ name: '未成熟', value: HARVEST.filter(h => h.maturity < 50).length }, { name: '接近成熟', value: HARVEST.filter(h => h.maturity >= 50 && h.maturity < 85).length }, { name: '成熟', value: HARVEST.filter(h => h.maturity >= 85 && h.maturity < 98).length }, { name: '过熟', value: HARVEST.filter(h => h.maturity >= 98).length }]
import { chartTooltip } from '../components/chart-theme'

export default function Dashboard() {
  const { settings, setPage, tasks, setTaskStatus } = useStore()
  const { enabled } = useMotion()
  const riskOrder = { '高风险': 0, '中风险': 1, '低风险': 2 }
  const pending = ALERTS.filter(a => !tasks.some(t => t.title === alertTaskTitle(a) && t.status === 'done')).sort((a,b) => riskOrder[a.level] - riskOrder[b.level])
  const total = FIELDS.reduce((s, f) => s + f.area, 0)
  const harvestArea = HARVEST.filter(h => h.maturity >= 85).reduce((s, h) => s + h.area, 0)
  const today = tasks.filter(t => t.date === todayStr()).sort((a,b) => a.time.localeCompare(b.time))
  const done = today.filter(t => t.status === 'done').length
  const trends = soilHistory('A1', 7)
  return <div className="overview">
    <div className="overview-heading"><div><h1>农场工作台</h1><p>{settings.displayName}，从今天需要关注的田间事务开始。</p></div><button className="primary-btn" onClick={() => setPage('tasks')}>安排农事 <ArrowUpRight size={17} /></button></div>
    <div className="kpi-grid">
      {[{ title:'管理面积',value:total,unit:'亩',sub:`${FIELDS.length} 个地块 · 全域覆盖`,icon:ScanLine,decimal:1 },{title:'今日农事',value:today.length-done,unit:'项',sub:`已完成 ${done} / ${today.length} 项`,icon:Leaf},{title:'巡检机器人',value:3,unit:'台',sub:'3 台在线 · 1 台待机（演示）',icon:Bot},{title:'待处置预警',value:pending.length,unit:'条',sub:`${pending.filter(a=>a.level==='高风险').length} 条高风险 · 优先关注`,icon:ShieldAlert},{title:'可采摘面积',value:harvestArea,unit:'亩',sub:'B2 蔬菜 · 建议明日采收',icon:Cherry,decimal:1}].map((k,i) => <button className={`metric-card metric-${i}`} key={k.title} onClick={() => setPage((['map','tasks','inspection','alerts','harvest'] as const)[i])}><div className="metric-top"><span>{k.title}</span><k.icon size={18} /></div><div className="metric-number"><Count value={k.value} decimals={k.decimal ?? 0} /><small>{k.unit}</small></div><div className="metric-bottom"><span>{k.sub}</span><ArrowUpRight size={14} /></div></button>)}
    </div>
    <div className="dashboard-priorities">
      <section className="panel"><div className="panel-heading"><h3><ShieldAlert size={17}/>优先处理</h3><button className="text-btn" onClick={() => setPage('alerts')}>全部 <ArrowUpRight size={14}/></button></div><div className="alert-preview">{pending.slice(0,3).map(a=><button key={a.id} onClick={()=>setPage('alerts')}><span className={`signal ${a.level==='高风险'?'red':'orange'}`}/><div><b>{a.title}</b><small>{a.field} · {a.source}</small></div><span className={`risk-pill ${a.level==='高风险'?'high':'medium'}`}>{a.level}</span></button>)}{pending.length===0 && <FarmEmpty title="全部预警已完成处置" description="田间风险已复核，继续关注作物变化。" action={()=>setPage('inspection')} label="查看巡检"/>}</div></section>
      <section className="panel"><div className="panel-heading"><h3><ClipboardList size={17}/>今日任务</h3><button className="text-btn" onClick={()=>setPage('tasks')}>全部 <ArrowUpRight size={14}/></button></div><div className="schedule-preview">{today.filter(t=>t.status!=='done').slice(0,3).map(t=><div key={t.id}><button className="task-check" title="标记完成" onClick={()=>setTaskStatus(t.id,'done')}><Check size={12}/></button><div><b>{t.title}</b><small>{t.assignee} · {t.time}</small></div><span className="tiny-status">{t.status==='in-progress'?'进行中':'待完成'}</span></div>)}{today.every(t=>t.status==='done')&&<FarmEmpty title="今日任务已全部完成" description="把下一次农事安排好，让生长从容有序。" action={()=>setPage('tasks')} label="安排农事"/>}</div></section>
    </div>
    <DigitalTwinOverview/>
    <div className="dashboard-chart-grid">
      <section className="panel trend-panel"><div className="panel-heading"><div><span className="eyebrow">EARLY INSIGHT</span><h3>病虫害预警趋势 <small>近 7 天</small></h3></div><button className="text-btn" onClick={() => setPage('history')}>查看复盘 <ArrowUpRight size={14} /></button></div><div className="chart-legend"><span><i style={{background:'#37745f'}} />多光谱筛查</span><span><i style={{background:'#6495a2'}} />RGB 识别</span><span><i style={{background:'#c29851'}} />热红外辅助</span><em>单位：条 · 演示样本</em></div><ResponsiveContainer width="100%" height={210}><AreaChart data={trends} margin={{ top: 15, right: 10, left: -26, bottom: 0 }}><defs><linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#37745f" stopOpacity={.24}/><stop offset="100%" stopColor="#37745f" stopOpacity={0}/></linearGradient></defs><CartesianGrid vertical={false} stroke="#263d31" strokeDasharray="4 5"/><XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill:'#829b8b',fontSize:10 }}/><YAxis axisLine={false} tickLine={false} tick={{fill:'#829b8b',fontSize:10}}/><Tooltip contentStyle={chartTooltip}/><Area type="monotone" dataKey="spectral" name="多光谱筛查" stroke="#37745f" fill="url(#trendFill)" strokeWidth={2.5} isAnimationActive={enabled}/><Area type="monotone" dataKey="rgb" name="RGB 识别" stroke="#6495a2" fill="transparent" strokeWidth={2} isAnimationActive={enabled}/><Area type="monotone" dataKey="thermal" name="热红外辅助" stroke="#c29851" fill="transparent" strokeWidth={2} isAnimationActive={enabled}/></AreaChart></ResponsiveContainer><div className="insight-note"><Leaf size={14}/><span>先发现，再行动。</span> 多源巡检辅助识别，处置前请人工复核。</div></section>
      <section className="panel maturity-panel"><div className="panel-heading"><div><span className="eyebrow">HARVEST OUTLOOK</span><h3>作物成熟度</h3></div><button className="round-link" aria-label="查看采摘规划" onClick={() => setPage('harvest')}><ArrowUpRight size={18}/></button></div><div className="maturity-content"><div className="donut"><ResponsiveContainer width="100%" height={190}><PieChart><Pie data={maturity} dataKey="value" innerRadius={65} outerRadius={82} paddingAngle={5} cornerRadius={5} stroke="none" isAnimationActive={enabled}>{maturity.map((d,i)=><Cell key={d.name} fill={colors[i]}/>)}</Pie><Tooltip contentStyle={chartTooltip}/></PieChart></ResponsiveContainer><div className="donut-center"><b><Count value={FIELDS.length}/></b><span>监测地块</span></div></div><div className="maturity-legend">{maturity.map((d,i)=><div key={d.name}><i style={{background:colors[i]}}/><span>{d.name}</span><b>{d.value/FIELDS.length*100}<small>%</small></b></div>)}</div></div><button className="harvest-note" onClick={() => setPage('harvest')}><Cherry size={18}/><span><b>把握最佳采摘窗口</b><small>B2 蔬菜成熟度 94% · 查看规划</small></span><ChevronRight size={17}/></button></section>
    </div>
    <button className="inspection-banner" onClick={()=>setPage('inspection')}><span className="radar-orbit"><Bot size={24}/></span><span><small>田间巡检</small><b>查看机器人作业与采集进度</b></span><p>路径巡航 · 多光谱采集 · 田间决策</p><span className="text-btn">开启巡检演示 <ArrowRight size={18}/></span></button>
  </div>
}
