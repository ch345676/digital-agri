import { useEffect } from 'react'
import { useMotion } from './motion-context'

/** One delegated controller, with the same tactile response for mouse and keyboard. */
export default function ButtonMotion() {
  const { enabled } = useMotion()
  useEffect(() => {
    if (!enabled || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const waves = new Set<HTMLElement>(), animations = new Set<Animation>()
    const timers = new Set<ReturnType<typeof setTimeout>>()
    let light: HTMLElement | null = null, pointerFrame = 0, pointerX = 0, pointerY = 0
    const play = (node: Element, frames: Keyframe[], duration: number) => {
      const a = node.animate(frames, { duration, easing: 'cubic-bezier(.22,1,.36,1)' })
      animations.add(a); a.finished.finally(() => animations.delete(a)).catch(() => {})
      return a
    }
    const pulse = (button: HTMLButtonElement, x?: number, y?: number) => {
      if (button.disabled || button.closest('[inert]') || button.matches('.mobile-scrim, .alert-photo-button, .crop-reference, .device-reference')) return
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
      const icon = button.querySelector('svg')
      if (icon && !button.matches('[role="switch"]')) play(icon, [{ scale: '.84' }, { scale: '1.08', offset: .55 }, { scale: '1' }], 350)
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
    const clearLight = () => { if (light) { delete light.dataset.pointerLight; light = null } }
    const move = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse' || !matchMedia('(hover: hover) and (pointer: fine)').matches) return
      const node = event.target instanceof Element ? event.target.closest<HTMLElement>('.metric-card, .harvest-card, .robot-card, .board-task, .device-card') : null
      if (node !== light) { clearLight(); light = node }
      if (!light) return
      pointerX = event.clientX; pointerY = event.clientY
      if (!pointerFrame) pointerFrame = requestAnimationFrame(() => {
        pointerFrame = 0
        if (!light) return
        const rect = light.getBoundingClientRect()
        light.style.setProperty('--pointer-x', `${pointerX - rect.left}px`)
        light.style.setProperty('--pointer-y', `${pointerY - rect.top}px`)
        light.dataset.pointerLight = 'true'
      })
    }
    const visibility = () => { if (document.hidden) { clearLight(); animations.forEach(a => a.finish()) } }
    document.addEventListener('pointerdown', pointer); document.addEventListener('keydown', keyboard)
    document.addEventListener('pointermove', move, { passive: true }); document.addEventListener('pointerleave', clearLight)
    document.addEventListener('visibilitychange', visibility)
    return () => {
      document.removeEventListener('pointerdown', pointer); document.removeEventListener('keydown', keyboard)
      document.removeEventListener('pointermove', move); document.removeEventListener('pointerleave', clearLight)
      document.removeEventListener('visibilitychange', visibility)
      cancelAnimationFrame(pointerFrame); clearLight(); animations.forEach(a => a.cancel()); waves.forEach(n => n.remove()); timers.forEach(clearTimeout)
    }
  }, [enabled])
  return null
}
