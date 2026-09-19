import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

/* ============================== 类型定义 ============================== */

export type PageKey =
  | 'dashboard'
  | 'map'
  | 'tasks'
  | 'devices'
  | 'crops'
  | 'analytics'
  | 'inventory'
  | 'team'
  | 'settings'
  | 'soil'
  | 'history'
  | 'alerts'
  | 'inspection'
  | 'harvest'

export type TaskType = '日常任务' | '灌溉施肥' | '会议' | '植保' | '采收' | '农机'
export type TaskStatus = 'pending' | 'in-progress' | 'done'

export interface Task {
  id: string
  title: string
  type: TaskType
  assignee: string
  date: string // YYYY-MM-DD
  time: string // HH:mm
  status: TaskStatus
}

export interface AppNotification {
  id: string
  title: string
  desc: string
  time: string
  read: boolean
  tone: 'green' | 'orange' | 'blue' | 'red'
}

export interface Device {
  id: string
  name: string
  kind: 'soil' | 'weather' | 'valve' | 'pest'
  field: string
  online: boolean
  /** 主数值含义，如 土壤湿度 */
  metricLabel: string
  metricUnit: string
  base: number
  /** 副数值（可选） */
  metric2Label?: string
  metric2Unit?: string
  base2?: number
}

export interface InventoryItem {
  id: string
  name: string
  category: '肥料' | '农药' | '种子' | '农膜'
  quantity: number
  unit: string
  safety: number
}

export interface Member {
  id: string
  name: string
  role: string
  fields: string
  online: boolean
  tasksToday: number
}

export interface Announcement {
  id: string
  author: string
  text: string
  time: string
}

export interface GrowthRecord {
  id: string
  fieldId: string
  date: string
  text: string
}

export interface SettingsState {
  displayName: string
  farmName: string
  farmArea: string
  farmAddress: string
  notifHeat: boolean
  notifOffline: boolean
  notifTask: boolean
  density: 'comfortable' | 'compact'
}

interface PersistedState {
  tasks: Task[]
  notifications: AppNotification[]
  valves: Record<string, boolean>
  inventory: InventoryItem[]
  members: Member[]
  announcements: Announcement[]
  growthRecords: GrowthRecord[]
  settings: SettingsState
}

/* ============================== 静态数据 ============================== */

export interface FieldInfo {
  id: string
  code: string
  name: string
  crop: string
  variety: string
  area: number
  stageName: string
  stagePct: number
  health: number
  soilMoisture: number
  ph: number
  harvest: string
  nextAction: string
}

export const FIELDS: FieldInfo[] = [
  { id: 'A1', code: 'A1', name: 'A1 地块', crop: '水稻', variety: '甬优 1540', area: 32.6, stageName: '分蘖期', stagePct: 65, health: 88, soilMoisture: 82, ph: 6.2, harvest: '2026-10-05', nextAction: '追施分蘖肥' },
  { id: 'A2', code: 'A2', name: 'A2 地块', crop: '玉米', variety: '先玉 335', area: 28.4, stageName: '拔节期', stagePct: 45, health: 82, soilMoisture: 56, ph: 6.5, harvest: '2026-09-25', nextAction: '中耕除草' },
  { id: 'B1', code: 'B1', name: 'B1 地块', crop: '大豆', variety: '黑河 43', area: 26.7, stageName: '开花期', stagePct: 58, health: 80, soilMoisture: 61, ph: 6.8, harvest: '2026-09-28', nextAction: '叶面喷肥' },
  { id: 'B2', code: 'B2', name: 'B2 地块', crop: '蔬菜', variety: '上海青', area: 18.3, stageName: '莲座期', stagePct: 72, health: 84, soilMoisture: 66, ph: 6.0, harvest: '2026-09-18', nextAction: '采收准备' },
  { id: 'C1', code: 'C1', name: 'C1 地块', crop: '小麦（试验）', variety: '济麦 22', area: 15.2, stageName: '苗期', stagePct: 20, health: 76, soilMoisture: 49, ph: 6.4, harvest: '2027-06-01', nextAction: '试验数据采集' },
]

