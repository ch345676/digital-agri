import { ChevronLeft, HelpCircle, Sprout, CalendarDays, Sun, CloudRain, SunSnow, TrendingUp } from 'lucide-react'
import { motion } from 'framer-motion'
import { Glass, SectionTitle, CountUp, DrawnLine, stagger, fadeUp, EASE } from '../components/anim'
import { useStore } from '../store'

/* 生长曲线数据（吨/亩，x：播种/伸蔓/开花/坐果/膨大/成熟） */
const STAGES = ['播种', '伸蔓期', '开花期', '坐果期', '膨大期', '成熟期']
const THIS_YEAR = [0.5, 2.2, 4.5, 6.8, 8.2, 8.62]
const LAST_YEAR = [0.4, 1.9, 3.8, 5.9, 7.1, 7.66]
const HIGH_AVG = [0.45, 2.0, 4.1, 6.2, 7.4, 7.8]

function scalePoints(data: number[], w: number, h: number, max: number): string {
  const step = w / (data.length - 1)
  return data
    .map((v, i) => `${i === 0 ? 'M' : 'L'}${(i * step).toFixed(1)},${(h - (v / max) * (h - 8)).toFixed(1)}`)
    .join(' ')
}

const BARS = [
  { name: 'A区1号田', value: 8.62, highlight: true },
  { name: 'A区2号田', value: 7.45 },
  { name: 'B区1号田', value: 6.89 },
  { name: '高产区平均', value: 7.8 },
]

const WEATHER_IMPACT = [
  { icon: Sun, label: '高温日数偏多', value: '+1.5%', good: true },
  { icon: CloudRain, label: '降雨量偏少', value: '-2.8%', good: false },
  { icon: SunSnow, label: '日照时数正常', value: '0%', good: true },
]

const ADVICES = [
  { text: '保持当前水肥管理方案', sub: '有利于产量提升', tone: '#16a34a' },
  { text: '关注白粉病防治', sub: '建议提前预防', tone: '#60a5fa' },
  { text: '适时收割', sub: '建议在10月18日前后收割', tone: '#e8a04c' },
]

function daysToHarvest(): number {
  const now = new Date()
  let target = new Date(now.getFullYear(), 9, 18) // 10-18
  if (target.getTime() < now.getTime()) target = new Date(now.getFullYear() + 1, 9, 18)
  return Math.ceil((target.getTime() - now.getTime()) / 86400000)
}

