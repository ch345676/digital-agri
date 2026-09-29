import { useEffect, useRef, type RefObject } from 'react'

/** Actual page position, not a simulated loading bar. */
export default function ScrollProgress({ target, page }: { target: RefObject<HTMLElement | null>; page: string }) {
  const bar = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const main = target.current, node = bar.current
    if (!main || !node) return
    let frame = 0
    const update = () => {
      frame = 0
      const total = main.scrollHeight - main.clientHeight
      node.style.transform = `scaleX(${total > 1 ? Math.min(1, Math.max(0, main.scrollTop / total)) : 0})`
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update) }
    const observer = new ResizeObserver(schedule)
    observer.observe(main)
    if (main.querySelector('.page-stage')) observer.observe(main.querySelector('.page-stage')!)
    main.addEventListener('scroll', schedule, { passive: true }); update()
    return () => { observer.disconnect(); main.removeEventListener('scroll', schedule); cancelAnimationFrame(frame) }
  }, [target, page])
  return <div className="reading-progress" aria-hidden="true"><div ref={bar}/></div>
}
