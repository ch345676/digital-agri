import { useState } from 'react'
import { Wheat, ChevronDown, ImagePlus, Trash2, NotebookPen, ArrowRight } from 'lucide-react'
import { useStore, FIELDS, todayStr, type FieldInfo } from '../store'
import { PageCard, PageHeader, inputCls, btnPrimary } from '../components/bits'

function CropCard({ field }: { field: FieldInfo }) {
  const { growthRecords, addGrowthRecord } = useStore()
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState(todayStr())
  const [text, setText] = useState('')

  const records = growthRecords.filter((r) => r.fieldId === field.id)

  const submit = () => {
    if (!text.trim()) return
    addGrowthRecord({ fieldId: field.id, date, text: text.trim() })
    setText('')
  }

  const healthColor = field.health >= 85 ? '#178a45' : field.health >= 78 ? '#e08a00' : '#e05252'

  return (
    <PageCard className="!p-0 overflow-hidden">
      <button onClick={() => setOpen((v) => !v)} className="w-full p-5 text-left">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e4f7ec]">
              <Wheat className="h-5 w-5 text-[#178a45]" />
            </div>
            <div>
              <div className="text-[15px] font-bold text-[#17352a]">
                {field.id} {field.crop}
              </div>
              <div className="text-[12px] text-[#8aa398]">
                {field.variety} · {field.area} 亩
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full px-2.5 py-0.5 text-[12px] font-bold" style={{ color: healthColor, backgroundColor: `${healthColor}1a` }}>
              {field.health} 分
            </span>
            <ChevronDown className={`h-4 w-4 text-[#a4bcb1] transition-transform ${open ? 'rotate-180' : ''}`} />
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between text-[12.5px]">
            <span className="text-[#5f7a6e]">生长阶段：{field.stageName}</span>
            <span className="font-bold text-[#178a45]">{field.stagePct}%</span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#dcebe2]">
            <div className="h-full rounded-full bg-[#1fa756]" style={{ width: `${field.stagePct}%` }} />
          </div>
          <div className="mt-2.5 flex items-center justify-between text-[12px] text-[#8aa398]">
            <span>
              下一农事：<span className="font-semibold text-[#3d5a4d]">{field.nextAction}</span>
            </span>
            <span>预计收获 {field.harvest.slice(5)}</span>
          </div>
        </div>
      </button>

      {open && (
        <div className="border-t border-[#f0f6f3] p-5 pt-4">
          <div className="mb-3 grid grid-cols-3 gap-3 text-center">
            {[
              ['土壤湿度', `${field.soilMoisture}%`],
              ['土壤 PH', field.ph.toFixed(1)],
              ['生长记录', `${records.length} 条`],
            ].map(([k, v]) => (
              <div key={k} className="rounded-xl bg-[#f5faf7] py-2.5">
                <div className="text-[15px] font-bold text-[#17352a]">{v}</div>
                <div className="text-[11.5px] text-[#8aa398]">{k}</div>
              </div>
            ))}
          </div>

          {/* 生长记录 */}
          <div className="mb-2 flex items-center gap-1.5 text-[13px] font-bold text-[#17352a]">
            <NotebookPen className="h-4 w-4 text-[#178a45]" />
            生长记录
          </div>
          {records.length === 0 && (
            <p className="py-2 text-[12.5px] text-[#a4bcb1]">暂无记录，添加第一条观察记录吧。</p>
          )}
          <ul className="mb-3 max-h-[160px] space-y-2 overflow-y-auto">
            {records.map((r) => (
              <li key={r.id} className="rounded-xl bg-[#f5faf7] p-3">
                <div className="text-[11.5px] font-semibold text-[#178a45]">{r.date}</div>
                <p className="mt-0.5 text-[12.5px] leading-relaxed text-[#3d5a4d]">{r.text}</p>
              </li>
            ))}
          </ul>

          {/* 添加记录 */}
          <div className="space-y-2 rounded-xl border border-dashed border-[#c8e0d2] p-3">
            <div className="flex gap-2">
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={`${inputCls} w-[150px]`} />
              <button
                type="button"
                title="添加照片（占位）"
                className="flex h-[38px] w-[46px] items-center justify-center rounded-xl border border-dashed border-[#c8e0d2] text-[#8aa398] hover:bg-[#f5faf7]"
              >
                <ImagePlus className="h-4 w-4" />
              </button>
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="记录作物长势、病虫害、农事操作…"
              rows={2}
              className={`${inputCls} resize-none`}
            />
            <div className="flex justify-end">
              <button onClick={submit} disabled={!text.trim()} className={`${btnPrimary} flex items-center gap-1 disabled:opacity-50`}>
                添加记录
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </PageCard>
  )
}

export default function CropsPage() {
  const { growthRecords } = useStore()
  const totalArea = FIELDS.reduce((s, f) => s + f.area, 0)
  const avgHealth = Math.round(FIELDS.reduce((s, f) => s + f.health, 0) / FIELDS.length)

  return (
    <div>
      <PageHeader title="作物管理" desc="按地块跟踪作物生长全过程" />

      <PageCard className="mb-5 flex items-center gap-10">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e4f7ec]">
            <Wheat className="h-5 w-5 text-[#178a45]" />
          </div>
          <div>
            <div className="text-[20px] font-extrabold text-[#17352a]">{FIELDS.length} 块</div>
            <div className="text-[12px] text-[#8aa398]">在管地块</div>
          </div>
        </div>
        <div>
          <div className="text-[20px] font-extrabold text-[#17352a]">{totalArea.toFixed(1)} 亩</div>
          <div className="text-[12px] text-[#8aa398]">种植总面积</div>
        </div>
        <div>
          <div className="text-[20px] font-extrabold text-[#178a45]">{avgHealth} 分</div>
          <div className="text-[12px] text-[#8aa398]">平均健康评分</div>
        </div>
        <div>
          <div className="text-[20px] font-extrabold text-[#17352a]">{growthRecords.length} 条</div>
          <div className="text-[12px] text-[#8aa398]">生长记录</div>
        </div>
      </PageCard>

      <div className="grid grid-cols-2 gap-5 max-[1400px]:grid-cols-1">
        {FIELDS.map((f) => (
          <CropCard key={f.id} field={f} />
        ))}
      </div>
      <div className="mt-4 flex items-center gap-1.5 text-[12px] text-[#a4bcb1]">
        <Trash2 className="h-3.5 w-3.5" />
        提示：生长记录保存在本地浏览器，刷新不丢失。
      </div>
    </div>
  )
}
