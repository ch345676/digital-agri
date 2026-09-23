import { useCallback, useState } from 'react'
import { Droplets, Leaf, Pause, Play, Sprout } from 'lucide-react'
import { Count } from './Motion'
import { useMotion } from './motion-context'
import { useSceneCanvas, type SceneDraw } from './use-scene-canvas'
import { curvePoint, traceCurve, glow, type Curve } from './scene-drawing'
import { resourceScenario } from '../insight-model'
type Scenario = ReturnType<typeof resourceScenario>
export default function ResourceFlowScene({ scenario }: { scenario: Scenario }) {
  const [paused, setPaused] = useState(false)
  const { enabled } = useMotion()
  const draw = useCallback<SceneDraw>((ctx, w, h, t) => {
    const hubX = w * .57, hubY = h * .5
    glow(ctx, hubX, hubY, w * .23, '#97c99c', .25)
    // A faint field of connected points provides depth behind the transfer lanes.
    for (let i = 0; i < 35; i++) {
      const x = ((i * 137.5) % 1000) / 1000 * w, y = ((i * 71.3) % 997) / 997 * h
      ctx.fillStyle = `rgba(178,210,178,${.08 + .08 * (1 + Math.sin(t * .5 + i))})`
      ctx.beginPath(); ctx.arc(x, y, .8, 0, Math.PI * 2); ctx.fill()
    }
    const channels = [{ cost: scenario.waterCost, color: '#8cd7e4', y: .29, bend: .28 }, { cost: scenario.fertilizerCost, color: '#d4dc92', y: .74, bend: .79 }]
    for (const lane of channels) {
      const share = scenario.baseline ? lane.cost / scenario.baseline : 0
      const p: Curve = [[w * .22, h * lane.y], [w * .41, h * lane.bend], [w * .39, hubY], [hubX, hubY]]
      traceCurve(ctx, p); ctx.strokeStyle = lane.color + '15'; ctx.lineWidth = 20 + share * 13; ctx.stroke()
      traceCurve(ctx, p); ctx.strokeStyle = lane.color + '2c'; ctx.lineWidth = 7 + share * 6; ctx.stroke()
      traceCurve(ctx, p); ctx.strokeStyle = lane.color + '80'; ctx.lineWidth = 1; ctx.stroke()
      if (!lane.cost) continue
      const count = 12 + Math.round(share * 19)
      for (let i = 0; i < count; i++) {
        const progress = (i / count + t * (.13 + (i % 3) * .012)) % 1
        const [x, y] = curvePoint(p, progress), [tailX, tailY] = curvePoint(p, Math.max(0, progress - .045))
        const offset = Math.sin(i * 12.8) * (3 + share * 4)
        const a = Math.sin(progress * Math.PI) * .8 + .15
        ctx.strokeStyle = lane.color + Math.round(a * 180).toString(16).padStart(2, '0'); ctx.lineWidth = i % 3 ? 1 : 1.8
        ctx.beginPath(); ctx.moveTo(tailX, tailY + offset); ctx.lineTo(x, y + offset); ctx.stroke()
        glow(ctx, x, y + offset, 7, lane.color, a * .7)
        ctx.fillStyle = '#f5fff1'; ctx.globalAlpha = a; ctx.beginPath(); ctx.arc(x, y + offset, i % 4 ? 1.1 : 1.7, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1
      }
    }
    // Concentric collector rings and a second stream make the outgoing stage complete.
    const r = Math.max(26, Math.min(40, w * .06))
    for (let i = 0; i < 3; i++) {
      ctx.strokeStyle = ['#bcd6a952', '#e0efbd80', '#bcd6a920'][i]; ctx.lineWidth = i === 1 ? 1.5 : .7
      ctx.beginPath(); ctx.arc(hubX, hubY, r + i * 7, t * .22 + i, t * .22 + i + Math.PI * 1.45); ctx.stroke()
    }
    const outgoing: Curve = [[hubX + r, hubY], [w * .68, hubY], [w * .7, hubY], [w * .8, hubY]]
    traceCurve(ctx, outgoing); ctx.strokeStyle = '#cfe8bd38'; ctx.lineWidth = 13; ctx.stroke()
    traceCurve(ctx, outgoing); ctx.strokeStyle = '#d4e6c08a'; ctx.lineWidth = 1; ctx.stroke()
    if (scenario.next > 0) for (let i = 0; i < 13; i++) {
      const progress = (i / 13 + t * .21) % 1, [x, y] = curvePoint(outgoing, progress)
      glow(ctx, x, y, 8, '#d7edb3', .7); ctx.fillStyle = '#f3ffd8'; ctx.beginPath(); ctx.arc(x, y, 1.3, 0, Math.PI * 2); ctx.fill()
    }
  }, [scenario.waterCost, scenario.fertilizerCost, scenario.baseline, scenario.next])
  const canvas = useSceneCanvas(draw, paused)
  return <div className="resource-cinema" data-paused={paused || !enabled}>
    <div className="resource-cinema-toolbar"><span><i/>水肥投入 · 动态流向</span><button aria-label={paused ? '播放资源特效' : '暂停资源特效'} disabled={!enabled} onClick={() => setPaused(!paused)}>{paused || !enabled ? <Play size={12}/> : <Pause size={12}/>}</button></div>
    <div className="resource-transfer-scene"><canvas ref={canvas} aria-hidden="true"/>
      <div className="resource-source source-water"><span><Droplets size={14}/>灌溉用水</span><b>¥ <Count value={scenario.waterCost}/></b><small>基准费用</small></div>
      <div className="resource-source source-nutrient"><span><Leaf size={14}/>肥料投入</span><b>¥ <Count value={scenario.fertilizerCost}/></b><small>基准费用</small></div>
      <div className="resource-collector"><Sprout size={25}/><span>投入汇聚</span></div>
      <div className="resource-destination"><span>调整后投入</span><b>¥ <Count value={scenario.next}/></b><small>仅计水肥两项</small></div>
    </div>
    <div className="resource-stream-legend"><span><i/>水分通道</span><span><i/>养分通道</span><small>粒子为流向示意</small></div>
  </div>
}
