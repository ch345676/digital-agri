import { useState } from 'react'
import { ChevronRight, CircleCheck, AlertCircle } from 'lucide-react'
import { soilMetrics, soilScore, type SoilSample } from '../agronomy'
import { metricPosition } from '../insight-model'
import { Count } from './Motion'
import SoilScene from './SoilScene'
const SYMBOLS=['°C','H₂O','EC','pH','N','P','K','OM']
export default function SoilExplorer({sample}:{sample:SoilSample}){
 const [selected,setSelected]=useState(1)
 const metrics=soilMetrics(sample),metric=metrics[selected],position=metricPosition(metric.value,metric.range)
 const warnings=metrics.filter(m=>m.warning)
 return <section className="soil-explorer panel">
  <div className="soil-visual"><div className="soil-visual-heading"><div className="soil-heading-copy"><span className="insight-kicker">地块体检图谱</span><h2>{sample.id} · {sample.crop}</h2></div><div className="soil-score"><span>综合评分</span><div><b><Count value={soilScore(sample)}/></b><small>/ 100</small></div></div></div>
   <SoilScene selected={selected} value={metric.value} unit={metric.unit} onSelect={setSelected}/><div className="soil-visual-footer"><span><i className={warnings.length?'warning':''}/>{warnings.length?`${warnings.length} 项待复核`:'8 项指标均在参考范围内'}</span><small>写实生成示意 · 非实测剖面</small></div>
  </div>
  <div className="soil-inspector"><div className="panel-heading"><div><span className="insight-kicker">点选指标，查看所在区间</span><h3>土壤指标透视</h3></div><span className="insight-badge">{selected+1} / 8</span></div><div className="soil-metric-picker" aria-label="选择土壤指标">{metrics.map((m,i)=><button key={m.name} onClick={()=>setSelected(i)} aria-pressed={selected===i} className={`${selected===i?'selected':''} ${m.warning?'warning':''}`}><b>{SYMBOLS[i]}</b><span>{m.name}</span>{m.warning&&<i/>}</button>)}</div>
   <div className="soil-metric-detail" key={metric.name}><div className="metric-detail-title"><span>{metric.name}</span><span className={`risk-pill ${metric.warning?'medium':'normal'}`}>{position.direction}</span></div><div className="metric-detail-value"><Count value={metric.value} decimals={Number.isInteger(metric.value)?0:selected===2?2:1}/><small>{metric.unit}</small></div><div className="reference-scale"><span className="reference-band" style={{left:`${position.start}%`,width:`${position.width}%`}}/><i style={{left:`${Math.min(97,Math.max(3,position.pin))}%`}}/><div><span>{position.min.toFixed(1)}</span><span>{position.max.toFixed(1)}</span></div></div><p className="reference-caption">绿色刻度：演示参考范围 {metric.range} {metric.unit}</p>
   <div className={`metric-explanation ${metric.warning?'warning':''}`}>{metric.warning?<AlertCircle size={19}/>:<CircleCheck size={19}/>}<div><b>{metric.warning?`比参考${position.direction==='偏高'?'上':'下'}限${position.direction==='偏高'?'高':'低'} ${+position.difference.toFixed(2)} ${metric.unit}`:'当前读数在演示参考范围内'}</b><p>{metric.warning?'偏离原因尚待确认。建议核对采样时间与位置，复测后再决定后续农事。':'可结合历史采样观察变化；单次读数不代表长期趋势。'}</p></div></div></div>
   <button className="text-btn next-metric" onClick={()=>setSelected((selected+1)%metrics.length)}>查看下一项指标 <ChevronRight size={15}/></button>
  </div>
 </section>
}
