import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Check, type LucideIcon } from 'lucide-react'

/* ================= 专业绿白农企风 设计组件 =================
   主色 #15803d（沉稳深绿），风险色 红/橙/黄绿 分级 */

export const PRO_GREEN = '#15803d'
export const RISK = {
  high: { label: '高风险', color: '#dc2626', bg: 'rgba(220,38,38,0.08)', border: 'rgba(220,38,38,0.22)' },
  mid: { label: '中风险', color: '#ea7a24', bg: 'rgba(234,122,36,0.08)', border: 'rgba(234,122,36,0.25)' },
  low: { label: '低风险', color: '#65a30d', bg: 'rgba(101,163,13,0.09)', border: 'rgba(101,163,13,0.25)' },
} as const
export type RiskLevel = keyof typeof RISK

/** 卡片（白底细边轻投影，同 Glass 但 pro 命名） */
export function ProCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`surface-card ${className}`}
    >
      {children}
    </div>
  )
}

/** 区块标题：左侧绿色方块小图标 + 标题 */
export function BlockTitle({ icon: Icon, title, extra }: { icon: LucideIcon; title: string; extra?: ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="flex h-[18px] w-[18px] items-center justify-center rounded-[5px] bg-[#15803d]">
          <Icon className="h-3 w-3 text-white" strokeWidth={2} />
        </span>
        <span className="text-[14.5px] font-bold text-[#17352a]">{title}</span>
      </div>
      {extra}
    </div>
  )
}

/** label(灰)/value(深) 信息表行 */
export function InfoRow({ label, children, divider = true }: { label: string; children: ReactNode; divider?: boolean }) {
  return (
    <div className={`flex items-start gap-4 py-2.5 ${divider ? 'border-b border-black/[0.05]' : ''}`}>
      <span className="w-[76px] shrink-0 text-[12px] leading-5 text-black/40">{label}</span>
      <span className="min-w-0 flex-1 text-[12.5px] font-medium leading-5 text-[#1a2b23]">{children}</span>
    </div>
  )
}

/** 统计条：N 格（图标+大数字+单位+label） */
export function StatBar({
  items,
  cols,
}: {
  items: { icon?: LucideIcon; label: string; value: string; unit?: string; color?: string }[]
  cols?: number
}) {
  return (
    <div
      className="grid divide-x divide-black/[0.06]"
      style={{ gridTemplateColumns: `repeat(${cols ?? items.length}, minmax(0,1fr))` }}
    >
      {items.map((it, i) => (
        <div key={i} className="flex flex-col items-center gap-0.5 px-1 py-3 text-center">
          {it.icon && <it.icon className="mb-0.5 h-4 w-4 text-black/35" strokeWidth={1.6} />}
          <span className="text-[10px] text-black/40">{it.label}</span>
          <span className="font-num text-[16px] font-bold leading-tight" style={{ color: it.color ?? '#1a2b23' }}>
            {it.value}
            {it.unit && <span className="ml-0.5 text-[10px] font-medium text-black/40">{it.unit}</span>}
          </span>
        </div>
      ))}
    </div>
  )
}

/** 顶部步骤条（1→2→3→4） */
export function StepBar({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="flex items-start justify-between px-2">
      {steps.map((s, i) => {
        const n = i + 1
        const done = n < current
        const active = n === current
        return (
          <div key={s} className="relative flex flex-1 flex-col items-center">
            {i > 0 && (
              <span
                className="absolute left-[-50%] right-[50%] top-[13px] h-[2px]"
                style={{ background: done || active ? '#15803d' : 'rgba(0,0,0,0.08)' }}
              />
            )}
            <span
              className="relative z-10 flex h-[26px] w-[26px] items-center justify-center rounded-full text-[12px] font-bold"
              style={{
                background: done || active ? '#15803d' : 'rgba(0,0,0,0.06)',
                color: done || active ? '#fff' : 'rgba(0,0,0,0.35)',
              }}
            >
              {done ? <Check className="h-3.5 w-3.5" strokeWidth={2.5} /> : n}
            </span>
            <span
              className="mt-1.5 text-[10.5px] font-medium"
              style={{ color: active ? '#15803d' : done ? '#1a2b23' : 'rgba(0,0,0,0.35)' }}
            >
              {s}
            </span>
          </div>
        )
      })}
    </div>
  )
}

