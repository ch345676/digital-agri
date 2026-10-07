import { Component, useEffect, type ReactNode } from 'react'

declare global {
  interface Window {
    __HUINONG_READY__?: boolean
    __HUINONG_BOOT_FAILED__?: boolean
    __HUINONG_METRICS__?: { firstPaintMs: number | null; interactiveMs: number | null }
    __huinongBoot?: { ready: () => void; fail: (reason: string) => void }
  }
}

function Ready({ children }: { children: ReactNode }) {
  useEffect(() => { window.__huinongBoot?.ready() }, [])
  return children
}

export default class StartupBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch(error: Error) {
    window.__huinongBoot?.fail(error.message.slice(0, 300))
  }
  render() { return this.state.failed ? null : <Ready>{this.props.children}</Ready> }
}
