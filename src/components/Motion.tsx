import { useEffect, useRef, useState, type ReactNode } from 'react'

import { MotionContext, useMotion } from './motion-context'
export function MotionProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(() => {
    try { return localStorage.getItem('huinong-motion') !== 'off' && !matchMedia('(prefers-reduced-motion: reduce)').matches } catch { return false }
  })
  useEffect(() => {
    document.documentElement.dataset.motion = enabled ? 'on' : 'off'
    const media = matchMedia('(prefers-reduced-motion: reduce)')
    const change = () => { if (media.matches) setEnabled(false) }
    media.addEventListener('change', change)
    return () => media.removeEventListener('change', change)
  }, [enabled])
  const toggle = () => { setEnabled(!enabled); try { localStorage.setItem('huinong-motion', enabled ? 'off' : 'on') } catch { /* optional preference */ } }
  return <MotionContext.Provider value={{ enabled, toggle }}>{children}</MotionContext.Provider>
}

export function Count({ value, decimals = 0 }: { value: number; decimals?: number }) {
  const { enabled } = useMotion()
  const ref = useRef<HTMLSpanElement>(null)
  const previous = useRef(0)
  useEffect(() => {
    const node = ref.current
    if (!node) return
    if (!enabled || matchMedia('(prefers-reduced-motion: reduce)').matches) { previous.current = value; node.textContent = value.toFixed(decimals); return }
    let id = 0
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      observer.disconnect()
      const from = previous.current
      previous.current = value
      const start = performance.now()
      const step = (now: number) => {
        const p = Math.min((now - start) / 800, 1)
        node.textContent = (from + (value - from) * (1 - Math.pow(1 - p, 3))).toFixed(decimals)
        if (p < 1 && !document.hidden) id = requestAnimationFrame(step)
        else node.textContent = value.toFixed(decimals)
      }
      id = requestAnimationFrame(step)
    }, {threshold: .1})
    observer.observe(node)
    return () => { observer.disconnect(); cancelAnimationFrame(id) }
  }, [value, decimals, enabled])
  return <span className="motion-count" ref={ref}>{value.toFixed(decimals)}</span>
}

