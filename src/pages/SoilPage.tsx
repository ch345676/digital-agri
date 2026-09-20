import { SceneMedia } from '../components/SceneMedia'
import { useState } from 'react'
import { Download, Printer, FlaskConical, ArrowRight, Leaf, CheckCircle2 } from 'lucide-react'
import { SAMPLES, soilMetrics, soilScore, downloadCSV } from '../agronomy'
import { PageHeader } from '../components/bits'
import { Count } from '../components/Motion'
import { useStore, todayStr, nowTimeStr } from '../store'

export default function SoilPage() {
  const [id,setId]=useState('A1')
  const {addTask,tasks,setPage,settings}=useStore()
  const sample=SAMPLES.find(s=>s.id===id)!
  const metrics=soilMetrics(sample)
  const score=soilScore(sample)
  const warnings=metrics.filter(m=>m.warning)
  const title=`${id} 土壤异常复核`
  const created=tasks.some(t=>t.title===title && t.date===todayStr())
  const create=()=> {if(!created) addTask({title,type:'日常任务',assignee:'杨白露',date:todayStr(),time:nowTimeStr()})}
  return <div className="soil-page"><PageHeader title="土壤分析报告" desc="读懂土壤的每一个信号，为生长提供精准依据。" extra={<div className="action-row"><button className="secondary-btn" onClick={()=>downloadCSV(`${id}-土壤报告-${todayStr()}.csv`,[['惠农土壤报告','演示数据',sample.village,id,sample.sampled],['指标','数值','单位','示例参考范围','状态'],...metrics.map(m=>[m.name,m.value,m.unit,m.range,m.warning?'关注':'正常'])])}><Download size={16}/>导出 CSV</button><button className="primary-btn" onClick={()=>window.print()}><Printer size={16}/>打印报告</button></div>}/>
    <div className="field-tabs" aria-label="选择采样地块">{SAMPLES.map(s=><button className={id===s.id?'active':''} key={s.id} onClick={()=>setId(s.id)}><span>{s.village}</span><small>{s.id} · {s.crop}</small></button>)}</div>
    <div className="report-grid" key={id}><section className="panel report-table"><div className="panel-heading"><div><span className="eyebrow">SOIL COMPOSITION</span><h3>土壤成分分析</h3></div><span className="green-chip"><FlaskConical size={13}/>8 项指标</span></div><div className="sample-meta">{settings.farmName} / {sample.village} / {sample.name}<br/>采样时间：{sample.sampled} · 演示样本</div><table><thead><tr><th>检测指标</th><th>检测结果</th><th>示例范围</th><th>状态</th></tr></thead><tbody>{metrics.map((m,i)=><tr key={m.name}><td><span className="element-symbol">{['°C','H₂O','EC','pH','N','P','K','OM'][i]}</span>{m.name}</td><td><b>{m.value}</b><small>{m.unit}</small></td><td>{m.range}</td><td><span className={`risk-pill ${m.warning?'medium':'normal'}`}>{m.warning?'关注':'正常'}</span></td></tr>)}</tbody></table></section>
      <aside className="report-aside"><section className="panel health-panel"><span className="eyebrow">SOIL HEALTH INDEX</span><h3>土壤综合评估</h3><div className="health-ring"><svg viewBox="0 0 200 200"><circle cx="100" cy="100" r="83"/><circle cx="100" cy="100" r="83" style={{strokeDasharray:522,strokeDashoffset:522*(1-score/100)}}/></svg><div><b><Count value={score}/></b><span>/ 100 分</span></div></div><span className="green-chip">{warnings.length ? '需要关注' : '状态良好'}</span><p>{warnings.length?`${warnings.map(m=>m.name).join('、')}偏离示例范围，建议现场复测。`:'各项检测值均在示例参考范围内，建议保持常规监测。'}</p><small>演示评分：96 − 异常项数 × 9<br/>参考范围仅用于功能演示，实际应按作物与土质校准。</small></section><section className="panel recommendation"><SceneMedia image="./media/glass/soil.jpg" video="./media/glass/soil.mp4" label="土壤光谱采样" className="report-media" controls/><Leaf size={23}/><h3>把分析变成行动</h3><p>{sample.soilMoisture<55?'水分偏低，建议先复核墒情，再安排灌溉。':sample.ec>1.7?'EC 偏高，建议复测并核对近期水肥作业记录。':'保存本次采样，结合历史趋势观察土壤变化。'}</p>{warnings.length>0&&<button className="primary-btn" onClick={create} disabled={created}>{created?<><CheckCircle2 size={15}/>已创建复核任务</>:'创建复核任务'}</button>}<button className="text-btn" onClick={()=>setPage('history')}>查看土壤历史 <ArrowRight size={15}/></button></section></aside></div>
  </div>
}
