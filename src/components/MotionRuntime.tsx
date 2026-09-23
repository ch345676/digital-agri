import { useEffect } from 'react'
import { useMotion } from './motion-context'
import { cancelPageTransition } from './page-transition'

const revealSelector = '.page-card, .panel, .metric-card, .fresh-welcome, .fresh-weather, .overview-heading, .page-heading-copy, .harvest-hero, .inspection-banner, [data-motion-item]'

/** One observer for all routes; animations never hold up state updates. */
export default function MotionRuntime() {
  const { enabled } = useMotion()
  useEffect(() => {
    if (!enabled || matchMedia('(prefers-reduced-motion: reduce)').matches) { cancelPageTransition(); return }
    const animations = new Set<Animation>()
    const seen = new WeakSet<Element>()
    const waiting = new Set<HTMLElement>()
    const ghosts = new Set<HTMLElement>()
    const positions = new Map<string, {rect: DOMRect; clone: HTMLElement}>()
    let frame = 0, snapshotTime = 0
    const play = (node: Element, frames: Keyframe[], duration = 430, delay = 0) => {
      if (document.hidden) return
      const a = node.animate(frames, {duration, delay, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards'})
      animations.add(a)
      a.finished.finally(() => animations.delete(a)).catch(() => {})
      return a
    }
    const observer = new IntersectionObserver(entries => {
      let order = 0
      entries.forEach(entry => {
        if (!entry.isIntersecting) return
        const node = entry.target as HTMLElement
        observer.unobserve(node); waiting.delete(node)
        // Do not leave hidden DOM behind if animation is interrupted.
        node.classList.remove('motion-pending')
        node.dataset.motionRevealed = 'true'
        play(node, [{opacity: 0, transform: 'translateY(20px) scale(.985)'}, {opacity: 1, transform: 'none'}], 490, Math.min(order++ * 38, 190))
        node.querySelectorAll<SVGGeometryElement>('.recharts-line-curve, .recharts-area-curve').forEach(path => {
          const length = path.getTotalLength()
          if (length > 0) play(path, [{strokeDasharray: String(length), strokeDashoffset: length}, {strokeDasharray: String(length), strokeDashoffset: 0}], 850, 100)
        })
        node.querySelectorAll<HTMLElement>('.progress-track>i, .h-full[style*="width"]').forEach(bar => play(bar, [{transform: 'scaleX(0)', transformOrigin: 'left'}, {transform: 'scaleX(1)', transformOrigin: 'left'}], 720, 100))
      })
    }, {threshold: .06, rootMargin: '0px 0px -12px 0px'})
    const register = (root: Element) => {
      const list = [...(root.matches(revealSelector) ? [root] : []), ...root.querySelectorAll(revealSelector)]
      list.forEach(element => {
        if (!(element instanceof HTMLElement) || seen.has(element) || element.closest('.motion-ghost, .motion-expand[data-open="false"]')) return
        seen.add(element); waiting.add(element)
        element.classList.add('motion-pending'); observer.observe(element)
      })
    }
    const snapshot = () => {
      positions.clear(); snapshotTime = performance.now()
      document.querySelectorAll<HTMLElement>('[data-motion-item]').forEach(node => {
        const rect = node.getBoundingClientRect()
        if (rect.bottom > 0 && rect.top < innerHeight) positions.set(node.dataset.motionItem!, {rect, clone: node.cloneNode(true) as HTMLElement})
      })
    }
    const layout = () => {
      frame = 0
      if (performance.now() - snapshotTime > 900 || !positions.size) { positions.clear(); return }
      const current = new Map([...document.querySelectorAll<HTMLElement>('[data-motion-item]')].map(n => [n.dataset.motionItem!, n]))
      positions.forEach(({rect, clone}, key) => {
        const node = current.get(key)
        if (node) {
          const next = node.getBoundingClientRect(), dy = rect.top - next.top, dx=rect.left-next.left
          if ((Math.abs(dy)>2||Math.abs(dx)>2) && Math.abs(dy)<innerHeight) play(node, [{transform: `translate(${dx}px,${dy}px)`}, {transform: 'none'}], 340)
        } else if (key.startsWith('task-')) {
          clone.classList.remove('motion-pending'); clone.classList.add('motion-ghost')
          clone.inert = true; clone.setAttribute('aria-hidden', 'true'); clone.removeAttribute('data-motion-item')
          Object.assign(clone.style, {position: 'fixed', left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px`, margin: '0', zIndex: '31'})
          document.body.appendChild(clone); ghosts.add(clone)
          const a = play(clone, [{opacity: .8, transform: 'none'}, {opacity: 0, transform: 'translateX(18px) scale(.98)'}], 190)
          if(a) a.finished.finally(() => {clone.remove(); ghosts.delete(clone)}).catch(() => {})
          else {clone.remove(); ghosts.delete(clone)}
        }
      })
      positions.clear()
    }
    const mutations = new MutationObserver(records => {
      let changed = false
      for (const record of records) {
        const target = record.target instanceof Element ? record.target : record.target.parentElement
        if (!target || target.closest('svg, .recharts-wrapper, .motion-ghost, .button-ripple, .motion-count')) continue
        if (record.type === 'attributes' && record.attributeName === 'data-open' && target.getAttribute('data-open') === 'true') register(target)
        if (record.type === 'childList') record.addedNodes.forEach(n => {if(n instanceof Element) register(n)})
        if (target.closest('.page-stage')) changed = true
        const status = target.closest('[data-status], [role="switch"], [role="status"]')
        if (status && (record.type === 'attributes' || record.type === 'characterData')) play(status, [{filter:'brightness(1.13)', transform:'scale(1.025)'},{filter:'brightness(1)',transform:'scale(1)'}], 340)
      }
      if (records.some(r => r.removedNodes.length)) waiting.forEach(node => {
        if (!node.isConnected) { observer.unobserve(node); waiting.delete(node); node.classList.remove('motion-pending') }
      })
      if(changed && !frame) frame = requestAnimationFrame(layout)
    })
    register(document.body)
    mutations.observe(document.body, {childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['aria-checked', 'data-status', 'data-open']})
    document.addEventListener('click', snapshot, true)
    document.addEventListener('drop', snapshot, true)
    document.addEventListener('change', snapshot, true)
    document.addEventListener('input', snapshot, true)
    const visibility = () => {if(document.hidden) animations.forEach(a => a.finish())}
    document.addEventListener('visibilitychange', visibility)
    return () => {
      observer.disconnect(); mutations.disconnect(); cancelAnimationFrame(frame)
      animations.forEach(a => a.cancel()); ghosts.forEach(n => n.remove())
      waiting.forEach(n => n.classList.remove('motion-pending'))
      document.removeEventListener('click', snapshot, true)
      document.removeEventListener('drop', snapshot, true)
      document.removeEventListener('change', snapshot, true); document.removeEventListener('input', snapshot, true)
      document.removeEventListener('visibilitychange', visibility)
      cancelPageTransition()
    }
  }, [enabled])
  return null
}
