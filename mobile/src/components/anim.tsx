import { useEffect, useRef, useState, type ReactNode } from 'react'
import { animate, motion, useInView, useReducedMotion } from 'framer-motion'

/* ===== v2 设计系统：克制、安静、有呼吸感 ===== */

/** 全站统一缓动 easeOutExpo */
export const EASE = [0.22, 1, 0.36, 1] as const

/** 点缀色：翠绿，仅用于关键数字、激活态、个别焦点元素 */
export const LIME = '#91a842'
export const LIME_DEEP = '#637823'

/** 文字色阶 */
export const TXT = '#1a2b23'
export const TXT_60 = 'rgba(0,0,0,0.55)'
export const TXT_38 = 'rgba(0,0,0,0.4)'

/* 卡片：纯白 + 极细边框 + 轻投影 */
export function Glass({
  children,
  className = '',
  onClick,
}: {
  children: ReactNode
  className?: string
  onClick?: () => void
}) {
  return (
    <div
      onClick={onClick}
      className={`surface-card ${className}`}
    >
      {children}
    </div>
  )
}

/* 入场：透明度 + 轻微上浮，stagger 收紧 */
export const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
}
export const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: EASE } },
}

/* 数字滚动：1s 从容匀速 */
export function CountUp({
  to,
  decimals = 0,
  duration = 1.0,
  className = '',
}: {
  to: number
  decimals?: number
  duration?: number
  className?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const reduced = useReducedMotion()
  const inView = useInView(ref, { once: true, margin: '-20px' })
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!inView) return
    const controls = animate(0, to, {
      duration: reduced ? 0 : duration,
      ease: EASE,
      onUpdate: (v) => setVal(v),
    })
    return () => controls.stop()
  }, [inView, to, duration, reduced])
  return (
    <span ref={ref} className={className}>
      {val.toLocaleString('zh-CN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
    </span>
  )
}

/* 环形进度：描边从容，细stroke */
export function Ring({
  value,
  size = 92,
  stroke = 7,
  color = LIME,
  track = 'rgba(0,0,0,0.08)',
  children,
}: {
  value: number
  size?: number
  stroke?: number
  color?: string
  track?: string
  children?: ReactNode
}) {
  const r = (size - stroke) / 2
  const reduced = useReducedMotion()
  const c = 2 * Math.PI * r
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: reduced ? c * (1 - value / 100) : c }}
          whileInView={{ strokeDashoffset: c * (1 - value / 100) }}
          viewport={{ once: true }}
          transition={{ duration: reduced ? 0 : 1.5, ease: EASE }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  )
}

/* 区块标题 */
export function SectionTitle({
  title,
  sub,
  extra,
}: {
  title: string
  sub?: string
  extra?: ReactNode
}) {
  return (
    <div className="mb-2.5 flex items-end justify-between">
      <div>
        <h3 className="text-[15px] font-medium tracking-[-0.01em] text-[#1a2b23]">{title}</h3>
        {sub && <p className="mt-0.5 text-[11px] text-black/40">{sub}</p>}
      </div>
      {extra}
    </div>
  )
}

/* 开关：安静 */
export function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label="切换开关"
      onClick={() => onChange(!on)}
      className={`relative h-[22px] w-[38px] shrink-0 rounded-full transition-colors duration-200 ${on ? 'bg-[#16a34a]' : 'bg-black/10'}`}
    >
      <span
        className={`absolute top-[3px] h-[16px] w-[16px] rounded-full bg-white transition-all duration-200 ${on ? 'left-[19px]' : 'left-[3px]'}`}
      />
    </button>
  )
}

/* 简易 sparkline 路径 */
export function sparkPath(points: number[], w: number, h: number): string {
  const max = Math.max(...points)
  const min = Math.min(...points)
  const range = max - min || 1
  const step = w / (points.length - 1)
  return points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${(i * step).toFixed(1)},${(h - ((p - min) / range) * (h - 4) - 2).toFixed(1)}`)
    .join(' ')
}

/* 描画生长的曲线：1.4-1.6s 从容 */
export function DrawnLine({
  points,
  w,
  h,
  color = LIME,
  width = 1.5,
  delay = 0,
  fill = false,
}: {
  points: number[]
  w: number
  h: number
  color?: string
  width?: number
  delay?: number
  fill?: boolean
}) {
  const d = sparkPath(points, w, h)
  const reduced = useReducedMotion()
  return (
    <>
      {fill && (
        <motion.path
          d={`${d} L${w},${h} L0,${h} Z`}
          fill={color}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 0.1 }}
          viewport={{ once: true }}
          transition={{ duration: reduced ? 0 : 1, delay: reduced ? 0 : delay + 0.5 }}
        />
      )}
      <motion.path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={width}
        strokeLinecap="round"
        initial={{ pathLength: reduced ? 1 : 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: reduced ? 0 : 1.5, delay: reduced ? 0 : delay, ease: EASE }}
      />
    </>
  )
}
