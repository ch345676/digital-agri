import {
  Home as HomeIcon,
  MapPin,
  ClipboardList,
  Radar,
  Wheat,
  BarChart3,
  Package,
  Users,
  Settings as SettingsIcon,
  Sprout,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react'
import { StoreProvider, useStore, type PageKey } from './store'
import Dashboard from './pages/Dashboard'
import FarmMapPage from './pages/FarmMapPage'
import TasksPage from './pages/TasksPage'
import DevicesPage from './pages/DevicesPage'
import CropsPage from './pages/CropsPage'
import AnalyticsPage from './pages/AnalyticsPage'
import InventoryPage from './pages/InventoryPage'
import TeamPage from './pages/TeamPage'
import SettingsPage from './pages/SettingsPage'

const NAV_ITEMS: { key: PageKey; icon: LucideIcon; label: string }[] = [
  { key: 'dashboard', icon: HomeIcon, label: '工作台' },
  { key: 'map', icon: MapPin, label: '农场地图' },
  { key: 'tasks', icon: ClipboardList, label: '任务管理' },
  { key: 'devices', icon: Radar, label: '设备监控' },
  { key: 'crops', icon: Wheat, label: '作物管理' },
  { key: 'analytics', icon: BarChart3, label: '数据分析' },
  { key: 'inventory', icon: Package, label: '物资管理' },
  { key: 'team', icon: Users, label: '团队协作' },
  { key: 'settings', icon: SettingsIcon, label: '系统设置' },
]

function Sidebar() {
  const { page, setPage, settings } = useStore()
  return (
    <aside className="flex h-screen w-[220px] shrink-0 flex-col bg-white">
      {/* Logo */}
      <div className="flex flex-col items-center pb-6 pt-7">
        <div className="flex h-14 w-14 items-center justify-center rounded-full border-[3px] border-[#1fa756] bg-white">
          <Sprout className="h-7 w-7 text-[#1fa756]" strokeWidth={2.2} />
        </div>
        <div className="mt-3 text-[20px] font-extrabold tracking-wide text-[#17352a]">数字农业</div>
        <div className="mt-0.5 text-[13px] text-[#8aa398]">协作平台</div>
      </div>

      {/* 导航 */}
      <nav className="flex-1 space-y-1.5 overflow-y-auto px-4">
        {NAV_ITEMS.map((item) => {
          const active = page === item.key
          return (
            <button
              key={item.key}
              onClick={() => setPage(item.key)}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-[15px] transition-colors ${
                active ? 'font-semibold text-[#178a45]' : 'text-[#5f7a6e] hover:bg-[#f2f9f5]'
              }`}
              style={active ? { backgroundColor: '#e4f7ec' } : undefined}
            >
              <item.icon
                className="h-[19px] w-[19px]"
                strokeWidth={active ? 2.4 : 2}
                color={active ? '#1fa756' : '#7b9489'}
              />
              {item.label}
            </button>
          )
        })}
      </nav>

      {/* 用户卡片 */}
      <div className="border-t border-[#eef5f1] p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#2fbf71] to-[#14914a] text-[17px] font-bold text-white">
            {settings.displayName.slice(0, 1) || '管'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[15px] font-bold text-[#17352a]">{settings.displayName}</div>
            <span className="mt-1 inline-block rounded-md bg-[#e4f7ec] px-2 py-0.5 text-[11px] font-semibold text-[#178a45]">
              系统管理员
            </span>
          </div>
          <ChevronRight className="h-4 w-4 text-[#a4bcb1]" />
        </div>
      </div>
    </aside>
  )
}

const PAGES: Record<PageKey, () => React.JSX.Element> = {
  dashboard: Dashboard,
  map: FarmMapPage,
  tasks: TasksPage,
  devices: DevicesPage,
  crops: CropsPage,
  analytics: AnalyticsPage,
  inventory: InventoryPage,
  team: TeamPage,
  settings: SettingsPage,
}

function Shell() {
  const { page, settings } = useStore()
  const Page = PAGES[page]
  return (
    <div className="flex h-screen overflow-hidden bg-[#eef7f1] text-[#17352a]">
      <Sidebar />
      <main
        className="min-w-0 flex-1 overflow-y-auto px-6 pb-6 pt-6"
        style={{ zoom: settings.density === 'compact' ? 0.88 : 1 }}
      >
        <Page />
      </main>
    </div>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  )
}
