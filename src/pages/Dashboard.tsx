import { useMemo, useState } from 'react'
import {
  Bell,
  Leaf,
  Sprout,
  Droplets,
  TrendingDown,
  TrendingUp,
  Plus,
  Minus,
  LocateFixed,
  Layers,
  Maximize2,
  ChevronRight,
  CalendarDays,
  CloudSun,
  AlertTriangle,
  ListChecks,
  Check,
} from 'lucide-react'
import { useStore, ADVICES, TASK_TYPE_COLORS, DEVICES, FIELDS, todayStr, type Task } from '../store'
import { FarmMapSVG, type MapLayers } from '../components/FarmMapSVG'

/* ---------------------------------- KPI 卡片 ---------------------------------- */

function KpiCard(props: {
  title: string
  sub: string
  value: React.ReactNode
  pill?: { text: string; color: 'green' | 'blue' }
  trend: 'down' | 'up'
  trendText: string
  icon: React.ReactNode
  iconBg: string
}) {
  return (
    <div className="flex flex-col justify-between rounded-2xl bg-white p-5 shadow-[0_2px_12px_rgba(23,53,42,0.05)]">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[16px] font-bold text-[#17352a]">{props.title}</div>
          <div className="mt-1 text-[12px] text-[#8aa398]">{props.sub}</div>
        </div>
        <div
          className="flex h-14 w-14 items-center justify-center rounded-full"
          style={{ backgroundColor: props.iconBg }}
        >
          {props.icon}
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2.5">
        {props.value}
        {props.pill && (
          <span
            className={`rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${
              props.pill.color === 'green'
                ? 'bg-[#e4f7ec] text-[#178a45]'
                : 'bg-[#e3f0fe] text-[#3b82f6]'
            }`}
          >
            {props.pill.text}
          </span>
        )}
      </div>
      <div className="mt-3 flex items-center gap-1.5 border-t border-[#f0f6f3] pt-3 text-[13px] text-[#8aa398]">
        较昨日
        {props.trend === 'down' ? (
          <TrendingDown className="h-4 w-4 text-[#1fa756]" />
        ) : (
          <TrendingUp className="h-4 w-4 text-[#1fa756]" />
        )}
        <span className="font-semibold text-[#178a45]">{props.trendText}</span>
      </div>
    </div>
  )
}

/* ---------------------------------- 地图卡片 ---------------------------------- */

const MAP_TABS: { key: keyof MapLayers; label: string }[] = [
  { key: 'fields', label: '地块' },
  { key: 'monitors', label: '监测点' },
  { key: 'irrigation', label: '灌溉线路' },
]

function MapCard() {
  const [tab, setTab] = useState<keyof MapLayers>('fields')
  const { setPage } = useStore()
  const layers: MapLayers = {
    fields: tab === 'fields',
    monitors: tab === 'monitors',
    irrigation: tab === 'irrigation',
  }
  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-2xl bg-white p-5 shadow-[0_2px_12px_rgba(23,53,42,0.05)]">
      <div className="flex items-center justify-between">
        <h2 className="text-[18px] font-bold text-[#17352a]">农场地图</h2>
        <div className="flex items-center gap-2">
          {MAP_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`rounded-lg px-3.5 py-1.5 text-[13px] transition-colors ${
                tab === t.key
                  ? 'border border-[#1fa756] bg-white font-semibold text-[#178a45]'
                  : 'border border-transparent bg-[#f2f7f4] text-[#7b9489] hover:text-[#4f6b5f]'
              }`}
            >
              {t.label}
            </button>
          ))}
          <button
            onClick={() => setPage('map')}
            title="全屏查看"
            className="ml-1 flex h-8 w-8 items-center justify-center rounded-lg border border-[#e4efe9] text-[#7b9489] hover:bg-[#f2f9f5]"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="relative mt-4 min-h-0 flex-1 overflow-hidden rounded-xl">
        <FarmMapSVG layers={layers} />

        {/* 左侧悬浮控件（展示性） */}
        <div className="absolute left-4 top-1/2 flex -translate-y-1/2 flex-col items-center gap-1 rounded-2xl bg-white/95 p-2 shadow-[0_4px_16px_rgba(23,53,42,0.15)]">
          {[Plus, Minus, LocateFixed, Layers].map((Icon, i) => (
            <button
              key={i}
              onClick={() => setPage('map')}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-[#4f6b5f] hover:bg-[#eef7f1]"
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={2.2} />
            </button>
          ))}
        </div>

        {/* 底部图例 */}
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-5 whitespace-nowrap rounded-full bg-white/92 px-5 py-2 shadow-[0_2px_10px_rgba(23,53,42,0.12)] backdrop-blur">
          <span className="flex items-center gap-1.5 text-[12px] text-[#4f6b5f]">
            <span className="h-2.5 w-2.5 rounded-full bg-[#1fa756]" />
            监测点
          </span>
          <span className="flex items-center gap-1.5 text-[12px] text-[#4f6b5f]">
            <span className="h-[3px] w-5 rounded-full bg-[#2196e8]" />
            灌溉管线
          </span>
          <span className="flex items-center gap-1.5 text-[12px] text-[#4f6b5f]">
            <span className="h-[3px] w-5 rounded-full border border-[#bcd2c6] bg-white" />
            地块边界
          </span>
          <span className="flex items-center gap-1.5 text-[12px] text-[#4f6b5f]">
            <Droplets className="h-3.5 w-3.5 text-[#1e8fe0]" fill="#1e8fe0" />
            取水点
          </span>
        </div>
      </div>
    </div>
  )
}

