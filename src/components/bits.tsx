import { X } from 'lucide-react'
import { useEffect, useRef, useId, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

/* 通用页面卡片 */
export function PageCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl bg-white p-5 shadow-[0_2px_12px_rgba(23,53,42,0.05)] ${className}`}>
      {children}
    </div>
  )
}

/* 页面标题 */
export function PageHeader({ title, desc, extra }: { title: string; desc?: string; extra?: ReactNode }) {
  return (
    <div className="mb-5 flex items-start justify-between">
      <div>
        <h1 className="text-[24px] font-extrabold tracking-tight text-[#10291e]">{title}</h1>
        {desc && <p className="mt-1 text-[13px] text-[#8aa398]">{desc}</p>}
      </div>
      {extra}
    </div>
  )
}

/* 通用对话框 */
export function Modal({
  open,
  title,
  onClose,
  children,
  width = 'w-[420px]',
}: {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  width?: string
}) {
  const dialog = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const closeRef = useRef(onClose)
  useEffect(() => { closeRef.current = onClose }, [onClose])
  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    const focusable = () => [...(dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]') ?? [])]
    focusable()[0]?.focus()
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); closeRef.current(); return }
      if (e.key !== 'Tab') return
      const items = focusable(), first = items[0], last = items[items.length - 1]
      if (!first) { e.preventDefault(); return }
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', key)
    return () => { document.removeEventListener('keydown', key); previous?.focus() }
  }, [open])
  if (!open) return null
  return createPortal(
    <div
      className="agri-modal fixed inset-0 z-50 flex items-center justify-center bg-[rgba(16,41,30,0.35)] p-4"
      onClick={onClose}
    >
      <div
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`${width} max-h-[85vh] overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 id={titleId} className="text-[17px] font-bold text-[#17352a]">{title}</h3>
          <button
            aria-label="关闭弹窗"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[#8aa398] hover:bg-[#f2f9f5]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>, document.body
  )
}

/* 表单元素 */
export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[12.5px] font-semibold text-[#5f7a6e]">{label}</span>
      {children}
    </label>
  )
}

export const inputCls =
  'w-full rounded-xl border border-[#dcebe2] bg-white px-3 py-2 text-[13.5px] text-[#17352a] outline-none focus:border-[#1fa756] focus:ring-2 focus:ring-[#1fa756]/15'

export const btnPrimary =
  'rounded-xl bg-[#1fa756] px-4 py-2 text-[13.5px] font-semibold text-white transition-colors hover:bg-[#178a45]'

export const btnGhost =
  'rounded-xl border border-[#dcebe2] bg-white px-4 py-2 text-[13.5px] font-semibold text-[#5f7a6e] transition-colors hover:bg-[#f2f9f5]'

/* 开关 */
export function Switch({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      role="switch"
      aria-checked={on}
      aria-label="切换状态"
      className={`relative h-6 w-11 rounded-full transition-colors ${on ? 'bg-[#1fa756]' : 'bg-[#d3e4da]'}`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? 'left-[22px]' : 'left-0.5'}`}
      />
    </button>
  )
}
