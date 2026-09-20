import AmbientVideo from '../components/AmbientVideo'
import { useEffect, useRef, useState } from 'react'
import {
  ChevronLeft, Layers, LocateFixed, Maximize2, X, Video,
  Camera, Lightbulb, FlaskConical, ScanSearch, Move, Droplets, BatteryCharging,
  TriangleAlert, ImageIcon, ClipboardCheck, Lock,
} from 'lucide-react'
import { AnimatePresence, motion, animate } from 'framer-motion'
import L from 'leaflet'
import { Glass, stagger, fadeUp, EASE } from '../components/anim'
import { SatMap, toggleLabels, type SatCenter } from '../components/SatMap'
import { DEMO_LOCATION } from '../lib/weather'
import { useStore, nowHM, type SoilTest, type PatrolAlert } from '../store'
import { usePerm } from '../auth'

/* 巡检路线（沿田埂折线），逻辑坐标 360x210，渲染时换算为经纬度偏移 */
const ROUTE: [number, number][] = [
  [30, 180], [120, 180], [120, 120], [200, 120], [200, 60], [300, 60], [300, 140],
  [240, 140], [240, 190], [150, 190], [150, 150], [60, 150], [60, 100], [30, 100],
]
const DOCK: [number, number] = ROUTE[0] // 充电桩（路线起点）
const FIELD_POLY = [[24, 196], [24, 44], [312, 44], [312, 196]]
const WAYPOINT_NAMES = [
  '充电桩', '东侧田埂 · 南段', '3号南瓜田 · 东界', '3号南瓜田 · 东北角', '3号南瓜田 · 北界',
  '灌溉阀组', '北界田埂 · 西段', '土壤采样点 A', '2号南瓜田 · 东界', '2号南瓜田 · 南界',
  '1号南瓜田', '南界田埂 · 西段', '西南角', '返回充电桩',
]
/* 历史异常分区（网格语义：3x3 小方格块） */
const ANOMALIES: { x: number; y: number; color: string }[] = [
  { x: 200, y: 90, color: '#e8604c' },
  { x: 262, y: 140, color: '#e8a04c' },
  { x: 62, y: 126, color: '#e8a04c' },
]
const GEARS = [
  { k: 'D1', speed: 0.6 },
  { k: 'D2', speed: 1.2 },
  { k: 'D3', speed: 2.0 },
]
/* 结构图鉴 8 大模块 */
const MODULES = [
  '上层 · 农药水箱（预留）', '工业计算与控制板', '底盘供电 / 信号线束', '车轮驱动与悬挂（四轮转向）',
  'USB 工业摄像头（云台）', '泵 / 过滤器 / 管路', '下层 · 电池组', '底部 · 光学检测模块',
]

/* 逻辑坐标 → 经纬度（围绕中心点） */
const LNG_SPAN = 0.005
const LAT_SPAN = 0.0029
const toLatLng = (c: SatCenter, px: number, py: number): [number, number] => [
  c.lat + ((105 - py) / 210) * LAT_SPAN,
  c.lon + ((px - 180) / 360) * LNG_SPAN,
]
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/* 覆盖物图标 */
const wpIcon = () => L.divIcon({ className: 'lm-pin', html: '<span class="lm-wp"></span>', iconSize: [6, 6], iconAnchor: [3, 3] })
const dockIcon = () => L.divIcon({ className: 'lm-pin', html: '<span class="lm-home">⚡</span>', iconSize: [22, 22], iconAnchor: [11, 11] })
/* 土壤检测点编号小旗 */
const flagIcon = (label: string) =>
  L.divIcon({
    className: 'lm-pin lm-flag',
    html: `<span style="display:flex;align-items:center;gap:2px;background:rgba(11,15,12,0.88);border:1px solid rgba(163,230,53,0.6);border-radius:4px;padding:1px 4px;font-size:8px;line-height:1.4;color:#a3e635;white-space:nowrap">⚑ ${label}</span>`,
    iconSize: [40, 14],
    iconAnchor: [3, 7],
  })

/* 网格分区块（3x3 小方格高亮，对齐真实网格地图语义） */
const drawGridBlock = (g: L.LayerGroup, c: SatCenter, cx: number, cy: number, color: string) => {
  const s = 8
  const gap = 1.5
  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      const x0 = cx + i * (s + gap) - s / 2
      const y0 = cy + j * (s + gap) - s / 2
      L.polygon(
        [toLatLng(c, x0, y0), toLatLng(c, x0 + s, y0), toLatLng(c, x0 + s, y0 + s), toLatLng(c, x0, y0 + s)],
        { color, weight: 0.5, fillColor: color, fillOpacity: 0.32 },
      ).addTo(g)
    }
  }
}

