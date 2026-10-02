import { useState } from 'react'
import { Save, Trash2 } from 'lucide-react'
import { useStore } from '../store'
import { resourceScenario } from '../insight-model'
import type { SavedScenario } from '../workflow-model'
type Draft = Omit<SavedScenario,'id'|'at'|'name'>
export default function ScenarioCompare({draft,onLoad}:{draft:Draft;onLoad:(p:SavedScenario)=>void}) {
  const {workflow,saveScenario,deleteScenario}=useStore()
  const [name,setName]=useState(''),[selected,setSelected]=useState<string[]>([])
  const plans=workflow.scenarios.filter(p=>selected.includes(p.id)).slice(0,3)
  return <section className="scenario-library"><div className="panel-heading"><h3>保存与比较方案</h3><span>最多并排对比 3 个方案</span></div><form className="scenario-save" onSubmit={e=>{e.preventDefault();if(name.trim()){saveScenario({...draft,name:name.trim()});setName('')}}}><input aria-label="方案名称" placeholder="例如：A1 本月节水方案" maxLength={60} value={name} onChange={e=>setName(e.target.value)}/><button className="secondary-btn" disabled={!name.trim()}><Save size={14}/>保存当前方案</button></form><div className="scenario-list">{workflow.scenarios.map(p=><div key={p.id}><label><input type="checkbox" aria-label={'比较方案 '+p.name} checked={selected.includes(p.id)} disabled={!selected.includes(p.id)&&selected.length>=3} onChange={e=>setSelected(s=>e.target.checked?[...s,p.id]:s.filter(x=>x!==p.id))}/><span>{p.name}<small>{p.period} · {p.at.slice(0,10)}</small></span></label><button className="text-btn" onClick={()=>onLoad(p)}>加载参数</button><button className="icon-btn" aria-label={'删除方案 '+p.name} onClick={()=>{deleteScenario(p.id);setSelected(s=>s.filter(x=>x!==p.id))}}><Trash2 size={14}/></button></div>)}</div>{!workflow.scenarios.length&&<p className="muted">保存参数与基准用量快照，之后可回看当时的测算。</p>}<div className="scenario-compare-grid">{plans.map(p=>{const s=resourceScenario(p.water,p.fertilizer,p.waterPrice,p.fertilizerPrice,p.waterReduction,p.fertilizerReduction);return <article key={p.id} data-motion-item={p.id}><h4>{p.name}</h4><span>{p.period}</span><dl><div><dt>基准投入</dt><dd>¥{s.baseline.toFixed(2)}</dd></div><div><dt>调整后</dt><dd>¥{s.next.toFixed(2)}</dd></div><div><dt>测算差额</dt><dd>¥{s.saving.toFixed(2)}</dd></div><div><dt>用水 / 肥料减量</dt><dd>{p.waterReduction}% / {p.fertilizerReduction}%</dd></div></dl><small>按该方案保存时的用量和单价计算，不代表增产或实际收益。</small></article>})}</div></section>
}
