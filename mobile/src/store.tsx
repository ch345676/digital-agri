import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type ScreenKey = 'overview' | 'irrigation' | 'alerts' | 'identify' | 'patrol' | 'team' | 'prediction' | 'spray'

export interface IdentifyRecord {
  id: string
  crop: string
  disease: string
  confidence: number
  date: string
  img?: string // dataURL，空则用渐变占位
  tone: string
}

export interface ChatMessage {
  id: string
  who: 'me' | 'other'
  name: string
  text: string
  time: string
}

export interface CheckinPhoto {
  id: string
  img: string
  time: string
}

export interface RoverShot {
  id: string
  img: string
  time: string
}

/* 土壤检测记录（近红外光谱 → 四项指标） */
export interface SoilTest {
  id: string
  point: string // 检测点编号 B-01…
  time: string
  om: number // 有机质 g/kg
  tn: number // 全氮 g/kg
  ap: number // 有效磷 mg/kg
  ak: number // 速效钾 mg/kg
  spectrum: number[] // 近红外反射光谱采样（0-100 反射率）
  x: number // 逻辑坐标（卫星地图小旗）
  y: number
}

/* 巡检预警任务（疑似病斑 → 待确认） */
export interface PatrolAlert {
  id: string
  zone: string // 分区编号 B-03…
  kind: string
  time: string
  status: '待确认' | '已确认'
  x: number
  y: number
}

/* 施药任务记录（4 步向导完成后持久化） */
export interface SprayRecord {
  id: string
  code: string // RW+日期+序号
  field: string // 地块名
  area: number // 亩
  pesticide: string // 药剂名
  target: string // 防治对象
  dosagePerMu: number // 克/亩
  totalDosage: number // 总用药 g
  dilution: string // 稀释倍数
  totalWater: number // 总兑水 L
  durationSec: number // 实际用时（秒）
  startedAt: string // HH:mm
  date: string // YYYY-MM-DD
}

interface Persisted {
  identifyRecords: IdentifyRecord[]
  chat: ChatMessage[]
  checkins: CheckinPhoto[]
  valves: boolean[]
  planEnabled: boolean
  headlight: boolean
  roverShots: RoverShot[]
  soilTests: SoilTest[]
  patrolAlerts: PatrolAlert[]
  ackAlerts: string[] // 已知晓的预警 id
  sprayRecords: SprayRecord[]
}

export const BASE_STORAGE_KEY = 'agri-mobile-state-v1'

let seq = 0
export function uid(p: string) {
  seq += 1
  return `${p}-${Date.now().toString(36)}-${seq}`
}

export function nowHM() {
  const d = new Date()
  return `${`${d.getHours()}`.padStart(2, '0')}:${`${d.getMinutes()}`.padStart(2, '0')}`
}

function seed(): Persisted {
  return {
    identifyRecords: [
      { id: 'r1', crop: '南瓜', disease: '早疫病', confidence: 92, date: '05-20', tone: '#8fae4c' },
      { id: 'r2', crop: '南瓜', disease: '霜霉病', confidence: 88, date: '05-18', tone: '#6d9e3f' },
      { id: 'r3', crop: '南瓜', disease: '蚜虫', confidence: 95, date: '05-15', tone: '#7ba23e' },
      { id: 'r4', crop: '南瓜', disease: '白粉病', confidence: 90, date: '05-12', tone: '#9dbb6a' },
    ],
    chat: [
      { id: 'c1', who: 'other', name: '张师傅', text: '田块A1施肥已完成一半，土壤墒情良好。', time: '09:21' },
      { id: 'c2', who: 'other', name: '李师傅', text: '田块B2喷药作业完成，已上传作业记录。', time: '09:15' },
      { id: 'c3', who: 'other', name: '王师傅', text: '发现田块C1有虫害，已上报并处理。', time: '09:08' },
    ],
    checkins: [],
    valves: [false, true, true, false, false],
    planEnabled: true,
    headlight: false,
    roverShots: [],
    soilTests: [],
    patrolAlerts: [],
    ackAlerts: [],
    sprayRecords: [],
  }
}

function load(key: string): Persisted {
  try {
    const raw = localStorage.getItem(key)
    if (raw) {
      const merged = { ...seed(), ...(JSON.parse(raw) as Partial<Persisted>) }
      merged.valves = Array.from({ length: 5 }, (_, i) => merged.valves?.[i] === true)
      /* 旧数据迁移：历史作物名统一改为南瓜 */
      const OLD_CROPS = ['番茄', '黄瓜', '辣椒', '葡萄']
      merged.identifyRecords = merged.identifyRecords.map((r) =>
        OLD_CROPS.includes(r.crop) ? { ...r, crop: '南瓜' } : r,
      )
      return merged
    }
  } catch {
    /* ignore */
  }
  return seed()
}

