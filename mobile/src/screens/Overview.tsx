import FieldMotion from '../components/FieldMotion'
import { ChevronDown, ScanBarcode, Bell, ChevronRight, AlertTriangle, CloudRain, Sun, CloudSun, CloudFog, CloudLightning, Snowflake } from 'lucide-react'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { Glass, Ring, CountUp, SectionTitle, DrawnLine, stagger, fadeUp, LIME } from '../components/anim'
import { useStore } from '../store'
import { useAuth, greeting } from '../auth'
import { ProfileSheet } from './Profile'
import { useGeoLocation, useWeather, weatherCodeText, weatherCodeGroup, windDirectionCN, beaufort } from '../lib/weather'

const WX_ICONS = { sunny: Sun, cloudy: CloudSun, fog: CloudFog, rain: CloudRain, snow: Snowflake, storm: CloudLightning }

/** 「实时 / 离线演示」徽标；dark=true 用于照片/视频上的深色场景 */
export function LiveBadge({ live, dark = false }: { live: boolean; dark?: boolean }) {
  return (
    <span
      className={`flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[9.5px] font-medium ${
        live
          ? 'border-[rgba(22,163,74,0.35)] bg-[rgba(22,163,74,0.08)] text-[#16a34a]'
          : dark
            ? 'border-white/20 bg-black/25 text-white/60'
            : 'border-black/10 bg-black/[0.04] text-black/40'
      }`}
    >
      <span className={`h-1 w-1 rounded-full ${live ? 'bg-[#16a34a]' : dark ? 'bg-white/40' : 'bg-black/30'}`} />
      {live ? '实时' : '离线演示'}
    </span>
  )
}

const FIELDS = [
  { name: '1号南瓜田', area: 320, score: 92, stage: '坐果期', active: true, img: 'images/field-corn.jpg' },
  { name: '2号南瓜田', area: 280, score: 88, stage: '开花期', active: true, img: 'images/field-soy.jpg' },
  { name: '3号南瓜田', area: 300, score: 85, stage: '伸蔓期', active: false, img: 'images/field-wheat.jpg' },
  { name: '4号南瓜田', area: 350, score: 90, stage: '坐果期', active: true, img: 'images/hero-field.jpg' },
]

const ALERTS = [
  { text: '2号南瓜田土壤湿度偏低', time: '10 分钟前' },
  { text: '3号南瓜田有病虫害风险', time: '1 小时前' },
]

const DAY_LABELS = ['今天', '明天', '后天']

