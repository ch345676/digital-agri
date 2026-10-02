import { useState, type Dispatch, type SetStateAction } from 'react'

// Per-tab view preferences survive route changes, without persisting transient dialogs.
export function usePageState<T extends string | number>(key: string, initial: T): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => { try { const saved = JSON.parse(sessionStorage.getItem('huinong-view-' + key) || 'null'); return typeof saved === typeof initial ? saved : initial } catch { return initial } })
  const update: Dispatch<SetStateAction<T>> = next => setValue(old => { const value = typeof next === 'function' ? (next as (v:T)=>T)(old) : next; try { sessionStorage.setItem('huinong-view-' + key, JSON.stringify(value)) } catch { /* optional view memory */ } return value })
  return [value, update]
}
