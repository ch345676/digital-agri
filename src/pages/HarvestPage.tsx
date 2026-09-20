import { CROP_IMAGES } from '../media'
import { SceneMedia } from '../components/SceneMedia'
import { useState } from 'react'
import { Cherry, ArrowRight, CalendarDays, CheckCircle2, Leaf } from 'lucide-react'
import { HARVEST, SAMPLES } from '../agronomy'
import { useStore, todayStr } from '../store'
import { PageHeader, Modal } from '../components/bits'

export default function HarvestPage(){
  const {tasks,addTask,members}=useStore()
  const [selected,setSelected]=useState<typeof HARVEST[number]|null>(null)
  const [date,setDate]=useState(todayStr(1))
  const [assignee,setAssignee]=useState(members[0]?.name??'未分配')
  const [filter,setFilter]=useState('全部地块')
  const list=[...HARVEST].filter(h=>filter==='全部地块'||h.maturity>=85).sort((a,b)=>b.maturity-a.maturity)
  const planned=(h:typeof HARVEST[number])=>tasks.some(t=>t.title===`${h.id} ${h.crop}采摘计划`&&t.status!=='done')
  return <div><PageHeader title="采摘窗口规划" desc="看得见成熟的节奏，把好品质留在最好的时刻。"/><section className="harvest-hero"><div><span className="eyebrow">THE RIGHT MOMENT TO HARVEST</span><h2>丰收，恰逢其时。</h2><p>B2 蔬菜成熟度 94%，进入示例最佳采摘窗口。</p></div><Cherry size={84} strokeWidth={1}/><div><b>18.3 <small>亩</small></b><span>当前建议采摘面积</span></div></section><div className="history-toolbar"><div className="segmented">{['全部地块','可采摘'].map(f=><button key={f} className={filter===f?'active':''} onClick={()=>setFilter(f)}>{f}</button>)}</div><span className="muted">按成熟度排序 · 预测为演示值</span></div><div className="harvest-grid">{list.map(h=><section className="panel harvest-card" key={h.id}><SceneMedia image={CROP_IMAGES[h.id]} label={`${h.crop}采摘示意`} className="harvest-photo"/><div className="panel-heading"><span className="crop-glyph"><Leaf size={24}/></span><span className={`risk-pill ${h.maturity>=85?'normal':'medium'}`}>{h.maturity>=85?'最佳采摘期':h.maturity>=50?'接近成熟':'生长中'}</span></div><h3>{h.crop} <small>{h.id} 地块</small></h3><p>{SAMPLES.find(s=>s.id===h.id)?.village} · {h.variety} · {h.area} 亩</p><div className="maturity-score"><span>成熟度</span><b>{h.maturity}<small>%</small></b></div><div className="progress-track"><i style={{width:`${h.maturity}%`}}/></div><dl><div><dt><CalendarDays size={14}/>建议窗口</dt><dd>{todayStr(h.days).slice(5)} — {todayStr(h.days+2).slice(5)}</dd></div><div><dt>品质评分</dt><dd>{h.quality} / 100</dd></div><div><dt>预计亩产</dt><dd>{h.yieldPerMu} kg</dd></div></dl><button className={planned(h)?'secondary-btn':'primary-btn'} disabled={planned(h)} onClick={()=>{setSelected(h);setDate(todayStr(h.days))}}>{planned(h)?<><CheckCircle2 size={15}/>已加入农事任务</>:<>安排采摘 <ArrowRight size={15}/></>}</button></section>)}</div><p className="data-disclaimer">成熟度、日期、亩产均为演示预测；实际采摘应结合现场长势、天气与品质检测。新建计划将保存到任务管理。</p><Modal open={!!selected} title="安排采摘任务" onClose={()=>setSelected(null)}>{selected&&<div className="harvest-form"><h3>{selected.id} {selected.crop} · {selected.area} 亩</h3><label className="form-label">计划日期<input type="date" min={todayStr()} value={date} onChange={e=>setDate(e.target.value)}/></label><label className="form-label">负责人<select value={assignee} onChange={e=>setAssignee(e.target.value)}>{members.map(m=><option key={m.id}>{m.name}</option>)}</select></label><button className="primary-btn" disabled={!date||date<todayStr()} onClick={()=>{if(!planned(selected))addTask({title:`${selected.id} ${selected.crop}采摘计划`,type:'采收',assignee,date,time:'08:00'});setSelected(null)}}>确认创建采摘任务</button></div>}</Modal></div>
}