interface Store extends Persisted {
  screen: ScreenKey
  setScreen: (s: ScreenKey) => void
  addIdentifyRecord: (r: Omit<IdentifyRecord, 'id'>) => void
  addChat: (m: Omit<ChatMessage, 'id'>) => void
  addCheckin: (p: Omit<CheckinPhoto, 'id'>) => void
  setValve: (i: number, on: boolean) => void
  setValves: (v: boolean[]) => void
  setPlanEnabled: (b: boolean) => void
  setHeadlight: (b: boolean) => void
  addRoverShot: (s: Omit<RoverShot, 'id'>) => void
  addSoilTest: (t: Omit<SoilTest, 'id'>) => void
  addPatrolAlert: (a: Omit<PatrolAlert, 'id'>) => string
  confirmPatrolAlert: (id: string) => void
  ackAlert: (id: string) => void
  addSprayRecord: (r: Omit<SprayRecord, 'id'>) => void
}

const Ctx = createContext<Store | null>(null)

export function StoreProvider({ children, storageKey = BASE_STORAGE_KEY }: { children: ReactNode; storageKey?: string }) {
  const [persisted, setPersisted] = useState<Persisted>(() => load(storageKey))
  const [screen, setScreenState] = useState<ScreenKey>(() => {
    const h = window.location.hash.replace('#', '') as ScreenKey
    const valid: ScreenKey[] = ['overview', 'irrigation', 'alerts', 'identify', 'patrol', 'team', 'prediction', 'spray']
    return valid.includes(h) ? h : 'overview'
  })

  const setScreen = (s: ScreenKey) => {
    setScreenState(s)
    window.location.hash = s
  }

  useEffect(() => {
    const onHash = () => {
      const h = window.location.hash.replace('#', '') as ScreenKey
      const valid: ScreenKey[] = ['overview', 'irrigation', 'alerts', 'identify', 'patrol', 'team', 'prediction', 'spray']
      if (valid.includes(h)) setScreenState(h)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(persisted))
    } catch {
      /* 存储满（如大照片）时忽略 */
    }
  }, [persisted, storageKey])

  const store = useMemo<Store>(
    () => ({
      ...persisted,
      screen,
      setScreen,
      addIdentifyRecord: (r) =>
        setPersisted((p) => ({ ...p, identifyRecords: [{ ...r, id: uid('r') }, ...p.identifyRecords] })),
      addChat: (m) => setPersisted((p) => ({ ...p, chat: [...p.chat, { ...m, id: uid('c') }] })),
      addCheckin: (ph) => setPersisted((p) => ({ ...p, checkins: [{ ...ph, id: uid('p') }, ...p.checkins] })),
      setValve: (i, on) =>
        setPersisted((p) => ({ ...p, valves: p.valves.map((v, idx) => (idx === i ? on : v)) })),
      setValves: (v) => setPersisted((p) => ({ ...p, valves: v })),
      setPlanEnabled: (b) => setPersisted((p) => ({ ...p, planEnabled: b })),
      setHeadlight: (b) => setPersisted((p) => ({ ...p, headlight: b })),
      addRoverShot: (s) => setPersisted((p) => ({ ...p, roverShots: [{ ...s, id: uid('s') }, ...p.roverShots] })),
      addSoilTest: (t) => setPersisted((p) => ({ ...p, soilTests: [{ ...t, id: uid('t') }, ...p.soilTests] })),
      addPatrolAlert: (a) => {
        const id = uid('a')
        setPersisted((p) => ({ ...p, patrolAlerts: [{ ...a, id }, ...p.patrolAlerts] }))
        return id
      },
      confirmPatrolAlert: (id) =>
        setPersisted((p) => ({
          ...p,
          patrolAlerts: p.patrolAlerts.map((a) => (a.id === id ? { ...a, status: '已确认' } : a)),
        })),
      ackAlert: (id) =>
        setPersisted((p) => (p.ackAlerts.includes(id) ? p : { ...p, ackAlerts: [...p.ackAlerts, id] })),
      addSprayRecord: (r) =>
        setPersisted((p) => ({ ...p, sprayRecords: [{ ...r, id: uid('spray') }, ...p.sprayRecords] })),
    }),
    [persisted, screen],
  )

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>
}

export function useStore(): Store {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useStore 必须在 StoreProvider 内')
  return ctx
}