/* ---------------------------------- 通知铃铛 ---------------------------------- */

const TONE_COLORS: Record<string, string> = {
  green: 'bg-[#1fa756]',
  orange: 'bg-[#f59e0b]',
  blue: 'bg-[#3b82f6]',
  red: 'bg-[#ef4444]',
}

function NotificationBell() {
  const { notifications, markAllRead, markRead } = useStore()
  const [open, setOpen] = useState(false)
  const unread = notifications.filter((n) => !n.read).length
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-[0_2px_8px_rgba(23,53,42,0.08)]"
      >
        <Bell className="h-5 w-5 text-[#4f6b5f]" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#1fa756] px-1 text-[10px] font-bold text-white ring-2 ring-[#eef7f1]">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-[330px] rounded-2xl bg-white p-3 shadow-[0_8px_30px_rgba(23,53,42,0.18)]">
            <div className="flex items-center justify-between px-2 pb-2">
              <span className="text-[14px] font-bold text-[#17352a]">通知中心</span>
              <button
                onClick={markAllRead}
                className="text-[12px] font-semibold text-[#178a45] hover:underline"
              >
                全部标为已读
              </button>
            </div>
            <ul className="max-h-[300px] space-y-1 overflow-y-auto">
              {notifications.map((n) => (
                <li
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  className={`flex cursor-pointer items-start gap-2.5 rounded-xl p-2.5 hover:bg-[#f5faf7] ${n.read ? 'opacity-60' : ''}`}
                >
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${TONE_COLORS[n.tone]}`} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold text-[#17352a]">{n.title}</span>
                      {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-[#1fa756]" />}
                    </div>
                    <p className="mt-0.5 text-[12px] leading-relaxed text-[#7b9489]">{n.desc}</p>
                    <span className="mt-1 block text-[11px] text-[#a4bcb1]">{n.time}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  )
}

/* ---------------------------------- 右侧卡片 ---------------------------------- */

function CardHeaderRow(props: { icon: React.ReactNode; title: string; titleClass?: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {props.icon}
        <span className={`text-[15px] font-bold ${props.titleClass ?? 'text-[#17352a]'}`}>
          {props.title}
        </span>
      </div>
      <button className="flex items-center gap-0.5 text-[12px] text-[#8aa398] hover:text-[#5f7a6e]">
        更多
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

function AdviceCard() {
  const [idx, setIdx] = useState(0)
  return (
    <div className="rounded-2xl bg-white p-4 shadow-[0_2px_12px_rgba(23,53,42,0.05)]">
      <CardHeaderRow
        icon={<Leaf className="h-4 w-4 text-[#1fa756]" fill="#1fa756" />}
        title="智慧农事建议"
        titleClass="text-[#178a45]"
      />
      <div className="mt-3 flex min-h-[104px] items-center gap-3 rounded-xl bg-[#eff8f0] p-3.5">
        <p className="flex-1 text-[13px] leading-relaxed text-[#3d5a4d]">{ADVICES[idx]}</p>
        <svg viewBox="0 0 64 64" className="h-16 w-16 shrink-0">
          <ellipse cx="32" cy="56" rx="20" ry="5" fill="#cfe8c2" />
          <path d="M32 56 C32 40 32 32 32 24" stroke="#3f9e4d" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          <path d="M32 38 C24 38 18 32 17 24 C26 24 32 30 32 38 Z" fill="#5cbb63" />
          <path d="M32 32 C40 32 46 26 47 17 C37 17 32 24 32 32 Z" fill="#74cc72" />
          <path d="M32 24 C28 18 28 12 32 6 C36 12 36 18 32 24 Z" fill="#8fd67f" />
        </svg>
      </div>
      <div className="mt-3 flex items-center justify-center gap-1.5">
        {ADVICES.map((_, i) => (
          <button
            key={i}
            onClick={() => setIdx(i)}
            className={`h-1.5 rounded-full transition-all ${
              i === idx ? 'w-4 bg-[#1fa756]' : 'w-1.5 bg-[#d3e4da] hover:bg-[#a9cbb8]'
            }`}
          />
        ))}
      </div>
    </div>
  )
}

function WeatherCard() {
  const { readings, settings } = useStore()
  const weather = readings['D4'] ?? { v1: 26, v2: 65 }
  if (!settings.notifHeat) {
    /* 高温预警开关关闭时仍显示卡片，仅隐藏预警条 */
  }
  return (
    <div className="rounded-2xl bg-white p-4 shadow-[0_2px_12px_rgba(23,53,42,0.05)]">
      <CardHeaderRow icon={<CloudSun className="h-4 w-4 text-[#5f7a6e]" />} title="天气与预警" />
      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div>
            <div className="text-[34px] font-extrabold leading-none text-[#17352a]">
              {Math.round(weather.v1)}
              <span className="align-top text-[18px] font-bold">°C</span>
            </div>
            <div className="mt-1.5 text-[13px] text-[#8aa398]">多云</div>
          </div>
          <svg viewBox="0 0 64 64" className="ml-1 h-14 w-14">
            <circle cx="26" cy="24" r="12" fill="#ffc93c" />
            <g stroke="#ffc93c" strokeWidth="3" strokeLinecap="round">
              <line x1="26" y1="4" x2="26" y2="9" />
              <line x1="8" y1="14" x2="12" y2="17" />
              <line x1="6" y1="28" x2="11" y2="28" />
            </g>
            <path
              d="M22 44 a9 9 0 0 1 .8-17.9 a11 11 0 0 1 21.4 2.4 A8 8 0 0 1 42 44 Z"
              fill="#e8eef2"
              stroke="#d3dde3"
              strokeWidth="1.5"
            />
          </svg>
        </div>
        <ul className="space-y-2.5 text-[13px]">
          {[
            ['东南风', '2 级'],
            ['湿度', `${Math.round(weather.v2)}%`],
            ['降雨概率', '20%'],
          ].map(([k, v]) => (
            <li key={k} className="flex items-center gap-6">
              <span className="flex items-center gap-1.5 text-[#8aa398]">
                <span className="h-1 w-1 rounded-full bg-[#a4bcb1]" />
                {k}
              </span>
              <span className="ml-auto font-semibold text-[#3d5a4d]">{v}</span>
            </li>
          ))}
        </ul>
      </div>
      {settings.notifHeat && (
        <div className="mt-3.5 flex items-start gap-2.5 rounded-xl bg-[#fff6ea] p-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#f59e0b]" fill="#fde3b5" />
          <div className="flex-1">
            <div className="text-[13px] font-bold text-[#e08a00]">高温预警</div>
            <div className="mt-0.5 text-[12px] leading-relaxed text-[#a08050]">
              未来 2 天最高温将达 33°C，请注意防暑降温。
            </div>
          </div>
          <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-[#d8c39a]" />
        </div>
      )}
    </div>
  )
}

function ScheduleCard() {
  const { tasks, setTaskStatus } = useStore()
  const today = todayStr()
  const tomorrow = todayStr(1)
  const schedules = useMemo(() => {
    const fmt = (t: Task) => ({
      ...t,
      dayLabel: t.date === today ? '今天' : t.date === tomorrow ? '明天' : t.date.slice(5),
    })
    const upcoming = tasks
      .filter((t) => (t.date === today || t.date === tomorrow) && t.status !== 'done')
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
      .map(fmt)
    const doneToday = tasks
      .filter((t) => t.date === today && t.status === 'done')
      .sort((a, b) => a.time.localeCompare(b.time))
      .map(fmt)
    return [...upcoming, ...doneToday].slice(0, 3)
  }, [tasks, today, tomorrow])

  return (
    <div className="rounded-2xl bg-white p-4 shadow-[0_2px_12px_rgba(23,53,42,0.05)]">
      <CardHeaderRow icon={<CalendarDays className="h-4 w-4 text-[#5f7a6e]" />} title="近期日程" />
      <div className="relative mt-4">
        <div className="absolute bottom-3 left-[7px] top-3 w-px bg-[#e0ece5]" />
        <ul className="space-y-5">
          {schedules.map((s) => {
            const done = s.status === 'done'
            return (
              <li key={s.id} className="relative flex items-center gap-2.5 pl-6">
                <button
                  title={done ? '标记为未完成' : '标记完成'}
                  onClick={() => setTaskStatus(s.id, done ? 'pending' : 'done')}
                  className={`absolute left-0 top-1/2 flex h-4 w-4 -translate-y-1/2 items-center justify-center rounded-full ring-4 ring-white transition-colors ${
                    done ? 'bg-[#c6ddd0]' : 'bg-[#1fa756] hover:bg-[#178a45]'
                  }`}
                >
                  {done && <Check className="h-2.5 w-2.5 text-white" strokeWidth={4} />}
                </button>
                <span
                  className={`text-[13.5px] font-semibold ${done ? 'text-[#a4bcb1] line-through' : 'text-[#17352a]'}`}
                >
                  {s.title}
                </span>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${TASK_TYPE_COLORS[s.type]}`}>
                  {s.type}
                </span>
                <span className="ml-auto whitespace-nowrap text-[12px] text-[#8aa398]">
                  {s.dayLabel} {s.time}
                </span>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}

/* ---------------------------------- 页面 ---------------------------------- */

export default function Dashboard() {
  const { tasks, readings, settings } = useStore()
  const today = todayStr()

  const todayTasks = tasks.filter((t) => t.date === today)
  const todayUndone = todayTasks.filter((t) => t.status !== 'done').length

  const healthAvg = Math.round(FIELDS.reduce((s, f) => s + f.health, 0) / FIELDS.length)

  const soilDevices = DEVICES.filter((d) => d.kind === 'soil' && d.online)
  const moistureAvg =
    soilDevices.length > 0
      ? Math.round(
          soilDevices.reduce((s, d) => s + (readings[d.id]?.v1 ?? d.base), 0) / soilDevices.length,
        )
      : 0

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* 顶部问候 */}
      <header className="flex items-start justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-[28px] font-extrabold tracking-tight text-[#10291e]">
            上午好，{settings.displayName}
            <Leaf className="h-6 w-6 text-[#5cbb63]" fill="#74cc72" />
          </h1>
          <p className="mt-1 text-[14px] text-[#8aa398]">欢迎使用数字农业协作平台</p>
        </div>
        <NotificationBell />
      </header>

      {/* 内容区 */}
      <div className="mt-5 flex min-h-0 flex-1 items-start gap-5">
        {/* 左列 */}
        <div className="flex min-w-0 flex-1 flex-col gap-5 self-stretch">
          <div className="grid grid-cols-3 gap-5">
            <KpiCard
              title="今日工单"
              sub="待完成 / 总数"
              value={
                <span className="text-[30px] font-extrabold leading-none text-[#10291e]">
                  {todayUndone}
                  <span className="mx-1.5 text-[22px] font-bold text-[#8aa398]">/</span>
                  <span className="text-[22px] font-bold text-[#8aa398]">{todayTasks.length}</span>
                </span>
              }
              trend="down"
              trendText="2"
              icon={<ListChecks className="h-7 w-7 text-white" strokeWidth={2.2} />}
              iconBg="#2fbf71"
            />
            <KpiCard
              title="作物长势"
              sub="整体长势评分"
              value={
                <span className="text-[30px] font-extrabold leading-none text-[#10291e]">
                  {healthAvg}
                  <span className="ml-1 text-[16px] font-bold text-[#8aa398]">分</span>
                </span>
              }
              pill={{ text: '良好', color: 'green' }}
              trend="up"
              trendText="5"
              icon={<Sprout className="h-7 w-7 text-[#178a45]" strokeWidth={2.2} />}
              iconBg="#e4f7ec"
            />
            <KpiCard
              title="水肥状态"
              sub="当前均衡度"
              value={
                <span className="text-[30px] font-extrabold leading-none text-[#10291e]">
                  {moistureAvg}
                  <span className="ml-1 text-[16px] font-bold text-[#8aa398]">%</span>
                </span>
              }
              pill={{ text: '适宜', color: 'blue' }}
              trend="up"
              trendText="6%"
              icon={<Droplets className="h-7 w-7 text-white" fill="#ffffff" strokeWidth={2.2} />}
              iconBg="#4aa8ec"
            />
          </div>

          <MapCard />
        </div>

        {/* 右信息栏 */}
        <div className="flex w-[300px] shrink-0 flex-col gap-5">
          <AdviceCard />
          <WeatherCard />
          <ScheduleCard />
        </div>
      </div>
    </div>
  )
}
