import { FIELDS } from './farm-data'

export type TaskStatus = '待分派' | '待执行' | '执行中' | '待验收' | '已完成'
export type IncidentStatus = '待核查' | '已派工' | '处理中' | '已解决'
export interface TaskPhoto { id: string; src: string; note: string; at: number }
export interface FarmTask { id: string; title: string; fieldId: string; kind: string; assignee: string; device: string; due: string; note: string; status: TaskStatus; photos: TaskPhoto[]; createdAt: number; updatedAt: number; incidentId?: string; scenarioId?: string }
export interface Incident { id: string; fieldId: string; title: string; status: IncidentStatus; at: number; taskId?: string }
export interface FarmEvent { id: string; fieldId: string; title: string; detail: string; kind: 'task' | 'irrigation' | 'patrol' | 'identify' | 'spray' | 'photo' | 'alert'; at: number; taskId?: string; photo?: string; position?: [number,number,number]; moisture?: number; read?: boolean; scenarioId?: string }
export interface FarmState { version: 2; tasks: FarmTask[]; incidents: Incident[]; events: FarmEvent[]; moisture: Record<string,number>; seen: string[]; updatedAt: number }
export const TASK_STATES: TaskStatus[] = ['待分派','待执行','执行中','待验收','已完成']
export const PEOPLE = ['张师傅','李师傅','王师傅','管理员']
export const DEVICES = ['人工巡田','巡检小车 01','巡检小车 02','灌溉系统','喷淋系统']
export const fieldById = (id: string) => FIELDS.find(f=>f.id===id) ?? FIELDS[0]
export const fieldLabel = (id: string) => `${id} ${fieldById(id).crop}`
export const freshId = (kind: string) => `${kind}-${crypto.randomUUID?.() ?? Date.now().toString(36)+Math.random().toString(36).slice(2)}`
export const today = () => new Date().toLocaleDateString('en-CA')
export const EVENT_KINDS = {task:'农事任务',irrigation:'灌溉',patrol:'巡检采样',identify:'作物识别',spray:'喷淋施药',photo:'作业照片',alert:'预警处理'}

export function seedFarm(): FarmState {
  const at=Date.now()
  return {version:2,updatedAt:at,seen:[],moisture:Object.fromEntries(FIELDS.map(f=>[f.id,f.soilMoisture])),
    tasks:[{id:'task-seed-1',title:'A2 墒情复核',fieldId:'A2',kind:'巡检',assignee:'王师傅',device:'巡检小车 01',due:today(),note:'查看土壤读数并上传现场照片。',status:'待执行',photos:[],createdAt:at,updatedAt:at,incidentId:'incident-seed-1'},
      {id:'task-seed-2',title:'B2 生长记录',fieldId:'B2',kind:'巡检',assignee:'张师傅',device:'人工巡田',due:today(),note:'记录叶片长势。',status:'执行中',photos:[],createdAt:at,updatedAt:at}],
    incidents:[{id:'incident-seed-1',fieldId:'A2',title:'土壤墒情需复核',status:'已派工',at,taskId:'task-seed-1'}],
    events:[{id:'event-seed-1',fieldId:'A2',title:'墒情复核已分派',detail:'王师傅 · 巡检小车 01 · 示例任务',kind:'task',at,taskId:'task-seed-1',moisture:56}]}
}

export function validFieldId(value?: string): string {
  const found=FIELDS.find(f=>value?.includes(f.id)||value===f.name)
  return found?.id ?? 'B2'
}
export function loadFarm(key: string): FarmState {
  try {
    const raw=JSON.parse(localStorage.getItem(key)||'null')
    if(raw?.version===2&&Array.isArray(raw.tasks)&&Array.isArray(raw.events)&&Array.isArray(raw.incidents)&&raw.tasks.every((t:FarmTask)=>typeof t.id==='string'&&TASK_STATES.includes(t.status)&&Array.isArray(t.photos))){
      const seed=seedFarm()
      const moisture=Object.fromEntries(FIELDS.map(f=>[f.id,Number.isFinite(raw.moisture?.[f.id])?Math.max(0,Math.min(100,raw.moisture[f.id])):f.soilMoisture]))
      return {...seed,...raw,moisture,seen:Array.isArray(raw.seen)?raw.seen:[],tasks:raw.tasks.map((t:FarmTask)=>({...t,fieldId:validFieldId(t.fieldId)})),events:raw.events.filter((e:FarmEvent)=>typeof e.id==='string'&&Number.isFinite(e.at)).map((e:FarmEvent)=>({...e,fieldId:validFieldId(e.fieldId)})),incidents:raw.incidents.filter((i:Incident)=>typeof i.id==='string').map((i:Incident)=>({...i,fieldId:validFieldId(i.fieldId)}))}
    }
  }
  catch { /* A damaged workflow store must not stop the app from opening. */ }
  return seedFarm()
}
export function event(state: FarmState, input: Omit<FarmEvent,'id'|'at'> & Partial<Pick<FarmEvent,'id'|'at'>>): FarmState {
  return {...state,updatedAt:Date.now(),events:[{...input,id:input.id??freshId('event'),at:input.at??Date.now()},...state.events].slice(0,600)}
}
export function addTask(state: FarmState, task: FarmTask): FarmState {
  if(state.tasks.some(t=>t.id===task.id))return state
  const next={...state,tasks:[task,...state.tasks]}
  return event(next,{fieldId:task.fieldId,title:`${task.title} · ${task.status}`,detail:[task.assignee||'等待分派',task.device].join(' · '),kind:'task',taskId:task.id,scenarioId:task.scenarioId})
}
export function changeTask(state: FarmState, id: string, status: TaskStatus): FarmState {
  const task=state.tasks.find(t=>t.id===id)
  if(!task||TASK_STATES.indexOf(status)!==TASK_STATES.indexOf(task.status)+1)return state
  if(status==='待执行'&&!task.assignee)return state
  if((status==='待验收'||status==='已完成')&&!task.photos.length)return state
  const incidentStatus: IncidentStatus=status==='已完成'?'已解决':status==='执行中'||status==='待验收'?'处理中':'已派工'
  return event({...state,tasks:state.tasks.map(t=>t.id===id?{...t,status,updatedAt:Date.now()}:t),incidents:state.incidents.map(i=>i.id===task.incidentId?{...i,status:incidentStatus}:i)}, {fieldId:task.fieldId,title:`${task.title} · ${status}`,detail:status==='已完成'?'已验收，关联预警同步关闭':task.assignee,kind:'task',taskId:id,scenarioId:task.scenarioId})
}
export function addPhoto(state: FarmState,id: string,photo: TaskPhoto): FarmState {
  const task=state.tasks.find(t=>t.id===id)
  if(!task)return state
  return event({...state,tasks:state.tasks.map(t=>t.id===id?{...t,photos:[...t.photos,photo],updatedAt:Date.now()}:t)},{fieldId:task.fieldId,title:'上传作业照片',detail:photo.note||task.title,kind:'photo',taskId:id,photo:photo.src,scenarioId:task.scenarioId})
}