export const DEVICES: Device[] = [
  { id: 'D1', name: '土壤墒情监测仪 ①', kind: 'soil', field: 'A1 水稻', online: true, metricLabel: '土壤湿度', metricUnit: '%', base: 82, metric2Label: '土壤温度', metric2Unit: '°C', base2: 24.5 },
  { id: 'D2', name: '土壤墒情监测仪 ②', kind: 'soil', field: 'B1 大豆', online: true, metricLabel: '土壤湿度', metricUnit: '%', base: 74, metric2Label: '土壤温度', metric2Unit: '°C', base2: 23.8 },
  { id: 'D3', name: '土壤墒情监测仪 ③', kind: 'soil', field: 'C1 试验田', online: false, metricLabel: '土壤湿度', metricUnit: '%', base: 0, metric2Label: '土壤温度', metric2Unit: '°C', base2: 0 },
  { id: 'D4', name: '田间气象站', kind: 'weather', field: '农场中心', online: true, metricLabel: '空气温度', metricUnit: '°C', base: 26, metric2Label: '空气湿度', metric2Unit: '%', base2: 65 },
  { id: 'D5', name: '智能灌溉阀 ①', kind: 'valve', field: 'A1 / B1 灌区', online: true, metricLabel: '瞬时流量', metricUnit: 'm³/h', base: 0 },
  { id: 'D6', name: '智能灌溉阀 ②', kind: 'valve', field: 'B2 / C1 灌区', online: false, metricLabel: '瞬时流量', metricUnit: 'm³/h', base: 0 },
  { id: 'D7', name: '虫情测报灯', kind: 'pest', field: 'A2 玉米', online: true, metricLabel: '今日诱虫', metricUnit: '头', base: 36 },
]

export const ADVICES = [
  '未来几天温度上升，建议加强灌溉，并在相应地块追施氮肥。',
  'A1 水稻正值分蘖期，建议保持浅水层管理，促进有效分蘖。',
  '近期空气湿度较高，注意 B1 大豆田锈病预防，可提前喷施保护性杀菌剂。',
  'B2 蔬菜即将进入采收期，请提前安排采收人员与冷链运输车辆。',
]

export const TASK_TYPE_COLORS: Record<TaskType, string> = {
  日常任务: 'bg-[#e4f7ec] text-[#178a45]',
  灌溉施肥: 'bg-[#e3f0fe] text-[#3b82f6]',
  会议: 'bg-[#f1eafe] text-[#8b5cf6]',
  植保: 'bg-[#fff1e6] text-[#ea7a24]',
  采收: 'bg-[#e0f5f3] text-[#0d9488]',
  农机: 'bg-[#f3f4f6] text-[#4b5563]',
}

/* ============================== 工具 ============================== */

