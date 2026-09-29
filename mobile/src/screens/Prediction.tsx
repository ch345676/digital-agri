import { useState } from 'react'
import { motion } from 'framer-motion'
import { SlidersHorizontal, RotateCcw, ChevronDown } from 'lucide-react'
import { Reveal, Disclosure } from '../components/motion'
import { CountUp } from '../components/anim'
import { PageHeader, FieldSelect, InteractiveChart } from '../components/workflow'
import { useFarm } from '../FarmContext'
import { FIELDS } from '../farm-data'
import { fieldById } from '../workflow-model'

const BASE: Record<string,number> = {A1:640,A2:720,B1:210,B2:1800,C1:480}
const STAGES = ['播种','幼苗','生长','旺长期','灌浆 / 成熟','收获']

export default function Prediction(){
 const {activeField,selectField,openField}=useFarm()
 const field=fieldById(activeField)
 const [water,setWater]=useState(0),[sun,setSun]=useState(0),[compare,setCompare]=useState(true),[help,setHelp]=useState(false)
 const factor=Math.max(.6,1+water*.003+sun*.002),yieldPerMu=Math.round(BASE[field.id]*factor)
 const values=[.05,.18,.4,.65,.88,1].map(v=>Math.round(v*yieldPerMu))
 const previous=[.05,.18,.4,.65,.88,1].map(v=>Math.round(v*BASE[field.id]*.94))
 return <div className="work-page"><PageHeader title="产量情景预测" sub="调整参数，观察模拟结果"/>
  <FieldSelect value={activeField} onChange={selectField}/>
  <Reveal className="work-card"><button className="text-link" onClick={()=>openField(field.id)}>{field.id} {field.crop} · {field.variety} →</button><p className="muted">{field.area} 亩 · {field.stageName} · 示例农季档案</p><div className="prediction-metrics"><div><small>模拟亩产</small><b><CountUp to={yieldPerMu}/> <em>kg / 亩</em></b></div><div><small>全地块模拟产量</small><b><CountUp to={yieldPerMu*field.area/1000} decimals={1}/> <em>吨</em></b></div></div><p className="muted">档案计划收获：{field.harvest}</p></Reveal>
  <Reveal className="work-card"><div className="row-between"><h2>生长与产量曲线</h2><label className="check-label"><input type="checkbox" checked={compare} onChange={e=>setCompare(e.target.checked)}/>对比基准</label></div><InteractiveChart values={values} labels={STAGES} unit=" kg/亩" compare={compare?previous:undefined}/><p className="muted">滑动图表查看各阶段 · 虚线为对比样例</p></Reveal>
  <Reveal className="work-card"><div className="row-between"><h2><SlidersHorizontal size={18}/>情景试算</h2><button className="text-link" onClick={()=>{setWater(0);setSun(0)}}><RotateCcw size={15}/>重置</button></div><label className="slider-label">灌溉条件变化 <b>{water>0?'+':''}{water}%</b><input aria-label="灌溉条件变化" type="range" min="-30" max="30" value={water} onChange={e=>setWater(Number(e.target.value))}/></label><label className="slider-label">日照条件变化 <b>{sun>0?'+':''}{sun}%</b><input aria-label="日照条件变化" type="range" min="-30" max="30" value={sun} onChange={e=>setSun(Number(e.target.value))}/></label><div className="prediction-impact">相对当前基准 <motion.b key={yieldPerMu} initial={{opacity:0,y:6}} animate={{opacity:1,y:0}}>{factor>=1?'+':''}{((factor-1)*100).toFixed(1)}%</motion.b></div></Reveal>
  <Reveal className="work-card"><h2>五块田 · 模拟亩产</h2><div className="prediction-fields">{FIELDS.map(f=><button key={f.id} onClick={()=>selectField(f.id)} aria-pressed={f.id===field.id}><span>{f.id} {f.crop}</span><b>{BASE[f.id]} kg</b><i><motion.span animate={{width:`${BASE[f.id]/1800*100}%`}}/></i></button>)}</div></Reveal>
  <Reveal className="work-card"><button className="row-between full-width" aria-expanded={help} onClick={()=>setHelp(v=>!v)}><h2>试算说明</h2><ChevronDown size={18} style={{transform:help?'rotate(180deg)':undefined}}/></button><Disclosure open={help}><p className="muted">基础亩产和比较值均为演示样例，按“基础值 ×（1 + 灌溉变化 × 0.003 + 日照变化 × 0.002）”计算，未接入产量模型或真实农情预测。</p></Disclosure></Reveal>
 </div>
}
