import { useEffect, useRef, type RefObject } from 'react'

/** Actual page position, not a simulated loading bar. */
export default function ScrollProgress({ target, page }: { target: RefObject<HTMLElement | null>; page: string }) {
  const bar = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const main = target.current, node = bar.current
    if (!main || !node) return
    const update = () => {
      const total = main.scrollHeight - main.clientHeight
      node.style.transform = `scaleX(${total > 1 ? Math.min(1, Math.max(0, main.scrollTop / total)) : 0})`
    }
    const observer = new ResizeObserver(update)
    observer.observe(main)
    if (main.querySelector('.page-stage')) observer.observe(main.querySelector('.page-stage')!)
    main.addEventListener('scroll', update, { passive: true }); update()
    return () => { observer.disconnect(); main.removeEventListener('scroll', update) }
  }, [target, page])
  return <div className="reading-progress" aria-hidden="true"><div ref={bar}/></div>
}
