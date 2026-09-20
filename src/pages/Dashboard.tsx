import { useEffect, useRef } from 'react'
import { ArrowUpRight, ArrowRight, Leaf, ScanLine, Bot, ShieldAlert, Cherry, Droplets, Wind, Sun, CloudSun, Waves, Check, ChevronRight, ClipboardList } from 'lucide-react'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from 'recharts'
import { useStore, FIELDS, todayStr } from '../store'
import { ALERTS, alertTaskTitle, HARVEST, SAMPLES, soilHistory } from '../agronomy'
import { Count } from '../components/Motion'
import { useMotion } from '../components/motion-context'
import { FeatureGallery } from '../components/SceneMedia'

const colors = ['#507555', '#aad866', '#49c9a0', '#d9a166']
const maturity = [{ name: '未成熟', value: HARVEST.filter(h => h.maturity < 50).length }, { name: '接近成熟', value: HARVEST.filter(h => h.maturity >= 50 && h.maturity < 85).length }, { name: '成熟', value: HARVEST.filter(h => h.maturity >= 85 && h.maturity < 98).length }, { name: '过熟', value: HARVEST.filter(h => h.maturity >= 98).length }]
import { chartTooltip } from '../components/chart-theme'

export default function Dashboard() {
  const { settings, setPage, tasks, setTaskStatus, readings } = useStore()
  const { enabled } = useMotion()
  const video = useRef<HTMLVideoElement>(null)
  useEffect(() => {
    const node = video.current
    if (!node) return
    let inView = true
    const sync = () => { if (enabled && inView && !document.hidden) node.play().catch(() => {}); else node.pause() }
    const observer = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; sync() })
    observer.observe(node)
    document.addEventListener('visibilitychange', sync)
    sync()
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', sync) }
  }, [enabled])
  const pending = ALERTS.filter(a => !tasks.some(t => t.title === alertTaskTitle(a) && t.status === 'done'))
  const total = FIELDS.reduce((s, f) => s + f.area, 0)
  const harvestArea = HARVEST.filter(h => h.maturity >= 85).reduce((s, h) => s + h.area, 0)
  const today = tasks.filter(t => t.date === todayStr())
  const done = today.filter(t => t.status === 'done').length
  const weather = readings.D4
  const trends = soilHistory('A1', 7)
  return <div className="overview">
    <div className="overview-heading"><div><div className="eyebrow">GROW WITH INTELLIGENCE</div><h1>一览田间，心中有数<span>.</span></h1><p>{settings.displayName}，欢迎回到你的智慧农场。</p></div><button className="primary-btn" onClick={() => setPage('tasks')}>安排农事 <ArrowUpRight size={17} /></button></div>
    <section className="field-hero">
      <video ref={video} muted loop playsInline autoPlay={enabled} preload="metadata" poster="./media/field.jpg" aria-hidden="true"><source src="./media/field.mp4" type="video/mp4" /></video>
      <div className="hero-shade" /><div className="hero-grid" />
      <div className="hero-story"><div className="hero-chip"><span className="status-dot" />智慧农业 · 生长进行时</div><h2>科技扎根土壤<br />让丰收<span>有迹可循。</span></h2><p>从一片叶子的变化，到整座农场的生长。<br />感知、分析、行动，在这里自然相连。</p><button className="hero-link" onClick={() => setPage('inspection')}>进入智能巡检 <span><ArrowUpRight size={18} /></span></button></div>
      <div className="field-marker marker-one"><span className="target-ring" /><div><small>A1 · 水稻种植区</small><b>长势良好 <Leaf size={12} /></b></div></div>
      <div className="field-marker marker-two"><span className="target-ring" /><div><small>环境感知</small><b>土壤 · 光谱 · 虫情</b></div></div>
      <aside className="weather-glass"><div className="weather-top"><span>田间微气候</span><CloudSun size={23} /></div><div className="weather-value"><Count value={weather?.v1 ?? 26} decimals={1} /><sup>°C</sup></div><p>多云间晴 · 适宜田间作业</p><div className="weather-details"><span><Droplets size={14} />湿度 <b>{Math.round(weather?.v2 ?? 65)}%</b></span><span><Wind size={14} />东南风 <b>2 级</b></span></div><div className="hourly">{['现在','12:00','14:00','16:00'].map((h,i) => <div key={h}><small>{h}</small><Sun size={15} /><b>{[26,28,29,27][i]}°</b></div>)}</div><small className="weather-note">气象演示 · 非实时天气预报</small></aside>
      <div className="hero-coordinate">FIELD / 01 <span>PRECISION AGRICULTURE</span></div>
    </section>
    <FeatureGallery />
    <div className="kpi-grid">
      {[{ title:'管理面积',value:total,unit:'亩',sub:`${FIELDS.length} 个地块 · 全域覆盖`,icon:ScanLine,decimal:1 },{title:'今日农事',value:today.length-done,unit:'项',sub:`已完成 ${done} / ${today.length} 项`,icon:Leaf},{title:'巡检机器人',value:3,unit:'台',sub:'3 台在线 · 1 台待机（演示）',icon:Bot},{title:'待处置预警',value:pending.length,unit:'条',sub:`${pending.filter(a=>a.level==='高风险').length} 条高风险 · 优先关注`,icon:ShieldAlert},{title:'可采摘面积',value:harvestArea,unit:'亩',sub:'B2 蔬菜 · 建议明日采收',icon:Cherry,decimal:1}].map((k,i) => <button className={`metric-card metric-${i}`} key={k.title} onClick={() => setPage((['map','tasks','inspection','alerts','harvest'] as const)[i])}><div className="metric-top"><span>{k.title}</span><k.icon size={18} /></div><div className="metric-number"><Count value={k.value} decimals={k.decimal ?? 0} /><small>{k.unit}</small></div><div className="metric-bottom"><span>{k.sub}</span><ArrowUpRight size={14} /></div><svg className="mini-spark" viewBox="0 0 120 24" aria-hidden="true"><path d="M0 20 L15 16 L28 18 L45 8 L57 13 L70 5 L85 9 L98 3 L120 0" /></svg></button>)}
    </div>
    <div className="dashboard-chart-grid">
      <section className="panel trend-panel"><div className="panel-heading"><div><span className="eyebrow">EARLY INSIGHT</span><h3>病虫害预警趋势 <small>近 7 天</small></h3></div><button className="text-btn" onClick={() => setPage('history')}>查看复盘 <ArrowUpRight size={14} /></button></div><div className="chart-legend"><span><i style={{background:'#addb73'}} />多光谱筛查</span><span><i style={{background:'#5fc9ba'}} />RGB 识别</span><span><i style={{background:'#d9b779'}} />热红外辅助</span><em>单位：条 · 演示样本</em></div><ResponsiveContainer width="100%" height={210}><AreaChart data={trends} margin={{ top: 15, right: 10, left: -26, bottom: 0 }}><defs><linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#aad866" stopOpacity={.24}/><stop offset="100%" stopColor="#aad866" stopOpacity={0}/></linearGradient></defs><CartesianGrid vertical={false} stroke="#263d31" strokeDasharray="4 5"/><XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill:'#829b8b',fontSize:10 }}/><YAxis axisLine={false} tickLine={false} tick={{fill:'#829b8b',fontSize:10}}/><Tooltip contentStyle={chartTooltip}/><Area type="monotone" dataKey="spectral" name="多光谱筛查" stroke="#addb73" fill="url(#trendFill)" strokeWidth={2.5} isAnimationActive={enabled}/><Area type="monotone" dataKey="rgb" name="RGB 识别" stroke="#5fc9ba" fill="transparent" strokeWidth={2} isAnimationActive={enabled}/><Area type="monotone" dataKey="thermal" name="热红外辅助" stroke="#d9b779" fill="transparent" strokeWidth={2} isAnimationActive={enabled}/></AreaChart></ResponsiveContainer><div className="insight-note"><Leaf size={14}/><span>先发现，再行动。</span> 多源巡检辅助识别，处置前请人工复核。</div></section>
      <section className="panel maturity-panel"><div className="panel-heading"><div><span className="eyebrow">HARVEST OUTLOOK</span><h3>作物成熟度</h3></div><button className="round-link" aria-label="查看采摘规划" onClick={() => setPage('harvest')}><ArrowUpRight size={18}/></button></div><div className="maturity-content"><div className="donut"><ResponsiveContainer width="100%" height={190}><PieChart><Pie data={maturity} dataKey="value" innerRadius={65} outerRadius={82} paddingAngle={5} cornerRadius={5} stroke="none" isAnimationActive={enabled}>{maturity.map((d,i)=><Cell key={d.name} fill={colors[i]}/>)}</Pie><Tooltip contentStyle={chartTooltip}/></PieChart></ResponsiveContainer><div className="donut-center"><b><Count value={FIELDS.length}/></b><span>监测地块</span></div></div><div className="maturity-legend">{maturity.map((d,i)=><div key={d.name}><i style={{background:colors[i]}}/><span>{d.name}</span><b>{d.value/FIELDS.length*100}<small>%</small></b></div>)}</div></div><button className="harvest-note" onClick={() => setPage('harvest')}><Cherry size={18}/><span><b>把握最佳采摘窗口</b><small>B2 蔬菜成熟度 94% · 查看规划</small></span><ChevronRight size={17}/></button></section>
    </div>
    <div className="dashboard-lower-grid">
      <section className="panel"><div className="panel-heading"><h3><ShieldAlert size={17}/>田间预警</h3><button className="text-btn" onClick={() => setPage('alerts')}>全部 <ArrowUpRight size={14}/></button></div><div className="alert-preview">{pending.slice(0,3).map(a=><button key={a.id} onClick={()=>setPage('alerts')}><span className={`signal ${a.level==='高风险'?'red':'orange'}`}/><div><b>{a.title}</b><small>{a.field} · {a.source}</small></div><span className={`risk-pill ${a.level==='高风险'?'high':'medium'}`}>{a.level}</span></button>)}{pending.length===0 && <p className="empty-state">全部预警已完成处置</p>}</div></section>
      <section className="panel soil-preview"><div className="panel-heading"><h3><Waves size={17}/>土壤采样</h3><button className="text-btn" onClick={() => setPage('soil')}>报告 <ArrowUpRight size={14}/></button></div><div className="soil-preview-values"><div><b>{SAMPLES[0].ec}</b><small>EC · mS/cm</small></div><div><b>{SAMPLES[0].soilMoisture}</b><small>水分 · %</small></div><div><b>{SAMPLES[0].temperature}</b><small>温度 · °C</small></div></div><div className="soil-bands">{Array.from({length:34},(_,i)=><i key={i} style={{height:`${18+Math.sin(i*.24)*12+i%4*3}px`}}/>)}</div><p className="muted">巨龙村 · A1 水稻 <span>采样于 08:30</span></p></section>
      <section className="panel"><div className="panel-heading"><h3><ClipboardList size={17}/>近期农事</h3><button className="text-btn" onClick={()=>setPage('tasks')}>全部 <ArrowUpRight size={14}/></button></div><div className="schedule-preview">{today.filter(t=>t.status!=='done').slice(0,3).map(t=><div key={t.id}><button className="task-check" title="标记完成" onClick={()=>setTaskStatus(t.id,'done')}><Check size={12}/></button><div><b>{t.title}</b><small>{t.assignee} · {t.time}</small></div><span className="tiny-status">{t.status==='in-progress'?'进行中':'待完成'}</span></div>)}{today.every(t=>t.status==='done')&&<p className="empty-state">今日任务已全部完成</p>}</div></section>
    </div>
    <button className="inspection-banner" onClick={()=>setPage('inspection')}><span className="radar-orbit"><Bot size={24}/></span><span><small>AUTONOMOUS FIELD INSPECTION</small><b>让巡检走进每一行作物。</b></span><p>路径巡航 · 多光谱采集 · 田间决策</p><span className="text-btn">开启巡检演示 <ArrowRight size={18}/></span></button>
  </div>
}