export function todayStr(offsetDays = 0): string {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  const m = `${d.getMonth() + 1}`.padStart(2, '0')
  const day = `${d.getDate()}`.padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

export function nowTimeStr(): string {
  const d = new Date()
  return `${`${d.getHours()}`.padStart(2, '0')}:${`${d.getMinutes()}`.padStart(2, '0')}`
}

let seq = 0
export function uid(prefix: string): string {
  seq += 1
  return `${prefix}-${Date.now().toString(36)}-${seq}`
}

/* ============================== 种子数据 ============================== */

function seedState(): PersistedState {
  const today = todayStr()
  const tomorrow = todayStr(1)
  const mk = (
    id: string,
    title: string,
    type: TaskType,
    assignee: string,
    date: string,
    time: string,
    status: TaskStatus,
  ): Task => ({ id, title, type, assignee, date, time, status })

  return {
    tasks: [
      mk('t1', '田间巡查', '日常任务', '李田丰', today, '09:00', 'pending'),
      mk('t2', '水肥一体化施肥', '灌溉施肥', '陈谷雨', today, '14:30', 'pending'),
      mk('t3', '大棚温度检查', '日常任务', '王禾苗', today, '08:30', 'done'),
      mk('t4', 'A1 水稻追施分蘖肥', '灌溉施肥', '李田丰', today, '10:00', 'in-progress'),
      mk('t5', '设备巡检', '农机', '刘春耕', today, '10:30', 'done'),
      mk('t6', '虫情样本收集', '植保', '王禾苗', today, '11:00', 'pending'),
      mk('t7', 'A2 玉米地除草', '植保', '刘春耕', today, '15:30', 'pending'),
      mk('t8', '物资盘点', '日常任务', '赵秋分', today, '16:00', 'pending'),
      mk('t9', '灌溉管道检修', '农机', '陈谷雨', today, '16:30', 'in-progress'),
      mk('t10', 'B2 蔬菜采收准备', '采收', '李田丰', today, '17:00', 'pending'),
      mk('t11', '秧苗移栽', '日常任务', '王禾苗', today, '07:30', 'done'),
      mk('t12', '气象站数据校准', '农机', '杨白露', today, '09:30', 'done'),
      mk('t13', '月度种植计划会', '会议', '李田丰', tomorrow, '10:00', 'pending'),
      mk('t14', '土壤取样送检', '日常任务', '杨白露', tomorrow, '14:00', 'pending'),
      mk('t15', '农机保养', '农机', '刘春耕', tomorrow, '15:30', 'pending'),
    ],
    notifications: [
      { id: 'n1', title: '高温预警', desc: '未来 2 天最高温将达 33°C，请注意防暑降温。', time: '10 分钟前', read: false, tone: 'orange' },
      { id: 'n2', title: '设备离线', desc: '智能灌溉阀 ② 已离线，请及时检查。', time: '1 小时前', read: false, tone: 'red' },
      { id: 'n3', title: '库存提醒', desc: '尿素库存低于安全库存线，建议及时补货。', time: '3 小时前', read: false, tone: 'blue' },
      { id: 'n4', title: '任务完成', desc: '王禾苗 完成了「大棚温度检查」。', time: '昨天 18:20', read: true, tone: 'green' },
    ],
    valves: { D5: false, D6: false },
    inventory: [
      { id: 'i1', name: '尿素', category: '肥料', quantity: 480, unit: 'kg', safety: 500 },
      { id: 'i2', name: '复合肥（15-15-15）', category: '肥料', quantity: 860, unit: 'kg', safety: 400 },
      { id: 'i3', name: '磷酸二铵', category: '肥料', quantity: 320, unit: 'kg', safety: 300 },
      { id: 'i4', name: '有机肥', category: '肥料', quantity: 1200, unit: 'kg', safety: 600 },
      { id: 'i5', name: '阿维菌素', category: '农药', quantity: 45, unit: 'L', safety: 30 },
      { id: 'i6', name: '吡虫啉', category: '农药', quantity: 12, unit: 'L', safety: 20 },
      { id: 'i7', name: '水稻种子（甬优1540）', category: '种子', quantity: 240, unit: 'kg', safety: 200 },
      { id: 'i8', name: '玉米种子（先玉335）', category: '种子', quantity: 150, unit: 'kg', safety: 100 },
      { id: 'i9', name: '农膜', category: '农膜', quantity: 65, unit: '卷', safety: 50 },
    ],
    members: [
      { id: 'm1', name: '李田丰', role: '农场主管', fields: 'A1 / A2', online: true, tasksToday: 3 },
      { id: 'm2', name: '王禾苗', role: '植保专员', fields: 'B1', online: true, tasksToday: 2 },
      { id: 'm3', name: '刘春耕', role: '农机手', fields: 'C1', online: false, tasksToday: 1 },
      { id: 'm4', name: '陈谷雨', role: '灌溉技师', fields: 'A1 / B2', online: true, tasksToday: 4 },
      { id: 'm5', name: '杨白露', role: '数据分析师', fields: '全部地块', online: true, tasksToday: 2 },
      { id: 'm6', name: '赵秋分', role: '仓储管理员', fields: '仓库', online: false, tasksToday: 1 },
    ],
    announcements: [
      { id: 'a1', author: '李田丰', text: '高温期间户外作业请避开 12:00-15:00 时段，注意补水防暑。', time: '今天 08:10' },
      { id: 'a2', author: '杨白露', text: '本周五 16:00 召开月度种植计划会，请各地块负责人准备产量数据。', time: '昨天 17:40' },
    ],
    growthRecords: [
      { id: 'g1', fieldId: 'A1', date: todayStr(-2), text: '分蘖数达标，叶色浓绿，保持浅水层。' },
      { id: 'g2', fieldId: 'A1', date: todayStr(-7), text: '完成第一次追肥，尿素 15kg/亩。' },
      { id: 'g3', fieldId: 'B1', date: todayStr(-3), text: '初花期，发现少量蚜虫，已安排植保巡查。' },
    ],
    settings: {
      displayName: '管理员',
      farmName: '绿野示范农场',
      farmArea: '121.2',
      farmAddress: '江苏省苏州市吴中区甪直镇农场路 18 号',
      notifHeat: true,
      notifOffline: true,
      notifTask: true,
      density: 'comfortable',
    },
  }
}

const STORAGE_KEY = 'agri-platform-state-v1'

function loadState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PersistedState>
      const seed = seedState()
      return { ...seed, ...parsed, settings: { ...seed.settings, ...(parsed.settings ?? {}) } }
    }
  } catch {
    /* 忽略损坏的缓存 */
  }
  return seedState()
}

/* ============================== Store ============================== */

interface Store extends PersistedState {
  page: PageKey
  setPage: (p: PageKey) => void
  readings: Record<string, { v1: number; v2: number }>
  // 任务
  addTask: (t: Omit<Task, 'id' | 'status'>) => void
  setTaskStatus: (id: string, s: TaskStatus) => void
  deleteTask: (id: string) => void
  // 通知
  markAllRead: () => void
  markRead: (id: string) => void
  // 灌溉阀
  toggleValve: (id: string) => void
  // 库存
  adjustInventory: (id: string, delta: number) => void
  // 团队
  addMember: (m: Omit<Member, 'id'>) => void
  addAnnouncement: (a: Omit<Announcement, 'id'>) => void
  // 生长记录
  addGrowthRecord: (r: Omit<GrowthRecord, 'id'>) => void
  // 设置
  saveSettings: (s: SettingsState) => void
}

