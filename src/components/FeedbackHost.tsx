import { useCallback, useEffect, useState } from 'react'
import { Check, X, AlertCircle } from 'lucide-react'
import { getSaveState, type Feedback } from '../feedback'
import BrandMark from './BrandMark'
import { useMotion } from './motion-context'

export function SaveIndicator() {
  const [saved, setSaved] = useState(getSaveState)
  useEffect(() => {
    const update = () => setSaved(getSaveState())
    window.addEventListener('huinong-save', update); update()
    return () => window.removeEventListener('huinong-save', update)
  }, [])
  return <span className={`save-indicator ${saved?.ok === false ? 'save-error' : ''}`} title={saved?.ok ? '保存时间 ' + saved.time : undefined}>
    {saved?.ok ? <Check size={13}/> : <BrandMark/>}{saved === null ? '本地演示' : saved.ok ? '已保存于本机' : '未能保存，请检查浏览器存储'}
  </span>
}

function Toast({ item, remove }: { item: Feedback; remove: (id: string) => void }) {
  const { enabled } = useMotion()
  const [closing, setClosing] = useState(false)
  const [held, setHeld] = useState(false)
  const [previous, setPrevious] = useState(item)
  if (previous !== item) { setPrevious(item); setClosing(false) }
  const complete = item.progress === undefined || item.progress >= 100
  useEffect(() => {
    if (!complete || held || closing) return
    const timer = setTimeout(() => setClosing(true), item.action ? 10000 : item.error ? 10000 : 4200)
    return () => clearTimeout(timer)
  }, [item, complete, held, closing])
  useEffect(() => {
    if (!closing) return
    const timer = setTimeout(() => remove(item.id), enabled ? 180 : 0)
    return () => clearTimeout(timer)
  }, [closing, enabled, item.id, remove])
  return <div className="feedback-item" data-closing={closing} inert={closing} aria-hidden={closing}>
    <div><div className={`feedback-toast ${item.error ? 'feedback-error' : ''}`} onMouseEnter={() => setHeld(true)} onMouseLeave={() => setHeld(false)} onFocusCapture={() => setHeld(true)} onBlurCapture={e => { if (!e.currentTarget.contains(e.relatedTarget)) setHeld(false) }}>
      <div className="feedback-symbol" data-complete={complete && !item.error} aria-hidden="true">{item.error ? <AlertCircle/> : complete ? <Check/> : <BrandMark/>}</div>
      <div><span>{item.message}</span>{item.progress !== undefined && <progress aria-label="导出进度" max="100" value={item.progress}/>}</div>
      {item.action && <button className="feedback-undo" onClick={() => { item.action?.(); remove(item.id) }}>{item.actionLabel || '撤销'}</button>}
      <button aria-label="关闭提示" onClick={() => setClosing(true)}><X size={16}/></button>
    </div></div>
  </div>
}

export default function FeedbackHost() {
  const [items, setItems] = useState<Feedback[]>([])
  const remove = useCallback((id: string) => setItems(old => old.filter(x => x.id !== id)), [])
  useEffect(() => {
    const receive = (event: Event) => {
      const item = (event as CustomEvent<Feedback>).detail
      setItems(old => old.some(x => x.id === item.id) ? old.map(x => x.id === item.id ? item : x) : [...old, item].slice(-3))
    }
    window.addEventListener('huinong-feedback', receive)
    return () => window.removeEventListener('huinong-feedback', receive)
  }, [])
  return <div className="feedback-stack" aria-live="polite" aria-atomic="false">{items.map(item => <Toast key={item.id} item={item} remove={remove}/>)}</div>
}
