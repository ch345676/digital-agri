import { useEffect, useState } from 'react'
import { useMotion } from './motion-context'
export function usePresence(open: boolean, duration = 180) {
  const { enabled } = useMotion()
  const [previous, setPrevious] = useState(open)
  const [present, setPresent] = useState(open)
  if (previous !== open) {
    setPrevious(open)
    if (open) setPresent(true)
  }
  useEffect(() => {
    if (open || !present) return
    const timer = setTimeout(() => setPresent(false), enabled ? duration : 0)
    return () => clearTimeout(timer)
  }, [open, present, duration, enabled])
  return open || present
}
