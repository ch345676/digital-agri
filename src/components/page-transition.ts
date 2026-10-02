import { flushSync } from 'react-dom'
let active: ViewTransition | undefined
export function cancelPageTransition() { active?.skipTransition(); active = undefined; delete document.documentElement.dataset.routeTransition }
export function animatePageChange(update: () => void, direction = 1) {
  cancelPageTransition()
  document.documentElement.style.setProperty('--route-direction', String(direction))
  if (!document.startViewTransition || document.documentElement.dataset.motion !== 'on' || document.hidden || matchMedia('(prefers-reduced-motion: reduce)').matches) { update(); return }
  let applied = false
  const apply = () => { if (!applied) { applied = true; flushSync(update) } }
  const transition = document.startViewTransition(apply)
  active = transition
  document.documentElement.dataset.routeTransition = 'true'
  // Snapshot capture can stall on throttled renderers. Navigation must still
  // commit once, even if the browser cannot complete its visual transition.
  const fallback = setTimeout(() => {
    if (!applied) {
      transition.skipTransition(); apply()
      if (active === transition) { active = undefined; delete document.documentElement.dataset.routeTransition }
    }
  }, 550)
  transition.ready.catch(() => {})
  transition.finished.finally(() => { if (!applied) apply(); clearTimeout(fallback); if (active === transition) { active = undefined; delete document.documentElement.dataset.routeTransition } }).catch(() => {})
}
