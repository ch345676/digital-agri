import { useEffect, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion, useInView, useReducedMotion, type HTMLMotionProps } from 'framer-motion'
import { EASE } from './anim'

/** Reveal each section when it is actually seen, independently of page variants. */
export function Reveal({ children, ...props }: HTMLMotionProps<'div'>) {
  const ref = useRef<HTMLDivElement>(null)
  const seen = useInView(ref, { once: true, amount: 0.08 })
  const reduced = useReducedMotion()
  return <motion.div {...props} ref={ref} data-reveal
    initial={reduced ? false : { opacity: 0, y: 14 }}
    animate={{ opacity: seen || reduced ? 1 : 0, y: seen || reduced ? 0 : 14 }}
    transition={{ duration: reduced ? 0 : .42, ease: EASE }}>
    {children}
  </motion.div>
}

/** Keep outgoing content mounted until its natural-height collapse has finished. */
export function Disclosure({ open, children, className = '' }: { open: boolean; children: ReactNode; className?: string }) {
  const reduced = useReducedMotion()
  return <AnimatePresence initial={false}>{open && <motion.div
    className={`motion-disclosure ${className}`} data-disclosure
    initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
    transition={{ duration: reduced ? 0 : .28, ease: EASE }}>
    <div>{children}</div>
  </motion.div>}</AnimatePresence>
}

/** Reserve the existing label's geometry while its text changes. */
export function MotionLabel({ children, value, className = '' }: { children: ReactNode; value: string | number; className?: string }) {
  const reduced = useReducedMotion()
  return <span className={`motion-label ${className}`}><AnimatePresence initial={false} mode="popLayout">
    <motion.span key={value} initial={{ opacity: 0, y: reduced ? 0 : 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reduced ? 0 : -5 }} transition={{ duration: reduced ? 0 : .18 }}>{children}</motion.span>
  </AnimatePresence></span>
}

/** Ambient CSS effects run only while the scene is visible and motion is allowed. */
export function useSceneMotion<T extends Element>() {
  const ref = useRef<T>(null)
  const inView = useInView(ref, { amount: .05 })
  const reduced = useReducedMotion()
  const [visible, setVisible] = useState((!document.hidden && window.__HUINONG_FOREGROUND__ !== false))
  useEffect(() => {
    const update = () => setVisible((!document.hidden && window.__HUINONG_FOREGROUND__ !== false))
    document.addEventListener('visibilitychange', update)
    return () => document.removeEventListener('visibilitychange', update)
  }, [])
  return { ref, playing: inView && visible && !reduced }
}

export function SuccessMark({ size = 24 }: { size?: number }) {
  const reduced = useReducedMotion()
  return <svg width={size} height={size} viewBox="0 0 32 32" className="success-mark" aria-hidden="true">
    <motion.circle cx="16" cy="16" r="14" fill="#edf3df" stroke="#91a842" strokeWidth="1.5" initial={{ pathLength: reduced ? 1 : 0 }} animate={{ pathLength: 1 }} transition={{ duration: reduced ? 0 : .4 }}/>
    <motion.path d="m9 16 5 5 9-10" fill="none" stroke="#637823" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: reduced ? 1 : 0 }} animate={{ pathLength: 1 }} transition={{ duration: reduced ? 0 : .3, delay: reduced ? 0 : .18 }}/>
  </svg>
}
