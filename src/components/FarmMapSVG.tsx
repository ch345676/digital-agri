import {useId} from 'react'
import { FIELDS } from '../store'
import { FARM_IMAGERY } from '../real-media'

// Delineated against actual image field edges; IDs and crop data are demo overlays.
const PLOTS = [
  { id: 'A1', points: '158,80 243,70 242,378 157,380', x: 200, y: 217 },
  { id: 'A2', points: '249,70 329,66 330,377 247,378', x: 289, y: 217 },
  { id: 'B1', points: '335,66 421,66 421,376 335,377', x: 378, y: 217 },
  { id: 'C1', points: '427,66 511,67 515,376 426,376', x: 470, y: 217 },
  { id: 'B2', points: '582,185 875,186 863,327 810,318 792,333 582,315', x: 721, y: 255 },
]
const ROUTE = [[196,358],[196,91],[286,91],[286,358],[378,358],[378,91],[468,91],[468,365],[520,365],[520,175],[863,175],[863,300],[590,300]]
const ROUTE_PATH = ROUTE.map(([x,y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' ')
function routePosition(progress: number) {
  const lengths = ROUTE.slice(1).map(([x,y], i) => Math.hypot(x-ROUTE[i][0], y-ROUTE[i][1]))
  let distance = lengths.reduce((a,b) => a+b, 0) * Math.max(0, Math.min(100, progress)) / 100
  for (let i=0;i<lengths.length;i++) {
    if (distance <= lengths[i]) {
      const fraction = distance / lengths[i]
      return [ROUTE[i][0] + (ROUTE[i+1][0]-ROUTE[i][0])*fraction, ROUTE[i][1] + (ROUTE[i+1][1]-ROUTE[i][1])*fraction]
    }
    distance -= lengths[i]
  }
  return ROUTE[ROUTE.length-1]
}
export interface MapLayers { fields: boolean; monitors: boolean; irrigation: boolean }

export function FarmMapSVG({ layers, zoom=1, selectedField, onFieldClick, patrol }: {
  layers: MapLayers
  zoom?: number
  selectedField?: string | null
  onFieldClick?: (id:string) => void
  patrol?: { progress:number; running:boolean }
}) {
  const maskId=useId().replaceAll(':','')
  const selected=PLOTS.find(p=>p.id===selectedField)
  const info=FIELDS.find(f=>f.id===selectedField)
  const [rx,ry] = routePosition(patrol?.progress ?? 0)
  return <svg viewBox="0 0 1000 560" className="real-farm-map h-full w-full" preserveAspectRatio="xMidYMid meet" aria-label={patrol ? '真实农田遥感照片上的仿真巡航路线' : '真实农田卫星影像演示地图'}>
    <rect width="1000" height="560" fill="#18342e"/>
    <g className="map-zoom-layer" transform={`translate(500 280) scale(${zoom}) translate(-500 -280)`}>
      <image className="satellite-photo" href={FARM_IMAGERY.image} width="1000" height="560" preserveAspectRatio="none"/>
      <rect width="1000" height="560" fill="#092b22" opacity=".12" pointerEvents="none"/>
      {selected&&<><defs><mask id={maskId}><rect width="1000" height="560" fill="white"/><polygon points={selected.points} fill="black"/></mask></defs><rect className="field-spotlight" width="1000" height="560" fill="#061d13" opacity=".25" mask={'url(#'+maskId+')'} pointerEvents="none"/></>}
      {PLOTS.map(p => {
        const field=FIELDS.find(f=>f.id===p.id)!
        return <g key={p.id}>
          <polygon className="real-field" data-field={p.id} points={p.points} fill={selectedField===p.id ? '#daff854d' : '#bde99408'} stroke={selectedField===p.id ? '#f6ffd9' : '#d9efad'} strokeWidth={selectedField===p.id ? 3 : 1.3} strokeOpacity={layers.fields ? .85 : 0} role={onFieldClick?'button':undefined} tabIndex={onFieldClick?0:undefined} aria-label={onFieldClick?`选择 ${p.id} ${field.crop} 演示地块`:undefined} aria-pressed={onFieldClick?selectedField===p.id:undefined} onClick={()=>onFieldClick?.(p.id)} onKeyDown={e=>{if(onFieldClick && (e.key==='Enter'||e.key===' ')){e.preventDefault();onFieldClick(p.id)}}}/>
          {layers.fields && <g transform={`translate(${p.x} ${p.y})`} pointerEvents="none" textAnchor="middle">
            <rect x="-36" y="-23" width="72" height="59" rx="7" fill="#102e29d9" stroke="#e0f7bc77" strokeWidth=".7"/>
            <text y="-7" fill="#f4ffdb" fontSize="14" fontWeight="700">{p.id} {p.id==='C1'?'试验田':field.crop}</text>
            <text y="10" fill="#e8efd8" fontSize="11">{field.area} 亩</text>
            <text y="25" fill="#c3d3b8" fontSize="8">演示地块</text>
          </g>}
        </g>
      })}
      {selected&&layers.fields&&<polygon key={selected.id} className="field-trace" points={selected.points} pathLength="100" fill="none" stroke="#f0ffab" strokeWidth="3" pointerEvents="none"/>}

      {layers.irrigation && <g className="irrigation-overlay" pointerEvents="none"><path d="M150 62H523V386H151M246 62V386M332 62V386M424 62V386M523 175H882" stroke="#153c48" strokeWidth="7" fill="none"/><path d="M150 62H523V386H151M246 62V386M332 62V386M424 62V386M523 175H882" stroke="#8ddaf5" strokeWidth="2.5" fill="none"/>{[[150,62],[246,62],[332,386],[424,62],[523,175],[882,175]].map(([x,y])=><circle key={`${x}-${y}`} cx={x} cy={y} r="5" fill="#80daf8" stroke="#fff" strokeWidth="1.5"/>)}</g>}
      {layers.monitors && <g className="monitor-overlay" pointerEvents="none">{[[180,95],[310,340],[395,100],[490,340],[805,220]].map(([x,y],i)=><g key={i} transform={`translate(${x} ${y})`}><circle r="11" fill="#ecffda" stroke="#285941" strokeWidth="2"/><circle r="3" fill="#2b7955"/><path d="M-6-5Q0-11 6-5M-4-2Q0-6 4-2" stroke="#2b7955" strokeWidth="1.5" fill="none"/></g>)}</g>}
      {patrol && <g pointerEvents="none"><path d={ROUTE_PATH} fill="none" stroke="#143626" strokeWidth="7" strokeLinejoin="round"/><path className="patrol-route" d={ROUTE_PATH} fill="none" stroke="#dcff92" strokeWidth="2.5" strokeDasharray="8 6"/><path className="patrol-completed" d={ROUTE_PATH} fill="none" stroke="#dcff92" strokeWidth="3" pathLength="100" strokeDasharray={`${Math.max(0,Math.min(100,patrol.progress))} 100`}/><g className="rover-position" transform={`translate(${rx} ${ry})`}><circle r="25" fill="#d4ff7c44" className={patrol.running?'scan-pulse':''}/><circle r="13" fill="#e2ff9d" stroke="#24402b" strokeWidth="2"/><rect x="-8" y="-6" width="16" height="12" rx="4" fill="#24402b"/><circle cx="-3" cy="0" r="2" fill="#ecffd8"/><circle cx="3" cy="0" r="2" fill="#ecffd8"/></g></g>}
      {selected&&info&&<g key={'info-'+selected.id} className="field-map-callout" transform={'translate('+selected.x+' '+(selected.y+64)+')'} pointerEvents="none"><rect x="-58" y="0" width="116" height="40" rx="9" fill="#f6fbe9"/><path d="M-6 0L0-7L6 0" fill="#f6fbe9"/><text y="17" textAnchor="middle" fill="#2d4930" fontSize="11">水分 {info.soilMoisture}% · pH {info.ph}</text><text y="31" textAnchor="middle" fill="#617452" fontSize="8">地块采样演示</text></g>}
    </g>
  </svg>
}
