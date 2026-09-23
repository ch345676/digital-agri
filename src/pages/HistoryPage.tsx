import { useState } from 'react'
import { Download, Droplets, Thermometer, FlaskConical } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea } from 'recharts'
import { SAMPLES, soilHistory, downloadCSV } from '../agronomy'
import { PageHeader } from '../components/bits'
import { useMotion } from '../components/motion-context'
import { chartTooltip } from '../components/chart-theme'

export default function HistoryPage() {
  const [range,setRange]=useState(7)
  const [field,setField]=useState('A1')
  const {enabled}=useMotion()
  const data=soilHistory(field,range)
  const sample=SAMPLES.find(s=>s.id===field)!
  return <div><PageHeader title="数据复盘" desc="从一次采样到一段趋势，让田间变化清晰可见。" extra={<button className="secondary-btn" onClick={()=>downloadCSV(`${field}-${range}天土壤历史.csv`,[['演示数据',sample.village,field],['日期','EC (mS/cm)','水分 (%)','温度 (°C)'],...data.map(d=>[d.date,d.ec,d.moisture,d.temperature])])}><Download size={16}/>导出数据</button>}/><div className="history-toolbar"><div className="segmented">{[[7,'7 天'],[30,'30 天'],[60,'全部 · 60 天']].map(([n,label])=><button key={n} className={range===n?'active':''} aria-pressed={range===n} onClick={()=>setRange(Number(n))}>{label}</button>)}</div><label>监测地块<select value={field} onChange={e=>setField(e.target.value)}>{SAMPLES.map(s=><option key={s.id} value={s.id}>{s.village} · {s.id} {s.crop}</option>)}</select></label></div><div className="history-summary"><span className="status-dot"/>{data[0].date} — {data.at(-1)!.date}<span>{data.length} 条样本 / 每日一次 · 演示历史</span></div><div className="history-charts">{[{key:'ec',name:'EC 趋势',unit:'mS/cm',color:'#b0dd75',icon:FlaskConical},{key:'moisture',name:'水分趋势',unit:'%',color:'#65cabe',icon:Droplets},{key:'temperature',name:'温度趋势',unit:'°C',color:'#e0b77b',icon:Thermometer}].map(m=>{const key=m.key as 'ec'|'moisture'|'temperature'; const values=data.map(d=>d[key]); return <section className="panel" key={m.key}><div className="panel-heading"><h3><m.icon size={18} style={{color:m.color}}/>{m.name}<small>{m.unit}</small></h3><div className="chart-reading"><b style={{color:m.color}}>{data.at(-1)![key]}</b><small>最新采样</small></div></div><ResponsiveContainer width="100%" height={220}><AreaChart syncId="soil-history" data={data} margin={{top:15,right:16,left:-12,bottom:0}}><defs><linearGradient id={`history-${m.key}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={m.color} stopOpacity={.25}/><stop offset="100%" stopColor={m.color} stopOpacity={0}/></linearGradient></defs><CartesianGrid vertical={false} stroke="#2b4034" strokeDasharray="3 6"/><XAxis dataKey="label" tick={{fill:'#92a996',fontSize:11}} minTickGap={35} axisLine={false} tickLine={false}/><YAxis domain={['auto','auto']} tick={{fill:'#92a996',fontSize:11}} axisLine={false} tickLine={false}/><ReferenceArea y1={key==='ec'?1:key==='temperature'?18:sample.crop==='水稻'?70:55} y2={key==='ec'?1.7:key==='temperature'?28:sample.crop==='水稻'?90:75} ifOverflow="extendDomain" fill="#aec58c" fillOpacity={.12}/><Tooltip cursor={{stroke:'#81956e',strokeDasharray:'4 4'}} contentStyle={chartTooltip}/><Area type="monotone" dataKey={key} name={m.name} unit={m.unit} stroke={m.color} strokeWidth={2.5} fill={`url(#history-${m.key})`} isAnimationActive={enabled} animationDuration={900}/></AreaChart></ResponsiveContainer><div className="history-range"><span>浅绿区域：演示参考范围</span>区间范围 <b>{Math.min(...values).toFixed(key==='ec'?2:1)} – {Math.max(...values).toFixed(key==='ec'?2:1)} {m.unit}</b></div></section>})}</div></div>
}


