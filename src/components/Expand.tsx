import { useEffect, useRef, type ReactNode } from 'react'
import { useMotion } from './motion-context'

/** Keeps content mounted so closing can animate without losing form state. */
export function Expand({ open, children, id }: { open: boolean; children: ReactNode; id?: string }) {
  const { enabled } = useMotion()
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const node = ref.current
    if (!node) return
    const height = node.getBoundingClientRect().height
    node.getAnimations().forEach(a => a.cancel())
    node.style.height = open ? 'auto' : '0px'
    if (!enabled || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const target = open ? node.scrollHeight : 0
    const animation = node.animate([{height: `${height}px`, opacity: open ? .4 : 1}, {height: `${target}px`, opacity: open ? 1 : 0}], {duration: 240, easing: 'cubic-bezier(.22,1,.36,1)'})
    return () => animation.cancel()
  }, [open, enabled])
  return <div ref={ref} id={id} className="motion-expand" inert={!open} aria-hidden={!open} data-open={open}><div>{children}</div></div>
}