const StoreContext = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [persisted, setPersisted] = useState<PersistedState>(loadState)
  const [page, setPageState] = useState<PageKey>(() => {
    const h = window.location.hash.replace('#', '') as PageKey
    const valid: PageKey[] = ['dashboard', 'map', 'tasks', 'devices', 'crops', 'analytics', 'inventory', 'team', 'settings', 'soil', 'history', 'alerts', 'inspection', 'harvest']
    return valid.includes(h) ? h : 'dashboard'
  })
  const setPage = (p: PageKey) => {
    setPageState(p)
    window.location.hash = p
  }

  // 浏览器前进/后退或手动改 hash 时同步页面
  useEffect(() => {
    const onHash = () => {
      const h = window.location.hash.replace('#', '') as PageKey
      const valid: PageKey[] = ['dashboard', 'map', 'tasks', 'devices', 'crops', 'analytics', 'inventory', 'team', 'settings', 'soil', 'history', 'alerts', 'inspection', 'harvest']
      if (valid.includes(h)) setPageState(h)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])
  const [readings, setReadings] = useState<Record<string, { v1: number; v2: number }>>(() => {
    const init: Record<string, { v1: number; v2: number }> = {}
    for (const d of DEVICES) init[d.id] = { v1: d.base, v2: d.base2 ?? 0 }
    return init
  })

  // 持久化
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted))
    } catch {
      /* 存储满等情况忽略 */
    }
  }, [persisted])

  // 设备实时数据：每 3 秒小幅波动
  useEffect(() => {
    const timer = setInterval(() => {
      setReadings((prev) => {
        const next = { ...prev }
        for (const d of DEVICES) {
          if (!d.online) continue
          const cur = prev[d.id] ?? { v1: d.base, v2: d.base2 ?? 0 }
          if (d.kind === 'valve') {
            const on = persisted.valves[d.id]
            const target = on ? 12 : 0
            const v1 = on
              ? Math.max(8, Math.min(16, cur.v1 + (Math.random() - 0.5) * 2 + (target - cur.v1) * 0.3))
              : 0
            next[d.id] = { v1: Math.round(v1 * 10) / 10, v2: 0 }
          } else if (d.kind === 'pest') {
            next[d.id] = { v1: cur.v1 + (Math.random() < 0.3 ? 1 : 0), v2: 0 }
          } else {
            const walk = (v: number, amp: number, min: number, max: number) =>
              Math.round(Math.max(min, Math.min(max, v + (Math.random() - 0.5) * amp)) * 10) / 10
            next[d.id] = {
              v1: walk(cur.v1, 1.6, d.base - 8, d.base + 8),
              v2: walk(cur.v2, 0.8, (d.base2 ?? 0) - 3, (d.base2 ?? 0) + 3),
            }
          }
        }
        return next
      })
    }, 3000)
    return () => clearInterval(timer)
  }, [persisted.valves])

  const store = useMemo<Store>(
    () => ({
      ...persisted,
      page,
      setPage,
      readings,
      addTask: (t) =>
        setPersisted((p) => ({
          ...p,
          tasks: [...p.tasks, { ...t, id: uid('t'), status: 'pending' as TaskStatus }],
        })),
      setTaskStatus: (id, s) =>
        setPersisted((p) => ({
          ...p,
          tasks: p.tasks.map((t) => (t.id === id ? { ...t, status: s } : t)),
        })),
      deleteTask: (id) =>
        setPersisted((p) => ({ ...p, tasks: p.tasks.filter((t) => t.id !== id) })),
      markAllRead: () =>
        setPersisted((p) => ({
          ...p,
          notifications: p.notifications.map((n) => ({ ...n, read: true })),
        })),
      markRead: (id) =>
        setPersisted((p) => ({
          ...p,
          notifications: p.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
        })),
      toggleValve: (id) =>
        setPersisted((p) => ({
          ...p,
          valves: { ...p.valves, [id]: !p.valves[id] },
        })),
      adjustInventory: (id, delta) =>
        setPersisted((p) => ({
          ...p,
          inventory: p.inventory.map((it) =>
            it.id === id ? { ...it, quantity: Math.max(0, it.quantity + delta) } : it,
          ),
        })),
      addMember: (m) => setPersisted((p) => ({ ...p, members: [...p.members, { ...m, id: uid('m') }] })),
      addAnnouncement: (a) =>
        setPersisted((p) => ({ ...p, announcements: [{ ...a, id: uid('a') }, ...p.announcements] })),
      addGrowthRecord: (r) =>
        setPersisted((p) => ({ ...p, growthRecords: [{ ...r, id: uid('g') }, ...p.growthRecords] })),
      saveSettings: (s) => setPersisted((p) => ({ ...p, settings: s })),
    }),
    [persisted, page, readings],
  )

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
}

export function useStore(): Store {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore 必须在 StoreProvider 内使用')
  return ctx
}