/** 横向时间线（设备运行状态 4 步） */
export function Timeline({
  steps,
  current,
}: {
  steps: { label: string; time?: string }[]
  current: number // 已完成的步数（含进行中的那步之前）
}) {
  return (
    <div className="flex items-start justify-between px-1">
      {steps.map((s, i) => {
        const done = i < current
        const active = i === current
        return (
          <div key={s.label} className="relative flex flex-1 flex-col items-center">
            {i > 0 && (
              <span
                className="absolute left-[-50%] right-[50%] top-[11px] h-[2px]"
                style={{ background: done || active ? '#15803d' : 'rgba(0,0,0,0.08)' }}
              />
            )}
            <motion.span
              initial={false}
              animate={{ scale: active ? [1, 1.15, 1] : 1 }}
              transition={active ? { repeat: Infinity, duration: 1.2 } : undefined}
              className="relative z-10 flex h-[22px] w-[22px] items-center justify-center rounded-full"
              style={{
                background: done || active ? '#15803d' : 'rgba(0,0,0,0.07)',
              }}
            >
              {done ? (
                <Check className="h-3 w-3 text-white" strokeWidth={2.5} />
              ) : (
                <span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-white' : 'bg-black/25'}`} />
              )}
            </motion.span>
            <span
              className="mt-1.5 text-[10.5px] font-medium"
              style={{ color: done || active ? '#1a2b23' : 'rgba(0,0,0,0.35)' }}
            >
              {s.label}
            </span>
            {s.time && <span className="mt-0.5 font-num text-[9px] text-black/35">{s.time}</span>}
            {active && <span className="mt-0.5 text-[9px] font-medium text-[#15803d]">进行中</span>}
          </div>
        )
      })}
    </div>
  )
}

/** 风险等级徽章 */
export function RiskBadge({ level, large = false }: { level: RiskLevel; large?: boolean }) {
  const r = RISK[level]
  return (
    <span
      className={`inline-flex items-center rounded-md font-semibold ${large ? 'px-2.5 py-1 text-[13px]' : 'px-1.5 py-0.5 text-[10px]'}`}
      style={{ color: r.color, background: r.bg, border: `1px solid ${r.border}` }}
    >
      {r.label}
    </span>
  )
}

/** 主按钮（深绿） */
export function ProPrimaryBtn({
  children,
  onClick,
  disabled,
  className = '',
}: {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  className?: string
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-center gap-1.5 rounded-[12px] bg-[#15803d] py-3 text-[14.5px] font-semibold text-white disabled:opacity-60 ${className}`}
    >
      {children}
    </motion.button>
  )
}

/** 次按钮（白底绿边） */
export function ProGhostBtn({
  children,
  onClick,
  className = '',
}: {
  children: ReactNode
  onClick?: () => void
  className?: string
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`flex items-center justify-center gap-1.5 rounded-[12px] border border-black/[0.12] bg-white py-3 text-[14px] font-medium text-black/60 ${className}`}
    >
      {children}
    </motion.button>
  )
}

/** 页头（返回 + 标题 + 右侧槽） */
export function ProHeader({
  title,
  onBack,
  right,
}: {
  title: string
  onBack: () => void
  right?: ReactNode
}) {
  return (
    <header className="flex items-center justify-between">
      <button
        aria-label="返回"
        onClick={onBack}
        className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-black/[0.08] bg-black/[0.05] text-black/60"
      >
        ←
      </button>
      <h1 className="text-[17px] font-semibold tracking-[-0.02em] text-[#1a2b23]">{title}</h1>
      <div className="flex min-w-9 items-center justify-end">{right}</div>
    </header>
  )
}
