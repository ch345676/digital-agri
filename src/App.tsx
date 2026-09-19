import { useEffect, useRef, useState } from 'react'
import { LayoutDashboard, MapPin, ClipboardList, Radar, Wheat, BarChart3, Package, Users, Settings, Sprout, ChevronRight, FlaskConical, History, ShieldAlert, Bot, Cherry, Bell, Menu, X, Pause, Play, LocateFixed, ArrowUpRight, type LucideIcon } from 'lucide-react'
import { StoreProvider, useStore, type PageKey } from './store'
import { MotionProvider } from './components/Motion'
import { useMotion } from './components/motion-context'
import { ALERTS, alertTaskTitle } from './agronomy'
import Dashboard from './pages/Dashboard'
import FarmMapPage from './pages/FarmMapPage'
import TasksPage from './pages/TasksPage'
import DevicesPage from './pages/DevicesPage'
import CropsPage from './pages/CropsPage'
import AnalyticsPage from './pages/AnalyticsPage'
import InventoryPage from './pages/InventoryPage'
import TeamPage from './pages/TeamPage'
import SettingsPage from './pages/SettingsPage'
import SoilPage from './pages/SoilPage'
import HistoryPage from './pages/HistoryPage'
import AlertsPage from './pages/AlertsPage'
import InspectionPage from './pages/InspectionPage'
import HarvestPage from './pages/HarvestPage'
import './theme.css'

const NAV: { key: PageKey; icon: LucideIcon; label: string; group: string }[] = [
  { key: 'dashboard', icon: LayoutDashboard, label: '农场总览', group: '智 慧 农 场' },
  { key: 'map', icon: MapPin, label: '农场地图', group: '' },
  { key: 'inspection', icon: Bot, label: '智能巡检', group: '' },
  { key: 'alerts', icon: ShieldAlert, label: '预警中心', group: '' },
  { key: 'tasks', icon: ClipboardList, label: '任务管理', group: '' },
  { key: 'soil', icon: FlaskConical, label: '土壤报告', group: '数 据 与 生 产' },
  { key: 'history', icon: History, label: '数据复盘', group: '' },
  { key: 'harvest', icon: Cherry, label: '采摘规划', group: '' },
  { key: 'crops', icon: Wheat, label: '作物管理', group: '' },
  { key: 'devices', icon: Radar, label: '设备监控', group: '' },
  { key: 'analytics', icon: BarChart3, label: '经营分析', group: '' },
  { key: 'inventory', icon: Package, label: '物资管理', group: '协 作 管 理' },
  { key: 'team', icon: Users, label: '团队协作', group: '' },
  { key: 'settings', icon: Settings, label: '系统设置', group: '' },
]
const PAGES: Record<PageKey, () => React.JSX.Element> = { dashboard: Dashboard, map: FarmMapPage, tasks: TasksPage, devices: DevicesPage, crops: CropsPage, analytics: AnalyticsPage, inventory: InventoryPage, team: TeamPage, settings: SettingsPage, soil: SoilPage, history: HistoryPage, alerts: AlertsPage, inspection: InspectionPage, harvest: HarvestPage }

