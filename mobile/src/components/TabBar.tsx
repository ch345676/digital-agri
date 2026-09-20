import { LayoutGrid, Droplets, ShieldAlert, Car, Users } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import { useStore, type ScreenKey } from '../store'
const TABS: { key: ScreenKey; label: string; icon: typeof LayoutGrid }[] = [
  { key: 'overview', label: '概览', icon: LayoutGrid },
  { key: 'irrigation', label: '灌溉', icon: Droplets },
  { key: 'alerts', label: '预警', icon: ShieldAlert },
  { key: 'patrol', label: '巡检', icon: Car },
  { key: 'team', label: '协作', icon: Users },
]
export default function TabBar() {
  const { screen, setScreen } = useStore()
  const reduced = useReducedMotion()
  return <nav className="app-tabbar" aria-label="主要导航"><div className="app-tabs">
    {TABS.map(({ key, label, icon: Icon }) => <button key={key} className="app-tab" aria-current={screen === key ? 'page' : undefined} onClick={() => setScreen(key)}>
      {screen === key && <motion.span className="tab-highlight" layoutId="active-tab" transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 36 }} />}
      <Icon size={20} strokeWidth={screen === key ? 2 : 1.6} /><span>{label}</span>
    </button>)}
  </div></nav>
}
