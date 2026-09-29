import { flushSync } from 'react-dom'
let active: ViewTransition | undefined
export function cancelPageTransition() { active?.skipTransition(); active = undefined; delete document.documentElement.dataset.routeTransition }
export function animatePageChange(update: () => void, direction = 1) {
  cancelPageTransition()
  document.documentElement.style.setProperty('--route-direction', String(direction))
  if (!document.startViewTransition || document.documentElement.dataset.motion !== 'on' || document.hidden || matchMedia('(prefers-reduced-motion: reduce)').matches) { update(); return }
  const transition = document.startViewTransition(() => flushSync(update))
  active = transition
  document.documentElement.dataset.routeTransition = 'true'
  transition.ready.catch(() => {})
  transition.finished.finally(() => { if (active === transition) { active = undefined; delete document.documentElement.dataset.routeTransition } }).catch(() => {})
}
