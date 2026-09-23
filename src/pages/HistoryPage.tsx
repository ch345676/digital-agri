import { useEffect, useState } from 'react'
import { Download, Play, Pause, ChevronLeft, ChevronRight, CalendarDays, Activity, ArrowUpRight } from 'lucide-react'
import { Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea, ReferenceLine, ComposedChart } from 'recharts'
import { SAMPLES, soilHistory, downloadCSV } from '../agronomy'
import { PageHeader } from '../components/bits'
import { Count } from '../components/Motion'
import { useMotion } from '../components/motion-context'
import { chartTooltip } from '../components/chart-theme'
import { HISTORY_METRICS, historyBounds, dayWarnings, type HistoryMetric } from '../insight-model'

export default function HistoryPage(){
 const [range,setRange]=useState(7)
 const [field,setField]=useState(()=>{try{const id=sessionStorage.getItem('huinong-history-field');return SAMPLES.some(s=>s.id===id)?id!:'A1'}catch{return 'A1'}})
 const [compare,setCompare]=useState('')
 const [metric,setMetric]=useState<HistoryMetric>('moisture')
 const [cursor,setCursor]=useState(6)
 const [playing,setPlaying]=useState(false)
 const {enabled}=useMotion()
 const data=soilHistory(field,range),sample=SAMPLES.find(s=>s.id===field)!
 const index=Math.min(cursor,data.length-1),day=data[index],first=data[0]
 const definition=HISTORY_METRICS.find(m=>m.key===metric)!
 const [low,high]=historyBounds(sample,metric)
 const compareId=compare===field?'':compare,comparison=compareId?soilHistory(compareId,range):[]
 const chartData=data.map((row,i)=>({...row,comparison:comparison[i]?.[metric]}))
 const chartValues=chartData.flatMap(d=>d.comparison===undefined?[d[metric]]:[d[metric],d.comparison])
 const chartDomain:[number,number]=[Math.min(low,...chartValues),Math.max(high,...chartValues)]
 const warningDays=data.filter(d=>dayWarnings(d,sample).length)
 const warnings=dayWarnings(day,sample)
 const average=data.reduce((sum,d)=>sum+d[metric],0)/data.length
 const activePlayback=playing&&enabled
 useEffect(()=>{
  if(!activePlayback)return
  const timer=setInterval(()=>{if(document.hidden)return;if(cursor>=range-1)setPlaying(false);else setCursor(cursor+1)},1000)
  return()=>clearInterval(timer)
 },[activePlayback,range,cursor])
 const selectDay=(i:number)=>{setCursor(i);setPlaying(false)}
 const changeRange=(n:number)=>{setRange(n);setCursor(n-1);setPlaying(false)}
 const changeField=(id:string)=>{setField(id);setCursor(range-1);setPlaying(false)}
 const togglePlay=()=>{if(activePlayback){setPlaying(false);return}if(index===range-1)setCursor(0);setPlaying(true)}
 return <div className="insights-page history-lab">
  <PageHeader title="数据复盘" desc="沿时间重新走进田间，定位波动、对照地块、回看每一次采样。" extra={<button className="secondary-btn" onClick={()=>downloadCSV(`${field}-${range}天土壤历史.csv`,[['演示数据',sample.village,field],['日期','EC (mS/cm)','水分 (%)','温度 (°C)'],...data.map(d=>[d.date,d.ec,d.moisture,d.temperature])])}><Download size={16}/>导出数据</button>}/>
  <div className="history-toolbar"><div className="segmented">{[[7,'7 天'],[30,'30 天'],[60,'全部 · 60 天']].map(([n,label])=><button key={n} className={range===n?'active':''} aria-pressed={range===n} onClick={()=>changeRange(Number(n))}>{label}</button>)}</div><label>监测地块<select value={field} onChange={e=>changeField(e.target.value)}>{SAMPLES.map(s=><option key={s.id} value={s.id}>{s.village} · {s.id} {s.crop}</option>)}</select></label></div>
  <div className="history-summary"><span className="status-dot"/>{data[0].date} — {data.at(-1)!.date}<span>{data.length} 条样本 / 每日一次 · 演示历史</span></div>
  <div className="replay-metrics">{HISTORY_METRICS.map(m=>{const delta=day[m.key]-first[m.key];return <button key={m.key} className={metric===m.key?'selected':''} aria-pressed={metric===m.key} onClick={()=>setMetric(m.key)}><span>{m.name}<ArrowUpRight size={15}/></span><b style={{color:m.color}}><Count value={day[m.key]} decimals={m.digits}/><small>{m.unit}</small></b><em>较区间首日 {delta>0?'+':''}{delta.toFixed(m.digits)} {m.key==='moisture'?'个百分点':m.unit}</em></button>})}</div>
  <div className="replay-layout"><section className="panel replay-chart"><div className="panel-heading"><div><span className="insight-kicker">时序回放</span><h3>{definition.name} · {sample.id} {sample.crop}</h3></div><label className="compare-picker">对比地块<select aria-label="对比地块" value={compareId} onChange={e=>setCompare(e.target.value)}><option value="">不对比</option>{SAMPLES.filter(s=>s.id!==field).map(s=><option key={s.id} value={s.id}>{s.id} {s.crop}</option>)}</select></label></div>
   <div className="replay-chart-legend"><span><i style={{background:definition.color}}/>{field} 采样值</span>{compareId&&<span><i className="dashed"/>{compareId} 对比值</span>}<small>参考范围仅适用于 {field} · {definition.unit}</small></div>
   <ResponsiveContainer width="100%" height={275}><ComposedChart data={chartData} margin={{top:12,right:16,left:-17,bottom:0}}><defs><linearGradient id="replay-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={definition.color} stopOpacity={.22}/><stop offset="100%" stopColor={definition.color} stopOpacity={0}/></linearGradient></defs><CartesianGrid vertical={false} strokeDasharray="3 6"/><XAxis dataKey="label" axisLine={false} tickLine={false} minTickGap={35}/><YAxis domain={chartDomain} axisLine={false} tickLine={false}/><ReferenceArea y1={low} y2={high} ifOverflow="hidden" fill="#a4bb84" fillOpacity={.12}/><Tooltip contentStyle={chartTooltip}/><Area type="monotone" dataKey={metric} name={`${field} ${definition.name}`} unit={definition.unit} stroke={definition.color} fill="url(#replay-fill)" strokeWidth={2.5} isAnimationActive={enabled} animationDuration={400}/>{compareId&&<Line type="monotone" dataKey="comparison" name={`${compareId} 对比`} unit={definition.unit} stroke="#a27e55" strokeWidth={2} strokeDasharray="5 4" dot={false} isAnimationActive={enabled} animationDuration={400}/>}<ReferenceLine x={day.label} stroke="#365a40" strokeDasharray="4 4"/></ComposedChart></ResponsiveContainer>
   <div className="replay-transport"><button className="replay-play" onClick={togglePlay} disabled={!enabled} aria-label={activePlayback?'暂停回放':'播放回放'} title={!enabled?'请先打开页面顶部的动画开关':undefined}>{activePlayback?<Pause size={17}/>:<Play size={17}/>}</button><button aria-label="前一天" disabled={index===0} onClick={()=>selectDay(index-1)}><ChevronLeft size={16}/></button><input aria-label="回放日期" type="range" min={0} max={range-1} value={index} onChange={e=>selectDay(Number(e.target.value))}/><button aria-label="后一天" disabled={index===range-1} onClick={()=>selectDay(index+1)}><ChevronRight size={16}/></button><span>{day.label}<small>{index+1} / {range}</small></span></div>
  </section><aside className="replay-day panel" aria-live="polite"><span className="insight-kicker">当日采样解读</span><h3><CalendarDays size={19}/>{day.date}</h3><div className={`day-status ${warnings.length?'attention':''}`}><Activity size={24}/><b>{warnings.length||'全部'}<small>{warnings.length?'项指标偏离参考范围':'指标在参考范围内'}</small></b></div><p>{warnings.length?`${warnings.map(m=>m.name).join('、')}需要复核。点击左侧指标查看变化及参考区间。`:'当日水分、EC 与温度均在演示参考范围内，可结合前后日期观察持续变化。'}</p><dl>{HISTORY_METRICS.map(m=><div key={m.key}><dt>{m.name}</dt><dd>{day[m.key]} <small>{m.unit}</small></dd></div>)}</dl><div className="day-insight"><b>当前区间 · {definition.name}</b><span>平均 {average.toFixed(definition.digits)} {definition.unit}</span><span>{warningDays.length} / {range} 天存在指标偏离</span></div><small className="insight-footnote">基于当前演示样本计算，不代表现场诊断。</small></aside></div>
  <section className="panel sampling-calendar"><div className="panel-heading"><div><span className="insight-kicker">从波动定位到日期</span><h3>采样日历</h3></div><span className="calendar-legend"><i/>正常 <i className="warning"/>需复核</span></div><p>点选日期联动上方读数与回放位置。颜色按该日三项指标是否超出参考范围显示。</p><div className="sampling-days" style={{gridTemplateColumns:`repeat(${range===7?7:10},minmax(0,1fr))`}}>{data.map((d,i)=>{const count=dayWarnings(d,sample).length;return <button key={d.date} className={`${count?'warning':''} ${index===i?'selected':''}`} aria-pressed={index===i} aria-label={`${d.date}，${count} 项需复核`} onClick={()=>selectDay(i)}><span>{d.label}</span><b>{count?`${count} 项`:'正常'}</b></button>})}</div></section>
 </div>
}
