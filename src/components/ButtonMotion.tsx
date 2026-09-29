import { useEffect } from 'react'
import { useMotion } from './motion-context'

/** Primary actions share a bounded pulse; secondary controls use state transitions. */
export default function ButtonMotion() {
  const { enabled } = useMotion()
  useEffect(() => {
    if (!enabled || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const waves = new Set<HTMLElement>(), animations = new Set<Animation>()
    const timers = new Set<ReturnType<typeof setTimeout>>()
    const play = (node: Element, frames: Keyframe[], duration: number) => {
      const a = node.animate(frames, { duration, easing: 'cubic-bezier(.22,1,.36,1)' })
      animations.add(a); a.finished.finally(() => animations.delete(a)).catch(() => {})
      return a
    }
    const pulse = (button: HTMLButtonElement, x?: number, y?: number) => {
      if (button.disabled || button.closest('[inert]') || !button.matches('.primary-btn, .task-start, .task-finish')) return
      const r = button.getBoundingClientRect()
      if (!r.width || r.height > 250) return
      button.querySelectorAll('.interaction-wave').forEach(n => n.remove())
      const wave = document.createElement('span'); wave.className = 'interaction-wave'; wave.setAttribute('aria-hidden', 'true')
      const size = Math.min(500, Math.hypot(r.width, r.height) * 2)
      Object.assign(wave.style, { width: `${size}px`, height: `${size}px`, left: `${(x ?? r.left + r.width / 2) - r.left - size / 2}px`, top: `${(y ?? r.top + r.height / 2) - r.top - size / 2}px` })
      button.appendChild(wave); waves.add(wave)
      const animation = play(wave, [{ transform: 'scale(.04)', opacity: .7 }, { transform: 'scale(1)', opacity: 0 }], 570)
      // A detached or occluded button must not keep decoration alive indefinitely.
      const cleanup = () => { wave.remove(); waves.delete(wave); animation.cancel(); clearTimeout(timer); timers.delete(timer) }
      const timer = setTimeout(cleanup, 650); timers.add(timer)
      animation.finished.finally(cleanup).catch(() => {})
    }
    const pointer = (event: PointerEvent) => {
      if (event.button !== 0) return
      const button = event.target instanceof Element ? event.target.closest('button') : null
      if (button) pulse(button, event.clientX, event.clientY)
    }
    const keyboard = (event: KeyboardEvent) => {
      if (event.repeat || !['Enter', ' '].includes(event.key)) return
      const button = event.target instanceof Element ? event.target.closest('button') : null
      if (button) pulse(button)
    }
    const visibility = () => { if (document.hidden) animations.forEach(a => a.finish()) }
    document.addEventListener('pointerdown', pointer); document.addEventListener('keydown', keyboard)
    document.addEventListener('visibilitychange', visibility)
    return () => {
      document.removeEventListener('pointerdown', pointer); document.removeEventListener('keydown', keyboard)
      document.removeEventListener('visibilitychange', visibility)
      animations.forEach(a => a.cancel()); waves.forEach(n => n.remove()); timers.forEach(clearTimeout)
    }
  }, [enabled])
  return null
}
