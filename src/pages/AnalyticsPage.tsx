import { useMemo, useState } from 'react'
import { chartTooltip, chartColors } from '../components/chart-theme'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { PageCard, PageHeader } from '../components/bits'
import { FIELDS } from '../store'
import { useMotion } from '../components/motion-context'

type RangeKey = '3m' | '6m' | '12m'
const RANGES: { key: RangeKey; label: string; months: number; weeks: number }[] = [
  { key: '3m', label: '近 3 月', months: 3, weeks: 12 },
  { key: '6m', label: '近半年', months: 6, weeks: 26 },
  { key: '12m', label: '近一年', months: 12, weeks: 52 },
]

/* 确定性伪随机（保证同一月份数据稳定） */
function seeded(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

const MONTH_LABELS = (() => {
  const labels: string[] = []
  const now = new Date()
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    labels.push(`${d.getMonth() + 1}月`)
  }
  return labels
})()

const MONTHLY = (() => {
  const rnd = seeded(42)
  return MONTH_LABELS.map((m, i) => ({
    month: m,
    water: Math.round(2800 + rnd() * 1400 + Math.sin(i / 2) * 500),
    fertilizer: Math.round(60 + rnd() * 50 + (i > 5 ? 25 : 0)),
    completion: Math.round(68 + rnd() * 28),
  }))
})()

const WEEKLY_YIELD = (() => {
  const rnd = seeded(7)
  const arr: { week: string; yield: number }[] = []
  for (let i = 52; i >= 1; i--) {
    arr.push({ week: `W${53 - i}`, yield: Math.round(12 + rnd() * 16 + (52 - i) / 6) })
  }
  return arr
})()

const PIE_COLORS = [chartColors.green, chartColors.pale, chartColors.amber, chartColors.water, chartColors.earth]

const tooltipStyle = chartTooltip

export default function AnalyticsPage() {
  const { enabled } = useMotion()
  const [range, setRange] = useState<RangeKey>('6m')
  const months = RANGES.find((r) => r.key === range)!.months
  const weeks = RANGES.find((r) => r.key === range)!.weeks

  const monthly = useMemo(() => MONTHLY.slice(12 - months), [months])
  const weekly = useMemo(() => WEEKLY_YIELD.slice(52 - weeks), [weeks])
  const pieData = FIELDS.map((f) => ({ name: `${f.id} ${f.crop}`, value: f.area }))

  return (
    <div>
      <PageHeader
        title="数据分析"
        desc="产量、水肥与任务完成情况一览"
        extra={
          <div className="flex gap-2">
            {RANGES.map((r) => (
              <button
                key={r.key}
                onClick={() => setRange(r.key)}
                className={`rounded-lg px-3.5 py-1.5 text-[13px] transition-colors ${
                  range === r.key
                    ? 'border border-[#1fa756] bg-white font-semibold text-[#178a45]'
                    : 'border border-transparent bg-[#f2f7f4] text-[#7b9489] hover:text-[#4f6b5f]'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-5">
        {/* 产量趋势 */}
        <PageCard>
          <h3 className="mb-3 text-[15px] font-bold text-[#17352a]">产量趋势（吨 / 周）</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={weekly} margin={{ top: 5, right: 10, bottom: 0, left: -18 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8f2ec" />
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#8aa398' }} interval={Math.floor(weeks / 8)} />
              <YAxis tick={{ fontSize: 11, fill: '#8aa398' }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="yield" name="产量" stroke={chartColors.green} strokeWidth={2.5} dot={false} isAnimationActive={enabled} />
            </LineChart>
          </ResponsiveContainer>
        </PageCard>

        {/* 水肥用量对比 */}
        <PageCard>
          <h3 className="mb-3 text-[15px] font-bold text-[#17352a]">水肥用量对比</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={monthly} margin={{ top: 5, right: 10, bottom: 0, left: -18 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8f2ec" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#8aa398' }} />
              <YAxis tick={{ fontSize: 11, fill: '#8aa398' }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="water" name="灌溉用水 (m³)" fill={chartColors.water} radius={[4, 4, 0, 0]} isAnimationActive={enabled} />
              <Bar dataKey="fertilizer" name="肥料 (kg)" fill={chartColors.green} radius={[4, 4, 0, 0]} isAnimationActive={enabled} />
            </BarChart>
          </ResponsiveContainer>
        </PageCard>

        {/* 作物面积占比 */}
        <PageCard>
          <h3 className="mb-3 text-[15px] font-bold text-[#17352a]">作物面积占比（亩）</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={3}
                isAnimationActive={enabled}
                label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                fontSize={11}
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </PageCard>

        {/* 任务完成率 */}
        <PageCard>
          <h3 className="mb-3 text-[15px] font-bold text-[#17352a]">月度任务完成率（%）</h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={monthly} margin={{ top: 5, right: 10, bottom: 0, left: -18 }}>
              <defs>
                <linearGradient id="compGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={chartColors.green} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={chartColors.green} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8f2ec" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#8aa398' }} />
              <YAxis domain={[40, 100]} tick={{ fontSize: 11, fill: '#8aa398' }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="completion" name="完成率" stroke={chartColors.green} strokeWidth={2.5} fill="url(#compGrad)" isAnimationActive={enabled} />
            </AreaChart>
          </ResponsiveContainer>
        </PageCard>
      </div>
    </div>
  )
}
