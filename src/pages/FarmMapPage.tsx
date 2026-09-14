import { useState } from 'react'
import {
  Plus,
  Minus,
  LocateFixed,
  X,
  Droplets,
  Thermometer,
  FlaskConical,
  CalendarDays,
  Sprout,
  CheckCircle2,
} from 'lucide-react'
import { useStore, FIELDS, nowTimeStr, todayStr } from '../store'
import { FarmMapSVG, type MapLayers } from '../components/FarmMapSVG'
import { PageHeader, btnPrimary, btnGhost } from '../components/bits'

const LAYER_ITEMS: { key: keyof MapLayers; label: string }[] = [
  { key: 'fields', label: '地块标注' },
  { key: 'monitors', label: '监测点' },
  { key: 'irrigation', label: '灌溉管线 / 取水点' },
]

export default function FarmMapPage() {
  const { addTask, setPage, settings } = useStore()
  const [layers, setLayers] = useState<MapLayers>({ fields: true, monitors: true, irrigation: true })
  const [zoom, setZoom] = useState(1)
  const [selected, setSelected] = useState<string | null>(null)
  const [irrigated, setIrrigated] = useState<string | null>(null)

  const field = FIELDS.find((f) => f.id === selected) ?? null

  const zoomIn = () => setZoom((z) => Math.min(2, Math.round((z + 0.2) * 10) / 10))
  const zoomOut = () => setZoom((z) => Math.max(0.6, Math.round((z - 0.2) * 10) / 10))
  const reset = () => {
    setZoom(1)
    setSelected(null)
  }

  const arrangeIrrigation = () => {
    if (!field) return
    addTask({
      title: `${field.id} ${field.crop}灌溉作业`,
      type: '灌溉施肥',
      assignee: '陈谷雨',
      date: todayStr(),
      time: nowTimeStr(),
    })
    setIrrigated(field.id)
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageHeader
        title="农场地图"
        desc="点击地块查看详情，支持图层开关与缩放"
        extra={
          <div className="flex items-center gap-2">
            {LAYER_ITEMS.map((l) => (
              <button
                key={l.key}
                onClick={() => setLayers((s) => ({ ...s, [l.key]: !s[l.key] }))}
                className={`rounded-lg px-3 py-1.5 text-[13px] transition-colors ${
                  layers[l.key]
                    ? 'border border-[#1fa756] bg-white font-semibold text-[#178a45]'
                    : 'border border-transparent bg-[#f2f7f4] text-[#7b9489] hover:text-[#4f6b5f]'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        }
      />

      <div className="flex min-h-0 flex-1 gap-5">
        {/* 地图 */}
        <div className="relative min-w-0 flex-1 overflow-hidden rounded-2xl bg-white shadow-[0_2px_12px_rgba(23,53,42,0.05)]">
          <FarmMapSVG
            layers={layers}
            zoom={zoom}
            selectedField={selected}
            onFieldClick={(id) => {
              setSelected(id)
              setIrrigated(null)
            }}
          />

          {/* 缩放控件 */}
          <div className="absolute left-4 top-1/2 flex -translate-y-1/2 flex-col items-center gap-1 rounded-2xl bg-white/95 p-2 shadow-[0_4px_16px_rgba(23,53,42,0.15)]">
            <button onClick={zoomIn} className="flex h-9 w-9 items-center justify-center rounded-xl text-[#4f6b5f] hover:bg-[#eef7f1]">
              <Plus className="h-[18px] w-[18px]" strokeWidth={2.2} />
            </button>
            <button onClick={zoomOut} className="flex h-9 w-9 items-center justify-center rounded-xl text-[#4f6b5f] hover:bg-[#eef7f1]">
              <Minus className="h-[18px] w-[18px]" strokeWidth={2.2} />
            </button>
            <button onClick={reset} title="复位" className="flex h-9 w-9 items-center justify-center rounded-xl text-[#4f6b5f] hover:bg-[#eef7f1]">
              <LocateFixed className="h-[18px] w-[18px]" strokeWidth={2.2} />
            </button>
          </div>

          <div className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[12px] font-semibold text-[#4f6b5f] shadow">
            缩放 {Math.round(zoom * 100)}%
          </div>
        </div>

        {/* 地块详情侧栏 */}
        {field && (
          <div className="flex w-[320px] shrink-0 flex-col overflow-y-auto rounded-2xl bg-white p-5 shadow-[0_2px_12px_rgba(23,53,42,0.05)]">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-[18px] font-extrabold text-[#17352a]">
                  {field.id} {field.crop}
                </h3>
                <p className="mt-0.5 text-[12.5px] text-[#8aa398]">
                  品种：{field.variety} · {field.area} 亩
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-[#8aa398] hover:bg-[#f2f9f5]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              {[
                { icon: Droplets, label: '土壤湿度', value: `${field.soilMoisture}%`, color: '#2196e8' },
                { icon: FlaskConical, label: '土壤 PH', value: field.ph.toFixed(1), color: '#8b5cf6' },
                { icon: Thermometer, label: '健康评分', value: `${field.health} 分`, color: '#1fa756' },
                { icon: CalendarDays, label: '预计收获', value: field.harvest.slice(5), color: '#ea7a24' },
              ].map((it) => (
                <div key={it.label} className="rounded-xl bg-[#f5faf7] p-3">
                  <div className="flex items-center gap-1.5 text-[12px] text-[#8aa398]">
                    <it.icon className="h-3.5 w-3.5" color={it.color} />
                    {it.label}
                  </div>
                  <div className="mt-1 text-[16px] font-bold text-[#17352a]">{it.value}</div>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-xl bg-[#f5faf7] p-3">
              <div className="flex items-center justify-between text-[12.5px]">
                <span className="flex items-center gap-1.5 text-[#5f7a6e]">
                  <Sprout className="h-4 w-4 text-[#1fa756]" />
                  生长阶段：{field.stageName}
                </span>
                <span className="font-bold text-[#178a45]">{field.stagePct}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#dcebe2]">
                <div className="h-full rounded-full bg-[#1fa756]" style={{ width: `${field.stagePct}%` }} />
              </div>
              <p className="mt-2 text-[12px] text-[#8aa398]">下一农事：{field.nextAction}</p>
            </div>

            {irrigated === field.id && (
              <div className="mt-3 flex items-center gap-1.5 rounded-xl bg-[#e4f7ec] px-3 py-2 text-[12.5px] font-semibold text-[#178a45]">
                <CheckCircle2 className="h-4 w-4" />
                已创建灌溉任务，可在任务管理中查看
              </div>
            )}

            <div className="mt-auto flex gap-2 pt-4">
              <button onClick={arrangeIrrigation} className={`${btnPrimary} flex-1`}>
                安排灌溉
              </button>
              <button onClick={() => setPage('crops')} className={`${btnGhost} flex-1`}>
                查看详情
              </button>
            </div>
            <p className="mt-2 text-center text-[11px] text-[#a4bcb1]">
              操作人：{settings.displayName}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