function Shell() {
  const { page, setPage, settings, notifications, markAllRead, tasks } = useStore()
  const { enabled, toggle } = useMotion()
  const [menu, setMenu] = useState(false)
  const [notice, setNotice] = useState(false)
  const [clock, setClock] = useState(new Date())
  const [location, setLocation] = useState('')
  const [locating, setLocating] = useState(false)
  const main = useRef<HTMLElement>(null)
  const unread = notifications.filter(n => !n.read).length
  const pending = ALERTS.filter(a => !tasks.some(t => t.title === alertTaskTitle(a) && t.status === 'done')).length
  const Page = PAGES[page]
  useEffect(() => { const id = setInterval(() => setClock(new Date()), 1000); return () => clearInterval(id) }, [])
  useEffect(() => { main.current?.scrollTo({ top: 0 }); document.title = `${NAV.find(n => n.key === page)?.label} · 惠农智慧农业` }, [page])
  useEffect(() => {
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') { setMenu(false); setNotice(false) } }
    window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key)
  }, [])
  const go = (key: PageKey) => { setPage(key); setMenu(false); setNotice(false) }
  const locate = () => {
    if (!navigator.geolocation) { setLocation('当前浏览器不支持定位'); return }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(p => { setLocation(`当前位置 ${p.coords.latitude.toFixed(4)}°N, ${p.coords.longitude.toFixed(4)}°E`); setLocating(false) }, e => { setLocation(e.code === 1 ? '定位未授权，继续使用示范农场' : '暂时无法定位，请稍后重试'); setLocating(false) }, { timeout: 10000 })
  }
  return <div className="agri-shell">
    {menu && <button className="mobile-scrim" aria-label="关闭菜单" onClick={() => setMenu(false)} />}
    <aside className={`sidebar ${menu ? 'is-open' : ''}`}>
      <button className="brand" onClick={() => go('dashboard')}><span className="brand-mark"><Sprout size={28} /></span><span><b>惠农<span className="brand-dot">.</span></b><small>HUINONG · SMART AGRI</small></span></button>
      <nav aria-label="平台导航">{NAV.map(n => <div key={n.key}>{n.group && <div className="nav-group">{n.group}</div>}<button className={`nav-item ${page === n.key ? 'active' : ''}`} aria-current={page === n.key ? 'page' : undefined} onClick={() => go(n.key)}><n.icon size={18} strokeWidth={1.7} /><span>{n.label}</span>{n.key === 'alerts' && pending > 0 ? <i>{pending}</i> : page === n.key ? <ChevronRight size={14} /> : null}</button></div>)}</nav>
      <div className="sidebar-foot"><div className="connection"><span className="status-dot" />农业数字孪生 · 演示空间</div><button className="profile" onClick={() => go('settings')}><span className="avatar">{settings.displayName.slice(0, 1)}</span><span><b>{settings.displayName}</b><small>农场管理者</small></span><Settings size={16} /></button></div>
    </aside>
    <div className="workspace">
      <header className="topbar">
        <button className="icon-btn mobile-menu" aria-label="打开导航" onClick={() => setMenu(!menu)}>{menu ? <X size={20} /> : <Menu size={20} />}</button>
        <div className="breadcrumb"><span>惠农控制中心</span><ChevronRight size={13} /><b>{NAV.find(n => n.key === page)?.label}</b></div>
        <div className="topbar-tools"><span className="clock">{clock.toLocaleDateString('zh-CN', {month:'2-digit', day:'2-digit'})} <b>{clock.toLocaleTimeString('zh-CN', {hour12:false})}</b></span><span className="demo-label">演示数据</span><button className="icon-btn motion-toggle" aria-label={enabled ? '关闭动画' : '开启动画'} title={enabled ? '关闭动画' : '开启动画'} onClick={toggle}>{enabled ? <Pause size={16} /> : <Play size={16} />}</button><button className="icon-btn notification-trigger" aria-label="通知中心" aria-expanded={notice} onClick={() => setNotice(!notice)}><Bell size={18} />{unread > 0 && <i />}</button><span className="avatar mini">{settings.displayName.slice(0, 1)}</span></div>
        {notice && <section className="notification-panel"><div className="panel-heading"><h3>通知中心</h3><button className="text-btn" onClick={markAllRead}>全部标为已读</button></div>{notifications.map(n => <div className={`notice-row ${n.read ? 'read' : ''}`} key={n.id}><span className={`signal ${n.tone}`} /><div><b>{n.title}</b><p>{n.desc}</p><small>{n.time}{n.read ? ' · 已读' : ''}</small></div></div>)}<button className="text-btn" onClick={() => go('alerts')}>打开预警中心 <ArrowUpRight size={14} /></button></section>}
      </header>
      <main ref={main} className={`main-content ${settings.density === 'compact' ? 'compact' : ''}`}>
        <div className="farm-context"><span><MapPin size={13} />{settings.farmName}<span className="context-divider">/</span>数字农业协作平台</span><button onClick={locate} disabled={locating}><LocateFixed size={13} />{locating ? '定位中…' : '获取位置'}</button></div>
        {location && <div className="location-message" role="status">{location}</div>}
        <div key={page} className={`page-stage page-${page}`}><Page /></div>
        <footer className="site-footer"><span>HUINONG <i>让每一寸土地，都被悉心照料。</i></span><span>演示模式 · 数据与操作保存在当前浏览器</span></footer>
      </main>
      <nav className="mobile-bottom" aria-label="快捷导航">{NAV.filter(n => ['dashboard','tasks','map','history'].includes(n.key)).map(n => <button key={n.key} className={page === n.key ? 'active' : ''} onClick={() => go(n.key)}><n.icon size={19} /><span>{n.key === 'dashboard' ? '首页' : n.key === 'tasks' ? '作业' : n.key === 'map' ? '地图' : '复盘'}</span></button>)}<button onClick={() => setMenu(true)}><Menu size={19} /><span>更多</span></button></nav>
    </div>
  </div>
}
export default function App() { return <StoreProvider><MotionProvider><Shell /></MotionProvider></StoreProvider> }
