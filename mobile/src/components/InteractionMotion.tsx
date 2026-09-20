import { useEffect } from 'react'

/** Small, non-blocking pointer feedback shared by all native and motion buttons. */
export default function InteractionMotion() {
  useEffect(() => {
    const feedback = (event: PointerEvent) => {
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
      const button = (event.target as Element).closest('button')
      if (!button || button.disabled || event.button !== 0) return
      const ring = document.createElement('i')
      ring.className = 'ui-ripple'
      ring.setAttribute('aria-hidden', 'true')
      ring.style.left = `${event.clientX}px`
      ring.style.top = `${event.clientY}px`
      document.body.append(ring)
      ring.addEventListener('animationend', () => ring.remove(), { once: true })
    }
    document.addEventListener('pointerdown', feedback, { passive: true })
    return () => {
      document.removeEventListener('pointerdown', feedback)
      document.querySelectorAll('.ui-ripple').forEach(el => el.remove())
    }
  }, [])
  return null
}
