import { ALERT_DEFS } from './lib/alerts'
import { createContext,useContext,useEffect,useMemo,useRef,useState,type ReactNode } from 'react'
import { toast } from 'sonner'
import { storageKeyFor,useAuth } from './auth'
import { useStore } from './store'
import { FIELDS } from './farm-data'
import { addPhoto,addTask,changeTask,event,fieldLabel,freshId,loadFarm,today,validFieldId,type FarmState,type FarmTask,type FarmEvent,type TaskStatus } from './workflow-model'

export const SCENARIOS = {
  irrigation:{label:'缺水补灌',fieldId:'A2',steps:['发现墒情偏低','生成灌溉任务','阀门开启','墒情回升','照片验收','记录归档']},
  patrol:{label:'巡检发现异常',fieldId:'C1',steps:['小车开始巡田','标记疑似异常','分派现场复核','执行处理','上传复核照片','关闭预警']},
  spray:{label:'识别后安排施药',fieldId:'B2',steps:['分析示例叶片','生成处置建议','分派施药任务','喷淋演示','照片验收','结果归档']},
} as const
export type ScenarioKey=keyof typeof SCENARIOS
type Run={id:string;kind:ScenarioKey;step:number;running:boolean;done:boolean;applied:number[]}
type FarmApi={state:FarmState;activeField:string;selectField:(id:string)=>void;dossier:string|null;openField:(id:string)=>void;closeField:()=>void;taskFocus:string|null;openTask:(id?:string)=>void;createTask:(input:Pick<FarmTask,'title'|'fieldId'|'kind'|'assignee'|'device'|'due'|'note'> & {incidentId?:string})=>string;assignTask:(id:string,assignee:string,device:string)=>void;advanceTask:(id:string,status:TaskStatus)=>void;uploadPhoto:(id:string,src:string,note:string)=>void;reportIncident:(id:string,fieldId:string,title:string)=>void;dispatchIncident:(id:string)=>void;record:(entry:Omit<FarmEvent,'id'|'at'>)=>void;setMoisture:(id:string,value:number)=>void;markRead:()=>void;saveError:boolean;retrySave:()=>void;run:Run|null;startScenario:(kind:ScenarioKey)=>void;pauseScenario:()=>void;resumeScenario:()=>void;cancelScenario:()=>void}
const Ctx=createContext<FarmApi|null>(null)
export function FarmProvider({children}:{children:ReactNode}) {
  const {session}=useAuth();const base=useStore()
  const key=storageKeyFor(session!,'huinong-workflow-v2')
  const [state,setState]=useState(()=>loadFarm(key))
  const [activeField,selectField]=useState('A1');const [dossier,setDossier]=useState<string|null>(null)
  const [taskFocus,setTaskFocus]=useState<string|null>(null)
  const [saveError,setSaveError]=useState(false);const [retry,setRetry]=useState(0)
  const [run,setRun]=useState<Run|null>(null);const [visible,setVisible]=useState((!document.hidden && window.__HUINONG_FOREGROUND__ !== false))
  const stateRef=useRef(state);stateRef.current=state
  useEffect(()=>{try{localStorage.setItem(key,JSON.stringify(state));setSaveError(false)}catch{setSaveError(true)}},[key,state,retry])
  useEffect(()=>{const update=()=>setVisible((!document.hidden && window.__HUINONG_FOREGROUND__ !== false));document.addEventListener('visibilitychange',update);return()=>document.removeEventListener('visibilitychange',update)},[])
  useEffect(()=>setState(s=>{let next=s;for(const a of ALERT_DEFS){if(next.incidents.some(i=>i.id===a.id))continue;next={...next,incidents:[...next.incidents,{id:a.id,fieldId:validFieldId(a.field),title:a.name,status:'待核查',at:new Date(a.time.replace(' ','T')).getTime()}]}}return next}),[])
  // Bridge existing screens into one event history. Stable source IDs prevent duplicate imports on reload.
  useEffect(()=>{
    const records:Array<FarmEvent & {sourceId:string}>=[]
    const at=Date.now()
    for(const t of base.soilTests)records.push({id:`soil-${t.id}`,sourceId:t.id,at:t.at??at,fieldId:validFieldId(t.fieldId??t.point),kind:'patrol',title:`土壤采样 · ${t.point}`,detail:`有机质 ${t.om} g/kg · 全氮 ${t.tn} g/kg · 磷 ${t.ap} mg/kg · 钾 ${t.ak} mg/kg`,position:[t.x*1000/360,t.y*560/210,0]})
    for(const a of base.patrolAlerts)records.push({id:`alert-${a.id}`,sourceId:a.id,at:a.at??at,fieldId:validFieldId(a.fieldId??a.zone),kind:'alert',title:a.kind,detail:'巡检发现疑似异常，等待现场复核',position:[a.x*1000/360,a.y*560/210,0]})
    for(const r of base.identifyRecords)records.push({id:`identify-${r.id}`,sourceId:r.id,at:r.at??at,fieldId:validFieldId(r.fieldId??'B2'),kind:'identify',title:`${r.crop} · ${r.disease}`,detail:`示例识别结果 · 置信度 ${r.confidence}%`,photo:r.img})
    for(const r of base.sprayRecords)records.push({id:`spray-${r.id}`,sourceId:r.id,at:r.at??at,fieldId:validFieldId(r.fieldId??r.field),kind:'spray',title:`${r.field} · 施药完成`,detail:`${r.pesticide} · 作业编号 ${r.code} · 演示记录`})
    for(const r of [...base.roverShots,...base.checkins])records.push({id:`photo-${r.id}`,sourceId:r.id,at:r.at??at,fieldId:validFieldId(r.fieldId??'A1'),kind:'photo',title:'田间作业照片',detail:r.time,photo:r.img})
    setState(previous=>{
      const fresh=records.filter(r=>!previous.seen.includes(r.sourceId));if(!fresh.length)return previous
      let next={...previous,seen:[...previous.seen,...fresh.map(r=>r.sourceId)]}
      for(const r of fresh){next=event(next,r);if(r.kind==='alert'&&!next.incidents.some(i=>i.id===r.sourceId))next={...next,incidents:[{id:r.sourceId,fieldId:r.fieldId,title:r.title,status:'待核查',at:r.at},...next.incidents]}}
      return next
    })
  },[base.soilTests,base.patrolAlerts,base.identifyRecords,base.sprayRecords,base.roverShots,base.checkins])
  useEffect(()=>{
    if(!run||!run.running||!visible||run.done)return
    const timer=setTimeout(()=>setRun(r=>r?{...r,step:Math.min(5,r.step+1),done:r.step>=4,running:r.step<4}:r),2400)
    return()=>clearTimeout(timer)
  },[run,visible])
  useEffect(()=>{
    if(!run||run.applied.includes(run.step))return
    const scene=SCENARIOS[run.kind],fieldId=scene.fieldId,taskId=`task-${run.id}`,incidentId=`incident-${run.id}`
    setState(previous=>{
      let s=previous
      if(run.step===0){s={...s,incidents:[{id:incidentId,fieldId,title:scene.label,status:'待核查',at:Date.now()},...s.incidents]}}
      if(run.step===1){s=addTask(s,{id:taskId,title:scene.label,fieldId,kind:run.kind==='irrigation'?'灌溉':run.kind==='spray'?'施药':'巡检',assignee:'王师傅',device:run.kind==='irrigation'?'灌溉系统':run.kind==='spray'?'喷淋系统':'巡检小车 01',due:today(),note:'场景演示自动创建',status:'待执行',photos:[],createdAt:Date.now(),updatedAt:Date.now(),incidentId,scenarioId:run.id});s={...s,incidents:s.incidents.map(i=>i.id===incidentId?{...i,status:'已派工',taskId}:i)}}
      if(run.step===2)s=changeTask(s,taskId,'执行中')
      if(run.step===3&&run.kind==='irrigation')s={...s,moisture:{...s.moisture,[fieldId]:Math.min(90,(s.moisture[fieldId]??56)+4)}}
      if(run.step===4){s=addPhoto(s,taskId,{id:freshId('photo'),src:'./media/real/farm-satellite.jpg',note:'场景演示示意图，非实际验收照片',at:Date.now()});s=changeTask(s,taskId,'待验收')}
      if(run.step===5)s=changeTask(s,taskId,'已完成')
      return event(s,{fieldId,title:scene.steps[run.step],detail:`${scene.label} · 演示步骤 ${run.step+1}/6`,kind:run.kind==='irrigation'?'irrigation':run.kind==='spray'?'spray':'patrol',taskId:run.step?taskId:undefined,scenarioId:run.id,moisture:s.moisture[fieldId]})
    })
    if(run.kind==='irrigation'&&run.step===2)base.setValve(FIELDS.findIndex(f=>f.id===fieldId),true)
    if(run.kind==='irrigation'&&run.step===5)base.setValve(FIELDS.findIndex(f=>f.id===fieldId),false)
    setRun(r=>r&&r.id===run.id?{...r,applied:[...r.applied,r.step]}:r)
  },[run,base])
  const api=useMemo<FarmApi>(()=>({state,activeField,selectField,dossier,openField:id=>{selectField(id);setDossier(id)},closeField:()=>setDossier(null),taskFocus,
    openTask:id=>{setTaskFocus(id??null);setDossier(null);base.setScreen('tasks')},
    createTask:input=>{const id=freshId('task');setState(s=>addTask(s,{...input,id,status:input.assignee?'待执行':'待分派',photos:[],createdAt:Date.now(),updatedAt:Date.now()}));return id},
    assignTask:(id,assignee,device)=>setState(s=>{const t=s.tasks.find(t=>t.id===id);if(!t||t.status!=='待分派'||!assignee)return s;return changeTask({...s,tasks:s.tasks.map(t=>t.id===id?{...t,assignee,device}:t)},id,'待执行')}),
    advanceTask:(id,status)=>setState(s=>changeTask(s,id,status)),
    uploadPhoto:(id,src,note)=>setState(s=>addPhoto(s,id,{id:freshId('photo'),src,note,at:Date.now()})),
    reportIncident:(id,fieldId,title)=>setState(s=>s.incidents.some(i=>i.id===id)?s:event({...s,incidents:[{id,fieldId,title,status:'待核查',at:Date.now()},...s.incidents]},{fieldId,title,detail:'等待核查与分派',kind:'alert'})),
    dispatchIncident:id=>{const incident=stateRef.current.incidents.find(i=>i.id===id);if(!incident)return;if(incident.taskId){setTaskFocus(incident.taskId);base.setScreen('tasks');return}const taskId=freshId('task');setState(s=>{const current=s.incidents.find(i=>i.id===id);if(current?.taskId)return s;return {...addTask(s,{id:taskId,title:incident.title,fieldId:incident.fieldId,kind:'复核',assignee:'王师傅',device:'人工巡田',due:today(),note:'现场核查后上传照片，验收完成后关闭预警。',status:'待执行',photos:[],incidentId:id,createdAt:Date.now(),updatedAt:Date.now()}),incidents:s.incidents.map(i=>i.id===id?{...i,status:'已派工',taskId}:i)}});setTaskFocus(taskId);base.setScreen('tasks')},
    record:input=>setState(s=>event(s,input)),setMoisture:(id,value)=>setState(s=>({...s,moisture:{...s.moisture,[id]:value}})),
    markRead:()=>setState(s=>({...s,events:s.events.map(e=>({...e,read:true}))})),saveError,retrySave:()=>setRetry(n=>n+1),run,
    startScenario:kind=>{if(run?.running){toast('请先暂停或结束当前演示');return}selectField(SCENARIOS[kind].fieldId);setRun({id:freshId('scene'),kind,step:0,running:true,done:false,applied:[]})},pauseScenario:()=>setRun(r=>r?{...r,running:false}:r),resumeScenario:()=>setRun(r=>r&&!r.done?{...r,running:true}:r),cancelScenario:()=>{if(run?.kind==='irrigation')base.setValve(1,false);setRun(null);toast('演示已停止，已生成的作业记录保留')},
  }),[state,activeField,dossier,taskFocus,base,saveError,run])
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>
}
export function useFarm(){const ctx=useContext(Ctx);if(!ctx)throw Error('FarmProvider missing');return ctx}
export {fieldLabel}
