import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, Pause, Play, Film } from 'lucide-react'
import { useMotion } from './motion-context'
import { useStore, type PageKey } from '../store'
import { SCENES, type Scene } from '../media'

export function SceneMedia({ image, video, label, className='', controls=false }: { image:string;video?:string;label:string;className?:string;controls?:boolean }) {
  const {enabled}=useMotion()
  const ref=useRef<HTMLVideoElement>(null)
  const host=useRef<HTMLDivElement>(null)
  const [paused,setPaused]=useState(false)
  const [failed,setFailed]=useState(false)
  const [playing,setPlaying]=useState(false)
  useEffect(()=>{
    const node=ref.current, container=host.current
    if(!node||!container||!video)return
    let visible=false
    const sync=()=>{
      if(visible&&enabled&&!paused&&!document.hidden&&!failed){if(!node.getAttribute('src'))node.src=video;node.play().catch(()=>setPlaying(false))}
      else node.pause()
    }
    const observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;sync()},{threshold:.12})
    observer.observe(container);document.addEventListener('visibilitychange',sync)
    return()=>{observer.disconnect();document.removeEventListener('visibilitychange',sync);node.pause()}
  },[video,enabled,paused,failed])
  return <div ref={host} className={`scene-media ${className}`}>
    <img src={image} alt={label} loading="lazy" decoding="async"/>
    {video&&!failed&&<video ref={ref} muted loop playsInline preload="none" poster={image} aria-label={`${label}演示视频`} onPlay={()=>setPlaying(true)} onPause={()=>setPlaying(false)} onError={()=>{setFailed(true);setPlaying(false)}}/>}
    {video&&controls&&<button className="media-control" type="button" disabled={!enabled||failed} title={!enabled?'请先开启全站动画':failed?'视频暂不可用，显示图片':undefined} aria-label={`${playing?'暂停':'播放'}${label}视频`} onClick={()=>{if(playing){setPaused(true);ref.current?.pause()}else{setPaused(false);if(ref.current&&video){if(!ref.current.src)ref.current.src=video;ref.current.play().catch(()=>setPlaying(false))}}}}>{playing?<Pause size={12}/>:<Play size={12}/>}<span>{failed?'静态预览':playing?'动态演示':'静态预览'}</span></button>}
  </div>
}
export function HeaderScene({scene}:{scene:Scene}){return <div className="header-scene"><SceneMedia image={scene.image} video={scene.video} label={scene.caption} controls/><div className="header-scene-shade"/><div className="scene-caption"><span>{scene.kicker}</span><p>{scene.caption}</p></div><small className="scene-origin">{scene.video?<Film size={10}/>:null}素材演示 · 非实时画面</small></div>}
export function FeatureGallery(){
 const {setPage}=useStore()
 const cards:{page:PageKey;name:string;title:string;sub:string;tag:string;value:string;unit:string}[]=[
 {page:'inspection',name:'AUTONOMOUS EXPLORATION',title:'与田野，一起呼吸。',sub:'机器人穿行田垄，捕捉每一处生长信号。',tag:'智能巡检',value:'03',unit:'台在线 · 演示'},
 {page:'soil',name:'BENEATH EVERY HARVEST',title:'丰收，从脚下开始。',sub:'从一次光谱采样，到一份可执行的土壤报告。',tag:'土壤感知',value:'08',unit:'项土壤指标'},
 {page:'harvest',name:'A SEASON WORTH WAITING',title:'不错过，成熟的时刻。',sub:'追踪作物长势，让好品质恰逢好时机。',tag:'采摘规划',value:'18.3',unit:'亩建议采摘 · 演示'},
 ]
 return <section className="feature-gallery" aria-label="田间影像功能入口">{cards.map(c=><article className={`immersive-card immersive-${c.page}`} key={c.page}><SceneMedia {...SCENES[c.page]} label={c.tag} controls/><div className="immersive-shade"/><div className="immersive-copy"><span className="scene-tag"><i/>{c.tag}</span><small>{c.name}</small><h3>{c.title}</h3><p>{c.sub}</p></div><div className="immersive-bottom"><div><strong>{c.value}</strong><span>{c.unit}</span></div><button onClick={()=>setPage(c.page)}>进入{c.tag}<ArrowUpRight size={15}/></button></div></article>)}</section>
}
