import { useEffect, useRef } from 'react'
import { useMotion } from './motion-context'
export type SceneDraw = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => void

/** A single bounded animation loop; off-screen and background scenes are suspended. */
export function useSceneCanvas(draw: SceneDraw, paused = false) {
  const ref = useRef<HTMLCanvasElement>(null)
  const { enabled } = useMotion()
  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    let frame = 0, visible = false, width = 0, height = 0, last = 0
    const moving = enabled && !paused
    const paint = (time: number) => {
      if (!width || !height) return
      ctx.clearRect(0, 0, width, height)
      draw(ctx, width, height, moving ? time / 1000 : 0)
    }
    const loop = (time: number) => {
      if (time - last >= 32) { paint(time); last = time }
      frame = requestAnimationFrame(loop)
    }
    const sync = () => {
      cancelAnimationFrame(frame)
      const running = moving && visible && !document.hidden
      canvas.dataset.running = String(running)
      paint(performance.now())
      if (running) frame = requestAnimationFrame(loop)
    }
    const resize = new ResizeObserver(([entry]) => {
      width = entry.contentRect.width; height = entry.contentRect.height
      const ratio = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio)
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
      sync()
    })
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync() }, { threshold: .05 })
    resize.observe(canvas); observer.observe(canvas)
    document.addEventListener('visibilitychange', sync)
    return () => { cancelAnimationFrame(frame); resize.disconnect(); observer.disconnect(); document.removeEventListener('visibilitychange', sync) }
  }, [draw, enabled, paused])
  return ref
}
