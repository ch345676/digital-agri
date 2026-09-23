import { useState } from 'react'
import { User, Tractor, Bell, MonitorCog, CheckCircle2 } from 'lucide-react'
import { useStore, type SettingsState } from '../store'
import { PageCard, PageHeader, Field, inputCls, btnPrimary, Switch } from '../components/bits'

function SectionTitle({ icon: Icon, title }: { icon: typeof User; title: string }) {
  return (
    <div className="mb-3.5 flex items-center gap-2">
      <Icon className="h-4 w-4 text-[#178a45]" />
      <span className="text-[15px] font-bold text-[#17352a]">{title}</span>
    </div>
  )
}

export default function SettingsPage() {
  const { settings, saveSettings } = useStore()
  const [draft, setDraft] = useState<SettingsState>(settings)
  const [saved, setSaved] = useState(false)

  const set = <K extends keyof SettingsState>(k: K, v: SettingsState[K]) => {
    setDraft((d) => ({ ...d, [k]: v }))
    setSaved(false)
  }

  const save = () => {
    saveSettings(draft)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div>
      <PageHeader title="系统设置" desc="个人信息、农场信息与偏好设置" />

      <div className="grid max-w-[980px] grid-cols-2 gap-5">
        {/* 个人信息 */}
        <PageCard>
          <SectionTitle icon={User} title="个人信息" />
          <div className="space-y-3.5">
            <Field label="显示名（用于工作台问候语与公告署名）">
              <input
                value={draft.displayName}
                onChange={(e) => set('displayName', e.target.value)}
                placeholder="管理员"
                className={inputCls}
              />
            </Field>
            <Field label="角色">
              <input value="系统管理员" disabled className={`${inputCls} bg-[#f5faf7] text-[#8aa398]`} />
            </Field>
          </div>
        </PageCard>

        {/* 农场信息 */}
        <PageCard>
          <SectionTitle icon={Tractor} title="农场信息" />
          <div className="space-y-3.5">
            <Field label="农场名称">
              <input value={draft.farmName} onChange={(e) => set('farmName', e.target.value)} className={inputCls} />
            </Field>
            <div className="grid grid-cols-[120px_1fr] gap-3">
              <Field label="面积（亩）">
                <input value={draft.farmArea} onChange={(e) => set('farmArea', e.target.value)} className={inputCls} />
              </Field>
              <Field label="地址">
                <input value={draft.farmAddress} onChange={(e) => set('farmAddress', e.target.value)} className={inputCls} />
              </Field>
            </div>
          </div>
        </PageCard>

        {/* 通知设置 */}
        <PageCard>
          <SectionTitle icon={Bell} title="通知设置" />
          <ul className="divide-y divide-[#f0f6f3]">
            {(
              [
                ['notifHeat', '高温预警', '温度过高时推送预警通知'],
                ['notifOffline', '设备离线', '设备掉线时立即提醒'],
                ['notifTask', '任务提醒', '任务开始前 30 分钟提醒负责人'],
              ] as const
            ).map(([key, label, desc]) => (
              <li key={key} className="flex items-center justify-between py-3">
                <div>
                  <div className="text-[13.5px] font-semibold text-[#17352a]">{label}</div>
                  <div className="text-[12px] text-[#8aa398]">{desc}</div>
                </div>
                <Switch on={draft[key]} onChange={() => set(key, !draft[key])} />
              </li>
            ))}
          </ul>
        </PageCard>

        {/* 显示设置 */}
        <PageCard>
          <SectionTitle icon={MonitorCog} title="显示设置" />
          <div className="space-y-2.5">
            {(
              [
                ['comfortable', '宽松', '默认间距，适合大屏浏览'],
                ['compact', '紧凑', '缩小整体比例，一屏展示更多内容'],
              ] as const
            ).map(([key, label, desc]) => (
              <button
                key={key}
                onClick={() => set('density', key)}
                className={`flex w-full items-center justify-between rounded-xl border p-3.5 text-left transition-colors ${
                  draft.density === key
                    ? 'border-[#1fa756] bg-[#f0faf4]'
                    : 'border-[#dcebe2] hover:bg-[#f5faf7]'
                }`}
              >
                <div>
                  <div className="text-[13.5px] font-semibold text-[#17352a]">{label}</div>
                  <div className="text-[12px] text-[#8aa398]">{desc}</div>
                </div>
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                    draft.density === key ? 'border-[#1fa756] bg-[#1fa756]' : 'border-[#c8d8cf]'
                  }`}
                >
                  {draft.density === key && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                </span>
              </button>
            ))}
          </div>
        </PageCard>
      </div>

      {/* 保存 */}
      <div className="mt-5 flex max-w-[980px] items-center gap-3">
        <button onClick={save} className={btnPrimary}>
          保存设置
        </button>
        {saved && (
          <span role="status" className="flex items-center gap-1.5 text-[13px] font-semibold text-[#178a45]">
            <CheckCircle2 className="h-4 w-4" />
            设置已应用，保存状态见页脚
          </span>
        )}
      </div>
    </div>
  )
}
