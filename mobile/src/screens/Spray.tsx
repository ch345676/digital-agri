import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ChevronLeft, ChevronRight, MapPin, FlaskConical, FileText, CircleCheck, Lock,
  Droplets, Gauge, Clock, SprayCan, ClipboardList, History, CheckCircle2, Wind,
} from 'lucide-react'
import { toast } from 'sonner'
import { useStore, nowHM, type SprayRecord } from '../store'
import { usePerm } from '../auth'
import { ProCard, BlockTitle, InfoRow, StepBar, Timeline, ProPrimaryBtn, ProGhostBtn } from '../components/pro'
import { stagger, fadeUp, EASE } from '../components/anim'

/* ================= 基础数据 ================= */

const FIELDS = [
  { name: '1号南瓜田', area: 320, stage: '坐果期' },
  { name: '2号南瓜田', area: 280, stage: '开花期' },
  { name: '3号南瓜田', area: 300, stage: '伸蔓期' },
  { name: '4号南瓜田', area: 350, stage: '坐果期' },
  { name: '5号南瓜田', area: 260, stage: '开花期' },
  { name: '6号南瓜田', area: 310, stage: '坐果期' },
  { name: '7号南瓜田', area: 290, stage: '伸蔓期' },
  { name: '8号南瓜田', area: 330, stage: '膨大期' },
]

interface Pesticide {
  name: string
  target: string
  dosagePerMu: number // 克/亩
  form: string // 剂型
  dilution: string
  waterPerMu: number // 兑水 L/亩
}

const PESTICIDES: Pesticide[] = [
  { name: '醚菌酯', target: '白粉病', dosagePerMu: 25, form: '悬浮剂', dilution: '1500 倍', waterPerMu: 30 },
  { name: '70%吡虫啉', target: '蚜虫', dosagePerMu: 15, form: '可湿性粉剂', dilution: '2000 倍', waterPerMu: 25 },
  { name: '霜霉威盐酸盐', target: '霜霉病', dosagePerMu: 72, form: '水剂', dilution: '800 倍', waterPerMu: 30 },
]

const DEVICES = ['水泵', '搅拌器', '喷淋阀门', '喷头']
const SPRAY_PHOTOS = ['images/spray-1.png', 'images/spray-2.png', 'images/spray-3.png']
const TL_STEPS = ['任务接收', '开始运行', '喷淋执行', '任务完成']

function taskCode(seq: number): string {
  const d = new Date()
  const ymd = `${d.getFullYear()}${`${d.getMonth() + 1}`.padStart(2, '0')}${`${d.getDate()}`.padStart(2, '0')}`
  return `RW${ymd}${`${seq}`.padStart(2, '0')}`
}

const fmtDur = (sec: number) => `${Math.floor(sec / 60)} 分 ${sec % 60} 秒`

function SprayImg({ src, className }: { src: string; className: string }) {
  const [err, setErr] = useState(false)
  return (
    <img
      src={err ? 'images/rover-real.jpg' : src}
      onError={() => setErr(true)}
      alt="施药过程"
      className={className}
    />
  )
}

