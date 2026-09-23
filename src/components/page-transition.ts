import { flushSync } from 'react-dom'
let active: ViewTransition | undefined
export function cancelPageTransition() { active?.skipTransition(); active = undefined }
export function animatePageChange(update: () => void) {
  cancelPageTransition()
  if (!document.startViewTransition || document.documentElement.dataset.motion !== 'on' || document.hidden || matchMedia('(prefers-reduced-motion: reduce)').matches) { update(); return }
  const transition = document.startViewTransition(() => flushSync(update))
  active = transition
  transition.ready.catch(() => {})
  transition.finished.finally(() => { if (active === transition) active = undefined }).catch(() => {})
}
