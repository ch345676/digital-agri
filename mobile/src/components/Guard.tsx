import type { ReactNode } from 'react'
import { Lock } from 'lucide-react'
import { toast } from 'sonner'

/**
 * 权限锁包裹层：locked 时子元素半透明、不可交互，
 * 点击/触摸弹出提示并显示小锁标识。
 */
export default function Guard({
  locked,
  message = '该功能仅管理员可用',
  children,
  className = '',
}: {
  locked: boolean
  message?: string
  children: ReactNode
  className?: string
}) {
  if (!locked) return <div className={className}>{children}</div>
  return (
    <div
      className={`relative ${className}`}
      onClickCapture={(e) => {
        e.preventDefault()
        e.stopPropagation()
        toast(message, { icon: '🔒' })
      }}
      onPointerDownCapture={(e) => {
        e.preventDefault()
        e.stopPropagation()
        toast(message, { icon: '🔒' })
      }}
    >
      <div className="pointer-events-none opacity-55">{children}</div>
      <span className="absolute right-1.5 top-1.5 z-10 flex h-5 w-5 items-center justify-center rounded-full border border-black/[0.1] bg-white/95 shadow-sm">
        <Lock className="h-3 w-3 text-black/45" strokeWidth={1.8} />
      </span>
    </div>
  )
}
