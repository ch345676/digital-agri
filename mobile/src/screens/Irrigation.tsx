import FarmMap from '../components/FarmMap'
import { FIELDS } from '../farm-data'
import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, MoreHorizontal, Droplets, CalendarClock, Sparkles, ArrowRight, CheckCircle2, Sun, CloudSun, CloudFog, CloudRain, CloudLightning, Snowflake } from 'lucide-react'
import { AnimatePresence, animate, motion } from 'framer-motion'
import { Glass, SectionTitle, Toggle, DrawnLine, CountUp, stagger, fadeUp, EASE } from '../components/anim'
import { useStore, nowHM } from '../store'
import { useAuth, usePerm } from '../auth'
import { Lock, Send, SprayCan } from 'lucide-react'
import { toast as sonnerToast } from 'sonner'
import { useGeoLocation, useWeather, weatherCodeText, weatherCodeGroup, windDirectionCN, beaufort, rainSoon } from '../lib/weather'
import { LiveBadge } from './Overview'

const WX_ICONS = { sunny: Sun, cloudy: CloudSun, fog: CloudFog, rain: CloudRain, snow: Snowflake, storm: CloudLightning }

const ZONES = FIELDS.map((f,i)=>({id:i,fieldId:f.id,name:f.id,crop:f.crop,base:f.soilMoisture}))

