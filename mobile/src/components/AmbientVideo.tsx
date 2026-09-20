import { useEffect, useRef, type VideoHTMLAttributes } from 'react'
import { useReducedMotion } from 'framer-motion'

/** Decorative field footage only plays while visible and motion is welcome. */
export default function AmbientVideo({ autoPlay = true, ...props }: VideoHTMLAttributes<HTMLVideoElement>) {
  const ref = useRef<HTMLVideoElement>(null)
  const reduced = useReducedMotion()
  useEffect(() => {
    const video = ref.current
    if (!video) return
    let visible = false
    const update = () => {
      if (autoPlay && visible && !document.hidden && !reduced) void video.play().catch(() => {})
      else video.pause()
    }
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; update() }, { threshold: .1 })
    observer.observe(video)
    document.addEventListener('visibilitychange', update)
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', update); video.pause() }
  }, [autoPlay, reduced, props.src])
  return <video {...props} ref={ref} preload="metadata" />
}