/* ================= 回传页（按 4.png 右，记录详情复用） ================= */
function Receipt({ rec, onHistory, onHome }: { rec: SprayRecord; onHistory: () => void; onHome: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: EASE }} className="space-y-3.5">
      {/* 大绿勾 */}
      <div className="flex items-center gap-3.5 rounded-[14px] bg-[rgba(21,128,61,0.07)] p-4">
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.1 }}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#15803d]"
        >
          <CircleCheck className="h-7 w-7 text-white" strokeWidth={1.8} />
        </motion.span>
        <div>
          <div className="text-[16px] font-bold text-[#17352a]">施药任务已接收并执行</div>
          <div className="mt-0.5 text-[11px] text-black/45">喷淋系统已完成本次施药任务</div>
        </div>
      </div>

      {/* 任务回传信息 */}
      <ProCard className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <BlockTitle icon={FileText} title="任务回传信息" />
            <div className="mt-1">
              <InfoRow label="任务编号">{rec.code}</InfoRow>
              <InfoRow label="地块名称">{rec.field}</InfoRow>
              <InfoRow label="开始时间">{rec.date} {rec.startedAt}</InfoRow>
              <InfoRow label="实际用时">{fmtDur(rec.durationSec)}</InfoRow>
              <InfoRow label="任务状态" divider={false}>
                <span className="font-semibold text-[#15803d]">执行完成</span>
              </InfoRow>
            </div>
          </div>
          <SprayImg src={SPRAY_PHOTOS[0]} className="h-[92px] w-[104px] shrink-0 rounded-[10px] object-cover" />
        </div>
      </ProCard>

      {/* 施药执行详情 4 格 */}
      <ProCard className="p-4">
        <BlockTitle icon={Gauge} title="施药执行详情" />
        <div className="mt-3 grid grid-cols-4 divide-x divide-black/[0.06] text-center">
          {[
            { icon: Droplets, label: '实际用水量', v: `${rec.totalWater}`, u: 'L', c: '#3b82f6' },
            { icon: FlaskConical, label: '实际用药量', v: `${rec.totalDosage}`, u: 'g', c: '#15803d' },
            { icon: Clock, label: '运行时长', v: fmtDur(rec.durationSec), u: '', c: '#ea7a24' },
            { icon: SprayCan, label: '喷淋次数', v: '3', u: '次', c: '#8b5cf6' },
          ].map((m) => (
            <div key={m.label} className="px-1">
              <m.icon className="mx-auto h-4.5 w-4.5" style={{ color: m.c }} strokeWidth={1.6} />
              <div className="mt-1 text-[9.5px] text-black/40">{m.label}</div>
              <div className="mt-0.5 font-num text-[13px] font-bold text-[#1a2b23]">
                {m.v}
                {m.u && <span className="ml-0.5 text-[9px] font-medium text-black/40">{m.u}</span>}
              </div>
            </div>
          ))}
        </div>
      </ProCard>

      {/* 设备运行状态 4 步时间线 */}
      <ProCard className="p-4">
        <BlockTitle icon={CheckCircle2} title="设备运行状态" />
        <div className="mt-4">
          <Timeline
            steps={TL_STEPS.map((label, i) => ({ label, time: i === 0 ? rec.startedAt : i === 3 ? '完成' : undefined }))}
            current={4}
          />
        </div>
      </ProCard>

      {/* 备注 */}
      <ProCard className="p-4">
        <BlockTitle icon={ClipboardList} title="备注信息" />
        <p className="mt-2 text-[11.5px] leading-relaxed text-black/55">
          本次施药过程正常，设备运行稳定，药剂喷淋均匀。{rec.field}（南瓜）{rec.target}防治，{rec.pesticide} {rec.dosagePerMu} 克/亩，共 {rec.totalDosage} 克。
        </p>
      </ProCard>

      {/* 施药过程照片 */}
      <ProCard className="p-4">
        <BlockTitle icon={FileText} title="施药过程照片" />
        <div className="mt-3 grid grid-cols-3 gap-2">
          {SPRAY_PHOTOS.map((p) => (
            <SprayImg key={p} src={p} className="h-[72px] w-full rounded-[10px] object-cover" />
          ))}
        </div>
      </ProCard>

      <div className="flex gap-3 pb-2 pt-1">
        <ProGhostBtn onClick={onHistory} className="flex-1">
          <History className="h-4 w-4" strokeWidth={1.6} />
          查看历史记录
        </ProGhostBtn>
        <ProPrimaryBtn onClick={onHome} className="flex-1">返回首页</ProPrimaryBtn>
      </div>
    </motion.div>
  )
}

/* ================= 主屏 ================= */
type View = 'wizard' | 'records' | 'receipt'