export default function Irrigation() {
  const { setScreen, valves, setValve, planEnabled, setPlanEnabled, addChat } = useStore()
  const { session } = useAuth()
  const { isAdmin, isGuest, needLogin } = usePerm()
  /* 普通用户：提交灌溉申请给管理员（出现在协作群聊中） */
  const applyIrrigation = (label: string) => {
    if (isGuest) {
      needLogin()
      return
    }
    addChat({ who: 'me', name: session?.nickname ?? '我', text: `【灌溉申请】请求开启 ${label}，请管理员审批。`, time: nowHM() })
    sonnerToast('灌溉申请已提交，等待管理员处理', { icon: '💧' })
  }
  /** 非管理员点击阀门/计划：用户转申请，游客只读提示 */
  const guardValve = (label: string) => {
    if (isAdmin) return true
    applyIrrigation(label)
    return false
  }
  const geo = useGeoLocation()
  const { data: wx, source } = useWeather(geo.lat, geo.lon)
  const live = source === 'live'
  const NowIcon = WX_ICONS[weatherCodeGroup(wx.weatherCode)]
  const willRain = rainSoon(wx)
  const [moisture, setMoisture] = useState(ZONES.map((z) => z.base))
  const [water, setWater] = useState(28.6)
  const [running, setRunning] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const startIrrigation = () => {
    if (running) return
    setRunning(true)
    // 阀门依次开启
    ZONES.forEach((_, i) => {
      timers.current.push(setTimeout(() => setValve(i, true), 350 * (i + 1)))
    })
    // 墒情逐渐上升到适宜
    moisture.forEach((m, i) => {
      const target = Math.max(m, Math.min(90, ZONES[i].base + 4))
      animate(m, target, {
        duration: 3.2,
        delay: 0.4 + i * 0.25,
        ease: 'easeInOut',
        onUpdate: (v) =>
          setMoisture((prev) => {
            const next = [...prev]
            next[i] = Math.round(v * 10) / 10
            return next
          }),
      })
    })
    // 用水量上升
    animate(water, water + 1.2, {
      duration: 3.4,
      ease: 'easeInOut',
      onUpdate: (v) => setWater(Math.round(v * 10) / 10),
    })
    // 完成
    timers.current.push(
      setTimeout(() => {
        setRunning(false)
        setToast('五地块灌溉演示完成')
        timers.current.push(setTimeout(() => setToast(null), 2400))
      }, 4800),
    )
  }

  return (
    <div className="px-4 pb-40 pt-5">
      {/* 顶部 */}
      <header className="flex items-center justify-between">
        <button onClick={() => setScreen('overview')} className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-black/[0.08] bg-black/[0.05]">
          <ChevronLeft className="h-5 w-5 text-black/60" strokeWidth={1.5} />
        </button>
        <h1 className="text-[17px] font-semibold tracking-[-0.02em] text-[#1a2b23]">智能灌溉</h1>
        <button className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-black/[0.08] bg-black/[0.05]">
          <MoreHorizontal className="h-5 w-5 text-black/60" strokeWidth={1.5} />
        </button>
      </header>

      <motion.div variants={stagger} initial="hidden" animate="show" className="mt-4 space-y-3.5">
        {/* 天气条 */}
        <motion.div variants={fadeUp}>
          <Glass className="flex items-center justify-between p-3.5">
            <div className="flex items-center gap-3">
              <NowIcon className="h-9 w-9 text-black/60" strokeWidth={1.5} />
              <div>
                <div className="text-[22px] font-semibold leading-none text-[#1a2b23]">
                  <CountUp to={Math.round(wx.temperature)} />
                  <span className="text-[13px] font-normal">°C</span>
                  <span className="ml-2 text-[12px] font-normal text-black/55">{weatherCodeText(wx.weatherCode)}</span>
                  <span className="ml-2 align-middle"><LiveBadge live={live} /></span>
                </div>
                <div className="mt-1 text-[11px] text-black/40">
                  {windDirectionCN(wx.windDirection)} {beaufort(wx.windSpeed)}级 · 湿度 {Math.round(wx.humidity)}%
                </div>
              </div>
            </div>
            {willRain ? (
              <div className="rounded-[10px] border border-[rgba(232,160,76,0.25)] bg-[rgba(232,160,76,0.07)] px-3 py-2 text-right">
                <div className="text-[12.5px] font-medium text-[#e8a04c]">有降雨可能</div>
                <div className="text-[10px] text-black/40">未来24小时内 · 建议推迟灌溉</div>
              </div>
            ) : (
              <div className="rounded-[10px] border border-[rgba(22,163,74,0.2)] bg-[rgba(22,163,74,0.06)] px-3 py-2 text-right">
                <div className="text-[12.5px] font-medium text-[#16a34a]">适宜灌溉</div>
                <div className="text-[10px] text-black/40">未来24小时无降雨</div>
              </div>
            )}
          </Glass>
        </motion.div>

        <motion.div variants={fadeUp}>
          <FarmMap irrigation={{moisture:Object.fromEntries(ZONES.map((z,i)=>[z.fieldId,moisture[i]])),valves:Object.fromEntries(ZONES.map((z,i)=>[z.fieldId,valves[i]])),busy:running,onValve:(id)=>{const index=ZONES.findIndex(z=>z.fieldId===id);if(index>=0&&guardValve(`${id} ${ZONES[index].crop} 阀门`))setValve(index,!valves[index])}}}/>
          <p className="farm-credit">五块田与电脑端一致；墒情和灌溉过程为演示数据。</p>
        </motion.div>

        {/* 阀门状态 */}
        <motion.div variants={fadeUp}>
          <Glass className="p-4">
            <SectionTitle title="阀门控制" extra={<span className="valve-summary">{valves.filter(Boolean).length} / 5 已开启</span>} />
            <div className="valve-list">
              {ZONES.map((z, i) => {
                const on = valves[i]
                return <button key={z.id} data-valve-field={z.fieldId} aria-pressed={on} aria-label={`${z.name} ${z.crop} 阀门，${on?'已开启':'已关闭'}`} disabled={running} onClick={()=>guardValve(`${z.name} ${z.crop} 阀门`)&&setValve(i,!on)} className={`valve-row ${on?'is-on':''}`}>
                  <span className="valve-icon"><Droplets size={17} strokeWidth={1.6}/></span>
                  <span className="valve-name"><b>{z.name}</b><small>{z.crop}</small></span>
                  {!isAdmin&&<Lock size={12} className="valve-lock"/>}
                  <span className="valve-state">{running?'执行中':on?'开启':'关闭'}</span>
                  <span className="valve-switch" aria-hidden="true"><i/></span>
                </button>
              })}
            </div>
          </Glass>
        </motion.div>

        {/* 今日用水量 */}
        <motion.div variants={fadeUp}>
          <Glass className="p-4">
            <div className="flex items-end justify-between">
              <div>
                <SectionTitle title="今日用水量" />
                <div className="font-num text-[28px] font-semibold leading-none tracking-[-0.02em] text-[#1a2b23]">
                  {water.toFixed(1)}
                  <span className="ml-1 text-[12px] font-normal text-black/40">吨</span>
                </div>
                <div className="mt-1.5 text-[11px] text-black/40">
                  较昨日 <span className="font-medium text-[#16a34a]">-12%</span>
                </div>
              </div>
              <svg viewBox="0 0 150 52" className="h-[52px] w-[46%]">
                <DrawnLine points={[4, 8, 6, 12, 10, 18, 14, 20, 16, 22]} w={150} h={52} fill />
              </svg>
            </div>
            <div className="mt-1 flex justify-between text-[9.5px] text-black/40">
              <span>00:00</span>
              <span>08:00</span>
              <span>16:00</span>
              <span>24:00</span>
            </div>
          </Glass>
        </motion.div>

        {/* 自动灌溉计划 */}
        <motion.div variants={fadeUp}>
          <Glass className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-black/[0.08] bg-black/[0.05]">
                  <CalendarClock className="h-[18px] w-[18px] text-black/60" strokeWidth={1.5} />
                </span>
                <span className="text-[14px] font-medium text-[#1a2b23]">自动灌溉计划</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-md px-2 py-0.5 text-[10.5px] font-medium ${planEnabled ? 'bg-[rgba(22,163,74,0.08)] text-[#16a34a]' : 'bg-black/[0.07] text-black/40'}`}>
                  {planEnabled ? '已启用' : '已停用'}
                </span>
                <span onClick={(e) => { if (!isAdmin) { e.stopPropagation(); applyIrrigation('自动灌溉计划调整') } }} className="relative inline-flex">
                  {!isAdmin && <Lock className="absolute -left-4 top-1/2 h-3 w-3 -translate-y-1/2 text-black/35" strokeWidth={2} />}
                  <Toggle on={planEnabled} onChange={(v) => isAdmin && setPlanEnabled(v)} />
                </span>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between rounded-[10px] bg-black/[0.04] px-3.5 py-2.5">
              <div>
                <div className="text-[10.5px] text-black/40">下次灌溉时间</div>
                <div className="text-[14px] font-medium text-[#1a2b23]">明天 06:00</div>
              </div>
              <div className="text-right">
                <div className="text-[10.5px] text-black/40">灌溉时长</div>
                <div className="text-[14px] font-medium text-[#1a2b23]">60 分钟</div>
              </div>
              <ChevronLeft className="h-4 w-4 rotate-180 text-black/40" strokeWidth={1.5} />
            </div>
          </Glass>
        </motion.div>

        {/* AI 灌溉建议 */}
        <motion.div variants={fadeUp}>
          <Glass className="flex items-center gap-3 p-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-black/[0.08] bg-black/[0.05]">
              <Sparkles className="h-[18px] w-[18px] text-black/60" strokeWidth={1.5} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[13.5px] font-medium text-[#1a2b23]">AI 灌溉建议</div>
              <p className="mt-0.5 text-[11px] leading-snug text-black/40">
                基于土壤墒情、作物阶段及天气预报，建议明日清晨灌溉，节水增效
              </p>
            </div>
            <button
              onClick={() => (isAdmin ? startIrrigation() : applyIrrigation('AI 推荐方案'))}
              className="flex shrink-0 items-center gap-1 rounded-lg border border-[rgba(22,163,74,0.3)] bg-[rgba(22,163,74,0.06)] px-2.5 py-1.5 text-[11px] font-medium text-[#16a34a]"
            >
              {!isAdmin && <Lock className="h-3 w-3" strokeWidth={2} />}
              {isAdmin ? '推荐执行' : '申请执行'}
            </button>
          </Glass>
        </motion.div>
        {/* 施药管理入口 */}
        <motion.div variants={fadeUp}>
          <Glass className="flex items-center gap-3 p-4" onClick={() => setScreen('spray')}>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-[rgba(21,128,61,0.25)] bg-[rgba(21,128,61,0.07)]">
              <SprayCan className="h-[18px] w-[18px] text-[#15803d]" strokeWidth={1.5} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[13.5px] font-medium text-[#1a2b23]">施药管理</div>
              <p className="mt-0.5 text-[11px] leading-snug text-black/40">
                喷淋施药 4 步向导 · 药剂方案自动计算 · 记录可回看
              </p>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-black/30" strokeWidth={1.5} />
          </Glass>
        </motion.div>
      </motion.div>
      <div className="fixed bottom-[86px] left-1/2 z-30 w-full max-w-[420px] center-x px-4">
        <div className="rounded-[15px] p-[1px]" style={{ background: 'linear-gradient(135deg, rgba(22,163,74,0.75), rgba(22,163,74,0.08) 55%, transparent)' }}>
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => (isAdmin ? startIrrigation() : applyIrrigation('一键灌溉'))}
            disabled={running}
            className="flex w-full items-center justify-between rounded-[14px] bg-[#16a34a] px-5 py-3.5 disabled:opacity-70"
          >
            <span className="flex items-center gap-2 text-[15px] font-semibold text-white">
              {isAdmin ? (
                <Droplets className="h-5 w-5" strokeWidth={1.5} />
              ) : isGuest ? (
                <Lock className="h-5 w-5" strokeWidth={1.5} />
              ) : (
                <Send className="h-5 w-5" strokeWidth={1.5} />
              )}
              {running ? '灌溉执行中…' : isAdmin ? '一键灌溉' : isGuest ? '一键灌溉' : '提交灌溉申请'}
            </span>
            <span className="flex items-center gap-1 text-[11px] font-medium text-[rgba(255,255,255,0.8)]">
              {running ? '分区阀门依次开启' : isAdmin ? '按推荐方案立即执行灌溉' : isGuest ? '游客只读 · 登录后可申请' : '发送给管理员审批'}
              <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
            </span>
          </motion.button>
        </div>
        <p className="mt-1.5 text-center text-[9.5px] text-black/40">*灌溉执行将按当前阀门状态与安全策略运行</p>
      </div>

      {/* 完成 toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="fixed left-1/2 top-6 z-50 flex center-x items-center gap-2 rounded-full border border-black/[0.1] bg-white px-4 py-2.5 shadow-lg"
          >
            <CheckCircle2 className="h-4 w-4 text-[#16a34a]" strokeWidth={1.5} />
            <span className="whitespace-nowrap text-[12.5px] font-medium text-[#1a2b23]">{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
