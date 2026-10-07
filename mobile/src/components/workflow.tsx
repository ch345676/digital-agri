import { PhotoCredit, StoredPhoto } from '../../../shared/reference-media'
import { isRetiredPhoto } from '../../../shared/reference-photos'
import { useEffect,useRef,useState,type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence,motion,useDragControls,useReducedMotion } from 'framer-motion'
import { ArrowLeft,ChevronLeft,ChevronRight,Image as ImageIcon,X,WifiOff,RefreshCw } from 'lucide-react'
import { FIELDS } from '../farm-data'
import { EASE } from './anim'
import { useStore } from '../store'
import { useFarm } from '../FarmContext'
import { fieldLabel } from '../workflow-model'

export function PageHeader({title,sub,children}:{title:string;sub?:string;children?:ReactNode}){
 const {setScreen}=useStore();return <header className="work-header"><button className="icon-button" aria-label="返回概览" onClick={()=>setScreen('overview')}><ArrowLeft size={19}/></button><div><h1>{title}</h1>{sub&&<p>{sub}</p>}</div>{children}</header>
}
export function FieldSelect({value,onChange,all=false}:{value:string;onChange:(id:string)=>void;all?:boolean}) {return <select aria-label="选择地块" className="work-select" value={value} onChange={e=>onChange(e.target.value)}>{all&&<option value="all">全部地块</option>}{FIELDS.map(f=><option key={f.id} value={f.id}>{fieldLabel(f.id)}</option>)}</select>}
export function EmptyState({title,detail,children}:{title:string;detail:string;children?:ReactNode}) {return <div className="empty-state"><span><ImageIcon size={23}/></span><b>{title}</b><p>{detail}</p>{children}</div>}
export function Sheet({open,onClose,title,children}:{open:boolean;onClose:()=>void;title:string;children:ReactNode}) {
 return createPortal(<AnimatePresence>{open&&<SheetContent key="sheet" onClose={onClose} title={title}>{children}</SheetContent>}</AnimatePresence>,document.body)
}
const sheetStack:HTMLElement[]=[]
const viewportUnit=typeof CSS!=='undefined'&&CSS.supports('height','100dvh')?'dvh':'vh'
let savedBodyOverflow=''
function SheetContent({onClose,title,children}:{onClose:()=>void;title:string;children:ReactNode}) {
 const controls=useDragControls(),reduced=useReducedMotion();const [full,setFull]=useState(false);const panel=useRef<HTMLDivElement>(null)
 const close=useRef(onClose);close.current=onClose
 useEffect(()=>{
  const previous=document.activeElement as HTMLElement,node=panel.current!;
  if(!sheetStack.length){savedBodyOverflow=document.body.style.overflow;document.body.style.overflow='hidden'}
  sheetStack.push(node);node.focus()
  const key=(e:KeyboardEvent)=>{
   if(sheetStack.at(-1)!==node)return
   if(e.key==='Escape'){e.preventDefault();close.current()}
   if(e.key==='Tab'){const items=Array.from(node.querySelectorAll<HTMLElement>('button,a[href],summary,input,select,textarea,[tabindex="0"]')).filter(el=>!el.hasAttribute('disabled')&&el.getClientRects().length>0);const first=items[0],last=items.at(-1);if(!first){e.preventDefault();return}if(e.shiftKey&&(document.activeElement===first||document.activeElement===node)){e.preventDefault();last?.focus()}else if(!e.shiftKey&&(document.activeElement===last||document.activeElement===node)){e.preventDefault();first.focus()}}
  }
  document.addEventListener('keydown',key)
  return()=>{const index=sheetStack.indexOf(node);if(index>=0)sheetStack.splice(index,1);document.removeEventListener('keydown',key);if(!sheetStack.length)document.body.style.overflow=savedBodyOverflow;if(previous?.isConnected)previous.focus();else sheetStack.at(-1)?.focus()}
 },[])

 return <><motion.div className="work-backdrop" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={onClose}/><motion.div ref={panel} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title} className="work-sheet" initial={{y:reduced?0:'100%',opacity:0}} animate={{y:0,opacity:1,height:`${full?90:64}${viewportUnit}`}} exit={{y:reduced?0:'100%',opacity:0}} transition={{duration:reduced?0:.28,ease:EASE}} drag="y" dragControls={controls} dragListener={false} dragConstraints={{top:0,bottom:0}} dragElastic={.16} onDragEnd={(_,info)=>{if(info.offset.y>110||info.velocity.y>650)onClose();else if(info.offset.y < -35)setFull(true);else if(info.offset.y>35)setFull(false)}}>
  <div className="sheet-handle" onPointerDown={e=>controls.start(e)}><button onClick={()=>setFull(v=>!v)} aria-label={full?'收起面板':'展开面板'} aria-expanded={full}><i/></button></div><div className="sheet-heading"><h2>{title}</h2><button aria-label="关闭面板" className="icon-button" onClick={onClose}><X size={18}/></button></div><div className="sheet-body">{children}</div>
 </motion.div></>
}
export type GalleryPhoto={id:string;src:string;note?:string}
export function PhotoGallery({photos,index,onClose}:{photos:GalleryPhoto[];index:number|null;onClose:()=>void}) {
 const [current,setCurrent]=useState(index??0);const [zoom,setZoom]=useState(false)
 useEffect(()=>{if(index!==null){setCurrent(index);setZoom(false)}},[index])
 const photo=photos[current]
 return <Sheet open={index!==null&&!!photo} onClose={onClose} title={`图片记录 ${current+1} / ${photos.length}`}><div className="gallery-stage"><AnimatePresence mode="wait">{photo&&(isRetiredPhoto(photo.src)?<StoredPhoto src={photo.src}/>:<motion.img key={photo.id} src={photo.src} alt={photo.note||'作业照片'} initial={{opacity:0,scale:.94}} animate={{opacity:1,scale:zoom?1.7:1}} exit={{opacity:0}} onDoubleClick={()=>setZoom(z=>!z)} drag={zoom?true:'x'} dragConstraints={{left:zoom?-100:0,right:zoom?100:0,top:zoom?-100:0,bottom:zoom?100:0}} onDragEnd={(_,i)=>{if(zoom)return;if(i.offset.x<-45)setCurrent(c=>Math.min(photos.length-1,c+1));else if(i.offset.x>45)setCurrent(c=>Math.max(0,c-1))}}/>)}</AnimatePresence></div><PhotoCredit src={photo?.src}/><p className="muted">{photo?.note||'图片记录'} · 双击放大，左右滑动切换</p><div className="work-actions"><button disabled={current===0} onClick={()=>{setCurrent(c=>c-1);setZoom(false)}}><ChevronLeft size={17}/>上一张</button><button disabled={current>=photos.length-1} onClick={()=>{setCurrent(c=>c+1);setZoom(false)}}>下一张<ChevronRight size={17}/></button></div></Sheet>
}
export async function readPhoto(file:File):Promise<string> {
 if(!file.type.startsWith('image/'))throw Error('请选择图片文件')
 if(file.size>20*1024*1024)throw Error('图片超过 20 MB，请选择较小的照片')
 const source=await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(Error('照片读取失败，请重试'));reader.readAsDataURL(file)})
 const img=await new Promise<HTMLImageElement>((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(Error('无法识别此图片格式'));img.src=source})
 const scale=Math.min(1,1200/img.width,1200/img.height);const canvas=document.createElement('canvas');canvas.width=img.width*scale;canvas.height=img.height*scale;canvas.getContext('2d')!.drawImage(img,0,0,canvas.width,canvas.height);return canvas.toDataURL('image/jpeg',.78)
}
export function ConnectionStatus(){const [online,setOnline]=useState(navigator.onLine);const {saveError,retrySave,state}=useFarm();useEffect(()=>{const update=()=>setOnline(navigator.onLine);window.addEventListener('online',update);window.addEventListener('offline',update);return()=>{window.removeEventListener('online',update);window.removeEventListener('offline',update)}},[]);return <div className="connection-status" role="status">{!online&&<span><WifiOff size={13}/>离线 · 本地演示和记录可用</span>}{saveError?<button onClick={retrySave}><RefreshCw size={13}/>存储空间不足，记录尚未保存 · 重试</button>:<small>本机演示记录 · 更新于 {new Date(state.updatedAt).toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'})}</small>}</div>}
export function InteractiveChart({values,labels,color='#819c56',unit='%',compare}:{values:number[];labels:string[];color?:string;unit?:string;compare?:number[]}) {
 const [index,setIndex]=useState(values.length-1);const max=Math.max(...values,...(compare??[]))*1.15||1,w=320,h=120;const active=Math.min(index,values.length-1)
 const path=(data:number[])=>data.map((n,i)=>`${i?'L':'M'}${12+i*(w-24)/(data.length-1)},${h-20-n/max*(h-34)}`).join(' ')
 const x=12+active*(w-24)/(values.length-1),y=h-20-values[active]/max*(h-34)
 const move=(e:React.PointerEvent<SVGSVGElement>)=>{const r=e.currentTarget.getBoundingClientRect();setIndex(Math.max(0,Math.min(values.length-1,Math.round((e.clientX-r.left)/r.width*(values.length-1)))))}
 return <div className="interactive-chart"><div><span>{labels[active]}</span><b style={{color}}>{values[active].toFixed(1)}{unit}</b>{compare&&<small>对比 {compare[active].toFixed(1)}{unit}</small>}</div><svg viewBox={`0 0 ${w} ${h}`} onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);move(e)}} onPointerMove={e=>{if(e.buttons||e.pointerType==='mouse')move(e)}} role="img" aria-label={`${labels[active]} ${values[active]}${unit}`} style={{touchAction:'pan-y'}}>{[25,55,85].map(y=><line key={y} x1="10" x2="310" y1={y} y2={y} stroke="#e7ede8"/>)}{compare&&<motion.path animate={{d:path(compare)}} fill="none" stroke="#b4bfc0" strokeDasharray="4 4" strokeWidth="2"/>}<motion.path animate={{d:path(values)}} transition={{duration:.4}} fill="none" stroke={color} strokeWidth="2.5"/><line x1={x} x2={x} y1="8" y2="106" stroke={color} opacity=".3"/><motion.circle animate={{cx:x,cy:y}} r="5" fill="white" stroke={color} strokeWidth="2"/></svg><input aria-label="查看图表时间点" type="range" min="0" max={values.length-1} value={active} onChange={e=>setIndex(Number(e.target.value))}/></div>
}
