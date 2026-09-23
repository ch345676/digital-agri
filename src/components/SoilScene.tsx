import { useCallback, useState, type CSSProperties } from 'react'
import { Pause, Play, ScanLine } from 'lucide-react'
import { useMotion } from './motion-context'
import { useSceneCanvas, type SceneDraw } from './use-scene-canvas'
import { curvePoint, traceCurve, glow, type Curve } from './scene-drawing'
const ELEMENTS = [{symbol:'N',name:'氮',index:4,x:17,y:59,color:'#d3eaa1'},{symbol:'P',name:'磷',index:5,x:80,y:59,color:'#eacb89'},{symbol:'K',name:'钾',index:6,x:28,y:78,color:'#addbbb'},{symbol:'OM',name:'有机质',index:7,x:68,y:77,color:'#d6b58a'}]
const MODES = ['温度分布', '水分迁移', '离子分布', '酸碱观察', '氮素通道', '磷素通道', '钾素通道', '有机质分布']
export default function SoilScene({ selected, value, unit, onSelect }: { selected: number; value: number; unit: string; onSelect: (index: number) => void }) {
  const [paused, setPaused] = useState(false)
  const { enabled } = useMotion()
  const focus = selected < 2 ? 'water' : selected < 4 ? 'balance' : 'nutrient'
  const draw = useCallback<SceneDraw>((ctx, w, h, t) => {
    const colors = ['#ffc582', '#9ce7f3', '#b5e0d2', '#c1b5ee', '#d3eaa1', '#eacb89', '#addbbb', '#d6b58a']
    const color = colors[selected]
    ctx.save(); ctx.beginPath(); ctx.rect(0, h * .41, w, h * .59); ctx.clip()
    // Under-surface bloom is subdued to retain the actual soil texture.
    glow(ctx, w * .5, h * .65, w * .35, color, .16)
    if (selected === 0 || selected === 3) {
      for (let n = 0; n < 4; n++) {
        const phase = (n / 4 + t * .065) % 1
        ctx.strokeStyle = color; ctx.globalAlpha = (1 - phase) * .35; ctx.lineWidth = .7
        ctx.beginPath(); ctx.ellipse(w * .5, h * .58, 20 + phase * w * .46, 12 + phase * h * .4, -.07, 0, Math.PI * 2); ctx.stroke()
      }
      ctx.globalAlpha = 1
    }
    for (let lane = 0; lane < 6; lane++) {
      const side = lane % 2 ? 1 : -1, depth = .53 + Math.floor(lane / 2) * .17
      const p: Curve = [[w * (.5 + side * .42), h * depth], [w * (.5 + side * .3), h * (depth + .07)], [w * (.5 + side * .13), h * (depth - .11)], [w * .5, h * .445]]
      traceCurve(ctx, p); ctx.strokeStyle = color + (selected === 1 ? '32' : '15'); ctx.lineWidth = .7; ctx.stroke()
      for (let i = 0; i < 8; i++) {
        const phase = (i / 8 + t * (.07 + lane * .004)) % 1
        const [x, y] = curvePoint(p, phase), [tx, ty] = curvePoint(p, Math.max(0, phase - .025))
        const alpha = (.28 + Math.sin(phase * Math.PI) * .65) * (selected === 0 || selected === 3 ? .6 : 1)
        glow(ctx, x, y, i % 3 ? 7 : 11, color, alpha * .6)
        ctx.globalAlpha = alpha; ctx.strokeStyle = color; ctx.lineWidth = selected === 1 ? 1.4 : .8
        ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(x, y); ctx.stroke()
        ctx.fillStyle = '#f5ffeb'; ctx.beginPath(); ctx.arc(x, y, selected === 1 ? 1.4 : 1, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1
      }
    }
    if (selected >= 4) {
      const element = ELEMENTS[selected - 4]
      // Explicit symbols remain legible while small tracer labels move toward roots.
      for (let lane = 0; lane < 4; lane++) {
        const side = lane % 2 ? 1 : -1
        const p: Curve = [[w * (.5 + side * .35), h * (.57 + Math.floor(lane / 2) * .2)], [w * (.5 + side * .3), h * .72], [w * (.5 + side * .16), h * .6], [w * .5, h * .46]]
        for (let n = 0; n < 2; n++) {
          const phase = (n / 2 + lane * .11 + t * .065) % 1
          const [x, y] = curvePoint(p, phase)
          ctx.font = '600 ' + Math.max(10, Math.min(13, w / 45)) + 'px system-ui'
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
          ctx.shadowColor = '#0c201a'; ctx.shadowBlur = 5; ctx.strokeStyle = '#163026'; ctx.lineWidth = 3
          ctx.globalAlpha = .5 + Math.sin(phase * Math.PI) * .45
          ctx.strokeText(element.symbol, x, y); ctx.fillStyle = element.color; ctx.fillText(element.symbol, x, y)
          ctx.globalAlpha = 1; ctx.shadowBlur = 0
        }
      }
    }
    // Soft particles suspended in pores, rather than uniform dotted arrows.
    for (let i = 0; i < 28; i++) {
      const x = w * (.09 + ((i * 73) % 83) / 100), y = h * (.47 + ((i * 29) % 47) / 100) + Math.sin(t * .45 + i) * 3
      const alpha = .12 + .25 * (1 + Math.sin(t * .75 + i * 1.7)) / 2
      glow(ctx, x, y, 4 + i % 3, color, alpha); ctx.fillStyle = color; ctx.globalAlpha = alpha
      ctx.beginPath(); ctx.arc(x, y, .9, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1
    }
    const scan = (t * .05) % 1
    const scanY = h * (.46 + scan * .47)
    const gradient = ctx.createLinearGradient(0, scanY - 17, 0, scanY + 2)
    gradient.addColorStop(0, color + '00'); gradient.addColorStop(1, color + '15')
    ctx.fillStyle = gradient; ctx.fillRect(w * .06, scanY - 17, w * .88, 19)
    ctx.strokeStyle = color + '42'; ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(w * .09, scanY); ctx.lineTo(w * .91, scanY); ctx.stroke()
    ctx.restore()
  }, [selected])
  const canvas = useSceneCanvas(draw, paused)
  return <div className="soil-illustration soil-photo-scene" data-focus={focus} data-mode={selected}>
    <img className="soil-profile-photo" src={`${import.meta.env.BASE_URL}media/insights/soil-root-profile-v2.webp`} alt="写实生成的田间幼苗与土壤根系剖面示意，非现场照片或实测剖面" width="1536" height="1024"/>
    <canvas ref={canvas} aria-hidden="true"/>
    <div className="soil-scene-toolbar"><span><ScanLine size={13}/>{MODES[selected]}</span><button aria-label={paused ? '播放土壤特效' : '暂停土壤特效'} disabled={!enabled} onClick={() => setPaused(!paused)}>{paused || !enabled ? <Play size={13}/> : <Pause size={13}/>}</button></div>
    {selected >= 4 && <div className="soil-element-layer" aria-label="土壤元素示意选择">
      <svg className="soil-element-links" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">{ELEMENTS.map(e=><path key={e.symbol} d={`M${e.x} ${e.y} Q${(e.x+50)/2} ${e.y+2} 50 47`} className={selected===e.index?'active':''} style={{stroke:e.color}}/>)}</svg>
      {ELEMENTS.map(e=><button key={e.symbol} data-element={e.symbol} className={`soil-element-node ${selected===e.index?'active':''}`} style={{left:`${e.x}%`,top:`${e.y}%`,'--element-color':e.color} as CSSProperties} onClick={()=>onSelect(e.index)} aria-label={`查看${e.name}含量`} aria-pressed={selected===e.index}><b>{e.symbol}</b><span>{e.name}</span></button>)}
      <span className="soil-element-note">元素分布示意 · 非实测位置</span>
    </div>}
    <div className="soil-scene-reading" key={selected}><span>{selected>=4?ELEMENTS[selected-4].name+'含量':'当前演示读数'}</span><b>{value}<small>{unit}</small></b></div>
    <div className="soil-scene-tabs" aria-label="图谱效果"><button aria-pressed={selected === 1} onClick={() => onSelect(1)}>水分</button><button aria-pressed={selected === 3} onClick={() => onSelect(3)}>酸碱</button><button aria-pressed={selected >= 4} onClick={() => onSelect(4)}>养分</button></div>
  </div>
}
