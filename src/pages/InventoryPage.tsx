import { useState } from 'react'
import { Package, AlertTriangle, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react'
import { useStore, type InventoryItem } from '../store'
import { PageCard, PageHeader, Modal, Field, inputCls, btnPrimary, btnGhost } from '../components/bits'

const CATEGORY_COLORS: Record<InventoryItem['category'], string> = {
  肥料: 'bg-[#e4f7ec] text-[#178a45]',
  农药: 'bg-[#fff1e6] text-[#ea7a24]',
  种子: 'bg-[#e3f0fe] text-[#3b82f6]',
  农膜: 'bg-[#f1eafe] text-[#8b5cf6]',
}

export default function InventoryPage() {
  const { inventory, adjustInventory } = useStore()
  const [dialog, setDialog] = useState<{ item: InventoryItem; mode: 'in' | 'out' } | null>(null)
  const [amount, setAmount] = useState('')

  const lowItems = inventory.filter((i) => i.quantity < i.safety)
  const openDialog = (item: InventoryItem, mode: 'in' | 'out') => {
    setDialog({ item, mode })
    setAmount('')
  }
  const submit = () => {
    if (!dialog) return
    const n = parseFloat(amount)
    if (!Number.isFinite(n) || n <= 0) return
    adjustInventory(dialog.item.id, dialog.mode === 'in' ? n : -n)
    setDialog(null)
  }

  return (
    <div>
      <PageHeader title="物资管理" desc="肥料、农药、种子与农膜库存管理" />

      {/* 统计 */}
      <PageCard className="mb-5 flex items-center gap-10">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e4f7ec]">
            <Package className="h-5 w-5 text-[#178a45]" />
          </div>
          <div>
            <div className="text-[20px] font-extrabold text-[#17352a]">{inventory.length} 项</div>
            <div className="text-[12px] text-[#8aa398]">物资总数</div>
          </div>
        </div>
        <div>
          <div className={`text-[20px] font-extrabold ${lowItems.length ? 'text-[#e05252]' : 'text-[#178a45]'}`}>
            {lowItems.length} 项
          </div>
          <div className="text-[12px] text-[#8aa398]">库存不足</div>
        </div>
        {lowItems.length > 0 && (
          <div className="flex items-center gap-1.5 rounded-xl bg-[#fdeeee] px-3 py-2 text-[12.5px] font-semibold text-[#e05252]">
            <AlertTriangle className="h-4 w-4" />
            {lowItems.map((i) => i.name).join('、')} 低于安全库存，请及时补货
          </div>
        )}
      </PageCard>

      {/* 库存表格 */}
      <PageCard className="!p-0 overflow-hidden">
        <table className="w-full text-[13.5px]">
          <thead>
            <tr className="bg-[#f5faf7] text-left text-[12.5px] text-[#7b9489]">
              <th className="px-5 py-3 font-semibold">物资名称</th>
              <th className="px-4 py-3 font-semibold">分类</th>
              <th className="px-4 py-3 text-right font-semibold">库存量</th>
              <th className="px-4 py-3 text-right font-semibold">安全库存</th>
              <th className="px-4 py-3 font-semibold">状态</th>
              <th className="px-5 py-3 text-right font-semibold">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0f6f3]">
            {inventory.map((it) => {
              const low = it.quantity < it.safety
              return (
                <tr key={it.id} className="hover:bg-[#fafdfb]">
                  <td className="px-5 py-3.5 font-semibold text-[#17352a]">{it.name}</td>
                  <td className="px-4 py-3.5">
                    <span className={`rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ${CATEGORY_COLORS[it.category]}`}>
                      {it.category}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right font-bold text-[#17352a]">
                    {it.quantity} <span className="text-[12px] font-normal text-[#8aa398]">{it.unit}</span>
                  </td>
                  <td className="px-4 py-3.5 text-right text-[#8aa398]">
                    {it.safety} {it.unit}
                  </td>
                  <td className="px-4 py-3.5">
                    {low ? (
                      <span className="rounded-full bg-[#fdeeee] px-2.5 py-0.5 text-[11.5px] font-bold text-[#e05252]">
                        库存不足
                      </span>
                    ) : (
                      <span className="rounded-full bg-[#e4f7ec] px-2.5 py-0.5 text-[11.5px] font-semibold text-[#178a45]">
                        库存充足
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => openDialog(it, 'in')}
                        className="flex items-center gap-1 rounded-lg bg-[#e4f7ec] px-2.5 py-1.5 text-[12px] font-semibold text-[#178a45] hover:bg-[#d5f0e0]"
                      >
                        <ArrowDownToLine className="h-3.5 w-3.5" />
                        入库
                      </button>
                      <button
                        onClick={() => openDialog(it, 'out')}
                        className="flex items-center gap-1 rounded-lg bg-[#f2f7f4] px-2.5 py-1.5 text-[12px] font-semibold text-[#5f7a6e] hover:bg-[#e7f0ea]"
                      >
                        <ArrowUpFromLine className="h-3.5 w-3.5" />
                        出库
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </PageCard>

      {/* 入库/出库对话框 */}
      <Modal
        open={!!dialog}
        title={dialog ? `${dialog.mode === 'in' ? '入库' : '出库'}：${dialog.item.name}` : ''}
        onClose={() => setDialog(null)}
        width="w-[360px]"
      >
        {dialog && (
          <div className="space-y-3.5">
            <p className="text-[12.5px] text-[#8aa398]">
              当前库存：<span className="font-bold text-[#17352a]">{dialog.item.quantity} {dialog.item.unit}</span>
            </p>
            <Field label={`${dialog.mode === 'in' ? '入库' : '出库'}数量（${dialog.item.unit}）`}>
              <input
                type="number"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="请输入数量"
                className={inputCls}
                autoFocus
              />
            </Field>
            <div className="flex justify-end gap-2 pt-1">
              <button onClick={() => setDialog(null)} className={btnGhost}>取消</button>
              <button
                onClick={submit}
                disabled={!amount || parseFloat(amount) <= 0}
                className={`${btnPrimary} disabled:opacity-50`}
              >
                确认{dialog.mode === 'in' ? '入库' : '出库'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
