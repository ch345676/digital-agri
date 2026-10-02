import { useState } from 'react'
import { Plus, ArrowRight, GitCompareArrows } from 'lucide-react'
import { useStore, todayStr } from '../store'
import { SAMPLES, soilMetrics } from '../agronomy'
import { SAMPLE_NAMES, SAMPLE_UNITS, SAMPLE_LIMITS, validSample } from '../workflow-model'
import { Modal } from './bits'
import { sampleFromRecord } from '../sample-model'

export default function SoilComparison({fieldId}: {fieldId:string}) {
  const { workflow, addSample, openField, selectDate } = useStore()
  const records = workflow.samples.filter(s=>s.fieldId===fieldId).sort((a,b)=>b.at.localeCompare(a.at))
  const [beforeId,setBefore] = useState(records[1]?.id || records[0]?.id || '')
  const [afterId,setAfter] = useState(records[0]?.id || '')
  const before=records.find(s=>s.id===beforeId)||records[1]||records[0],after=records.find(s=>s.id===afterId)||records[0]
  const base=SAMPLES.find(s=>s.id===fieldId)!
  const left=soilMetrics(sampleFromRecord(base,before)),right=soilMetrics(sampleFromRecord(base,after))
  const [open,setOpen]=useState(false),[at,setAt]=useState(todayStr()+'T09:00'),[note,setNote]=useState('')
  const [values,setValues]=useState<string[]>([])
  const add=()=>{setValues(right.map(m=>String(m.value)));setNote('');setAt(todayStr()+'T09:00');setOpen(true)}
  const submit=()=>{if(addSample({fieldId,at,values:values.map(Number),note})){setOpen(false);selectDate(at.slice(0,10));setAfter('')}}
  const same=before?.id===after?.id, chronological=!!before&&!!after&&before.at<after.at
  return <section className="panel soil-comparison"><div className="panel-heading"><div><span className="insight-kicker">以记录比较，以复测确认</span><h3><GitCompareArrows size={18}/>两次采样对照</h3></div><button className="primary-btn" onClick={add}><Plus size={15}/>录入复测</button></div>
    <div className="comparison-selects"><label>基准采样<select aria-label="基准采样" value={before?.id||''} onChange={e=>setBefore(e.target.value)}>{records.map(s=><option key={s.id} value={s.id}>{s.at.replace('T',' ')} · {s.origin==='demo'?'示例':'录入'}</option>)}</select></label><ArrowRight size={18}/><label>对照采样<select aria-label="对照采样" value={after?.id||''} onChange={e=>setAfter(e.target.value)}>{records.map(s=><option key={s.id} value={s.id}>{s.at.replace('T',' ')} · {s.origin==='demo'?'示例':'录入'}</option>)}</select></label></div>
    {(!chronological||same)&&<p className="inline-notice">{same?'当前选择同一条记录，差值为零。':'对照采样早于或等于基准采样；以下差值仍按“对照 − 基准”计算。'}</p>}
    <div className="sample-differences">{right.map((m,i)=>{const old=left[i],delta=+(m.value-old.value).toFixed(2),max=Math.max(old.value,m.value,1);return <div className="sample-difference" key={m.name} data-motion-key={`${before?.id}-${after?.id}-${i}`}><div><b>{m.name}</b><span>{old.value} → {m.value} <small>{m.unit}</small></span><strong className={m.warning?'warning':''}>{delta>0?'+':''}{delta}{m.unit==='%'?' 个百分点':' '+m.unit}</strong></div><div className="paired-bars" aria-hidden="true"><i style={{width:old.value/max*100+'%'}}/><i style={{width:m.value/max*100+'%'}}/></div><small>{same?'同一条采样':old.warning&&m.warning?'两次采样均偏离，建议继续复核':m.warning?'对照采样偏离参考范围':'对照采样在参考范围内'}</small></div>})}</div>
    <div className="comparison-notes"><span>浅色为基准，深色为对照；每项使用相同刻度，跨指标不比较条长。</span><button className="text-btn" onClick={()=>{if(after)selectDate(after.at.slice(0,10));openField('history',fieldId)}}>查看关联农事 <ArrowRight size={14}/></button></div>
    <Modal open={open} title={`${fieldId} · 录入土壤复测`} onClose={()=>setOpen(false)} width="w-[620px]"><form className="sample-entry" onSubmit={e=>{e.preventDefault();submit()}}><p>将现场复测结果记入本机。示例值已填入，请核对后修改。</p><label className="form-label">采样时间<input aria-label="采样时间" type="datetime-local" max={todayStr()+'T23:59'} required value={at} onChange={e=>setAt(e.target.value)}/></label><div className="sample-input-grid">{SAMPLE_NAMES.map((name,i)=><label className="form-label" key={name}>{name} {SAMPLE_UNITS[i]}<input aria-label={`复测${name}`} required type="number" step="any" min={SAMPLE_LIMITS[i][0]} max={SAMPLE_LIMITS[i][1]} value={values[i]||''} onChange={e=>setValues(v=>v.map((x,j)=>j===i?e.target.value:x))}/></label>)}</div><label className="form-label">采样说明<textarea aria-label="采样说明" required value={note} maxLength={1200} onChange={e=>setNote(e.target.value)} placeholder="位置、仪器、采样条件及记录人"/></label><button className="primary-btn" disabled={!note.trim()||!values.every(v=>v.trim())||!validSample(values.map(Number))}>保存复测记录</button></form></Modal>
  </section>
}