export default function Overview() {
  const { setScreen } = useStore()
  const { session } = useAuth()
  const [profileOpen, setProfileOpen] = useState(false)
  const role = session?.role ?? 'guest'
  const displayName = role === 'admin' ? '管理员' : role === 'guest' ? '游客模式' : (session?.nickname ?? '用户')
  const geo = useGeoLocation()
  const { data: wx, source } = useWeather(geo.lat, geo.lon)
  const live = source === 'live'
  const NowIcon = WX_ICONS[weatherCodeGroup(wx.weatherCode)]
  const forecast = wx.daily.slice(0, 3).map((d, i) => ({
    day: DAY_LABELS[i] ?? d.date.slice(5),
    icon: WX_ICONS[weatherCodeGroup(d.code)],
    range: `${Math.round(d.tMin)}~${Math.round(d.tMax)}°C`,
  }))

  return (
    <div className="pb-32">
      {/* ===== HERO：真实田野摄影 + 问候 + 超大健康度 ===== */}
      <div className="overview-hero relative h-[228px] overflow-hidden">
        <img src="images/hero-field.jpg" alt="田野航拍" className="absolute inset-0 h-full w-full object-cover" />
        <div className="hero-tint absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(6,9,6,0.42) 0%, rgba(6,9,6,0.08) 42%, rgba(6,9,6,0.88) 100%)' }} />

        {/* 顶部：问候 + 操作 */}
        <div className="relative flex items-start justify-between px-4 pt-2">
          <div className="flex items-center gap-2.5">
            <button onClick={() => setProfileOpen(true)} className="flex items-center gap-2.5 text-left">
              <img src="images/avatar-user.jpg" alt={displayName} className="h-9 w-9 rounded-full border border-white/20 object-cover" />
              <div>
                <div className="flex items-center gap-1 text-[15px] font-semibold tracking-[-0.02em] text-white">
                  {greeting()}，{displayName}
                  <ChevronDown className="h-3.5 w-3.5 text-white/40" strokeWidth={1.5} />
                </div>
                <p className="mt-0.5 flex items-center gap-1.5 text-[10.5px] text-white/60">
                  {weatherCodeText(wx.weatherCode)} {Math.round(wx.temperature)}°C · {windDirectionCN(wx.windDirection)} {beaufort(wx.windSpeed)}级
                  <LiveBadge live={live} dark />
                </p>
              </div>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button aria-label="拍照识别" onClick={() => setScreen('identify')} className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-white/[0.12] bg-[rgba(6,9,6,0.35)] backdrop-blur-sm">
              <ScanBarcode className="h-[18px] w-[18px] text-white/80" strokeWidth={1.5} />
            </button>
            <button aria-label="查看预警通知" onClick={() => setScreen('alerts')} className="relative flex h-9 w-9 items-center justify-center rounded-[10px] border border-white/[0.12] bg-[rgba(6,9,6,0.35)] backdrop-blur-sm">
              <Bell className="h-[18px] w-[18px] text-white/80" strokeWidth={1.5} />
              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#e8a04c]" />
            </button>
          </div>
        </div>

        {/* 左下：超大健康度数字 */}
        <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
          <div>
            <div className="label-caps text-[10px] font-medium text-white/50">作物健康度 · 长势良好</div>
            <div className="mt-0.5 flex items-baseline gap-2">
              <span className="font-num text-[60px] font-bold leading-none text-white">
                <CountUp to={92} />
              </span>
              <span className="text-[11px] text-white/60">
                较昨日 <span className="font-medium text-[#4ade80]">↑ 6</span>
              </span>
            </div>
          </div>
          <svg viewBox="0 0 120 36" className="h-9 w-[110px] opacity-90">
            <DrawnLine points={[20, 24, 22, 30, 26, 34, 31, 30, 36, 40]} w={120} h={36} />
          </svg>
        </div>
      </div>

      <motion.div variants={stagger} initial="hidden" animate="show" className="mt-4 space-y-4 px-4">
        {/* 四格统计 */}
        <motion.div variants={fadeUp}>
          <Glass className="grid grid-cols-4 divide-x divide-black/[0.08] p-3.5 text-center">
            {[
              ['种植面积', 1250, '亩'],
              ['地块数量', 8, '块'],
              ['传感器', 24, '个'],
              ['在线率', 96, '%'],
            ].map(([label, v, unit]) => (
              <div key={label as string}>
                <div className="font-num text-[19px] font-semibold leading-none text-[#1a2b23]">
                  <CountUp to={v as number} />
                  <span className="ml-0.5 text-[10px] font-medium text-black/40">{unit}</span>
                </div>
                <div className="mt-1 text-[10.5px] text-black/40">{label}</div>
              </div>
            ))}
          </Glass>
        </motion.div>

        {/* 地块一览：真实田照 */}
        <motion.div variants={fadeUp}>
          <SectionTitle
            title="地块一览"
            extra={
              <button className="flex items-center text-[11px] text-black/40">
                查看全部 <ChevronRight className="h-3 w-3" strokeWidth={1.5} />
              </button>
            }
          />
          <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
            {FIELDS.map((f, i) => (
              <motion.div
                key={f.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.05, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="relative w-[128px] shrink-0 overflow-hidden rounded-[12px] border border-black/[0.08] bg-white shadow-[0_1px_3px_rgba(20,40,30,0.06)]"
              >
                <div className="relative h-[86px]">
                  <FieldMotion src={f.img} alt={f.name} index={i} />
                  <div className="absolute inset-0 bg-gradient-to-t from-[rgba(6,9,6,0.55)] to-transparent" />
                  <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[rgba(11,15,12,0.75)] font-num text-[11px] font-semibold text-[#16a34a]">
                    {f.score}
                  </div>
                </div>
                <div className="border-t border-black/[0.07] p-2.5">
                  <div className="text-[12.5px] font-medium text-[#1a2b23]">{f.name}</div>
                  <div className="mt-0.5 text-[11px] text-black/40">{f.area} 亩</div>
                  <span
                    className={`mt-1.5 inline-block rounded-md px-1.5 py-0.5 text-[10px] font-medium ${
                      f.active
                        ? 'border border-[rgba(22,163,74,0.3)] bg-[rgba(22,163,74,0.06)] text-[#16a34a]'
                        : 'border border-[rgba(232,160,76,0.3)] bg-[rgba(232,160,76,0.06)] text-[#e8a04c]'
                    }`}
                  >
                    {f.stage}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* 大卡（墒情）配小卡（天气） */}
        <motion.div variants={fadeUp} className="grid grid-cols-5 gap-3.5">
          <Glass className="col-span-3 p-4">
            <SectionTitle title="土壤墒情" sub="30cm土层含水率" />
            <div className="font-num text-[30px] font-semibold leading-none tracking-[-0.02em] text-[#1a2b23]">
              <CountUp to={62} />
              <span className="text-[14px]">%</span>
              <span className="ml-2 rounded-md border border-black/10 bg-black/[0.05] px-1.5 py-0.5 align-middle text-[10px] font-medium text-black/55">
                适宜
              </span>
            </div>
            <svg viewBox="0 0 150 44" className="mt-2 h-11 w-full">
              <DrawnLine points={[30, 34, 28, 40, 36, 44, 38, 48, 44]} w={150} h={44} color="#8fb8d8" fill />
            </svg>
            <div className="mt-1 flex justify-between text-[9.5px] text-black/40">
              <span>00:00</span>
              <span>06:00</span>
              <span>12:00</span>
              <span>18:00</span>
            </div>
          </Glass>
          <Glass className="col-span-2 p-3.5">
            <SectionTitle title="天气预报" extra={<LiveBadge live={live} />} />
            <div className="flex items-center gap-2">
              <NowIcon className="h-7 w-7 text-black/60" strokeWidth={1.5} />
              <span className="font-num text-[24px] font-semibold leading-none text-[#1a2b23]">
                <CountUp to={Math.round(wx.temperature)} />
                <span className="text-[13px]">°C</span>
              </span>
            </div>
            <div className="mt-1 text-[11px] text-black/40">{weatherCodeText(wx.weatherCode)}</div>
            <div className="mt-2 space-y-1.5">
              {forecast.map((f) => (
                <div key={f.day} className="flex items-center justify-between text-[10px]">
                  <span className="flex items-center gap-1 text-black/55">
                    <f.icon className="h-3 w-3 text-black/40" strokeWidth={1.5} />
                    {f.day}
                  </span>
                  <span className="text-[#1a2b23]">{f.range}</span>
                </div>
              ))}
            </div>
          </Glass>
        </motion.div>

        {/* 灌溉状态 + 告警提醒 */}
        <motion.div variants={fadeUp} className="grid grid-cols-2 gap-4">
          <Glass className="p-3.5">
            <SectionTitle title="灌溉状态" sub="今日灌溉时长" />
            <div className="flex items-center gap-3">
              <div>
                <div className="font-num text-[26px] font-semibold leading-none tracking-[-0.02em] text-[#1a2b23]">
                  <CountUp to={2.6} decimals={1} />
                  <span className="text-[12px] font-medium text-black/40"> 小时</span>
                </div>
                <span className="mt-1 inline-block rounded-md border border-[rgba(22,163,74,0.3)] bg-[rgba(22,163,74,0.06)] px-1.5 py-0.5 text-[10px] font-medium text-[#16a34a]">
                  正常
                </span>
              </div>
              <Ring value={65} size={54} stroke={5} color="#8fb8d8">
                <span className="text-[13px] text-black/45">💧</span>
              </Ring>
            </div>
            <div className="mt-2 border-t border-black/[0.08] pt-2 text-[11px] text-black/40">
              预计节水 <span className="font-semibold text-[#16a34a]">15%</span>
            </div>
          </Glass>
          <Glass className="p-3.5" onClick={() => setScreen('alerts')}>
            <SectionTitle title="告警提醒" />
            <ul className="space-y-2.5">
              {ALERTS.map((a) => (
                <li key={a.text} className="flex items-start gap-2">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-black/[0.06]">
                    <AlertTriangle className="h-3 w-3 text-[#e8a04c]" strokeWidth={1.5} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11.5px] font-medium leading-snug text-[#1a2b23]">{a.text}</p>
                    <span className="text-[10px] text-black/40">{a.time}</span>
                  </div>
                </li>
              ))}
            </ul>
            <button className="mt-2 flex w-full items-center justify-end text-[10.5px] font-medium text-[#15803d]">
              查看全部 <ChevronRight className="h-3 w-3" strokeWidth={1.5} />
            </button>
          </Glass>
        </motion.div>

        {/* 产量预测卡（焦点元素 + 渐变描边） */}
        <motion.div variants={fadeUp}>
          <Glass className="grad-border p-4" onClick={() => setScreen('prediction')}>
            <div className="flex items-center justify-between">
              <SectionTitle title="产量预测" sub="南瓜 | 1号地块" />
              <span className="rounded-md border border-[rgba(22,163,74,0.3)] bg-[rgba(22,163,74,0.06)] px-2 py-0.5 text-[10.5px] font-medium text-[#16a34a]">
                丰收在望
              </span>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <div className="font-num text-[34px] font-semibold leading-none tracking-[-0.02em] text-[#1a2b23]">
                  <CountUp to={1280} />
                  <span className="ml-1 text-[12px] font-medium text-black/40">kg/亩</span>
                </div>
                <div className="mt-1.5 text-[11.5px] text-black/40">
                  较去年 <span className="font-semibold text-[#16a34a]">↑ 8%</span>
                </div>
              </div>
              <svg viewBox="0 0 150 56" className="h-14 w-[46%]">
                <DrawnLine points={[20, 26, 24, 32, 30, 36, 42, 46, 52]} w={150} h={56} color={LIME} fill />
              </svg>
            </div>
            <div className="mt-1 flex justify-between text-[9.5px] text-black/40">
              <span>5月</span>
              <span>6月</span>
              <span>7月</span>
              <span>8月</span>
              <span>9月(预估)</span>
            </div>
          </Glass>
        </motion.div>
      </motion.div>

      {/* 个人中心 */}
      <ProfileSheet open={profileOpen} onClose={() => setProfileOpen(false)} />
    </div>
  )
}
