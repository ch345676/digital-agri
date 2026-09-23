import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, Minus, RotateCcw, Maximize2, X, Droplets } from 'lucide-react'
import { FarmMapSVG, type MapLayers } from './FarmMapSVG'
import { FIELDS } from '../farm-data'
import { useStore } from '../store'

type Props = Pick<Parameters<typeof FarmMapSVG>[0], 'patrol' | 'markers'> & { compact?: boolean }
export default function FarmMap({ patrol, markers, compact = false }: Props) {
  const { setScreen } = useStore()
  const [layers, setLayers] = useState<MapLayers>({ fields: true, monitors: true, irrigation: true })
  const [zoom, setZoom] = useState(1)
  const [selected, setSelected] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)
  const field = FIELDS.find(f => f.id === selected)
  return <section className={`farm-demo ${expanded ? 'farm-expanded' : ''} ${compact ? 'farm-compact' : ''}`} aria-label="电脑端同源农场地图">
    <div className="farm-map-heading"><div><b>田间{patrol ? '巡航' : '地图'}</b><small>电脑端同源底图 · 仿真演示</small></div><button aria-label={expanded ? '收起地图' : '展开地图'} onClick={() => setExpanded(!expanded)}>{expanded ? <X size={18}/> : <Maximize2 size={18}/>}</button></div>
    <div className="farm-layer-tabs">{([['fields','地块'],['monitors','监测点'],['irrigation','灌溉管线']] as const).map(([key,label])=><button key={key} aria-pressed={layers[key]} onClick={()=>setLayers(s=>({...s,[key]:!s[key]}))}>{label}</button>)}</div>
    <div className="farm-canvas-scroll"><div className="farm-canvas" style={{width:`${zoom*100}%`}}><FarmMapSVG layers={layers} selectedField={selected} onFieldClick={setSelected} patrol={patrol} markers={markers}/></div></div>
    <div className="farm-map-tools"><span>缩放 {Math.round(zoom*100)}%</span><div><button aria-label="缩小地图" disabled={zoom<=1} onClick={()=>setZoom(z=>Math.max(1,z-.25))}><Minus size={16}/></button><button aria-label="放大地图" disabled={zoom>=2.5} onClick={()=>setZoom(z=>Math.min(2.5,z+.25))}><Plus size={16}/></button><button aria-label="复位地图" onClick={()=>{setZoom(1);setSelected(null)}}><RotateCcw size={16}/></button></div></div>
    <div className="farm-field-tabs">{FIELDS.map(f=><button key={f.id} aria-pressed={selected===f.id} onClick={()=>setSelected(f.id)}>{f.id} {f.id==='C1'?'试验田':f.crop}</button>)}</div>
    <AnimatePresence mode="wait">{field&&<motion.div key={field.id} className="farm-field-detail" initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}}>
      <div className="farm-map-heading"><div><b>{field.id} {field.crop}</b><small>{field.variety} · {field.area} 亩</small></div><button aria-label="关闭地块详情" onClick={()=>setSelected(null)}><X size={16}/></button></div>
      <dl><div><dt>土壤湿度</dt><dd>{field.soilMoisture}%</dd></div><div><dt>土壤 pH</dt><dd>{field.ph}</dd></div><div><dt>健康评分</dt><dd>{field.health} 分</dd></div><div><dt>预计收获</dt><dd>{field.harvest.slice(5)}</dd></div></dl>
      <p>生长阶段：{field.stageName} · {field.stagePct}%</p><div className="farm-growth"><i style={{width:`${field.stagePct}%`}}/></div><p>下一农事：{field.nextAction}</p>
      <button className="farm-action" onClick={()=>{setExpanded(false);setScreen('irrigation')}}><Droplets size={15}/>打开灌溉演示</button>
    </motion.div>}</AnimatePresence>
    <p className="farm-credit">戴维斯农田遥感影像 · 地块、路线为演示覆盖物<br/>Esri, Vantor, Earthstar Geographics, GIS User Community</p>
  </section>
}
