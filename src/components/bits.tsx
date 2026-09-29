import { X } from 'lucide-react'
import { useEffect, useRef, useId, useState, type ReactNode, type HTMLAttributes } from 'react'
import { createPortal } from 'react-dom'
import {useMotion} from './motion-context'
import { usePresence } from './use-presence'

/* 通用页面卡片 */
export function PageCard({ children, className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...props} className={`page-card ${className}`}>
      {children}
    </div>
  )
}

/* 页面标题 */
export function PageHeader({ title, desc, extra }: { title: string; desc?: string; extra?: ReactNode }) {
  return (
    <div className="page-heading-glass">
      <div className="page-heading-copy">
        <h1>{title}</h1>
        {desc && <p>{desc}</p>}
      </div>
      <div className="page-heading-actions">{extra}</div>
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
  origin,
}: {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  width?: string
  origin?: DOMRect | null
}) {
  const {enabled}=useMotion()
  const present = usePresence(open)
  const [retainedContent, setRetainedContent] = useState(children)
  if (open && children !== retainedContent) setRetainedContent(children)
  const dialog = useRef<HTMLDivElement>(null)
  const trigger = useRef<DOMRect | null>(null)
  const titleId = useId()
  const closeRef = useRef(onClose)
  useEffect(() => { closeRef.current = onClose }, [onClose])
  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    trigger.current = previous?.closest('button')?.getBoundingClientRect() ?? null
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
  useEffect(()=>{
    const node=dialog.current
    if(!node||!enabled||matchMedia('(prefers-reduced-motion: reduce)').matches)return
    const rect=node.getBoundingClientRect()
    const anchor=origin??trigger.current
    const transform=origin?'translate('+(origin.left-rect.left)+'px,'+(origin.top-rect.top)+'px) scale('+origin.width/rect.width+','+origin.height/rect.height+')':'translateY(18px) scale(.95)'
    const frames=[{transform,opacity:.25,borderRadius:'24px'},{transform:'none',opacity:1,borderRadius:'18px'}]
    node.style.transformOrigin=origin?'top left':anchor?`${Math.max(0,Math.min(rect.width,anchor.left+anchor.width/2-rect.left))}px ${Math.max(0,Math.min(rect.height,anchor.top+anchor.height/2-rect.top))}px`:'50% 60%'
    const animation=node.animate(open?frames:frames.slice().reverse(),{duration:open?280:170,easing:'cubic-bezier(.22,1,.36,1)'})
    return()=>{animation.cancel();node.style.transformOrigin=''}
  },[open,origin,enabled,present])
  if (!present) return null
  return createPortal(
    <div
      data-closing={!open}
      inert={!open}
      aria-hidden={!open}
      className="agri-modal fixed inset-0 z-50 flex items-center justify-center bg-[rgba(16,41,30,0.35)] p-4"
      onClick={onClose}
    >
      <div
        ref={dialog}
        role={open ? "dialog" : undefined}
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
        <div className="modal-body" data-motion-stagger>{open ? children : retainedContent}</div>
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

export const inputCls = 'form-input w-full'

export const btnPrimary = 'primary-btn'

export const btnGhost = 'secondary-btn'

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