export default function Spray() {
  const { setScreen, sprayRecords, addSprayRecord } = useStore()
  const { isAdmin, needAdmin } = usePerm()
  const [view, setView] = useState<View>('wizard')
  const [step, setStep] = useState(1)
  const [fieldIdx, setFieldIdx] = useState<number | null>(null)
  const [pestIdx, setPestIdx] = useState<number | null>(null)
  const [executing, setExecuting] = useState(false)
  const [tlStep, setTlStep] = useState(0)
  const [progress, setProgress] = useState(0)
  const [receipt, setReceipt] = useState<SprayRecord | null>(null)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const field = fieldIdx !== null ? FIELDS[fieldIdx] : null
  const pest = pestIdx !== null ? PESTICIDES[pestIdx] : null
  const totalDosage = field && pest ? Math.round(pest.dosagePerMu * field.area) : 0
  const totalWater = field && pest ? Math.round(pest.waterPerMu * field.area) : 0
  const code = useMemo(() => taskCode(sprayRecords.length + 1), [sprayRecords.length])

  const confirm = () => {
    if (!field || !pest || executing) return
    if (!needAdmin()) return
    setExecuting(true)
    setStep(4)
    setTlStep(0)
    setProgress(0)
    /* 执行动画：时间线 4 步推进 + 进度条（约 6.5 秒演完） */
    const startedAt = nowHM()
    timers.current.push(setTimeout(() => setTlStep(1), 900))
    timers.current.push(setTimeout(() => setTlStep(2), 2000))
    const t0 = Date.now()
    const tick = () => {
      const p = Math.min(100, Math.round(((Date.now() - t0 - 2000) / 4000) * 100))
      setProgress(Math.max(0, p))
      if (p < 100) timers.current.push(setTimeout(tick, 100))
      else {
        setTlStep(4)
        const rec: SprayRecord = {
          id: `spray-${Date.now().toString(36)}`,
          code,
          field: field.name,
          area: field.area,
          pesticide: pest.name,
          target: pest.target,
          dosagePerMu: pest.dosagePerMu,
          totalDosage,
          dilution: pest.dilution,
          totalWater,
          durationSec: 30 * 60 + 53,
          startedAt,
          date: new Date().toISOString().slice(0, 10),
        }
        addSprayRecord(rec)
        timers.current.push(
          setTimeout(() => {
            setReceipt(rec)
            setView('receipt')
            setExecuting(false)
            toast('施药任务已完成并回传', { icon: '✅' })
          }, 800),
        )
      }
    }
    timers.current.push(setTimeout(tick, 2100))
  }

  return (
    <div className="px-4 pb-32 pt-5">
      <header className="flex items-center justify-between">
        <button onClick={() => setScreen('patrol')} className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-black/[0.08] bg-black/[0.05]">
          <ChevronLeft className="h-5 w-5 text-black/60" strokeWidth={1.5} />
        </button>
        <h1 className="text-[17px] font-semibold tracking-[-0.02em] text-[#1a2b23]">喷淋施药系统</h1>
        <button
          onClick={() => setView(view === 'records' ? 'wizard' : 'records')}
          className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-black/[0.08] bg-black/[0.05]"
          title="施药记录"
        >
          <History className="h-[18px] w-[18px] text-black/60" strokeWidth={1.5} />
        </button>
      </header>

      <AnimatePresence mode="wait"><motion.div key={view} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: .18 }}>
      {view === 'receipt' && receipt ? (
        <div className="mt-4">
          <Receipt rec={receipt} onHistory={() => setView('records')} onHome={() => setScreen('overview')} />
        </div>
      ) : view === 'records' ? (
        /* ================= 施药记录列表 ================= */
        <motion.div variants={stagger} initial="hidden" animate="show" className="mt-4 space-y-3">
          {!isAdmin && (
            <motion.div variants={fadeUp} className="rounded-[12px] border border-black/[0.07] bg-white px-3.5 py-2.5 text-[11px] text-black/45">
              普通用户可查看施药记录，发起施药需管理员权限
            </motion.div>
          )}
          {sprayRecords.length === 0 && (
            <motion.div variants={fadeUp}>
              <ProCard className="p-8 text-center">
                <SprayCan className="mx-auto h-8 w-8 text-black/20" strokeWidth={1.4} />
                <p className="mt-2 text-[12px] text-black/40">暂无施药记录</p>
                <ProPrimaryBtn onClick={() => setView('wizard')} className="mx-auto mt-4 px-6">发起施药</ProPrimaryBtn>
              </ProCard>
            </motion.div>
          )}
          {sprayRecords.map((r) => (
            <motion.button
              key={r.id}
              variants={fadeUp}
              onClick={() => {
                setReceipt(r)
                setView('receipt')
              }}
              className="block w-full rounded-[14px] border border-black/[0.07] bg-white p-3.5 text-left shadow-[0_1px_2px_rgba(16,24,40,0.04)]"
            >
              <div className="flex items-center justify-between">
                <span className="font-num text-[13px] font-bold text-[#1a2b23]">{r.code}</span>
                <span className="flex items-center gap-1 rounded-md bg-[rgba(21,128,61,0.08)] px-2 py-0.5 text-[10px] font-semibold text-[#15803d]">
                  <CircleCheck className="h-3 w-3" strokeWidth={2} />
                  执行完成
                </span>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-black/50">
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" strokeWidth={1.6} />{r.field} · {r.area}亩</span>
                <span className="flex items-center gap-1"><FlaskConical className="h-3 w-3" strokeWidth={1.6} />{r.pesticide}（治{r.target}）</span>
                <span className="flex items-center gap-1"><Droplets className="h-3 w-3" strokeWidth={1.6} />用药 {r.totalDosage}g · 兑水 {r.totalWater}L</span>
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" strokeWidth={1.6} />{fmtDur(r.durationSec)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-black/[0.05] pt-2 text-[10.5px] text-black/40">
                <span className="font-num">{r.date} {r.startedAt}</span>
                <span className="flex items-center">回传详情 <ChevronRight className="h-3 w-3" strokeWidth={1.6} /></span>
              </div>
            </motion.button>
          ))}
        </motion.div>
      ) : (
        /* ================= 4 步向导 ================= */
        <div className="mt-4">
          <ProCard className="px-3 py-4">
            <StepBar steps={['选择地块', '施药方案', '确认施药', '施药完成']} current={step} />
          </ProCard>

          <AnimatePresence mode="wait">
            {/* ---------- 第 1 步：选择地块 ---------- */}
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.25, ease: EASE }} className="mt-4">
                <BlockTitle icon={MapPin} title="选择施药地块" />
                <div className="mt-3 grid grid-cols-2 gap-2.5">
                  {FIELDS.map((f, i) => (
                    <button
                      key={f.name}
                      onClick={() => setFieldIdx(i)}
                      className={`rounded-[12px] border p-3.5 text-left transition-colors ${
                        fieldIdx === i ? 'border-[#15803d] bg-[rgba(21,128,61,0.06)]' : 'border-black/[0.08] bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[13.5px] font-bold text-[#1a2b23]">{f.name}</span>
                        {fieldIdx === i && <CircleCheck className="h-4 w-4 text-[#15803d]" strokeWidth={2} />}
                      </div>
                      <div className="mt-1.5 text-[11px] text-black/45">
                        南瓜 · {f.stage} · <span className="font-num font-semibold text-[#1a2b23]">{f.area}</span> 亩
                      </div>
                    </button>
                  ))}
                </div>
                <ProPrimaryBtn onClick={() => fieldIdx !== null && setStep(2)} disabled={fieldIdx === null} className="mt-4 w-full">
                  下一步 · 施药方案
                </ProPrimaryBtn>
              </motion.div>
            )}

            {/* ---------- 第 2 步：施药方案 ---------- */}
            {step === 2 && field && (
              <motion.div key="s2" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.25, ease: EASE }} className="mt-4">
                <BlockTitle icon={FlaskConical} title="选择药剂方案" extra={<span className="text-[10.5px] text-black/40">{field.name} · {field.area}亩</span>} />
                <div className="mt-3 space-y-2.5">
                  {PESTICIDES.map((p, i) => (
                    <button
                      key={p.name}
                      onClick={() => setPestIdx(i)}
                      className={`block w-full rounded-[12px] border p-3.5 text-left transition-colors ${
                        pestIdx === i ? 'border-[#15803d] bg-[rgba(21,128,61,0.06)]' : 'border-black/[0.08] bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[13.5px] font-bold text-[#1a2b23]">{p.name}</span>
                        <span className="rounded-md bg-[rgba(220,38,38,0.07)] px-2 py-0.5 text-[10px] font-medium text-[#dc2626]">防治{p.target}</span>
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[10.5px] text-black/45">
                        <span>{p.form}</span>
                        <span>稀释 {p.dilution}</span>
                        <span className="font-num font-semibold text-[#15803d]">{p.dosagePerMu} 克/亩</span>
                      </div>
                      {pestIdx === i && (
                        <div className="mt-2 flex gap-4 rounded-[8px] bg-white/80 px-3 py-2 text-[11px]">
                          <span className="text-black/50">总用药量 <span className="font-num font-bold text-[#1a2b23]">{Math.round(p.dosagePerMu * field.area)} g</span></span>
                          <span className="text-black/50">总兑水量 <span className="font-num font-bold text-[#1a2b23]">{Math.round(p.waterPerMu * field.area)} L</span></span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                <div className="mt-4 flex gap-3">
                  <ProGhostBtn onClick={() => setStep(1)} className="flex-1">上一步</ProGhostBtn>
                  <ProPrimaryBtn onClick={() => pestIdx !== null && setStep(3)} disabled={pestIdx === null} className="flex-1">
                    下一步 · 确认施药
                  </ProPrimaryBtn>
                </div>
              </motion.div>
            )}

            {/* ---------- 第 3 步：确认施药（按 4.png 左） ---------- */}
            {step === 3 && field && pest && (
              <motion.div key="s3" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.25, ease: EASE }} className="mt-4 space-y-3">
                <div className="rounded-[10px] border border-[rgba(21,128,61,0.2)] bg-[rgba(21,128,61,0.06)] px-3.5 py-2.5 text-[11.5px] text-[#15803d]">
                  ✓ 请确认以下施药任务信息，确认后将下发到喷淋系统
                </div>

                <ProCard className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <BlockTitle icon={FileText} title="施药任务信息" />
                      <div className="mt-1">
                        <InfoRow label="任务编号"><span className="font-num">{code}</span></InfoRow>
                        <InfoRow label="地块名称">{field.name}</InfoRow>
                        <InfoRow label="作物类型">南瓜（{field.stage}）</InfoRow>
                        <InfoRow label="施药方案">南瓜{pest.target}防治方案</InfoRow>
                        <InfoRow label="计划时间">{new Date().toISOString().slice(0, 10)} {nowHM()}</InfoRow>
                        <InfoRow label="预计用时" divider={false}>30 分钟</InfoRow>
                      </div>
                    </div>
                    <SprayImg src={SPRAY_PHOTOS[1]} className="h-[88px] w-[96px] shrink-0 rounded-[10px] object-cover" />
                  </div>
                </ProCard>

                <ProCard className="p-4">
                  <BlockTitle icon={FlaskConical} title="药剂信息" />
                  <div className="mt-1">
                    <InfoRow label="药剂名称">{pest.name}</InfoRow>
                    <InfoRow label="剂型">{pest.form}</InfoRow>
                    <InfoRow label="稀释倍数">{pest.dilution}</InfoRow>
                    <InfoRow label="每亩用量">{pest.dosagePerMu} 克</InfoRow>
                    <InfoRow label="总用药量"><span className="font-num">{totalDosage} g（{field.area} 亩）</span></InfoRow>
                    <InfoRow label="总用水量" divider={false}><span className="font-num">{totalWater} L</span></InfoRow>
                  </div>
                </ProCard>

                <ProCard className="p-4">
                  <BlockTitle icon={Wind} title="环境条件" />
                  <div className="mt-3 grid grid-cols-4 divide-x divide-black/[0.06] text-center">
                    {[
                      ['温度', '24.6 ℃'], ['湿度', '68 %'], ['光照', '中等'], ['风速', '1.2 m/s'],
                    ].map(([l, v]) => (
                      <div key={l}>
                        <div className="text-[10px] text-black/40">{l}</div>
                        <div className="mt-0.5 font-num text-[13.5px] font-bold text-[#1a2b23]">{v}</div>
                      </div>
                    ))}
                  </div>
                </ProCard>

                <ProCard className="p-4">
                  <BlockTitle icon={Gauge} title="设备状态" extra={<span className="flex items-center gap-1 text-[10.5px] font-medium text-[#15803d]"><span className="h-1.5 w-1.5 rounded-full bg-[#15803d]" />设备正常</span>} />
                  <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5">
                    {DEVICES.map((d) => (
                      <div key={d} className="flex items-center justify-between rounded-[10px] bg-black/[0.03] px-3 py-2.5">
                        <span className="text-[12px] font-medium text-[#1a2b23]">{d}</span>
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-[#15803d]">
                          <CircleCheck className="h-3.5 w-3.5" strokeWidth={2} />
                          正常
                        </span>
                      </div>
                    ))}
                  </div>
                </ProCard>

                <p className="flex items-center gap-1 px-1 text-[10px] text-black/35">ⓘ 确认后，系统将自动执行喷淋施药任务</p>
                <div className="flex gap-3 pb-2">
                  <ProGhostBtn onClick={() => setStep(2)} className="flex-1">取消</ProGhostBtn>
                  <ProPrimaryBtn onClick={confirm} className="flex-[2]">
                    {!isAdmin && <Lock className="h-4 w-4" strokeWidth={2} />}
                    确认施药
                  </ProPrimaryBtn>
                </div>
              </motion.div>
            )}

            {/* ---------- 第 4 步：执行动画 ---------- */}
            {step === 4 && field && pest && (
              <motion.div key="s4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 space-y-3.5">
                <ProCard className="p-5 text-center">
                  <motion.div
                    animate={{ rotate: tlStep >= 2 && tlStep < 4 ? 360 : 0 }}
                    transition={{ repeat: tlStep >= 2 && tlStep < 4 ? Infinity : 0, duration: 1.6, ease: 'linear' }}
                    className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[rgba(21,128,61,0.09)]"
                  >
                    <SprayCan className="h-7 w-7 text-[#15803d]" strokeWidth={1.6} />
                  </motion.div>
                  <div className="mt-3 text-[15px] font-bold text-[#1a2b23]">
                    {tlStep < 2 ? '正在下发施药任务…' : tlStep < 4 ? '喷淋施药执行中…' : '任务完成'}
                  </div>
                  <div className="mt-1 text-[11px] text-black/40">{code} · {field.name} · {pest.name}</div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-black/[0.07]">
                    <motion.div className="h-full rounded-full bg-[#15803d]" animate={{ width: `${progress}%` }} transition={{ duration: 0.15 }} />
                  </div>
                  <div className="mt-1.5 font-num text-[11px] font-semibold text-[#15803d]">{progress}%</div>
                </ProCard>

                <ProCard className="p-4">
                  <BlockTitle icon={CheckCircle2} title="设备运行状态" />
                  <div className="mt-4">
                    <Timeline steps={TL_STEPS.map((label) => ({ label }))} current={tlStep} />
                  </div>
                </ProCard>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
      </motion.div></AnimatePresence>
    </div>
  )
}
