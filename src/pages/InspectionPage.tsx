import { FarmMapSVG } from '../components/FarmMapSVG'
import { ImageryCredit } from '../components/ImageryCredit'
import { PhotoCredit, RoverSchematic } from '../../shared/reference-media'
import { REFERENCE_PHOTOS } from '../../shared/reference-photos'
import { useEffect, useRef, useState } from 'react'
import { Bot, BatteryMedium, Pause, Play, RotateCcw, Radar, ArrowUpRight } from 'lucide-react'
import { Modal, PageHeader } from '../components/bits'
import { useStore } from '../store'
import { feedback } from '../feedback'

const ROBOTS=[{id:'01',field:'A1',job:'多光谱叶面扫描',battery:86},{id:'02',field:'B1',job:'病害复查与采样',battery:72},{id:'03',field:'B2',job:'作物成熟度采集',battery:64},{id:'04',field:'基地',job:'充电待机',battery:98}]
interface Run { progress:number; running:boolean }
const initial:Run[]=[{progress:42,running:true},{progress:28,running:true},{progress:65,running:true},{progress:0,running:false}]
export default function InspectionPage() {
  const {context,selectField,openField,logEvent,workflow}=useStore()
  const [runs,setRuns]=useState<Run[]>(()=>{try {const r=JSON.parse(localStorage.getItem('huinong-inspection')??'null');return Array.isArray(r)&&r.length===4&&r.every(x=>typeof x?.progress==='number'&&x.progress>=0&&x.progress<=100&&typeof x?.running==='boolean')?r:initial}catch{return initial}})
  const [chosen,setChosen]=useState<{index:number;fieldId:string}|null>(null)
  const selected=chosen?.fieldId===context.fieldId?chosen.index:Math.max(0,ROBOTS.findIndex(r=>r.field===context.fieldId))
  const setSelected=(index:number)=>{const fieldId=index<3?ROBOTS[index].field:context.fieldId;setChosen({index,fieldId});if(index<3)selectField(fieldId)}
  const [offline,setOffline]=useState(false),offlineRef=useRef(false)
  const [dispatch,setDispatch]=useState<{index:number;restart:boolean;phase:string;target:boolean}|null>(null)
  const timers=useRef<ReturnType<typeof setTimeout>[]>([])
  const dispatchRef=useRef(false)
  useEffect(()=>()=>timers.current.forEach(clearTimeout),[])
  const [showRover,setShowRover]=useState(false)
  const [visible,setVisible]=useState(!document.hidden)
  useEffect(()=>{const fn=()=>setVisible(!document.hidden);document.addEventListener('visibilitychange',fn);return()=>document.removeEventListener('visibilitychange',fn)},[])
  useEffect(()=>{if(!visible)return;const id=setInterval(()=>setRuns(prev=>prev.map((r,i)=>i<3&&r.running?{progress:Math.min(100,r.progress+.25),running:r.progress+.25<100}:r)),1000);return()=>clearInterval(id)},[visible])
  useEffect(()=>{try{localStorage.setItem('huinong-inspection',JSON.stringify(runs))}catch{/* optional local persistence */}},[runs])
  const robot=ROBOTS[selected]; const run=runs[selected]
  const update=(index:number,restart=false,desired?:boolean)=>{
    if(dispatchRef.current)return
    dispatchRef.current=true
    const target=desired??(restart||!runs[index].running)
    const command={index,restart,phase:'正在发送模拟指令',target}
    setDispatch(command)
    timers.current.push(setTimeout(()=>setDispatch({...command,phase:offlineRef.current?'等待通信恢复':'模拟回执已确认'}),450))
    timers.current.push(setTimeout(()=>{
      dispatchRef.current=false
      if(offlineRef.current){setDispatch({...command,phase:'发送失败 · 小车状态未改变'});feedback('模拟通信中断，可恢复连接后重试',{error:true});return}
      setRuns(prev=>prev.map((r,i)=>i===index?{progress:restart?0:r.progress,running:target}:r))
      setDispatch({...command,phase:target?'模拟巡检已启动':'模拟巡检已暂停'})
      logEvent({fieldId:ROBOTS[index].field,kind:'device',title:`ROVER ${ROBOTS[index].id} · ${target?'启动巡检':'暂停巡检'}`,detail:'本地仿真操作，非真实车辆指令或 GPS 轨迹'})
    },1100))
  }
  return <div><PageHeader title="智能巡检" desc="从路径巡航到多源感知，见证每一次田间探索。" extra={<span className="green-chip"><span className="status-dot"/>巡检仿真演示</span>}/><div className="patrol-dispatch"><label>巡检通信演示 <select aria-label="巡检通信演示" value={offline?'offline':'online'} onChange={e=>{const value=e.target.value==='offline';setOffline(value);offlineRef.current=value}}><option value="online">模拟连接正常</option><option value="offline">模拟断线</option></select></label>{dispatch&&<span role="status">{dispatch.phase}</span>}{dispatch?.phase.startsWith('发送失败')&&<button className="secondary-btn" onClick={()=>update(dispatch.index,dispatch.restart,dispatch.target)}>重试巡检指令</button>}</div><div className="inspection-layout"><section className="panel patrol-panel"><div className="panel-heading"><h3><Radar size={18}/>田间巡航视图</h3><span className="muted">{robot.field} / ROVER {robot.id}</span></div><div className={`patrol-map ${run.running?'running':''}`}><FarmMapSVG layers={{fields:true,monitors:false,irrigation:false}} patrol={run}/><div className="patrol-map-label" data-motion-key={`${robot.id}-${run.running}`}><span className="status-dot"/>ROVER {robot.id} · {run.progress>=100?'已完成':run.running?'正在巡航':'已暂停'}</div><span className="map-north">真实农田影像 · N ↑</span></div><ImageryCredit/><a className="rover-reference-link" href="./rover-control/">打开小车移动控制台 <ArrowUpRight size={12}/></a><button className="rover-reference-link" onClick={()=>setShowRover(true)}>查看小车功能结构 <ArrowUpRight size={12}/></button><Modal open={showRover} onClose={()=>setShowRover(false)} title="惠农项目巡检小车" width="w-[720px]"><RoverSchematic/><p className="muted" style={{marginTop:12}}>此图为四轮巡检车功能结构示意；地图与路线用于巡检仿真。</p></Modal><div className="patrol-footer"><span>路线进度 <b>{run.progress.toFixed(1)}%</b></span><span>示意路线 · 非 GPS 实时轨迹</span></div><div className="progress-track"><i style={{width:`${run.progress}%`}}/></div></section><section className="panel scan-panel"><span className="eyebrow">MULTISPECTRAL VISION</span><h3>叶面参考 · 采集演示</h3><div className="reference-scan" data-running={run.running&&visible}><img src={REFERENCE_PHOTOS.soybeanDowny.image} alt={REFERENCE_PHOTOS.soybeanDowny.title}/></div><PhotoCredit photo={REFERENCE_PHOTOS.soybeanDowny}/><p>当前任务 <b>{robot.job}</b></p><div className="scan-tags"><span>RGB 可见光</span><span>多光谱筛查</span><span>热红外辅助</span></div><button className="secondary-btn" onClick={()=>openField('alerts',robot.field)}>查看识别预警 <ArrowUpRight size={15}/></button><small className="data-disclaimer">实拍参考照片 + 扫描动画，未连接真实摄像头。</small></section></div><div className="robot-grid">{ROBOTS.map((r,i)=><section className={`panel robot-card ${selected===i?'selected':''}`} key={r.id}><button className="robot-select" aria-pressed={selected===i} onClick={()=>setSelected(i)}><span className="robot-icon"><Bot size={27}/></span><span><b>巡检机器人 #{r.id}</b><small>{r.field} · {r.job}</small></span></button><div className="robot-meta" data-status={runs[i].running?'running':'paused'}><span className={runs[i].running?'green-chip':'muted'}>{i===3?'充电待机':runs[i].progress>=100?'巡检完成':runs[i].running?'巡检中':'已暂停'}</span><span><BatteryMedium size={16}/>{r.battery}%</span></div><div className="progress-track"><i style={{width:`${runs[i].progress}%`}}/></div><div className="robot-actions"><span>{runs[i].progress.toFixed(1)}%</span>{i<3&&(runs[i].progress>=100?<button onClick={()=>update(i,true)}><RotateCcw size={14}/>重新演示</button>:<button onClick={()=>update(i)}>{runs[i].running?<Pause size={14}/>:<Play size={14}/>} {runs[i].running?'暂停巡检':'继续巡检'}</button>)}</div></section>)}</div><details className="panel command-log"><summary>巡检操作记录</summary>{workflow.events.filter(e=>e.kind==='device'&&e.title.startsWith('ROVER')).slice(0,20).map(e=><div key={e.id}><b>{e.title}</b><span>{e.fieldId}</span><time>{e.at.replace('T',' ')}</time><small>{e.detail}</small></div>)}</details></div>
}
