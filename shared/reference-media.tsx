import type { ImgHTMLAttributes } from 'react'
import { isRetiredPhoto, photoBySrc, type PhotoReference } from './reference-photos'
import './reference-media.css'

export function PhotoCredit({ photo, src }: { photo?: PhotoReference; src?: string }) {
  const ref = photo ?? photoBySrc(src)
  if (!ref) return null
  return <div className="photo-credit">
    <b>{ref.title}</b><p>{ref.caption}</p>
    <details><summary>查看完整照片与来源</summary><div className="photo-source-body">
      <img src={ref.image} alt={ref.title} loading="lazy"/>
      <span>摄影 / 来源：{ref.author}</span>
      <span><a href={ref.source} target="_blank" rel="noreferrer">原始来源</a> · <a href={ref.licenseUrl} target="_blank" rel="noreferrer">{ref.license}</a></span>
      <small>保留原始照片内容；卡片可能裁切显示，完整照片见上方。扫描线等为界面动画。</small>
    </div></details>
  </div>
}

export function StoredPhoto({ src, alt, className, ...props }: ImgHTMLAttributes<HTMLImageElement>) {
  if (!src || isRetiredPhoto(src)) return <span className={`retired-photo ${className ?? ''}`} role="img" aria-label={src ? '旧版示意图已移除，原记录保留' : '未附现场照片'}><span>▧<small>{src ? '旧版示意图已移除' : '未附现场照片'}</small></span></span>
  return <img src={src} alt={alt ?? '记录图片'} className={className} {...props}/>
}

export function RoverSchematic({ className = '' }: { className?: string }) {
  return <div className={`rover-schematic ${className}`}>
    <svg viewBox="0 0 520 240" role="img" aria-label="四轮巡检车功能结构示意，非设备实拍">
      <path d="M10 202H510M25 180H495M55 160H465M85 141H435M150 100L75 230M230 100L205 230M310 100L335 230M390 100L465 230" fill="none" stroke="#bdcec6" strokeWidth="1"/>
      <ellipse cx="261" cy="204" rx="132" ry="16" fill="#1e4538" opacity=".1"/>
      <g stroke="#214c3e" strokeWidth="3" strokeLinejoin="round">
        <rect x="148" y="154" width="32" height="49" rx="12" fill="#33564a"/><rect x="326" y="154" width="32" height="49" rx="12" fill="#33564a"/>
        <path d="M166 164L208 140H349L321 166V196H166Z" fill="#c4d6cc"/>
        <path d="M166 164H321L349 140V173L321 196" fill="none"/>
        <path d="M207 147V88L257 64L306 86V147L259 165Z" fill="#e8eee6"/>
        <path d="M207 88L259 110L306 86M259 110V165" fill="none"/>
        <path d="M273 80V39" strokeWidth="9"/><rect x="258" y="27" width="34" height="24" rx="8" fill="#e8eee6"/>
        <circle cx="275" cy="38" r="5" fill="#294f40" stroke="none"/>
        <rect x="157" y="178" width="32" height="40" rx="12" fill="#33564a"/><rect x="301" y="178" width="32" height="40" rx="12" fill="#33564a"/>
      </g>
      <g fill="none" stroke="#87a75e" strokeWidth="2"><path d="M296 38H369L386 22"/><path d="M215 109H132L117 94"/><path d="M345 191H398L415 177"/></g>
      <g fontSize="12" fill="#446853"><text x="391" y="25">视觉感知</text><text x="51" y="92">光谱模块</text><text x="416" y="176">四轮底盘</text></g>
      <circle className="schematic-pulse" cx="275" cy="38" r="15" fill="none" stroke="#8aa85c"/>
    </svg>
    <span className="schematic-tag">功能结构示意 · 非设备照片</span>
  </div>
}

export function SprayDiagram({ compact = false }: { compact?: boolean }) {
  return <div className={`spray-diagram ${compact ? 'is-compact' : ''}`}>
    <svg viewBox="0 0 300 145" role="img" aria-label="喷淋流程动画示意，非现场照片">
      <path d="M28 121H275" stroke="#b6c89b" strokeWidth="3"/>
      {[65,112,162,211,251].map((x,i)=><g key={x} stroke="#6f9468" fill="#9ab477" strokeWidth="2"><path d={`M${x} 120v-24`}/><path d={`M${x} 110q-17 -1 -19 -16q17 -2 19 16M${x} 106q16 -3 17 -17q-17 0 -17 17`}/><path className="spray-droplet" style={{animationDelay:`${i*.18}s`}} d={`M${x-1} 55l-3 13`} stroke="#4f9eb4"/></g>)}
      <path d="M45 36H260M151 36V17" fill="none" stroke="#456e62" strokeWidth="7" strokeLinecap="round"/>
      {[68,151,238].map(x=><g key={x}><path d={`M${x-7} 36v10h14V36`} fill="#587f6b"/><path d={`M${x} 50l-23 32M${x} 50v32M${x} 50l23 32`} stroke="#80b8c1" strokeDasharray="2 5" strokeWidth="2" fill="none"/></g>)}
    </svg><span>喷淋流程示意</span>
  </div>
}
