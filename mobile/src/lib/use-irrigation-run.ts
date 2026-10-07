import { useEffect, useRef, useState } from 'react'
import { useFarm } from '../FarmContext'
import { FIELDS } from '../farm-data'
import { useStore } from '../store'
import { freshId } from '../workflow-model'

type Run = { id: string; before: number[]; target: number[]; valves: boolean[]; finished: boolean }
export function useIrrigationRun() {
  const farm = useFarm(), store = useStore()
  const api = useRef({ farm, store }); api.current = { farm, store }
  const [run, setRun] = useState<Run | null>(null)
  const [values, setValues] = useState<number[] | null>(null)
  const [progress, setProgress] = useState(0)
  useEffect(() => {
    if (!run) return
    let elapsed = 0, last = performance.now(), opened = 0
    const timer = setInterval(() => {
      const now = performance.now(), delta = Math.min(180, now - last); last = now
      if (document.hidden || window.__HUINONG_FOREGROUND__ === false) return
      elapsed += delta
      const ratio = Math.min(1, elapsed / 4800), eased = ratio * ratio * (3 - 2 * ratio)
      setProgress(ratio)
      setValues(run.before.map((n, i) => n + (run.target[i] - n) * eased))
      while (opened < FIELDS.length && elapsed >= (opened + 1) * 350) api.current.store.setValve(opened++, true)
      if (ratio < 1) return
      clearInterval(timer); run.finished = true
      FIELDS.forEach((field, i) => {
        api.current.store.setValve(i, false)
        api.current.farm.setMoisture(field.id, run.target[i])
        api.current.farm.record({ fieldId: field.id, kind: 'irrigation', title: '分区灌溉演示完成',
          detail: `墒情 ${run.before[i].toFixed(1)}% → ${run.target[i].toFixed(1)}% · 演示用水 0.24 吨 · 阀门已关闭`,
          moisture: run.target[i], irrigation: { runId: run.id, before: run.before[i], after: run.target[i], waterTonnes: .24, durationSeconds: 4.8 } })
      })
      setRun(null); setValues(null)
    }, 80)
    return () => {
      clearInterval(timer)
      // Leaving an unfinished demonstration restores the previous valve states.
      if (!run.finished) run.valves.forEach((on, i) => api.current.store.setValve(i, on))
    }
  }, [run])
  const start = () => {
    if (run || farm.run?.running) return
    const before = FIELDS.map(f => farm.state.moisture[f.id])
    setProgress(0); setValues(before)
    setRun({ id: freshId('irrigation'), before, target: before.map((n, i) => Math.max(n, Math.min(90, FIELDS[i].soilMoisture + 4))), valves: [...store.valves], finished: false })
  }
  const startToday = new Date(); startToday.setHours(0, 0, 0, 0)
  const savedWater = farm.state.events.filter(e => e.kind === 'irrigation' && e.at >= startToday.getTime()).reduce((n, e) => n + (e.irrigation?.waterTonnes || 0), 0)
  const latest = farm.state.events.find(e => e.irrigation)?.irrigation?.runId
  const receipt = latest ? farm.state.events.filter(e => e.irrigation?.runId === latest).sort((a, b) => FIELDS.findIndex(f => f.id === a.fieldId) - FIELDS.findIndex(f => f.id === b.fieldId)) : []
  return { start, running: !!run, progress, moisture: values || FIELDS.map(f => farm.state.moisture[f.id]), water: savedWater + (run ? progress * 1.2 : 0), receipt }
}

declare global { interface Window { __HUINONG_FOREGROUND__?: boolean } }
