import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ScanLine, ChevronRight, ChevronDown, Bell, ShieldAlert, Bug, FileText, ClipboardList,
  Leaf, FlaskConical, SprayCan, CloudSun, MapPin, Thermometer, Droplets, Wheat, Database,
  AlertTriangle, CircleCheck, ChevronLeft,
} from 'lucide-react'
import { useStore } from '../store'
import { ALERT_DEFS, patrolToAlert, pestTrend, envTrend, type AlertDef } from '../lib/alerts'
import { ProCard, BlockTitle, InfoRow, StatBar, RiskBadge, RISK, type RiskLevel } from '../components/pro'
import { stagger, fadeUp, EASE, CountUp } from '../components/anim'

/* ================= 趋势折线图（SVG，与全站风格一致） ================= */
function TrendChart({ data, unit, color = '#15803d' }: { data: number[]; unit: string; color?: string }) {
  const W = 300
  const H = 110
  const max = Math.max(...data) * 1.15
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * W},${H - 14 - (v / max) * (H - 34)}`)
  const area = `0,${H - 14} ${pts.join(' ')} ${W},${H - 14}`
  const last = pts[pts.length - 1].split(',').map(Number)
  return (
    <div>
      <div className="flex items-center gap-1.5 text-[10px] text-black/40">
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
        {unit}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-1 w-full">
        {[0.25, 0.5, 0.75].map((t) => (
          <line key={t} x1="0" x2={W} y1={(H - 14) * t} y2={(H - 14) * t} stroke="rgba(0,0,0,0.05)" strokeWidth="1" />
        ))}
        <polygon points={area} fill={color} opacity="0.07" />
        <motion.polyline key={data.length + unit} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6, ease: EASE }} points={pts.join(' ')} fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
        {pts.map((p, i) => {
          const [x, y] = p.split(',').map(Number)
          return <circle key={i} cx={x} cy={y} r={i === pts.length - 1 ? 3 : 1.6} fill="#fff" stroke={color} strokeWidth="1.4" />
        })}
        <rect x={Math.min(last[0] + 4, W - 64)} y={last[1] - 12} rx="4" width="62" height="16" fill={color} />
        <text x={Math.min(last[0] + 4, W - 64) + 31} y={last[1]} textAnchor="middle" fontSize="9" fill="#fff" fontWeight="600">
          {data[data.length - 1]} {unit}
        </text>
      </svg>
    </div>
  )
}

/* ================= 预警详情 ================= */
function AlertDetail({ alert, acked, onAck, onBack }: { alert: AlertDef; acked: boolean; onAck: () => void; onBack: () => void }) {
  const [trendTab, setTrendTab] = useState<'pest' | 'env'>('pest')
  const [days, setDays] = useState<7 | 15 | 30>(7)
  const [openCtl, setOpenCtl] = useState<number>(0)
  const risk = RISK[alert.level]
  const trend = useMemo(
    () => (trendTab === 'pest' ? pestTrend(alert.id, days, alert.trendBase) : envTrend(alert.id, days)),
    [alert.id, days, trendTab, alert.trendBase],
  )
  const ctlIcons = [Leaf, SprayCan, FlaskConical]

  return (
    <div className="pb-32">
      {/* hero（按 2.png：棚切换条 + 图 + 圆形照片 + 徽章） */}
      <div className="relative h-[190px] overflow-hidden">
        <img src="images/hero-field.jpg" alt="田块" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(6,9,6,0.5) 0%, rgba(6,9,6,0.2) 45%, rgba(6,9,6,0.85) 100%)' }} />
        <div className="relative flex items-center justify-between px-4 pt-2">
          <button onClick={onBack} className="flex h-8 w-8 items-center justify-center rounded-[10px] border border-white/20 bg-black/25 text-white/85">
            <ChevronLeft className="h-4.5 w-4.5" strokeWidth={1.6} />
          </button>
          <span className="flex items-center gap-1 rounded-full border border-white/20 bg-black/25 px-3 py-1.5 text-[11.5px] font-medium text-white backdrop-blur-sm">
            <MapPin className="h-3 w-3" strokeWidth={1.6} />
            {alert.field}
            <ChevronDown className="h-3 w-3 text-white/50" strokeWidth={1.6} />
          </span>
          <span className="w-8" />
        </div>
        <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <RiskBadge level={alert.level} />
              <span className="text-[20px] font-bold text-white">{alert.name}</span>
            </div>
            <div className="mt-1 text-[10.5px] text-white/65">预警时间：{alert.time}</div>
            <div className="mt-1.5 rounded-[8px] bg-black/30 px-2.5 py-1.5 text-[10px] leading-snug text-white/80 backdrop-blur-sm">
              当前田间{alert.kind === 'pest' ? '虫害' : '病害'}发生风险{risk.label.slice(0, 1)}等，建议及时采取防治措施，避免{alert.kind === 'pest' ? '虫害' : '病害'}扩散。
            </div>
          </div>
          <div className="relative ml-3 shrink-0">
            <img src="images/leaf-disease.jpg" alt={alert.name} className="h-[72px] w-[72px] rounded-full border-[3px] border-white/85 object-cover shadow-lg" />
            <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full" style={{ background: risk.color }}>
              <AlertTriangle className="h-3 w-3 text-white" strokeWidth={2} />
            </span>
          </div>
        </div>
      </div>

      <motion.div variants={stagger} initial="hidden" animate="show" className="mt-3 space-y-3 px-4">
        {/* 风险大卡（按 1.png：4 指标） */}
        <motion.div variants={fadeUp}>
          <div className="rounded-[14px] border p-4" style={{ background: risk.bg, borderColor: risk.border }}>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[15px] font-bold" style={{ color: risk.color }}>
                <AlertTriangle className="h-4.5 w-4.5" strokeWidth={1.8} />
                {risk.label}预警
              </span>
              <span className="text-[10px] text-black/40">{alert.time} 发布</span>
            </div>
            <div className="mt-1.5 text-[13px] font-semibold text-[#1a2b23]">检测到 {alert.typeLabel} {risk.label}</div>
            <p className="mt-1 text-[11px] leading-snug text-black/50">当前田间环境条件适宜{alert.kind === 'pest' ? '虫害' : '病害'}发生和扩散，请及时采取防控措施！</p>
            <div className="mt-3 grid grid-cols-4 divide-x divide-black/[0.06] rounded-[10px] bg-white/70 py-2.5 text-center">
              {[
                { label: '风险等级', v: risk.label, c: risk.color },
                { label: alert.kind === 'pest' ? '发生概率' : '发病概率', v: `${alert.prob}%`, c: risk.color },
                { label: '适宜温度', v: alert.tempRange },
                { label: '适宜湿度', v: alert.humidityRange },
              ].map((m) => (
                <div key={m.label}>
                  <div className="text-[9.5px] text-black/40">{m.label}</div>
                  <div className="mt-0.5 text-[13px] font-bold" style={{ color: m.c ?? '#1a2b23' }}>{m.v}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* 5 格统计条（按 2.png） */}
        <motion.div variants={fadeUp}>
          <ProCard>
            <StatBar
              items={[
                { icon: Wheat, label: '作物', value: '南瓜' },
                { icon: MapPin, label: '田内位置', value: alert.position },
                { icon: Thermometer, label: '田内温度', value: alert.tempNow },
                { icon: Droplets, label: '田内湿度', value: alert.humidityNow },
                { icon: Database, label: '数据来源', value: alert.source.includes('测报') ? '虫情测报' : '智能监测' },
              ]}
            />
          </ProCard>
        </motion.div>

        {/* 预警信息 2x2 网格（按 2.png） */}
        <motion.div variants={fadeUp}>
          <ProCard className="p-4">
            <BlockTitle icon={FileText} title="预警信息" />
            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3">
              <div>
                <div className="text-[10px] text-black/40">发生程度</div>
                <div className="mt-1"><RiskBadge level={alert.level} large /></div>
              </div>
              <div>
                <div className="text-[10px] text-black/40">{alert.densityLabel}</div>
                <div className="mt-1 font-num text-[16px] font-bold" style={{ color: risk.color }}>{alert.densityValue}</div>
              </div>
              <div>
                <div className="text-[10px] text-black/40">预测发生高峰期</div>
                <div className="mt-1 text-[12px] font-semibold text-[#1a2b23]">{alert.peak}</div>
              </div>
              <div>
                <div className="text-[10px] text-black/40">较昨日变化</div>
                <div className="mt-1 font-num text-[16px] font-bold" style={{ color: risk.color }}>ⓘ {alert.dayChange}</div>
              </div>
            </div>
          </ProCard>
        </motion.div>

        {/* 预警详情信息表（按 1.png） */}
        <motion.div variants={fadeUp}>
          <ProCard className="p-4">
            <BlockTitle icon={ClipboardList} title="预警详情" />
            <div className="mt-2">
              <InfoRow label={alert.kind === 'pest' ? '害虫类型' : '病害类型'}>{alert.typeLabel}</InfoRow>
              <InfoRow label="预警等级"><RiskBadge level={alert.level} /></InfoRow>
              <InfoRow label="发生概率">{alert.prob}%</InfoRow>
              <InfoRow label="预警依据">{alert.basis}</InfoRow>
              <InfoRow label="当前环境">{alert.envNow}</InfoRow>
              <InfoRow label="建议关注时间" divider={false}>{alert.focusDays}</InfoRow>
            </div>
          </ProCard>
        </motion.div>

        {/* 病害/虫害详情（按 2.png） */}
        <motion.div variants={fadeUp}>
          <ProCard className="p-4">
            <BlockTitle icon={alert.kind === 'pest' ? Bug : ShieldAlert} title={alert.kind === 'pest' ? '虫害详情' : '病害详情'} />
            <div className="mt-3 flex gap-3">
              <img src="images/leaf-disease.jpg" alt="" className="h-[76px] w-[86px] shrink-0 rounded-[10px] object-cover" />
              <div className="min-w-0 flex-1">
                <div className="text-[12px] font-semibold text-[#1a2b23]">{alert.detailName}</div>
                <div className="mt-1 text-[11px] text-black/45">危害作物：{alert.hosts}</div>
                <p className="mt-1.5 text-[11px] leading-snug text-black/55">{alert.symptom}</p>
              </div>
            </div>
          </ProCard>
        </motion.div>

        {/* 趋势分析（双 Tab + 7/15/30 天） */}
        <motion.div variants={fadeUp}>
          <ProCard className="p-4">
            <BlockTitle icon={CloudSun} title="趋势分析" />
            <div className="mt-3 flex items-center justify-between">
              <div className="flex rounded-full border border-black/[0.08] bg-black/[0.04] p-0.5">
                {([
                  ['pest', `${alert.trendName}趋势`],
                  ['env', '环境因素趋势'],
                ] as const).map(([k, label]) => (
                  <button
                    key={k}
                    onClick={() => setTrendTab(k)}
                    className={`rounded-full px-3 py-1 text-[11px] font-medium ${trendTab === k ? 'bg-[#15803d] text-white' : 'text-black/45'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="flex gap-1">
                {([7, 15, 30] as const).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDays(d)}
                    className={`rounded-md px-2 py-1 text-[10.5px] font-medium ${days === d ? 'border border-[#15803d] text-[#15803d]' : 'text-black/40'}`}
                  >
                    {d}天
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-2">
              <TrendChart
                data={trend}
                unit={trendTab === 'pest' ? `${alert.trendName}（${alert.trendUnit}）` : '湿度（%）'}
                color={trendTab === 'pest' ? '#15803d' : '#3b82f6'}
              />
            </div>
          </ProCard>
        </motion.div>

        {/* 防治建议（三类可展开，内嵌编号列表） */}
        <motion.div variants={fadeUp}>
          <ProCard className="p-4">
            <BlockTitle icon={ClipboardList} title="防治建议" />
            <div className="mt-2 divide-y divide-black/[0.05]">
              {alert.control.map((c, i) => {
                const Icon = ctlIcons[i] ?? Leaf
                const open = openCtl === i
                return (
                  <div key={c.title}>
                    <button onClick={() => setOpenCtl(open ? -1 : i)} className="flex w-full items-center gap-2.5 py-3 text-left">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[rgba(21,128,61,0.09)]">
                        <Icon className="h-4 w-4 text-[#15803d]" strokeWidth={1.6} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[12.5px] font-semibold text-[#1a2b23]">{c.title}</span>
                        {!open && <span className="mt-0.5 block truncate text-[10.5px] text-black/40">{c.items[0]}</span>}
                      </span>
                      <ChevronRight className={`h-4 w-4 shrink-0 text-black/30 transition-transform ${open ? 'rotate-90' : ''}`} strokeWidth={1.6} />
                    </button>
                    <AnimatePresence>
                      {open && (
                        <motion.ol
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: EASE }}
                          className="overflow-hidden pb-3 pl-10"
                        >
                          {c.items.map((it, j) => (
                            <li key={j} className="mt-1 flex gap-2 text-[11.5px] leading-relaxed text-black/60">
                              <span className="font-num font-semibold text-[#15803d]">{j + 1}.</span>
                              {it}
                            </li>
                          ))}
                        </motion.ol>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
            </div>
          </ProCard>
        </motion.div>

        {/* 环境趋势（未来 3 天，按 1.png） */}
        <motion.div variants={fadeUp}>
          <ProCard className="p-4">
            <BlockTitle icon={CloudSun} title="环境趋势（未来 3 天）" extra={<span className="text-[9.5px] text-black/35">— 温度(℃)　— 湿度(%)</span>} />
            <div className="mt-3 grid grid-cols-3 divide-x divide-black/[0.06] text-center">
              {[
                ['09-14 今天', '22~24℃', '85~95%'],
                ['09-15 明天', '21~23℃', '80~90%'],
                ['09-16 后天', '20~24℃', '75~85%'],
              ].map(([d, t, h]) => (
                <div key={d} className="px-1">
                  <div className="text-[11px] font-semibold text-[#1a2b23]">{d}</div>
                  <div className="mt-1.5 flex items-center justify-center gap-1 text-[11px] text-black/55">
                    <CloudSun className="h-3.5 w-3.5 text-[#3b82f6]" strokeWidth={1.6} />
                    {t}
                  </div>
                  <div className="mt-0.5 font-num text-[11px] font-semibold text-[#15803d]">{h}</div>
                </div>
              ))}
            </div>
          </ProCard>
        </motion.div>

        <p className="px-2 text-center text-[9.5px] text-black/30">ⓘ 以上预警信息由智能监测系统提供，仅供参考，请结合实际情况采取防治措施。</p>
      </motion.div>

      {/* 吸底：我已知晓 */}
      <div className="fixed bottom-[86px] left-1/2 z-30 w-full max-w-[420px] center-x px-4">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={onAck}
          disabled={acked}
          className={`flex w-full items-center justify-center gap-2 rounded-[13px] py-3.5 text-[15px] font-semibold text-white ${acked ? 'bg-black/25' : 'bg-[#15803d]'}`}
        >
          <CircleCheck className="h-5 w-5" strokeWidth={1.6} />
          {acked ? '已知晓' : '我已知晓'}
        </motion.button>
      </div>
    </div>
  )
}

/* ================= 预警列表 ================= */
const LEVEL_ORDER: Record<RiskLevel, number> = { high: 0, mid: 1, low: 2 }

export default function Alerts() {
  const { setScreen, patrolAlerts, ackAlerts, ackAlert } = useStore()
  const [selected, setSelected] = useState<AlertDef | null>(null)

  const list = useMemo(() => {
    const confirmed = patrolAlerts.filter((a) => a.status === '已确认').map(patrolToAlert)
    return [...confirmed, ...ALERT_DEFS].sort((a, b) => {
      const ackA = ackAlerts.includes(a.id) ? 1 : 0
      const ackB = ackAlerts.includes(b.id) ? 1 : 0
      if (ackA !== ackB) return ackA - ackB
      return LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level]
    })
  }, [patrolAlerts, ackAlerts])

  const unread = list.filter((a) => !ackAlerts.includes(a.id)).length

  return <AnimatePresence mode="wait" onExitComplete={() => window.scrollTo({ top: 0, behavior: 'instant' })}>{selected ? (
    <motion.div key="detail" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: .16 }}>
      <AlertDetail
        alert={selected}
        acked={ackAlerts.includes(selected.id)}
        onAck={() => {
          ackAlert(selected.id)
          setSelected(null)
        }}
        onBack={() => setSelected(null)}
      />
    </motion.div>
  ) : (
    <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: .16 }} className="px-4 pb-32 pt-5">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-[19px] font-semibold tracking-[-0.02em] text-[#1a2b23]">病虫害预警</h1>
          <p className="mt-0.5 text-[11px] text-black/40">
            {unread > 0 ? `${unread} 条待处理预警` : '全部预警已知晓'}
          </p>
        </div>
        <button
          onClick={() => setScreen('identify')}
          className="flex items-center gap-1.5 rounded-[10px] border border-[rgba(21,128,61,0.3)] bg-[rgba(21,128,61,0.06)] px-3 py-2 text-[11.5px] font-medium text-[#15803d]"
        >
          <ScanLine className="h-4 w-4" strokeWidth={1.6} />
          拍照识别
        </button>
      </header>

      <section className="alert-summary" aria-label="预警概况">
        <div className="summary-eyebrow">FIELD HEALTH / 田间健康</div>
        <div className="summary-main"><div><strong><CountUp to={unread} /></strong><p>条预警，等待你的关注</p></div><span className="summary-chip">{unread ? '及时关注 · 从容应对' : '全部已知晓'}</span></div>
        <div className="summary-foot"><span>让每一片新绿，都被悉心照料。</span><div className="summary-bars" aria-hidden="true">{[10,17,12,22,16,24,18,13,20,15].map((h,i)=><i key={i} style={{height:h,animationDelay:`${i*35}ms`}} />)}</div></div>
      </section>
      <motion.div variants={stagger} initial="hidden" animate="show" className="mt-4 space-y-3">
        {list.map((a) => {
          const acked = ackAlerts.includes(a.id)
          const risk = RISK[a.level]
          return (
            <motion.button
              key={a.id}
              layout="position"
              variants={fadeUp}
              onClick={() => setSelected(a)}
              className={`alert-card block w-full overflow-hidden rounded-[14px] border bg-white text-left shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition-opacity ${acked ? 'opacity-60' : ''}`}
              style={{ borderColor: acked ? 'rgba(0,0,0,0.07)' : risk.border }}
            >
              <div className="flex">
                <span className="w-1 shrink-0" style={{ background: acked ? 'rgba(0,0,0,0.15)' : risk.color }} />
                <div className="min-w-0 flex-1 p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px]" style={{ background: risk.bg }}>
                        {a.kind === 'pest' ? (
                          <Bug className="h-4 w-4" style={{ color: risk.color }} strokeWidth={1.6} />
                        ) : (
                          <ShieldAlert className="h-4 w-4" style={{ color: risk.color }} strokeWidth={1.6} />
                        )}
                      </span>
                      <span className="truncate text-[14.5px] font-bold text-[#1a2b23]">
                        {a.name}
                        {a.fromPatrol && <span className="ml-1.5 rounded bg-[rgba(59,130,246,0.1)] px-1.5 py-0.5 text-[9px] font-medium text-[#3b82f6]">巡检上报</span>}
                      </span>
                      <RiskBadge level={a.level} />
                    </div>
                    {acked ? (
                      <span className="flex shrink-0 items-center gap-1 text-[10px] text-black/35">
                        <CircleCheck className="h-3.5 w-3.5" strokeWidth={1.6} />
                        已知晓
                      </span>
                    ) : (
                      <span className="flex shrink-0 items-center gap-1.5 text-[10px] font-medium" style={{ color: risk.color }}>
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: risk.color }} />
                        未读
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex items-center gap-3 text-[11px] text-black/45">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" strokeWidth={1.6} />
                      {a.field}
                    </span>
                    <span className="font-num">{a.time}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between border-t border-black/[0.05] pt-2">
                    <span className="text-[10.5px] text-black/40">
                      {a.kind === 'pest' ? '发生概率' : '发病概率'} <span className="font-num font-bold" style={{ color: acked ? 'rgba(0,0,0,0.4)' : risk.color }}>{a.prob}%</span>
                    </span>
                    <span className="flex items-center text-[10.5px] text-black/40">
                      查看详情 <ChevronRight className="h-3 w-3" strokeWidth={1.6} />
                    </span>
                  </div>
                </div>
              </div>
            </motion.button>
          )
        })}
      </motion.div>

      {/* 监测说明 */}
      <div className="mt-4 flex items-center gap-3 rounded-[12px] border border-black/[0.06] bg-white px-3.5 py-3">
        <span className="flex items-center gap-1.5 text-[10.5px] text-black/45">
          <Bell className="h-3.5 w-3.5" strokeWidth={1.6} />
          预警数据为演示，请结合田间实际情况判断。
        </span>

      </div>
    </motion.div>
  )}</AnimatePresence>
}