/* ROVER_SKIN: 换皮单一引用点 —— 真实车体俯视图：方箱体 + 摄像头立杆 + 四轮（前后反向转向态） */
const roverIcon = () =>
  L.divIcon({
    className: 'lm-pin lm-rover',
    html: `<svg width="40" height="40" viewBox="0 0 40 40">
      <circle cx="20" cy="20" r="16" fill="rgba(163,230,53,0.10)"/>
      <rect x="9" y="10.5" width="4.5" height="7" rx="1.8" fill="rgba(237,242,238,0.6)" transform="rotate(-12 11.25 14)"/>
      <rect x="26.5" y="10.5" width="4.5" height="7" rx="1.8" fill="rgba(237,242,238,0.6)" transform="rotate(-12 28.75 14)"/>
      <rect x="9" y="22.5" width="4.5" height="7" rx="1.8" fill="rgba(237,242,238,0.6)" transform="rotate(12 11.25 26)"/>
      <rect x="26.5" y="22.5" width="4.5" height="7" rx="1.8" fill="rgba(237,242,238,0.6)" transform="rotate(12 28.75 26)"/>
      <rect x="12.5" y="8" width="15" height="24" rx="2.5" fill="#c9cfc9"/>
      <rect x="14" y="12.5" width="12" height="13.5" rx="1.5" fill="#EDF2EE"/>
      <rect x="21.3" y="8.6" width="2.6" height="5.5" rx="1.3" fill="#dfe4df"/>
      <circle cx="22.6" cy="8.8" r="2.7" fill="#EDF2EE" stroke="rgba(10,15,12,0.4)" stroke-width="0.6"/>
      <circle cx="22.6" cy="8.8" r="0.9" fill="#0a0f0c"/>
      <rect x="16.5" y="27.5" width="7" height="3" rx="1.2" fill="rgba(10,15,12,0.45)"/>
    </svg>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  })

type Mode = 'auto' | 'manual'
type RoverStatus = 'cruise' | 'returning' | 'docked'
type SoilPhase = 'idle' | 'descend' | 'collect'
type ScanPhase = 'idle' | 'scanning' | 'lock'
type SoilResult = Omit<SoilTest, 'id'>

/* 近红外反射光谱模拟曲线（0-100 反射率，0.6 处吸收谷） */
const genSpectrum = () =>
  Array.from({ length: 48 }, (_, i) => {
    const t = i / 47
    return Math.round((28 + 32 * t - 9 * Math.exp(-Math.pow((t - 0.6) / 0.07, 2)) + Math.random() * 2.5) * 10) / 10
  })
const spectrumPoints = (s: number[]) => s.map((v, i) => `${(i / (s.length - 1)) * 300},${88 - (v / 100) * 80}`).join(' ')

export default function Patrol() {
  const {
    setScreen, headlight, setHeadlight, roverShots, addRoverShot,
    soilTests, addSoilTest, patrolAlerts, addPatrolAlert, confirmPatrolAlert,
  } = useStore()
  const { isAdmin, needAdmin, needLogin } = usePerm()
  const [mode, setMode] = useState<Mode>('auto')
  const [status, setStatus] = useState<RoverStatus>('cruise')
  const [cruising, setCruising] = useState(true)
  const [gear, setGear] = useState(1)
  const [tele, setTele] = useState({ battery: 68, speed: 1.2, mileage: 2.6, signal: -62 })
  const [progress, setProgress] = useState(38)
  const [elapsed, setElapsed] = useState(12 * 60 + 45) // 秒
  const [nextTarget, setNextTarget] = useState(WAYPOINT_NAMES[1])
  const [knob, setKnob] = useState<[number, number]>([0, 0])
  const [toast, setToast] = useState<string | null>(null)
  /* 真实硬件功能状态 */
  const [soilPhase, setSoilPhase] = useState<SoilPhase>('idle')
  const [soilProgress, setSoilProgress] = useState(0)
  const [soilResult, setSoilResult] = useState<SoilResult | null>(null)
  const [scanPhase, setScanPhase] = useState<ScanPhase>('idle')
  const [alertCard, setAlertCard] = useState<PatrolAlert | null>(null)
  const [showGimbal, setShowGimbal] = useState(false)
  const [gimbal, setGimbal] = useState({ pan: 0, tilt: 0 })
  const [showExploded, setShowExploded] = useState(false)

  /* 地图相关 ref */
  const mapWrapRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const overlayRef = useRef<L.LayerGroup | null>(null)
  const roverMarkerRef = useRef<L.Marker | null>(null)
  const centerRef = useRef<SatCenter>({ ...DEMO_LOCATION })
  const posRef = useRef<[number, number]>([...ROUTE[1]])
  const segRef = useRef(0)
  const speedRef = useRef(1.2)
  const joyRef = useRef({ dx: 0, dy: 0, mag: 0 })
  const joyBaseRef = useRef<HTMLDivElement>(null)
  const toastTimer = useRef<number | null>(null)
  const alertZonesRef = useRef<{ x: number; y: number }[]>([])
  /* 供长驻 interval 读取的最新状态 */
  const modeRef = useRef(mode)
  const statusRef = useRef(status)
  const cruisingRef = useRef(cruising)
  const gearRef = useRef(gear)
  useEffect(() => { modeRef.current = mode }, [mode])
  useEffect(() => { statusRef.current = status }, [status])
  useEffect(() => { cruisingRef.current = cruising }, [cruising])
  useEffect(() => { gearRef.current = gear }, [gear])

  const syncRover = () => {
    const m = roverMarkerRef.current
    if (m) m.setLatLng(toLatLng(centerRef.current, posRef.current[0], posRef.current[1]))
  }

  const showToast = (t: string) => {
    setToast(t)
    if (toastTimer.current) window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 2200)
  }

  /* 遥测微跳 + 进度缓增（2s 节拍） */
  useEffect(() => {
    const t = setInterval(() => {
      const spd = statusRef.current === 'docked' ? 0 : speedRef.current
      setTele((p) => ({
        battery: Math.max(1, Math.round((p.battery - 0.05) * 10) / 10),
        speed: Math.round((spd + (spd > 0 ? (Math.random() - 0.5) * 0.08 : 0)) * 100) / 100,
        mileage: Math.round((p.mileage + (spd > 0 ? spd * 2 * 0.001 : 0)) * 1000) / 1000,
        signal: Math.round(-62 + (Math.random() - 0.5) * 7),
      }))
      if (modeRef.current === 'auto' && statusRef.current === 'cruise' && cruisingRef.current) {
        setProgress((p) => Math.min(99, Math.round((p + 0.3) * 10) / 10))
        setElapsed((e) => e + 2)
      }
    }, 2000)
    return () => clearInterval(t)
  }, [])

  /* 自动巡航：沿田埂路线循环（framer-motion 驱动，直接写 marker） */
  useEffect(() => {
    if (mode !== 'auto' || status !== 'cruise' || !cruising) return
    speedRef.current = 1.2
    const controls = animate(0, 1, {
      duration: 72,
      repeat: Infinity,
      ease: 'linear',
      onUpdate: (t) => {
        const n = ROUTE.length
        const seg = t * n
        const i = Math.floor(seg) % n
        const f = seg - Math.floor(seg)
        const a = ROUTE[i]
        const b = ROUTE[(i + 1) % n]
        posRef.current = [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]
        syncRover()
        if (i !== segRef.current) {
          segRef.current = i
          setNextTarget(WAYPOINT_NAMES[(i + 1) % n])
        }
      },
    })
    return () => controls.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, status, cruising])

  /* 手动驾驶：30ms 循环按摇杆向量 × 挡位速度更新位置 */
  useEffect(() => {
    if (mode !== 'manual') return
    speedRef.current = 0
    const t = setInterval(() => {
      const j = joyRef.current
      if (j.mag > 0.06 && statusRef.current !== 'docked') {
        const spd = GEARS[gearRef.current].speed * j.mag
        speedRef.current = spd
        const step = spd * 11 * 0.03 // m/s → 逻辑坐标 px / 30ms
        posRef.current = [
          clamp(posRef.current[0] + j.dx * step, 10, 350),
          clamp(posRef.current[1] + j.dy * step, 10, 200),
        ]
        syncRover()
      } else {
        speedRef.current = 0
      }
    }, 30)
    return () => clearInterval(t)
  }, [mode])

  /* 全屏切换后通知 Leaflet 重算尺寸 */
  useEffect(() => {
    const onFs = () => setTimeout(() => mapRef.current?.invalidateSize(), 120)
    document.addEventListener('fullscreenchange', onFs)
    return () => document.removeEventListener('fullscreenchange', onFs)
  }, [])

  const fmtTime = (s: number) => `${`${Math.floor(s / 60)}`.padStart(2, '0')}:${`${s % 60}`.padStart(2, '0')}`
  const remaining = Math.max(0, Math.round(((100 - progress) / 100) * 32 * 60))

  /* 一键回充 / 就位后再出发 */
  const goDock = () => {
    if (status === 'returning') return
    if (status === 'docked') {
      setStatus('cruise')
      setMode('auto')
      setCruising(true)
      return
    }
    setMode('auto')
    setCruising(false)
    setStatus('returning')
    speedRef.current = 1.5
    const [sx, sy] = posRef.current
    const dist = Math.hypot(DOCK[0] - sx, DOCK[1] - sy)
    const dur = clamp(dist / 8, 2, 6)
    animate(sx, DOCK[0], {
      duration: dur,
      ease: 'easeInOut',
      onUpdate: (x) => {
        posRef.current = [x, posRef.current[1]]
        syncRover()
      },
    })
    animate(sy, DOCK[1], {
      duration: dur,
      ease: 'easeInOut',
      onUpdate: (y) => {
        posRef.current = [posRef.current[0], y]
        syncRover()
      },
      onComplete: () => {
        setStatus('docked')
        speedRef.current = 0
      },
    })
  }

  /* ============ 真实硬件功能 1：底部光学检测模块（土壤检测） ============ */
  const soilBusy = soilPhase !== 'idle'
  const startSoilTest = () => {
    if (soilBusy || scanPhase !== 'idle') return
    setCruising(false) // 停车
    speedRef.current = 0
    setSoilPhase('descend')
    window.setTimeout(() => {
      setSoilPhase('collect')
      setSoilProgress(0)
      const t0 = Date.now()
      const iv = window.setInterval(() => {
        const p = Math.min(1, (Date.now() - t0) / 2500)
        setSoilProgress(p)
        if (p >= 1) {
          window.clearInterval(iv)
          finishSoilTest()
        }
      }, 100)
    }, 1500)
  }
  const finishSoilTest = () => {
    const point = `B-${String(soilTests.length + 1).padStart(2, '0')}`
    const jit = (base: number, pct: number) => Math.round(base * (1 + (Math.random() - 0.5) * pct) * 100) / 100
    const test: SoilResult = {
      point,
      time: nowHM(),
      om: jit(22.4, 0.1),
      tn: jit(1.28, 0.1),
      ap: jit(18.6, 0.12),
      ak: Math.round(126 * (1 + (Math.random() - 0.5) * 0.1)),
      spectrum: genSpectrum(),
      x: Math.round(posRef.current[0]),
      y: Math.round(posRef.current[1]),
    }
    addSoilTest(test)
    setSoilResult(test)
    setSoilPhase('idle')
    /* 检测点小旗立即上图 */
    const g = overlayRef.current
    if (g) {
      L.marker(toLatLng(centerRef.current, test.x, test.y), { icon: flagIcon(test.point), interactive: false, keyboard: false }).addTo(g)
    }
  }

  /* ============ 真实硬件功能 2：顶部云台摄像头（扫描作物 → 病斑预警） ============ */
  const addAlertGrid = (x: number, y: number) => {
    alertZonesRef.current.push({ x, y })
    const g = overlayRef.current
    if (g) drawGridBlock(g, centerRef.current, x, y, '#e8a04c')
  }
  const startScan = () => {
    if (scanPhase !== 'idle' || soilBusy) return
    setScanPhase('scanning')
    window.setTimeout(() => {
      if (Math.random() < 0.6) {
        setScanPhase('lock')
        window.setTimeout(() => {
          setScanPhase('idle')
          const zone = `B-${String((patrolAlerts.length % 5) + 1).padStart(2, '0')}`
          const base = {
            zone,
            kind: '疑似叶片病斑',
            time: nowHM(),
            status: '待确认' as const,
            x: clamp(Math.round(posRef.current[0]) + 16, 20, 340),
            y: clamp(Math.round(posRef.current[1]) - 12, 20, 190),
          }
          const id = addPatrolAlert(base)
          addRoverShot({ img: 'images/live-rover.jpg', time: nowHM() })
          addAlertGrid(base.x, base.y)
          setAlertCard({ ...base, id })
        }, 1100)
      } else {
        setScanPhase('idle')
        showToast('扫描完成 · 未发现异常')
      }
    }, 2400)
  }

  /* ============ 真实硬件功能 3：云台控制（水平转向 + 俯仰） ============ */
  const nudgeGimbal = (axis: 'pan' | 'tilt', d: number) =>
    setGimbal((g) => ({ ...g, [axis]: clamp(g[axis] + d, -45, 45) }))

  /* 摇杆 */
  const handleJoy = (e: React.PointerEvent) => {
    const el = joyBaseRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const max = r.width / 2 - 22
    let dx = e.clientX - (r.left + r.width / 2)
    let dy = e.clientY - (r.top + r.height / 2)
    const len = Math.hypot(dx, dy)
    if (len > max) {
      dx = (dx / len) * max
      dy = (dy / len) * max
    }
    setKnob([dx, dy])
    joyRef.current = { dx: max > 0 ? dx / max : 0, dy: max > 0 ? dy / max : 0, mag: Math.min(1, len / max) }
  }
  const resetJoy = () => {
    setKnob([0, 0])
    joyRef.current = { dx: 0, dy: 0, mag: 0 }
  }

  /* Leaflet 覆盖物重建（定位变化时） */
  const buildOverlays = (map: L.Map, c: SatCenter) => {
    centerRef.current = c
    overlayRef.current?.remove()
    const g = L.layerGroup().addTo(map)
    overlayRef.current = g

    /* 田块范围（亮色描边，保证深卫星图对比） */
    L.polygon(FIELD_POLY.map(([x, y]) => toLatLng(c, x, y)), {
      color: 'rgba(163,230,53,0.45)',
      weight: 1,
      fillColor: '#a3e635',
      fillOpacity: 0.05,
    }).addTo(g)
    /* 巡检路线（虚线） */
    L.polyline(ROUTE.map(([x, y]) => toLatLng(c, x, y)), {
      color: '#a3e635',
      weight: 1.5,
      dashArray: '5 6',
    }).addTo(g)
    /* 途经点 */
    for (const [x, y] of ROUTE) {
      L.marker(toLatLng(c, x, y), { icon: wpIcon(), interactive: false, keyboard: false }).addTo(g)
    }
    /* 历史异常分区（3x3 网格块） */
    for (const a of ANOMALIES) drawGridBlock(g, c, a.x, a.y, a.color)
    /* 本次预警产生的橙色分区 */
    for (const z of alertZonesRef.current) drawGridBlock(g, c, z.x, z.y, '#e8a04c')
    /* 土壤检测点小旗（持久化记录驱动） */
    for (const t of soilTests) {
      L.marker(toLatLng(c, t.x, t.y), { icon: flagIcon(t.point), interactive: false, keyboard: false }).addTo(g)
    }
    /* 充电桩 */
    L.marker(toLatLng(c, DOCK[0], DOCK[1]), { icon: dockIcon(), interactive: false, keyboard: false }).addTo(g)
    /* 巡检小车 */
    const rover = L.marker(toLatLng(c, posRef.current[0], posRef.current[1]), {
      icon: roverIcon(),
      interactive: false,
      keyboard: false,
      zIndexOffset: 100,
    }).addTo(g)
    roverMarkerRef.current = rover

    map.fitBounds(L.latLngBounds(ROUTE.map(([x, y]) => toLatLng(c, x, y))), { padding: [26, 26] })
  }

  const statusMeta =
    mode === 'manual'
      ? { text: '手动驾驶', cls: 'bg-[rgba(53,114,184,0.1)] text-[#3572b8]', pulse: true }
      : status === 'returning'
        ? { text: '返充中', cls: 'bg-[rgba(232,160,76,0.1)] text-[#e8a04c]', pulse: true }
        : status === 'docked'
          ? { text: '已就位', cls: 'bg-black/[0.07] text-black/40', pulse: false }
          : soilBusy
            ? { text: '土壤检测中', cls: 'bg-[rgba(22,163,74,0.08)] text-[#16a34a]', pulse: true }
            : cruising
              ? { text: '巡航中', cls: 'bg-[rgba(22,163,74,0.08)] text-[#16a34a]', pulse: true }
              : { text: '待命', cls: 'bg-black/[0.07] text-black/40', pulse: false }

  const recenter = () => {
    const map = mapRef.current
    if (map) map.flyTo([centerRef.current.lat, centerRef.current.lon], map.getZoom())
  }
  const fullscreen = () => {
    const el = mapWrapRef.current
    if (!el) return
    if (document.fullscreenElement) void document.exitFullscreen()
    else void el.requestFullscreen?.()
  }
  const ctrlButtons = [
    { icon: Layers, fn: () => mapRef.current && toggleLabels(mapRef.current) },
    { icon: LocateFixed, fn: recenter },
    { icon: Maximize2, fn: fullscreen },
  ]

  /* 硬件功能键（严格对齐真实硬件，无「鸣笛」）；操控类仅管理员可用 */
  const hwKeys = [
    { icon: FlaskConical, label: '土壤检测', active: soilBusy, locked: !isAdmin, fn: () => needAdmin() && startSoilTest() },
    { icon: ScanSearch, label: '扫描作物', active: scanPhase !== 'idle', locked: !isAdmin, fn: () => needAdmin() && startScan() },
    { icon: Move, label: '云台控制', active: showGimbal, locked: !isAdmin, fn: () => needAdmin() && setShowGimbal((v) => !v) },
    { icon: Lightbulb, label: '照明', active: headlight, locked: false, fn: () => needLogin() && setHeadlight(!headlight) },
    {
      icon: Camera,
      label: '拍照',
      active: false,
      locked: false,
      fn: () => {
        if (!needLogin()) return
        addRoverShot({ img: 'images/live-rover.jpg', time: nowHM() })
        showToast('巡检图像已保存')
      },
    },
  ]

  return (
    <div className="px-4 pb-32 pt-5">
      <header className="flex items-center justify-between">
        <button onClick={() => setScreen('overview')} className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-black/[0.08] bg-black/[0.05]">
          <ChevronLeft className="h-5 w-5 text-black/60" strokeWidth={1.5} />
        </button>
        <h1 className="text-[17px] font-semibold tracking-[-0.02em] text-[#1a2b23]">巡检小车 · 01</h1>
        <span className={`flex items-center gap-1.5 rounded-full border border-black/[0.09] px-2.5 py-1 text-[11px] font-medium ${statusMeta.cls}`}>
          <span className={`h-1.5 w-1.5 rounded-full bg-current ${statusMeta.pulse ? 'live-dot' : ''}`} />
          {statusMeta.text}
        </span>
      </header>

      <motion.div variants={stagger} initial="hidden" animate="show" className="mt-4 space-y-3.5">
        {/* 巡检路线地图（真实卫星影像 + 网格分区语义） */}
        <motion.div variants={fadeUp}>
          <div ref={mapWrapRef} className="relative overflow-hidden rounded-[14px] border border-black/[0.09] bg-[#f5f7f8]">
            <SatMap
              className="h-[210px]"
              badgeSide="left"
              onMapReady={(m) => {
                mapRef.current = m
              }}
              onView={buildOverlays}
            />
            <div className="absolute right-3 top-3 z-[500] flex flex-col gap-2">
              {ctrlButtons.map(({ icon: Icon, fn }, i) => (
                <button
                  key={i}
                  onClick={fn}
                  className="flex h-8 w-8 flex-col items-center justify-center rounded-lg border border-black/[0.09] bg-[rgba(255,255,255,0.88)] text-black/55"
                >
                  <Icon className="h-4 w-4" strokeWidth={1.5} />
                </button>
              ))}
            </div>
            <div className="absolute right-3 top-3 z-[500] mt-[104px] flex flex-col gap-1 text-[9px] text-black/40">
              <span className="w-8 text-center">图层</span>
              <span className="w-8 text-center">居中</span>
              <span className="w-8 text-center">全屏</span>
            </div>
          </div>
        </motion.div>

        {/* LIVE 画面（小车第一人称视角素材，主角卡） */}
        <motion.div variants={fadeUp}>
          <div className="relative h-[196px] overflow-hidden rounded-[14px] border border-black/[0.09]">
            {/* 云台响应层（pan-img 动画在 img 上，云台平移作用于外层） */}
            <div
              className="absolute inset-0"
              style={{
                transform: `translate(${gimbal.pan * -0.5}px, ${gimbal.tilt * 0.35}px) scale(1.08)`,
                transition: 'transform 0.5s cubic-bezier(0.22, 0.9, 0.28, 1)',
              }}
            >
              <AmbientVideo
                src="./videos/rover-pumpkin.mp4"
                poster="images/live-rover.jpg"
                autoPlay
                muted
                loop
                playsInline
                className="pan-img absolute inset-0 h-full w-full object-cover"
                style={headlight ? { filter: 'brightness(1.14)' } : undefined}
              />
            </div>
            <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(6,9,7,0.4), transparent 35%, rgba(6,9,7,0.35))' }} />
            {/* 照明（检测头环形照明 / 夜间巡检）光斑 */}
            {headlight && (
              <>
                <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 75% 55% at 50% 100%, rgba(255,246,214,0.32), transparent 70%)' }} />
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      'radial-gradient(ellipse 26% 26% at 37% 86%, rgba(255,250,230,0.5), transparent 70%), radial-gradient(ellipse 26% 26% at 63% 86%, rgba(255,250,230,0.5), transparent 70%)',
                  }}
                />
              </>
            )}
            {/* 扫描线 */}
            <div className="sweep absolute inset-x-0 top-0 h-1/4 bg-gradient-to-b from-transparent via-[rgba(22,163,74,0.08)] to-transparent" />
            <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-md bg-[rgba(10,15,11,0.8)] px-2 py-1">
              <span className="live-dot h-1.5 w-1.5 rounded-full bg-[#e8604c]" />
              <span className="text-[10px] font-semibold tracking-wide text-white">LIVE</span>
              <span className="text-[10px] font-medium text-white/50">1080P</span>
            </div>
            <button className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-md bg-[rgba(255,255,255,0.88)]">
              <Maximize2 className="h-3.5 w-3.5 text-black/55" strokeWidth={1.5} />
            </button>
            {/* 云台角度读数 */}
            {(gimbal.pan !== 0 || gimbal.tilt !== 0) && (
              <div className="absolute right-3 top-12 rounded-md bg-[rgba(255,255,255,0.88)] px-2 py-1 font-num text-[9px] text-black/55">
                水平 {gimbal.pan > 0 ? '+' : ''}{gimbal.pan}° · 俯仰 {gimbal.tilt > 0 ? '+' : ''}{gimbal.tilt}°
              </div>
            )}

            {/* 土壤检测：检测头下降贴土 */}
            {soilPhase === 'descend' && (
              <div className="absolute inset-0 flex flex-col items-center justify-end bg-[rgba(6,9,7,0.5)] pb-6">
                <div className="probe-drop flex flex-col items-center">
                  <div className="h-1.5 w-12 rounded bg-white/25" />
                  <div className="h-7 w-[3px] bg-white/40" />
                  <div className="flex h-4 w-14 items-center justify-center rounded-md border border-[rgba(163,230,53,0.6)] bg-[#131c16]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#a3e635]" />
                  </div>
                  <div className="mt-1 h-[3px] w-20 rounded bg-[rgba(163,230,53,0.35)]" />
                </div>
                <span className="mt-2.5 text-[11px] font-medium text-white/70">停车 · 检测头下降贴土</span>
              </div>
            )}
            {/* 土壤检测：环形照明 + 光谱采集 */}
            {soilPhase === 'collect' && (
              <div className="absolute inset-0 bg-[rgba(6,9,7,0.5)]">
                <div
                  className="ring-glow absolute bottom-9 left-1/2 h-11 w-11 center-x rounded-full border-2 border-[rgba(255,246,214,0.85)]"
                  style={{ boxShadow: '0 0 26px rgba(255,246,214,0.45), inset 0 0 12px rgba(255,246,214,0.3)' }}
                />
                <div className="absolute inset-x-5 bottom-3">
                  <div className="flex items-center justify-between text-[10px] text-white/70">
                    <span>环形照明开启 · 近红外光谱采集中</span>
                    <span className="font-num">{Math.round(soilProgress * 100)}%</span>
                  </div>
                  <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/15">
                    <div className="h-full rounded-full bg-[#a3e635]" style={{ width: `${soilProgress * 100}%` }} />
                  </div>
                </div>
              </div>
            )}
            {/* 扫描作物：蓝色粒子流 */}
            {scanPhase === 'scanning' && (
              <div className="absolute inset-0">
                <div className="absolute inset-0 bg-[rgba(70,130,255,0.07)]" />
                {Array.from({ length: 12 }).map((_, i) => (
                  <span
                    key={i}
                    className="scan-particle absolute h-[3px] w-[3px] rounded-full bg-[#6db3ff]"
                    style={{ top: `${9 + i * 7}%`, left: 0, animationDelay: `${(i % 6) * 0.28}s`, boxShadow: '0 0 6px rgba(109,179,255,0.9)' }}
                  />
                ))}
                <span className="absolute bottom-3 left-3 text-[11px] font-medium text-[#9ec5ff]">粒子扫描叶面中…</span>
              </div>
            )}
            {/* 取景框锁定 */}
            {scanPhase === 'lock' && (
              <motion.div
                initial={{ scale: 1.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.45, ease: EASE }}
                className="absolute left-1/2 top-1/2 h-24 w-32 center-x -translate-y-1/2"
              >
                {(['left-0 top-0 border-l-2 border-t-2', 'right-0 top-0 border-r-2 border-t-2', 'left-0 bottom-0 border-l-2 border-b-2', 'right-0 bottom-0 border-r-2 border-b-2'] as const).map((cls) => (
                  <span key={cls} className={`absolute h-4 w-4 border-[#e8a04c] ${cls}`} />
                ))}
                <span className="live-dot absolute left-1/2 top-1/2 h-2 w-2 center-x -translate-y-1/2 rounded-full bg-[#e8a04c]" />
                <span className="absolute -bottom-6 left-1/2 center-x whitespace-nowrap rounded bg-[rgba(255,255,255,0.9)] px-2 py-0.5 text-[10px] font-medium text-[#e8a04c]">
                  疑似病斑 · 已锁定
                </span>
              </motion.div>
            )}
            {/* 已就位：图传待机 */}
            {status === 'docked' && (
              <div className="absolute inset-0 flex items-center justify-center bg-[rgba(6,9,7,0.7)]">
                <span className="flex items-center gap-2 text-[13px] font-medium text-white/60">
                  <Video className="h-4 w-4" strokeWidth={1.5} />
                  已就位，图传待机
                </span>
              </div>
            )}
          </div>
        </motion.div>

        {/* 车型卡（真实渲染车 + 结构图鉴入口） */}
        <motion.div variants={fadeUp}>
          <Glass className="overflow-hidden p-0">
            <div className="relative h-[150px]">
              <img src="images/rover-real.jpg" alt="巡检小车实拍渲染" className="h-full w-full object-cover" />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, transparent 40%, rgba(6,9,7,0.85))' }} />
              <div className="absolute bottom-3 left-3.5">
                <div className="text-[14px] font-semibold text-white">农业智能巡检车</div>
                <div className="mt-0.5 text-[10px] text-white/55">四轮转向 · 光谱检测 · 云台摄像 · 喷淋施药</div>
              </div>
              <button
                onClick={() => setShowExploded(true)}
                className="absolute bottom-3 right-3 rounded-full border border-[rgba(22,163,74,0.4)] bg-[rgba(11,15,12,0.75)] px-3 py-1.5 text-[11px] font-medium text-[#16a34a]"
              >
                结构图鉴
              </button>
            </div>
          </Glass>
        </motion.div>

        {/* 操控区：模式切换 + 巡航控制 / 虚拟摇杆 */}
        <motion.div variants={fadeUp}>
          <Glass className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-medium text-[#1a2b23]">操控</span>
              <div className="flex rounded-full border border-black/[0.09] bg-black/[0.04] p-0.5">
                {(['auto', 'manual'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => needAdmin() && setMode(m)}
                    className={`flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-medium transition-colors ${
                      mode === m ? 'bg-[rgba(22,163,74,0.12)] text-[#16a34a]' : 'text-black/40'
                    }`}
                  >
                    {!isAdmin && <Lock className="h-2.5 w-2.5 opacity-60" strokeWidth={2} />}
                    {m === 'auto' ? '自动巡航' : '手动驾驶'}
                  </button>
                ))}
              </div>
            </div>

            <AnimatePresence mode="wait"><motion.div key={mode} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: .22, ease: EASE }} style={{ overflow: 'hidden' }}>
            {mode === 'auto' ? (
              <div className="mt-3.5 flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] text-black/40">下一目标点</div>
                  <div className="mt-0.5 truncate text-[13px] font-medium text-[#1a2b23]">
                    {status === 'docked' ? '充电桩 · 待命' : status === 'returning' ? '返回充电桩' : nextTarget}
                  </div>
                </div>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  disabled={status === 'returning'}
                  onClick={() => {
                    if (!needAdmin()) return
                    if (status === 'docked') {
                      setStatus('cruise')
                      setCruising(true)
                    } else {
                      setCruising(!cruising)
                    }
                  }}
                  className={`flex shrink-0 items-center gap-1 rounded-full border px-4 py-2 text-[12px] font-medium ${
                    status === 'returning'
                      ? 'border-black/[0.1] bg-black/[0.05] text-black/40'
                      : 'border-[rgba(22,163,74,0.35)] bg-[rgba(22,163,74,0.06)] text-[#16a34a]'
                  }`}
                >
                  {!isAdmin && <Lock className="h-3 w-3 opacity-60" strokeWidth={2} />}
                  {status === 'docked' ? '开始巡航' : status === 'returning' ? '返充中' : cruising ? '暂停巡航' : '继续巡航'}
                </motion.button>
              </div>
            ) : (
              <div className="mt-3.5 flex items-center gap-4">
                {/* 虚拟摇杆（鼠标 / 触摸通用） */}
                <div
                  ref={joyBaseRef}
                  onPointerDown={(e) => {
                    e.currentTarget.setPointerCapture(e.pointerId)
                    handleJoy(e)
                  }}
                  onPointerMove={(e) => {
                    if (e.buttons > 0) handleJoy(e)
                  }}
                  onPointerUp={resetJoy}
                  onPointerCancel={resetJoy}
                  className="relative h-28 w-28 shrink-0 touch-none rounded-full border border-black/[0.09] bg-black/[0.04]"
                >
                  <div
                    className="absolute h-11 w-11 rounded-full border border-[rgba(22,163,74,0.35)] bg-white"
                    style={{ left: '50%', top: '50%', transform: `translate(calc(-50% + ${knob[0]}px), calc(-50% + ${knob[1]}px))` }}
                  />
                </div>
                {/* 挡位 */}
                <div className="flex flex-1 flex-col gap-2">
                  {GEARS.map((g, i) => (
                    <button
                      key={g.k}
                      onClick={() => setGear(i)}
                      className={`flex items-center justify-between rounded-[10px] border px-3 py-2 text-[12px] font-medium ${
                        gear === i
                          ? 'border-[rgba(22,163,74,0.35)] bg-[rgba(22,163,74,0.08)] text-[#16a34a]'
                          : 'border-black/[0.08] bg-black/[0.04] text-black/40'
                      }`}
                    >
                      <span>{g.k}</span>
                      <span className="font-num text-[10px] opacity-70">{g.speed.toFixed(1)} m/s</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            </motion.div></AnimatePresence>
          </Glass>
        </motion.div>

        {/* 遥测四格 */}
        <motion.div variants={fadeUp}>
          <Glass className="grid grid-cols-4 divide-x divide-black/[0.08] p-3.5 text-center">
            <div>
              <div className="text-[10px] text-black/40">电量</div>
              <div className="mt-0.5 font-num text-[16px] font-semibold text-[#1a2b23]">
                {tele.battery.toFixed(0)}<span className="text-[10px] font-normal">%</span>
              </div>
              <div className="mx-auto mt-1 h-1 w-10 overflow-hidden rounded-full bg-black/[0.09]">
                <div className="h-full rounded-full bg-[#16a34a]" style={{ width: `${tele.battery}%` }} />
              </div>
            </div>
            <div>
              <div className="text-[10px] text-black/40">车速</div>
              <div className="mt-0.5 font-num text-[16px] font-semibold text-[#1a2b23]">
                {tele.speed.toFixed(1)}<span className="text-[10px] font-normal">m/s</span>
              </div>
              <div className="mt-1 text-[9px] text-black/40">➤</div>
            </div>
            <div>
              <div className="text-[10px] text-black/40">今日里程</div>
              <div className="mt-0.5 font-num text-[16px] font-semibold text-[#1a2b23]">
                {tele.mileage.toFixed(2)}<span className="text-[10px] font-normal">km</span>
              </div>
              <div className="mt-1 text-[9px] text-black/40">累计</div>
            </div>
            <div>
              <div className="text-[10px] text-black/40">信号</div>
              <div className="mt-0.5 font-num text-[16px] font-semibold text-[#1a2b23]">
                {tele.signal}<span className="text-[10px] font-normal">dBm</span>
              </div>
              <div className="mt-1 text-[9px] text-black/40">4G</div>
            </div>
          </Glass>
        </motion.div>

        {/* 硬件功能键（对齐真实硬件） */}
        <motion.div variants={fadeUp}>
          <div className="grid grid-cols-3 gap-2">
            {hwKeys.map(({ icon: Icon, label, active, fn, locked }) => (
              <motion.button
                key={label}
                whileTap={{ scale: 0.96 }}
                onClick={fn}
                className={`relative flex items-center justify-center gap-1.5 rounded-[12px] border py-3 ${
                  active
                    ? 'border-[rgba(22,163,74,0.35)] bg-[rgba(22,163,74,0.08)] text-[#16a34a]'
                    : 'border-black/[0.08] bg-black/[0.04] text-black/50'
                }`}
              >
                <Icon className="h-4 w-4" strokeWidth={1.5} />
                <span className="text-[11px] font-medium">{label}</span>
                {locked && (
                  <span className="absolute right-1 top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-black/[0.06]">
                    <Lock className="h-2.5 w-2.5 text-black/40" strokeWidth={2} />
                  </span>
                )}
              </motion.button>
            ))}
            {/* 喷淋施药：模块已上线，进入 4 步施药向导 */}
            <button
              onClick={() => setScreen('spray')}
              className="flex items-center justify-center gap-1.5 rounded-[12px] border border-[rgba(21,128,61,0.3)] bg-[rgba(21,128,61,0.06)] py-3 text-[#15803d]"
            >
              <Droplets className="h-4 w-4" strokeWidth={1.5} />
              <span className="text-[11px] font-medium">喷淋施药</span>
              <span className="text-[9px] opacity-70">已上线</span>
            </button>
          </div>
        </motion.div>

        {/* 云台控制 pad（四向，45° 范围内 15° 步进） */}
        {showGimbal && (
          <motion.div variants={fadeUp} initial="hidden" animate="show">
            <Glass className="flex items-center gap-4 p-4">
              <div className="grid shrink-0 grid-cols-3 gap-1.5">
                <span />
                <GimbalBtn label="↑" onClick={() => nudgeGimbal('tilt', 15)} />
                <span />
                <GimbalBtn label="←" onClick={() => nudgeGimbal('pan', -15)} />
                <button
                  onClick={() => setGimbal({ pan: 0, tilt: 0 })}
                  className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-[rgba(22,163,74,0.3)] bg-[rgba(22,163,74,0.06)] text-[10px] font-medium text-[#16a34a]"
                >
                  回中
                </button>
                <GimbalBtn label="→" onClick={() => nudgeGimbal('pan', 15)} />
                <span />
                <GimbalBtn label="↓" onClick={() => nudgeGimbal('tilt', -15)} />
                <span />
              </div>
              <div className="flex-1">
                <div className="text-[10px] text-black/40">云台角度（USB 工业摄像头）</div>
                <div className="mt-1.5 space-y-1 text-[12px]">
                  <div className="flex justify-between">
                    <span className="text-black/45">水平转向</span>
                    <span className="font-num font-medium text-[#1a2b23]">{gimbal.pan > 0 ? '+' : ''}{gimbal.pan}°</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-black/45">上下俯仰</span>
                    <span className="font-num font-medium text-[#1a2b23]">{gimbal.tilt > 0 ? '+' : ''}{gimbal.tilt}°</span>
                  </div>
                </div>
                <div className="mt-1.5 text-[9px] text-black/30">范围 ±45° · 步进 15°</div>
              </div>
            </Glass>
          </motion.div>
        )}

        {/* 土壤检测记录（持久化，可回看光谱） */}
        <motion.div variants={fadeUp}>
          <Glass className="p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-medium text-[#1a2b23]">土壤检测记录</span>
              <span className="text-[11px] text-black/40">{soilTests.length} 次</span>
            </div>
            {soilTests.length === 0 ? (
              <div className="mt-3 rounded-[10px] border border-dashed border-black/[0.09] py-4 text-center text-[11px] text-black/35">
                暂无记录，点「土壤检测」开始首次采样
              </div>
            ) : (
              <div className="mt-2.5 space-y-1.5">
                {soilTests.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSoilResult(t)}
                    className="flex w-full items-center gap-2.5 rounded-[10px] border border-black/[0.07] bg-black/[0.03] px-3 py-2 text-left"
                  >
                    <span className="rounded border border-[rgba(22,163,74,0.4)] px-1.5 py-0.5 font-num text-[10px] font-medium text-[#16a34a]">{t.point}</span>
                    <span className="flex-1 truncate text-[11px] text-black/45">
                      有机质 {t.om} · 全氮 {t.tn} · 磷 {t.ap} · 钾 {t.ak}
                    </span>
                    <span className="font-num text-[10px] text-black/35">{t.time}</span>
                  </button>
                ))}
              </div>
            )}
          </Glass>
        </motion.div>

        {/* 预警任务（疑似病斑 → 待确认） */}
        <motion.div variants={fadeUp}>
          <Glass className="p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-medium text-[#1a2b23]">预警任务</span>
              <span className="text-[11px] text-black/40">
                {patrolAlerts.filter((a) => a.status === '待确认').length} 待确认
              </span>
            </div>
            {patrolAlerts.length === 0 ? (
              <div className="mt-3 rounded-[10px] border border-dashed border-black/[0.09] py-4 text-center text-[11px] text-black/35">
                暂无预警，「扫描作物」发现疑似病斑后在此跟进
              </div>
            ) : (
              <div className="mt-2.5 space-y-1.5">
                {patrolAlerts.map((a) => (
                  <div key={a.id} className="flex items-center gap-2.5 rounded-[10px] border border-black/[0.07] bg-black/[0.03] px-3 py-2">
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${a.status === '待确认' ? 'bg-[#e8a04c]' : 'bg-[#16a34a]'}`} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[12px] font-medium text-[#1a2b23]">
                        {a.kind} · {a.zone} 分区
                      </div>
                      <div className="font-num text-[10px] text-black/35">{a.time}</div>
                    </div>
                    {a.status === '待确认' ? (
                      <button
                        onClick={() => confirmPatrolAlert(a.id)}
                        className="shrink-0 rounded-full border border-[rgba(232,160,76,0.4)] px-2.5 py-1 text-[10px] font-medium text-[#e8a04c]"
                      >
                        确认
                      </button>
                    ) : (
                      <span className="shrink-0 text-[10px] font-medium text-[#16a34a]">已确认</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Glass>
        </motion.div>

        {/* 巡检相册 */}
        <motion.div variants={fadeUp}>
          <Glass className="p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-medium text-[#1a2b23]">巡检相册</span>
              <span className="text-[11px] text-black/40">{roverShots.length} 张</span>
            </div>
            {roverShots.length === 0 ? (
              <div className="mt-3 rounded-[10px] border border-dashed border-black/[0.09] py-4 text-center text-[11px] text-black/35">
                暂无照片，点「拍照」后在此展示
              </div>
            ) : (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {roverShots.map((s) => (
                  <div key={s.id} className="shrink-0">
                    <img src={s.img} alt="巡检照片" className="h-16 w-24 rounded-[8px] border border-black/[0.09] object-cover" />
                    <div className="mt-1 text-center font-num text-[9px] text-black/40">{s.time}</div>
                  </div>
                ))}
              </div>
            )}
          </Glass>
        </motion.div>

        {/* 本次巡航进度 + 一键回充 */}
        <motion.div variants={fadeUp}>
          <Glass className="flex items-center gap-4 p-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium text-[#1a2b23]">本次巡航</span>
                <span className="text-[14px] font-semibold text-[#16a34a]">{progress.toFixed(0)}%</span>
              </div>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-black/[0.09]">
                <motion.div
                  className="h-full rounded-full bg-[#16a34a]"
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.8, ease: EASE }}
                />
              </div>
              <div className="mt-1.5 flex justify-between text-[10px] text-black/40">
                <span>已巡 {fmtTime(elapsed)}</span>
                <span>预计剩余 {fmtTime(remaining)}</span>
              </div>
            </div>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={goDock}
              disabled={status === 'returning'}
              className={`flex h-[74px] w-[74px] shrink-0 flex-col items-center justify-center rounded-full border font-medium ${
                status !== 'returning'
                  ? 'border-[rgba(22,163,74,0.35)] bg-[rgba(22,163,74,0.06)] text-[#16a34a]'
                  : 'border-black/[0.1] bg-black/[0.05] text-black/40'
              }`}
            >
              <BatteryCharging className="h-5 w-5" strokeWidth={1.5} />
              <span className="mt-0.5 text-[12px]">
                {status === 'docked' ? '出发' : status === 'returning' ? '返充中' : '回充'}
              </span>
            </motion.button>
          </Glass>
        </motion.div>
      </motion.div>

      {/* ========== 土壤检测结果卡（复刻检测屏：光谱 + 四指标） ========== */}
      {soilResult && (
        <div className="fixed inset-0 z-[1100] flex items-end justify-center bg-[rgba(6,9,7,0.7)] backdrop-blur-sm" onClick={() => setSoilResult(null)}>
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.35, ease: EASE }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[420px] rounded-t-[16px] border border-b-0 border-black/[0.1] bg-white p-4 pb-8"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[15px] font-semibold text-[#1a2b23]">土壤检测</div>
                <div className="label-caps mt-0.5 text-[9px] text-black/35">FIELD ANALYSIS · 近红外反射光谱</div>
              </div>
              <span className="rounded-md border border-[rgba(22,163,74,0.45)] bg-[rgba(22,163,74,0.08)] px-2 py-1 font-num text-[12px] font-semibold text-[#16a34a]">
                {soilResult.point}
              </span>
            </div>
            {/* 光谱曲线 */}
            <div className="mt-3 rounded-[10px] border border-black/[0.08] bg-[#f5f7f8] p-2.5">
              <svg viewBox="0 0 300 90" className="h-[88px] w-full">
                {[22, 44, 66].map((y) => (
                  <line key={y} x1="0" y1={y} x2="300" y2={y} stroke="rgba(0,0,0,0.07)" strokeWidth="1" />
                ))}
                <polyline points={spectrumPoints(soilResult.spectrum)} fill="none" stroke="#16a34a" strokeWidth="1.5" strokeLinejoin="round" />
              </svg>
              <div className="mt-1 flex justify-between text-[8px] text-black/30">
                <span>900nm</span>
                <span>反射率</span>
                <span>1700nm</span>
              </div>
            </div>
            {/* 四项指标 */}
            <div className="mt-3 grid grid-cols-2 gap-2">
              {[
                { label: '有机质', v: soilResult.om.toFixed(1), unit: 'g/kg' },
                { label: '全氮', v: soilResult.tn.toFixed(2), unit: 'g/kg' },
                { label: '有效磷', v: soilResult.ap.toFixed(1), unit: 'mg/kg' },
                { label: '速效钾', v: String(soilResult.ak), unit: 'mg/kg' },
              ].map((m) => (
                <div key={m.label} className="rounded-[10px] border border-black/[0.08] bg-black/[0.03] px-3 py-2.5">
                  <div className="text-[10px] text-black/40">{m.label}</div>
                  <div className="mt-0.5 font-num text-[19px] font-semibold text-[#1a2b23]">
                    {m.v}
                    <span className="ml-1 text-[10px] font-normal text-black/40">{m.unit}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-2 text-[10px] text-black/35">检测点 {soilResult.point} · {soilResult.time} · 指标已更新至分区档案</div>
            <button
              onClick={() => setSoilResult(null)}
              className="mt-3 w-full rounded-[12px] border border-[rgba(22,163,74,0.4)] bg-[rgba(22,163,74,0.1)] py-2.5 text-[13px] font-medium text-[#16a34a]"
            >
              完成
            </button>
          </motion.div>
        </div>
      )}

      {/* ========== 病斑预警卡（复刻预警流文案） ========== */}
      {alertCard && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-[rgba(6,9,7,0.7)] px-6 backdrop-blur-sm" onClick={() => setAlertCard(null)}>
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, ease: EASE }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[340px] rounded-[16px] border border-black/[0.1] bg-white p-4"
          >
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[rgba(232,160,76,0.12)]">
                <TriangleAlert className="h-4 w-4 text-[#e8a04c]" strokeWidth={1.8} />
              </span>
              <div>
                <div className="text-[14px] font-semibold text-[#1a2b23]">预警 · {alertCard.kind}</div>
                <div className="font-num text-[10px] text-black/35">{alertCard.time}</div>
              </div>
            </div>
            <div className="mt-3 space-y-2 text-[12px]">
              <div className="flex items-center gap-2 text-black/60">
                <span className="h-1 w-1 rounded-full bg-[#e8a04c]" />
                {alertCard.zone} 分区 · 建议现场复核
              </div>
              <div className="flex items-center gap-2 text-black/60">
                <ImageIcon className="h-3 w-3 text-black/35" strokeWidth={1.5} />
                巡检图像已保存
              </div>
              <div className="flex items-center gap-2 text-black/60">
                <ClipboardCheck className="h-3 w-3 text-black/35" strokeWidth={1.5} />
                任务状态：<span className="font-medium text-[#e8a04c]">待确认</span>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setAlertCard(null)}
                className="flex-1 rounded-[10px] border border-black/[0.1] py-2 text-[12px] font-medium text-black/50"
              >
                稍后处理
              </button>
              <button
                onClick={() => {
                  confirmPatrolAlert(alertCard.id)
                  setAlertCard(null)
                  showToast('已确认 · 任务状态更新')
                }}
                className="flex-1 rounded-[10px] border border-[rgba(22,163,74,0.4)] bg-[rgba(22,163,74,0.1)] py-2 text-[12px] font-medium text-[#16a34a]"
              >
                现场复核 · 确认
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ========== 结构图鉴层（整机爆炸结构总览） ========== */}
      {showExploded && (
        <div className="fixed inset-0 z-[1100] flex flex-col bg-[rgba(245,247,248,0.98)] backdrop-blur-md">
          <div className="flex items-center justify-between px-4 pt-5">
            <div>
              <div className="text-[15px] font-semibold text-[#1a2b23]">结构图鉴 · 整机爆炸结构</div>
              <div className="mt-0.5 text-[10px] text-black/35">左右滑动查看细节 · 8 大模块</div>
            </div>
            <button
              onClick={() => setShowExploded(false)}
              className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-black/[0.1] bg-black/[0.05]"
            >
              <X className="h-5 w-5 text-black/60" strokeWidth={1.5} />
            </button>
          </div>
          <div className="mt-3 flex-1 overflow-auto px-4">
            <img
              src="images/rover-exploded.png"
              alt="整机爆炸结构总览"
              className="h-full w-auto max-w-none rounded-[12px] border border-black/[0.09]"
            />
          </div>
          <div className="grid grid-cols-2 gap-1.5 px-4 py-4">
            {MODULES.map((m, i) => (
              <div key={m} className="flex items-center gap-1.5 rounded-[8px] border border-black/[0.07] bg-black/[0.03] px-2 py-1.5 text-[10px] text-black/50">
                <span className="font-num text-[9px] text-[#16a34a]">{String(i + 1).padStart(2, '0')}</span>
                {m}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 轻提示 */}
      {toast && (
        <div className="fixed bottom-[96px] left-1/2 z-[1100] center-x rounded-full border border-black/10 bg-[rgba(255,255,255,0.94)] px-4 py-2 text-[12px] text-black/70 backdrop-blur-md">
          {toast}
        </div>
      )}
    </div>
  )
}

function GimbalBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-black/[0.09] bg-black/[0.04] text-[13px] text-black/60"
    >
      {label}
    </motion.button>
  )
}
