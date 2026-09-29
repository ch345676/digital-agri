import { useEffect } from 'react'
import { useMotion } from './motion-context'
import { cancelPageTransition } from './page-transition'

const revealSelector = '.page-card, .panel, .metric-card, .fresh-welcome, .fresh-weather, .overview-heading, .page-heading-copy, .harvest-hero, .inspection-banner, .replay-metrics>button, .insight-summary, [data-motion-item]'
const trackSelector = '.segmented, .field-tabs, .map-field-picker, [data-motion-tabs]'
const ease = 'cubic-bezier(.22,1,.36,1)'

/** Shared observers keep route, collection and control motion in one lifecycle. */
export default function MotionRuntime() {
  const { enabled } = useMotion()
  useEffect(() => {
    if (!enabled || matchMedia('(prefers-reduced-motion: reduce)').matches) { cancelPageTransition(); return }
    const animations = new Set<Animation>()
    const channels = new WeakMap<Element, Map<string, Animation>>()
    const seen = new WeakSet<Element>()
    const waiting = new Set<HTMLElement>()
    const ghosts = new Set<HTMLElement>()
    const tracks = new Set<HTMLElement>()
    const dirtyTracks = new Set<HTMLElement>()
    const ambient = new Set<HTMLElement>()
    const positions = new Map<string, { rect: DOMRect; clone: HTMLElement }>()
    let frame = 0, trackFrame = 0, snapshotTime = 0, snapshotStage: Element | null = null
    const visible = (node: Element) => {
      const rect = node.getBoundingClientRect()
      return rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < innerHeight
    }
    const play = (node: Element, frames: Keyframe[], duration = 320, delay = 0, channel = 'enter') => {
      if (document.hidden || !node.isConnected) return
      let running = channels.get(node)
      if (!running) { running = new Map(); channels.set(node, running) }
      running.get(channel)?.cancel()
      const a = node.animate(frames, { duration, delay, easing: ease, fill: 'backwards' })
      running.set(channel, a); animations.add(a)
      a.finished.finally(() => { animations.delete(a); if (running.get(channel) === a) running.delete(channel) }).catch(() => {})
      return a
    }
    const observer = new IntersectionObserver(entries => {
      let order = 0
      entries.forEach(entry => {
        if (!entry.isIntersecting) return
        const node = entry.target as HTMLElement
        observer.unobserve(node); waiting.delete(node)
        node.classList.remove('motion-pending'); node.dataset.motionRevealed = 'true'
        const delay = Math.min(order++ * 35, 140)
        play(node, [{ opacity: 0, transform: 'translateY(14px) scale(.992)' }, { opacity: 1, transform: 'none' }], 430, delay)
        node.querySelectorAll<SVGGeometryElement>('.recharts-line-curve, .recharts-area-curve').forEach(path => {
          const length = path.getTotalLength()
          if (length > 0) play(path, [{ strokeDasharray: String(length), strokeDashoffset: length }, { strokeDasharray: String(length), strokeDashoffset: 0 }], 650, delay)
        })
        node.querySelectorAll<HTMLElement>('.progress-track>i, .h-full[style*="width"]').forEach(bar => play(bar, [{ transform: 'scaleX(0)', transformOrigin: 'left' }, { transform: 'scaleX(1)', transformOrigin: 'left' }], 550, delay))
      })
    }, { threshold: .04, rootMargin: '0px 0px -8px 0px' })

    // The selection surface travels between controls without changing their hit areas.
    const measureTrack = (node: HTMLElement) => {
      const active = node.querySelector<HTMLElement>(':scope>button.active, :scope>button[aria-pressed="true"], :scope>button[aria-selected="true"]')
      if (!active || !visible(node)) { delete node.dataset.motionTrack; return }
      const rect = node.getBoundingClientRect(), selected = active.getBoundingClientRect()
      const values = { x: selected.left - rect.left + node.scrollLeft - node.clientLeft, y: selected.top - rect.top + node.scrollTop - node.clientTop, w: selected.width, h: selected.height }
      Object.entries(values).forEach(([key, value]) => {
        const name = `--selection-${key}`, next = `${value.toFixed(2)}px`
        if (node.style.getPropertyValue(name) !== next) node.style.setProperty(name, next)
      })
      node.dataset.motionTrack = 'true'
    }
    const queueTrack = (node: HTMLElement) => {
      dirtyTracks.add(node)
      if (!trackFrame) trackFrame = requestAnimationFrame(() => { trackFrame = 0; dirtyTracks.forEach(measureTrack); dirtyTracks.clear() })
    }
    const resize = new ResizeObserver(entries => entries.forEach(entry => queueTrack(entry.target as HTMLElement)))
    const ambientObserver = new IntersectionObserver(entries => entries.forEach(entry => { (entry.target as HTMLElement).dataset.motionVisible = String(entry.isIntersecting) }))
    const register = (root: Element) => {
      const list = [...(root.matches(revealSelector) ? [root] : []), ...root.querySelectorAll(revealSelector)]
      list.forEach(element => {
        if (!(element instanceof HTMLElement) || seen.has(element) || element.closest('.motion-ghost, .motion-expand[data-open="false"]')) return
        seen.add(element); waiting.add(element)
        element.classList.add('motion-pending'); observer.observe(element)
      })
      const groups = [...(root.matches(trackSelector) ? [root] : []), ...root.querySelectorAll(trackSelector)]
      groups.forEach(element => {
        const node = element as HTMLElement
        if (!tracks.has(node)) { tracks.add(node); resize.observe(node) }
        queueTrack(node)
      })
      const scenes = [...(root.matches('[data-ambient-motion]') ? [root] : []), ...root.querySelectorAll('[data-ambient-motion]')]
      scenes.forEach(element => { const node = element as HTMLElement; if (!ambient.has(node)) { ambient.add(node); ambientObserver.observe(node) } })
    }
    const snapshot = (event: Event) => {
      positions.clear(); snapshotTime = performance.now()
      const target = event.target instanceof Element ? event.target : null
      snapshotStage = target?.closest('.page-stage') ?? null
      if (!snapshotStage) return
      snapshotStage.querySelectorAll<HTMLElement>('[data-motion-item]').forEach(node => {
        if (positions.size < 40 && visible(node)) positions.set(node.dataset.motionItem!, { rect: node.getBoundingClientRect(), clone: node.cloneNode(true) as HTMLElement })
      })
    }
    const layout = () => {
      frame = 0
      if (performance.now() - snapshotTime > 800 || snapshotStage !== document.querySelector('.page-stage')) { positions.clear(); return }
      const current = new Map([...document.querySelectorAll<HTMLElement>('[data-motion-item]')].map(n => [n.dataset.motionItem!, n]))
      positions.forEach(({ rect, clone }, key) => {
        const node = current.get(key)
        if (node) {
          const next = node.getBoundingClientRect(), dy = rect.top - next.top, dx = rect.left - next.left
          if ((Math.abs(dy) > 2 || Math.abs(dx) > 2) && Math.abs(dy) < innerHeight) play(node, [{ transform: `translate(${dx}px,${dy}px)` }, { transform: 'none' }], 390, 0, 'layout')
        } else {
          clone.classList.remove('motion-pending'); clone.classList.add('motion-ghost')
          clone.inert = true; clone.setAttribute('aria-hidden', 'true'); clone.removeAttribute('data-motion-item'); clone.removeAttribute('id')
          clone.querySelectorAll('[id]').forEach(n => n.removeAttribute('id'))
          Object.assign(clone.style, { position: 'fixed', left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px`, margin: '0', zIndex: '31' })
          document.body.appendChild(clone); ghosts.add(clone)
          const a = play(clone, [{ opacity: .65, transform: 'none' }, { opacity: 0, transform: 'translateY(-6px) scale(.97)' }], 190)
          const remove = () => { clone.remove(); ghosts.delete(clone) }
          if (a) a.finished.finally(remove).catch(() => {}); else remove()
        }
      })
      positions.clear()
    }
    const mutations = new MutationObserver(records => {
      let changed = false
      const updates = new Set<Element>(), statuses = new Set<Element>()
      for (const record of records) {
        const target = record.target instanceof Element ? record.target : record.target.parentElement
        if (!target || target.closest('svg, .recharts-wrapper, .motion-ghost, .interaction-wave, .motion-count')) continue
        if (record.type === 'attributes') {
          if (record.attributeName === 'data-open' && target.getAttribute('data-open') === 'true') register(target)
          if (record.attributeName === 'data-motion-key') updates.add(target)
          if (record.attributeName === 'data-status' || record.attributeName === 'aria-checked') statuses.add(target)
          if (['class', 'aria-pressed', 'aria-selected'].includes(record.attributeName!)) {
            const group = target.parentElement?.closest<HTMLElement>(trackSelector)
            if (group) queueTrack(group)
          }
        }
        if (record.type === 'childList') record.addedNodes.forEach(n => { if (n instanceof Element) register(n) })
        if (record.type !== 'attributes' && target.closest('.page-stage')) changed = true
      }
      updates.forEach(node => { if (visible(node)) play(node, [{ opacity: .48, transform: 'translateY(4px)' }, { opacity: 1, transform: 'none' }], 260, 0, 'update') })
      statuses.forEach(node => {
        if (visible(node)) play(node, [{ boxShadow: 'inset 3px 0 0 #91ae6a', backgroundColor: '#edf4e6' }, { boxShadow: 'inset 0px 0 0 transparent', backgroundColor: getComputedStyle(node).backgroundColor }], 550, 0, 'status')
      })
      if (records.some(r => r.removedNodes.length)) {
        waiting.forEach(node => { if (!node.isConnected) { observer.unobserve(node); waiting.delete(node); node.classList.remove('motion-pending') } })
        tracks.forEach(node => { if (!node.isConnected) { resize.unobserve(node); tracks.delete(node); dirtyTracks.delete(node) } })
        ambient.forEach(node => { if (!node.isConnected) { ambientObserver.unobserve(node); ambient.delete(node) } })
      }
      if (changed && !frame && positions.size) frame = requestAnimationFrame(layout)
    })
    register(document.body)
    mutations.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'aria-pressed', 'aria-selected', 'aria-checked', 'data-status', 'data-open', 'data-motion-key'] })
    const events = ['click', 'drop', 'change', 'input'] as const
    events.forEach(name => document.addEventListener(name, snapshot, true))
    const visibility = () => { document.documentElement.dataset.motionPaused = String(document.hidden); if (document.hidden) animations.forEach(a => a.finish()) }
    visibility()
    document.addEventListener('visibilitychange', visibility)
    return () => {
      observer.disconnect(); ambientObserver.disconnect(); mutations.disconnect(); resize.disconnect(); cancelAnimationFrame(frame); cancelAnimationFrame(trackFrame)
      animations.forEach(a => a.cancel()); ghosts.forEach(n => n.remove())
      waiting.forEach(n => n.classList.remove('motion-pending')); tracks.forEach(n => { delete n.dataset.motionTrack })
      ambient.forEach(n => { delete n.dataset.motionVisible }); delete document.documentElement.dataset.motionPaused
      events.forEach(name => document.removeEventListener(name, snapshot, true))
      document.removeEventListener('visibilitychange', visibility); cancelPageTransition()
    }
  }, [enabled])
  return null
}
