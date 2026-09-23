import { ROUTE_PATH, routePosition } from '../farm-route'
import {useId} from 'react'
import { ProjectRoverMarker } from './ProjectRoverMarker'
import { FIELDS, FARM_IMAGERY } from '../farm-data'


// Delineated against actual image field edges; IDs and crop data are demo overlays.
const PLOTS = [
  { id: 'A1', points: '158,80 243,70 242,378 157,380', x: 200, y: 157 },
  { id: 'A2', points: '249,70 329,66 330,377 247,378', x: 289, y: 286 },
  { id: 'B1', points: '335,66 421,66 421,376 335,377', x: 378, y: 157 },
  { id: 'C1', points: '427,66 511,67 515,376 426,376', x: 470, y: 286 },
  { id: 'B2', points: '582,185 875,186 863,327 810,318 792,333 582,315', x: 721, y: 255 },
]
export interface MapLayers { fields: boolean; monitors: boolean; irrigation: boolean }

export function FarmMapSVG({ layers, zoom=1, selectedField, onFieldClick, patrol, markers = [], fieldMoisture, fieldValves }: {
  fieldMoisture?: Record<string,number>
  fieldValves?: Record<string,boolean>
  layers: MapLayers
  zoom?: number
  selectedField?: string | null
  onFieldClick?: (id:string) => void
  patrol?: { progress:number; running:boolean; position?: [number, number, number] }
  markers?: {id:string;x:number;y:number;kind:"soil"|"alert"}[]
}) {
  const maskId=useId().replaceAll(':','')
  const selected=PLOTS.find(p=>p.id===selectedField)
  const info=FIELDS.find(f=>f.id===selectedField)
  const [rx,ry,heading] = patrol?.position ?? routePosition(patrol?.progress ?? 0)
  return <svg viewBox="0 0 1000 560" className="real-farm-map h-full w-full" preserveAspectRatio="xMidYMid meet" aria-label={patrol ? '真实农田遥感照片上的仿真巡航路线' : '真实农田卫星影像演示地图'}>
    <rect width="1000" height="560" fill="#18342e"/>
    <g className="map-zoom-layer" transform={`translate(500 280) scale(${zoom}) translate(-500 -280)`}>
      <image className="satellite-photo" href={FARM_IMAGERY.image} width="1000" height="560" preserveAspectRatio="none"/>
      <rect width="1000" height="560" fill="#092b22" opacity=".12" pointerEvents="none"/>
      {selected&&<><defs><mask id={maskId}><rect width="1000" height="560" fill="white"/><polygon points={selected.points} fill="black"/></mask></defs><rect className="field-spotlight" width="1000" height="560" fill="#061d13" opacity=".25" mask={'url(#'+maskId+')'} pointerEvents="none"/></>}
      {PLOTS.map(p => {
        const field=FIELDS.find(f=>f.id===p.id)!
        return <g key={p.id}>
          <polygon className="real-field" data-field={p.id} points={p.points} fill={fieldMoisture ? ({A1:'#b8d68d55',A2:'#d6b35b55',B1:'#6dc2a855',B2:'#74b6d855',C1:'#dc947155'}[p.id]) : selectedField===p.id ? '#d4eabc26' : '#bde99405'} stroke={selectedField===p.id ? '#f4ffe4' : '#d2dfbb'} strokeWidth={selectedField===p.id ? 2 : 1} strokeOpacity={layers.fields ? .85 : 0} role={onFieldClick?'button':undefined} tabIndex={onFieldClick?0:undefined} aria-label={onFieldClick?`选择 ${p.id} ${field.crop} 演示地块`:undefined} aria-pressed={onFieldClick?selectedField===p.id:undefined} onClick={()=>onFieldClick?.(p.id)} onKeyDown={e=>{if(onFieldClick && (e.key==='Enter'||e.key===' ')){e.preventDefault();onFieldClick(p.id)}}}/>

        </g>
      })}
      {selected&&layers.fields&&<polygon key={selected.id} className="field-trace" points={selected.points} pathLength="100" fill="none" stroke="#f0ffab" strokeWidth="1.7" pointerEvents="none"/>}

      {layers.irrigation && <g className="irrigation-overlay" pointerEvents="none"><path d="M150 62H523V386H151M246 62V386M332 62V386M424 62V386M523 175H882" stroke="#153c48" strokeWidth="7" fill="none"/><path d="M150 62H523V386H151M246 62V386M332 62V386M424 62V386M523 175H882" stroke="#8ddaf5" strokeWidth="2.5" fill="none"/>{[[150,62],[246,62],[332,386],[424,62],[523,175],[882,175]].map(([x,y])=><circle key={`${x}-${y}`} cx={x} cy={y} r="5" fill="#80daf8" stroke="#fff" strokeWidth="1.5"/>)}</g>}
      {layers.monitors && <g className="monitor-overlay" pointerEvents="none">{[[180,95],[310,340],[395,100],[490,340],[805,220]].map(([x,y],i)=><g key={i} transform={`translate(${x} ${y})`}><circle r="11" fill="#ecffda" stroke="#285941" strokeWidth="2"/><circle r="3" fill="#2b7955"/><path d="M-6-5Q0-11 6-5M-4-2Q0-6 4-2" stroke="#2b7955" strokeWidth="1.5" fill="none"/></g>)}</g>}
      {patrol && <g pointerEvents="none"><path d={ROUTE_PATH} fill="none" stroke="#143626" strokeWidth="5" strokeLinejoin="round"/><path className="patrol-route" d={ROUTE_PATH} fill="none" stroke="#d9eab8" strokeWidth="1.7" strokeDasharray="6 6"/><path className="patrol-completed" d={ROUTE_PATH} fill="none" stroke="#e0f0c5" strokeWidth="2.2" pathLength="100" strokeDasharray={`${Math.max(0,Math.min(100,patrol.progress))} 100`}/></g>}
      {PLOTS.map(p=>{const field=FIELDS.find(f=>f.id===p.id)!;return <g key={'label-'+p.id}>{layers.fields && <g className={`field-map-label ${selectedField===p.id?'selected':''}`} transform={`translate(${p.x} ${p.y})`} pointerEvents="none" textAnchor="middle">
            <rect className="field-label-box" x="-73" y="-29" width="146" height="64" rx="6" fill="#16392eef" stroke="#e0efcf88" strokeWidth=".7"/>
            <text className="field-label-title" y="-2" fill="#f7f8ef" fontSize="25" fontWeight="600"><tspan className="field-label-id">{p.id}</tspan><tspan className="field-label-crop"> {p.id==='C1'?'试验田':field.crop}</tspan></text>
            <text className="field-label-area" y="23" fill="#d2dfc9" fontSize="19">{fieldMoisture?`${fieldMoisture[p.id].toFixed(0)}% · ${fieldValves?.[p.id]?'灌溉中':'阀门关'}`:`${field.area} 亩`}</text>
          </g>}</g>})}
      {selected&&info&&<g key={'info-'+selected.id} className="field-map-callout" transform={'translate('+selected.x+' '+(selected.id==='B2'?375:423)+')'} pointerEvents="none"><path d="M0-12V-30" stroke="#e8f1dc" strokeWidth="1"/><rect x="-83" y="-11" width="166" height="50" rx="7" fill="#f7f9ef" stroke="#d3dfc4"/><text y="8" textAnchor="middle" fill="#365b42" fontSize="13" fontWeight="600">{selected.id} · 土壤采样</text><text y="27" textAnchor="middle" fill="#55744e" fontSize="12">水分 {(fieldMoisture?.[selected.id]??info.soilMoisture).toFixed(0)}% · pH {info.ph}</text></g>}
      {markers.map(p=><g key={p.id} transform={`translate(${p.x} ${p.y})`} pointerEvents="none"><circle r="12" fill={p.kind==='soil'?'#e8f1cc':'#f5b558'} stroke="#fff" strokeWidth="2"/><text y="4" textAnchor="middle" fontSize="12" fill="#203a2d">{p.kind==='soil'?'S':'!'}</text></g>)}
      {patrol&&<g className="rover-position" transform={`translate(${rx} ${ry})`}><circle r="20" fill="#d4ff7c12" className={patrol.running?'scan-pulse':''}/><g transform="scale(.85)"><ProjectRoverMarker heading={heading}/></g></g>}
    </g>
  </svg>
}