export default function Prediction() {
  const { setScreen } = useStore()
  const days = daysToHarvest()
  const W = 330
  const H = 150
  const MAX = 12

  return (
    <div className="px-4 pb-10 pt-5">
      <header className="flex items-center justify-between">
        <button onClick={() => setScreen('overview')} className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-black/[0.08] bg-black/[0.05]">
          <ChevronLeft className="h-5 w-5 text-black/60" strokeWidth={1.5} />
        </button>
        <h1 className="text-[17px] font-semibold tracking-[-0.02em] text-[#1a2b23]">产量预测</h1>
        <button className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-black/[0.08] bg-black/[0.05]">
          <HelpCircle className="h-[18px] w-[18px] text-black/60" strokeWidth={1.5} />
        </button>
      </header>

      <motion.div variants={stagger} initial="hidden" animate="show" className="mt-4 space-y-3.5">
        {/* 作物卡 */}
        <motion.div variants={fadeUp}>
          <Glass className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full border border-black/[0.08] bg-black/[0.05]">
                <Sprout className="h-5 w-5 text-black/60" strokeWidth={1.5} />
              </span>
              <div>
                <div className="text-[15px] font-medium text-[#1a2b23]">南瓜 · 蜜本南瓜</div>
                <div className="mt-0.5 text-[11px] text-black/40">田块：A区1号田</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10.5px] text-black/40">生育期</div>
              <div className="text-[15px] font-medium text-[#16a34a]">坐果期</div>
            </div>
          </Glass>
        </motion.div>

        {/* 产量 + 收获倒计时 */}
        <motion.div variants={fadeUp} className="grid grid-cols-2 gap-3.5">
          <Glass className="p-4">
            <div className="label-caps text-[10px] font-medium text-black/40">预计产量（鲜瓜）</div>
            <div className="mt-1.5 font-num text-[64px] font-bold leading-none tracking-[-0.03em] text-[#16a34a]">
              <CountUp to={8.62} decimals={2} />
            </div>
            <div className="mt-0.5 text-[10px] font-medium tracking-[0.15em] text-black/40">吨 / 亩</div>
            <div className="mt-2 text-[11px] text-black/40">
              较去年 <span className="font-medium text-[#16a34a]">↑ 12.6%</span>
            </div>
          </Glass>
          <Glass className="p-4">
            <div className="text-[11px] text-black/40">预计收获日期</div>
            <div className="mt-1 flex items-center gap-1.5 text-[15.5px] font-semibold text-[#1a2b23]">
              <CalendarDays className="h-4 w-4 text-[#16a34a]" strokeWidth={1.5} />
              2026-10-18
            </div>
            <div className="mt-2 text-[11px] text-black/40">
              还有 <span className="text-[15px] font-semibold text-[#16a34a]">{days}</span> 天
            </div>
          </Glass>
        </motion.div>

        {/* 生长曲线 */}
        <motion.div variants={fadeUp}>
          <Glass className="p-4">
            <SectionTitle
              title="作物生长曲线"
              extra={
                <span className="flex items-center gap-2.5 text-[9.5px] text-black/40">
                  <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-[#16a34a]" />今年</span>
                  <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-black/30" />去年</span>
                  <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-[#e8a04c]" />高产区平均</span>
                </span>
              }
            />
            <div className="relative">
              <svg viewBox={`0 0 ${W} ${H + 22}`} className="w-full">
                {[0, 3, 6, 9, 12].map((v) => (
                  <g key={v}>
                    <line x1="0" y1={H - (v / MAX) * (H - 8)} x2={W} y2={H - (v / MAX) * (H - 8)} stroke="rgba(0,0,0,0.06)" />
                    <text x="-2" y={H - (v / MAX) * (H - 8) + 3} textAnchor="end" fontSize="8" fill="rgba(0,0,0,0.35)">{v}</text>
                  </g>
                ))}
                <motion.path d={scalePoints(LAST_YEAR, W, H, MAX)} fill="none" stroke="rgba(0,0,0,0.25)" strokeWidth="1.5" strokeDasharray="4 4"
                  initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 1.4, delay: 0.3, ease: EASE }} />
                <motion.path d={scalePoints(HIGH_AVG, W, H, MAX)} fill="none" stroke="#e8a04c" strokeWidth="1.5"
                  initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 1.5, delay: 0.5, ease: EASE }} />
                <motion.path d={scalePoints(THIS_YEAR, W, H, MAX)} fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round"
                  initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 1.6, ease: EASE }} />
                {THIS_YEAR.map((v, i) => (
                  <motion.circle key={i} cx={(i * W) / (THIS_YEAR.length - 1)} cy={H - (v / MAX) * (H - 8)} r="3" fill="#16a34a"
                    initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.3 + i * 0.18, duration: 0.3, ease: EASE }} />
                ))}
                {STAGES.map((s, i) => (
                  <text key={s} x={(i * W) / (STAGES.length - 1)} y={H + 14} textAnchor="middle" fontSize="8.5" fill="rgba(0,0,0,0.4)">{s}</text>
                ))}
              </svg>
              {/* 预测产量标记 */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 1.6, duration: 0.5, ease: EASE }}
                className="absolute right-1 top-1 rounded-lg border border-[rgba(22,163,74,0.2)] bg-white px-2 py-1"
              >
                <div className="text-[8.5px] text-black/40">预测产量</div>
                <div className="text-[12px] font-semibold text-[#16a34a]">8.62 吨/亩</div>
              </motion.div>
            </div>
          </Glass>
        </motion.div>

        {/* 田块对比 + 天气影响 */}
        <motion.div variants={fadeUp} className="grid grid-cols-2 gap-3.5">
          <Glass className="p-3.5">
            <SectionTitle title="田块产量对比" sub="单位：吨/亩" />
            <div className="space-y-2.5">
              {BARS.map((b, i) => (
                <div key={b.name}>
                  <div className="flex items-center justify-between text-[10.5px]">
                    <span className="text-black/55">{b.name}</span>
                    <span className={`font-medium ${b.highlight ? 'text-[#16a34a]' : 'text-[#1a2b23]'}`}>{b.value}</span>
                  </div>
                  <div className="mt-1 h-1 overflow-hidden rounded-full bg-black/[0.09]">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${(b.value / 10) * 100}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.2, delay: 0.2 + i * 0.12, ease: EASE }}
                      className={`h-full rounded-full ${b.highlight ? 'bg-[#16a34a]' : 'bg-black/25'}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Glass>
          <Glass className="p-3.5">
            <SectionTitle title="天气影响分析" />
            <div className="text-[11px] text-black/40">
              影响产量 <span className="text-[14px] font-semibold text-[#e8a04c]">-3.2%</span>
            </div>
            <div className="mt-2 space-y-2">
              {WEATHER_IMPACT.map((w) => (
                <div key={w.label} className="flex items-center gap-1.5 text-[10.5px]">
                  <w.icon className="h-3.5 w-3.5 text-black/40" strokeWidth={1.5} />
                  <span className="text-black/55">{w.label}</span>
                  <span className={`ml-auto font-medium ${w.good ? 'text-[#16a34a]' : 'text-[#e8a04c]'}`}>{w.value}</span>
                </div>
              ))}
            </div>
          </Glass>
        </motion.div>

        {/* 价格趋势 + AI建议 */}
        <motion.div variants={fadeUp} className="grid grid-cols-2 gap-3.5">
          <Glass className="p-3.5">
            <SectionTitle title="价格趋势预测" sub="单位：元/吨" />
            <div className="font-num text-[24px] font-semibold tracking-[-0.02em] text-[#1a2b23]">
              <CountUp to={2850} />
            </div>
            <div className="text-[10px] text-black/40">预计收获期均价</div>
            <svg viewBox="0 0 150 58" className="mt-1.5 h-[58px] w-full">
              <DrawnLine points={[2200, 2350, 2280, 2500, 2450, 2650, 2850]} w={150} h={58} fill />
            </svg>
            <div className="mt-0.5 flex justify-between text-[9px] text-black/40">
              <span>08-01</span>
              <span>09-01</span>
              <span>10-01</span>
            </div>
          </Glass>
          <Glass className="p-3.5">
            <SectionTitle title="AI 种植建议" />
            <ul className="space-y-2.5">
              {ADVICES.map((a, i) => (
                <motion.li
                  key={a.text}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + i * 0.15, duration: 0.4, ease: EASE }}
                  className="flex items-start gap-2"
                >
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md" style={{ backgroundColor: `${a.tone}1a` }}>
                    <TrendingUp className="h-3 w-3" color={a.tone} strokeWidth={1.5} />
                  </span>
                  <div>
                    <div className="text-[11px] font-medium text-[#1a2b23]">{a.text}</div>
                    <div className="text-[9.5px] text-black/40">{a.sub}</div>
                  </div>
                </motion.li>
              ))}
            </ul>
          </Glass>
        </motion.div>

        {/* 综合分析结论 */}
        <motion.div variants={fadeUp}>
          <div className="flex items-center gap-2.5 rounded-[14px] border border-[rgba(22,163,74,0.15)] bg-[rgba(22,163,74,0.05)] p-3.5">
            <Sun className="h-4 w-4 shrink-0 text-[#16a34a]" strokeWidth={1.5} />
            <p className="text-[11.5px] leading-snug text-black/55">
              <span className="font-medium text-[#16a34a]">综合分析：</span>
              今年有望获得丰收，建议加强后期管理，确保产量目标达成
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
