import { Sprout } from 'lucide-react'
import { useEffect } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useStore } from './store'
import { EASE } from './components/anim'
import TabBar from './components/TabBar'
import Overview from './screens/Overview'
import Irrigation from './screens/Irrigation'
import Identify from './screens/Identify'
import Patrol from './screens/Patrol'
import Prediction from './screens/Prediction'
import Team from './screens/Team'
import Alerts from './screens/Alerts'
import Spray from './screens/Spray'

const SCREENS = {
  overview: Overview,
  irrigation: Irrigation,
  alerts: Alerts,
  identify: Identify,
  patrol: Patrol,
  team: Team,
  prediction: Prediction,
  spray: Spray,
} as const

export default function Shell() {
  const { screen } = useStore()
  const reduced = useReducedMotion()
  useEffect(() => { document.title = `${({overview:'农场概览',irrigation:'智能灌溉',alerts:'病虫害预警',identify:'拍照识别',patrol:'智能巡检',team:'农事协作',prediction:'产量预测',spray:'喷淋施药'})[screen]} · 惠农智慧农业` }, [screen])
  const Screen = SCREENS[screen]
  const isSubPage = screen === 'prediction' || screen === 'spray' || screen === 'identify'

  return (
    <div className="app-shell mx-auto min-h-screen w-full max-w-[420px]">
      <div className="app-masthead"><div className="app-wordmark"><Sprout size={21} />惠农<span className="text-black/30"> / </span>智慧农场</div><span className="app-edition">SMART AGRICULTURE</span></div>
      <AnimatePresence mode="wait" onExitComplete={() => window.scrollTo({ top: 0, behavior: 'instant' })}>
        <motion.div
          key={screen}
          className={`page-stage page-${screen}`}
          initial={{ opacity: 0, y: reduced ? 0 : 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: reduced ? 0 : -6 }}
          transition={{ duration: reduced ? 0 : 0.22, ease: EASE }}
        >
          <Screen />
        </motion.div>
      </AnimatePresence>
      {!isSubPage && <TabBar />}
    </div>
  )
}
