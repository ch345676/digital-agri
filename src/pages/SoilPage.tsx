import { useState } from 'react'
import { Download, Printer, FlaskConical, ArrowRight, CheckCircle2, ClipboardCheck, History, MapPinned } from 'lucide-react'
import { SAMPLES, soilMetrics, soilScore, downloadCSV } from '../agronomy'
import { PageHeader } from '../components/bits'
import SoilExplorer from '../components/SoilExplorer'
import { useStore, todayStr, nowTimeStr } from '../store'

export default function SoilPage(){
 const [id,setId]=useState(()=>{try{const chosen=sessionStorage.getItem('huinong-soil-field');return SAMPLES.some(s=>s.id===chosen)?chosen!:'A1'}catch{return 'A1'}})
 const {addTask,tasks,setPage,settings}=useStore()
 const sample=SAMPLES.find(s=>s.id===id)!,metrics=soilMetrics(sample),warnings=metrics.filter(m=>m.warning)
 const title=`${id} 土壤异常复核`,created=tasks.some(t=>t.title===title&&t.date===todayStr())
 const create=()=>{if(!created)addTask({title,type:'日常任务',assignee:'杨白露',date:todayStr(),time:nowTimeStr()})}
 const history=()=>{try{sessionStorage.setItem('huinong-history-field',id)}catch{/* optional navigation context */}setPage('history')}
 return <div className="soil-page insights-page"><PageHeader title="土壤分析报告" desc="从土壤图谱到指标位置，把异常读数变成可复核的清单。" extra={<div className="action-row"><button className="secondary-btn" onClick={()=>downloadCSV(`${id}-土壤报告-${todayStr()}.csv`,[['惠农土壤报告','演示数据',sample.village,id,sample.sampled],['指标','数值','单位','示例参考范围','状态'],...metrics.map(m=>[m.name,m.value,m.unit,m.range,m.warning?'关注':'正常'])])}><Download size={16}/>导出 CSV</button><button className="primary-btn" onClick={()=>window.print()}><Printer size={16}/>打印报告</button></div>}/>
  <div className="field-tabs" aria-label="选择采样地块">{SAMPLES.map(s=><button className={id===s.id?'active':''} aria-pressed={id===s.id} key={s.id} onClick={()=>setId(s.id)}><span>{s.village}</span><small>{s.id} · {s.crop}</small></button>)}</div>
  <SoilExplorer sample={sample}/>
  <p className="soil-score-method">演示综合评分 {soilScore(sample)} / 100：96 − 异常项数 × 9。参考范围用于功能演示，实际使用需按作物与土质校准。</p>
  <div className="report-grid"><section className="panel report-table"><div className="panel-heading"><div><span className="insight-kicker">完整检测记录</span><h3>土壤成分分析</h3></div><span className="green-chip"><FlaskConical size={13}/>8 项指标</span></div><div className="sample-meta">{settings.farmName} / {sample.village} / {sample.name}<br/>采样时间：{sample.sampled} · 演示样本</div><table><thead><tr><th>检测指标</th><th>检测结果</th><th>示例范围</th><th>状态</th></tr></thead><tbody>{metrics.map((m,i)=><tr key={m.name} className={m.warning?'soil-warning-row':''}><td><span className="element-symbol">{['°C','H₂O','EC','pH','N','P','K','OM'][i]}</span>{m.name}</td><td><b>{m.value}</b><small>{m.unit}</small></td><td>{m.range}</td><td><span className={`risk-pill ${m.warning?'medium':'normal'}`}>{m.warning?'关注':'正常'}</span></td></tr>)}</tbody></table></section>
  <aside className="report-aside soil-workflow"><section className="panel"><div className="panel-heading"><h3><ClipboardCheck size={19}/>复核与跟进</h3><span className="insight-badge">{warnings.length} 项</span></div>{warnings.length?<div className="soil-warning-list">{warnings.map(m=><div key={m.name}><span className="signal orange"/><div><b>{m.name} · {m.value} {m.unit}</b><small>参考 {m.range} {m.unit}</small></div></div>)}</div>:<div className="soil-all-clear"><CheckCircle2 size={28}/><b>本次无偏离指标</b><p>保留本次采样作为对照，继续观察后续变化。</p></div>}<ol className="followup-steps"><li><span>01</span><div><b>核对采样记录</b><p>{sample.village} · {id}<br/>{sample.sampled}</p></div></li><li><span>02</span><div><b>{warnings.length?'安排现场复测':'保持定期监测'}</b><p>{warnings.length?'核对仪器与采样条件，记录复测结果。':'以相同采样条件记录下一次结果。'}</p></div></li><li><span>03</span><div><b>对照历史变化</b><p>回看同一地块的水分、EC 和温度。</p></div></li></ol>{warnings.length>0&&<button className="primary-btn" onClick={create} disabled={created}>{created?<><CheckCircle2 size={16}/>已创建复核任务</>:'创建复核任务'}</button>}<button className="secondary-btn" onClick={history}><History size={16}/>查看土壤历史 <ArrowRight size={15}/></button></section><section className="panel soil-context-note"><MapPinned size={22}/><h3>把记录放回田间</h3><p>图谱用于查看指标关系，地块详情用于核对位置、作物与农事记录。</p><button className="text-btn" onClick={()=>setPage('map')}>打开农场地图 <ArrowRight size={15}/></button></section></aside></div>
 </div>
}
