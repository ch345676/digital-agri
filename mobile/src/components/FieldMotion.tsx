import { useEffect, useRef, useState } from 'react'

/** A still photograph animated by CSS, with no video or GIF download. */
export default function FieldMotion({ src, alt, index }: { src: string; alt: string; index: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [playing, setPlaying] = useState(false)
  useEffect(() => {
    let visible = false
    const update = () => setPlaying(visible && !document.hidden)
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; update() }, { threshold: .1 })
    if (ref.current) observer.observe(ref.current)
    document.addEventListener('visibilitychange', update)
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', update) }
  }, [])
  return <div ref={ref} className={`field-motion ${playing ? 'is-playing' : ''}`}>
    <img src={src} alt={alt} loading="lazy" style={{ animationDelay: `${-index * 3}s` }} />
    <span className="field-sunlight" aria-hidden="true" />
  </div>
}
