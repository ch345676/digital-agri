import { Sprout } from 'lucide-react'
import { useEffect, useState } from 'react'
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
import Fields, { FieldDossier } from './screens/Fields'
import Tasks from './screens/Tasks'
import History from './screens/History'
import Demo from './screens/Demo'
import Notifications from './screens/Notifications'
import { ConnectionStatus } from './components/workflow'
import { useFarm, SCENARIOS } from './FarmContext'

const SCREENS = {
  overview: Overview,
  irrigation: Irrigation,
  alerts: Alerts,
  identify: Identify,
  patrol: Patrol,
  team: Team,
  prediction: Prediction,
  spray: Spray,
  fields: Fields,
  tasks: Tasks,
  history: History,
  demo: Demo,
  notifications: Notifications,
} as const
const ORDER = ['overview', 'irrigation', 'alerts', 'patrol', 'team', 'prediction', 'identify', 'spray','fields','tasks','history','demo','notifications']

export default function Shell() {
  const { screen, setScreen } = useStore()
  const {run}=useFarm()
  const reduced = useReducedMotion()
  const [nav, setNav] = useState({ screen, direction: 1 })
  if (nav.screen !== screen) setNav({ screen, direction: ORDER.indexOf(screen) >= ORDER.indexOf(nav.screen) ? 1 : -1 })
  useEffect(() => { document.title = `${({overview:'农场概览',irrigation:'智能灌溉',alerts:'病虫害预警',identify:'拍照识别',patrol:'智能巡检',team:'农事协作',prediction:'产量预测',spray:'喷淋施药',fields:'地块档案',tasks:'农事任务',history:'农场时间轴',demo:'场景演示',notifications:'消息与处置'})[screen]} · 惠农智慧农业` }, [screen])
  const Screen = SCREENS[screen]
  const isSubPage = screen === 'prediction' || screen === 'spray' || screen === 'identify'

  return (
    <div className="app-shell mx-auto min-h-screen w-full max-w-[420px]">
      <div className="app-masthead"><div className="app-wordmark"><Sprout size={21} />惠农<span className="text-black/30"> / </span>智慧农场</div><span className="app-edition">SMART AGRICULTURE</span></div>
      <ConnectionStatus/>
      {run&&screen!=='demo'&&<button className="scenario-banner" onClick={()=>setScreen('demo')}>{SCENARIOS[run.kind].label} · {run.done?'已完成':run.running?'演示中':'已暂停'} · 查看进展 →</button>}
      <AnimatePresence mode="wait" custom={nav.direction} onExitComplete={() => window.scrollTo({ top: 0, behavior: 'instant' })}>
        <motion.div
          key={screen}
          className={`page-stage page-${screen}`}
          custom={nav.direction}
          variants={{
            enter: (direction: number) => ({ opacity: 0, x: reduced ? 0 : direction * 18 }),
            visible: { opacity: 1, x: 0, transition: { duration: reduced ? 0 : .3, ease: EASE } },
            leave: (direction: number) => ({ opacity: 0, x: reduced ? 0 : direction * -10, transition: { duration: reduced ? 0 : .14, ease: EASE } }),
          }}
          initial="enter" animate="visible" exit="leave"
        >
          <Screen />
        </motion.div>
      </AnimatePresence>
      {!isSubPage && <TabBar />}
      <FieldDossier/>
    </div>
  )
}
