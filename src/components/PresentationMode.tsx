import { useEffect, useRef, useState } from 'react'
import { MonitorPlay, Maximize, Pause, Play, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { useStore, type PageKey } from '../store'
import { useMotion } from './motion-context'
import { feedback } from '../feedback'
import { usePresence } from './use-presence'
const scenes: { page:PageKey; label:string; title:string; text:string; focus?:string; action?:boolean }[] = [
  {page:'alerts',label:'发现异常',title:'A2 · 一条 EC 预警',text:'从预警证据开始，查看来源与地块，明确需要复核的问题。',focus:'A02'},
  {page:'map',label:'定位田块',title:'让风险回到具体位置',text:'地图聚焦 A2，侧栏连接土壤、作业与设备，保持同一地块。',focus:'A02'},
  {page:'soil',label:'查看证据',title:'对照采样，理解偏离',text:'查看 EC 所在区间，再比较两次采样，必要时录入现场复测。'},
  {page:'alerts',label:'派发作业',title:'将发现交给负责人',text:'接管后在预警详情创建处置任务。任务完成后还要进行独立复核。',focus:'A02',action:true},
  {page:'tasks',label:'执行任务',title:'每一步操作，都能追踪',text:'开始或完成关联任务，查看状态反馈；误操作可使用撤销。',action:true},
  {page:'alerts',label:'复核结果',title:'用复测结果确认风险',text:'填写处置记录、复测结果和复核人，再决定通过或继续处理。',focus:'A02',action:true},
  {page:'history',label:'回看过程',title:'从曲线回到完整事件',text:'选中农事事件，联动日期和前后读数，回看这次处置留下的记录。'},
]
export default function PresentationMode() {
 const {page,context,openField,selectDate,alertStatus}=useStore(),{enabled}=useMotion()
 const [active,setActive]=useState(false),present=usePresence(active),[auto,setAuto]=useState(false),[seconds,setSeconds]=useState(12),[step,setStep]=useState(0)
 const previous=useRef({page,fieldId:context.fieldId,date:context.date,focusId:context.focusId}),ownsFullscreen=useRef(false),trigger=useRef<HTMLButtonElement>(null)
 const go=(index:number)=>{const next=Math.max(0,Math.min(scenes.length-1,index));setStep(next);setSeconds(12);openField(scenes[next].page,'A2',scenes[next].page==='alerts'?'':scenes[next].focus||'')}
 const finish=()=>{setActive(false);setAuto(false);selectDate(previous.current.date);openField(previous.current.page,previous.current.fieldId,previous.current.focusId);if(ownsFullscreen.current&&document.fullscreenElement)document.exitFullscreen().catch(()=>{});ownsFullscreen.current=false;requestAnimationFrame(()=>trigger.current?.focus())}
 const finishRef=useRef(finish),goRef=useRef(go);useEffect(()=>{finishRef.current=finish;goRef.current=go})
 useEffect(()=>{if(!active)return;const panel=document.querySelector('.story-controls');if(!panel)return;const measure=()=>document.documentElement.style.setProperty('--story-space',`${Math.ceil(panel.getBoundingClientRect().height)+32}px`);measure();const observer=new ResizeObserver(measure);observer.observe(panel);return()=>{observer.disconnect();document.documentElement.style.removeProperty('--story-space')}},[active])
 useEffect(()=>{document.documentElement.dataset.presenting=String(active);if(!active)return;const key=(e:KeyboardEvent)=>{if(e.key==='Escape'&&!document.querySelector('[role="dialog"]'))finishRef.current();else if(!(e.target as Element).closest('.presentation-controls'))setAuto(false)};const fullscreen=()=>{if(ownsFullscreen.current&&!document.fullscreenElement)finishRef.current()};const interact=(e:Event)=>{if(!(e.target as Element).closest('.presentation-controls'))setAuto(false)};document.addEventListener('keydown',key);document.addEventListener('fullscreenchange',fullscreen);document.addEventListener('pointerdown',interact);return()=>{document.documentElement.dataset.presenting='false';document.removeEventListener('keydown',key);document.removeEventListener('fullscreenchange',fullscreen);document.removeEventListener('pointerdown',interact)}},[active])
 useEffect(()=>{if(!active||!auto||!enabled)return;const timer=setTimeout(()=>{if(document.hidden){setAuto(false);return}if(seconds<=1){if(scenes[step].action||step===scenes.length-1){setAuto(false);return}goRef.current(step+1)}else setSeconds(v=>v-1)},1000);return()=>clearTimeout(timer)},[active,auto,enabled,seconds,step])
 const fullscreen=()=>{if(document.fullscreenElement)return;document.documentElement.requestFullscreen?.().then(()=>{ownsFullscreen.current=true}).catch(()=>feedback('浏览器未进入全屏，已保留展示布局'))}
 return <><button ref={trigger} className="icon-btn presentation-trigger" title="项目展示模式" aria-label="项目展示模式" onClick={()=>{previous.current={page,fieldId:context.fieldId,date:context.date,focusId:context.focusId};setActive(true);go(0)}}><MonitorPlay size={18}/></button>{present&&<div data-closing={!active} inert={!active} aria-hidden={!active} className="presentation-controls story-controls" role="region" aria-label="案例演示控制"><div className="story-narration"><span>惠农 · 地块案例 {step+1} / {scenes.length}</span><strong>{scenes[step].title}</strong><p>{scenes[step].text}</p><small>A2 演示预警当前状态：{alertStatus('A02')} · 需要提交的步骤由你接管操作</small></div><div className="presentation-scenes">{scenes.map((s,i)=><button key={s.label} aria-pressed={step===i} onClick={()=>go(i)}><small>0{i+1}</small>{s.label}</button>)}</div><div className="presentation-actions"><button aria-label="上一个演示步骤" disabled={step===0} onClick={()=>go(step-1)}><ChevronLeft size={16}/></button><button onClick={()=>{setAuto(v=>!v);setSeconds(12)}} disabled={!enabled}>{auto?<Pause size={15}/>:<Play size={15}/>}<span>{auto?seconds+' 秒后继续':'自动讲解'}</span></button><button aria-label="下一个演示步骤" disabled={step===scenes.length-1} onClick={()=>go(step+1)}><ChevronRight size={16}/></button><button onClick={()=>{setAuto(false);feedback('已暂停讲解，可直接操作当前页面')}}>接管操作</button><button onClick={fullscreen} aria-label="进入浏览器全屏"><Maximize size={17}/></button><button onClick={finish} aria-label="退出展示模式"><X size={18}/></button></div></div>}</>
}
