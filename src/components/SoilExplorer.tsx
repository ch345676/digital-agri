import { useId, useState } from 'react'
import { ChevronRight, CircleCheck, AlertCircle } from 'lucide-react'
import { soilMetrics, soilScore, type SoilSample } from '../agronomy'
import { metricPosition } from '../insight-model'
import { Count } from './Motion'
const SYMBOLS=['°C','H₂O','EC','pH','N','P','K','OM']
export default function SoilExplorer({sample}:{sample:SoilSample}){
 const [selected,setSelected]=useState(1)
 const uid=useId().replaceAll(':','')
 const metrics=soilMetrics(sample),metric=metrics[selected],position=metricPosition(metric.value,metric.range)
 const focus=selected<2?'water':selected<4?'balance':'nutrient'
 const warnings=metrics.filter(m=>m.warning)
 return <section className="soil-explorer panel">
  <div className="soil-visual"><div className="soil-visual-heading"><span className="insight-kicker">地块体检图谱</span><h2>{sample.id} · {sample.crop}</h2><span className="soil-score">综合评分 <b><Count value={soilScore(sample)}/></b><small>/ 100</small></span></div>
   <svg className="soil-illustration" data-focus={focus} viewBox="0 0 440 280" role="img" aria-label="作物与土壤结构示意，非实测土层剖面">
    <defs><linearGradient id={uid+'soil'} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#bda77c"/><stop offset="1" stopColor="#7c6648"/></linearGradient><linearGradient id={uid+'leaf'} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#8fab64"/><stop offset="1" stopColor="#3a694d"/></linearGradient></defs>
    <ellipse cx="222" cy="257" rx="164" ry="13" fill="#34583e" opacity=".08"/>
    <path d="M49 134L219 94L390 135L219 177Z" fill="#aebd7e"/><path d="M49 134L219 177V256L49 207Z" fill={'url(#'+uid+'soil)'}/><path d="M219 177L390 135V207L219 256Z" fill="#907851"/>
    <path d="M49 157L219 203L390 160M49 184L219 229L390 186" fill="none" stroke="#d5c7a6" strokeWidth="2" opacity=".48"/>
    <path className="soil-active-layer" d="M49 134L219 177L390 135" fill="none" stroke="#b1cb82" strokeWidth="6"/>
    {Array.from({length:16},(_,i)=><circle key={i} cx={70+(i%8)*17} cy={163+Math.floor(i/8)*32+(i%3)*4} r={i%2?1.4:2} fill="#efdcba" opacity=".45"/>)}
    <g className="soil-root-system" fill="none" stroke="#e9dcc0" strokeWidth="2" strokeLinecap="round"><path d="M220 135L219 222M220 160L187 187L161 195M219 177L246 198L267 214M219 195L194 214L182 236M205 178L199 197M235 190L252 184M188 189L179 209"/></g>
    <g className="soil-water-paths" fill="none" stroke="#9ed9dc" strokeWidth="2"><path d="M122 136L145 156L170 163L205 177"/><path d="M313 137L285 162L258 176L226 186"/><path d="M310 189L281 204L250 219L221 230"/></g>
    <path d="M219 138V54" stroke="#496f43" strokeWidth="5" strokeLinecap="round"/>
    <path d="M220 91C171 98 151 73 144 44C180 43 208 51 220 91Z" fill={'url(#'+uid+'leaf)'}/><path d="M220 74C224 28 258 20 285 23C279 52 252 76 220 74Z" fill={'url(#'+uid+'leaf)'}/><path d="M219 115C253 86 280 87 302 91C285 123 250 132 219 115Z" fill={'url(#'+uid+'leaf)'}/><path d="M151 48L215 88M278 28L223 70M294 95L222 115" stroke="#d3dfaa" opacity=".6" fill="none"/>
    <g className="soil-nutrient-nodes">{[{x:88,y:197,t:'N'},{x:331,y:179,t:'P'},{x:298,y:225,t:'K'}].map(n=><g key={n.t}><circle cx={n.x} cy={n.y} r="15" fill="#f3f3dc" stroke="#bccb96"/><text x={n.x} y={n.y+5} textAnchor="middle" fontSize="14" fill="#4c6b42" fontWeight="600">{n.t}</text></g>)}</g>
    <g className="soil-balance-node"><circle cx="355" cy="85" r="27" fill="#f5f6e7" stroke="#c2d19e"/><text x="355" y="82" textAnchor="middle" fontSize="11" fill="#778766">pH</text><text x="355" y="101" textAnchor="middle" fontSize="18" fill="#3c6448">{sample.ph}</text></g>
   </svg><div className="soil-visual-footer"><span><i className={warnings.length?'warning':''}/>{warnings.length?`${warnings.length} 项待复核`:'8 项指标均在参考范围内'}</span><small>结构示意 · 非实测剖面</small></div>
  </div>
  <div className="soil-inspector"><div className="panel-heading"><div><span className="insight-kicker">点选指标，查看所在区间</span><h3>土壤指标透视</h3></div><span className="insight-badge">{selected+1} / 8</span></div><div className="soil-metric-picker" aria-label="选择土壤指标">{metrics.map((m,i)=><button key={m.name} onClick={()=>setSelected(i)} aria-pressed={selected===i} className={`${selected===i?'selected':''} ${m.warning?'warning':''}`}><b>{SYMBOLS[i]}</b><span>{m.name}</span>{m.warning&&<i/>}</button>)}</div>
   <div className="soil-metric-detail" key={metric.name}><div className="metric-detail-title"><span>{metric.name}</span><span className={`risk-pill ${metric.warning?'medium':'normal'}`}>{position.direction}</span></div><div className="metric-detail-value"><Count value={metric.value} decimals={Number.isInteger(metric.value)?0:selected===2?2:1}/><small>{metric.unit}</small></div><div className="reference-scale"><span className="reference-band" style={{left:`${position.start}%`,width:`${position.width}%`}}/><i style={{left:`${Math.min(97,Math.max(3,position.pin))}%`}}/><div><span>{position.min.toFixed(1)}</span><span>{position.max.toFixed(1)}</span></div></div><p className="reference-caption">绿色刻度：演示参考范围 {metric.range} {metric.unit}</p>
   <div className={`metric-explanation ${metric.warning?'warning':''}`}>{metric.warning?<AlertCircle size={19}/>:<CircleCheck size={19}/>}<div><b>{metric.warning?`比参考${position.direction==='偏高'?'上':'下'}限${position.direction==='偏高'?'高':'低'} ${+position.difference.toFixed(2)} ${metric.unit}`:'当前读数在演示参考范围内'}</b><p>{metric.warning?'偏离原因尚待确认。建议核对采样时间与位置，复测后再决定后续农事。':'可结合历史采样观察变化；单次读数不代表长期趋势。'}</p></div></div></div>
   <button className="text-btn next-metric" onClick={()=>setSelected((selected+1)%metrics.length)}>查看下一项指标 <ChevronRight size={15}/></button>
  </div>
 </section>
}
