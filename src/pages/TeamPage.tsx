import { useState } from 'react'
import { UserPlus, Megaphone, MapPin, ClipboardList, Send } from 'lucide-react'
import { useStore, todayStr } from '../store'
import { PageCard, PageHeader, Modal, Field, inputCls, btnPrimary, btnGhost } from '../components/bits'

const AVATAR_COLORS = [
  'from-[#2fbf71] to-[#14914a]',
  'from-[#4aa8ec] to-[#2470c7]',
  'from-[#f2a93b] to-[#e07f1a]',
  'from-[#9b7bf0] to-[#7448d8]',
  'from-[#ef7d7d] to-[#d84f4f]',
  'from-[#3fc6c0] to-[#129e98]',
]

export default function TeamPage() {
  const { members, announcements, addMember, addAnnouncement, tasks, settings } = useStore()
  const [inviteOpen, setInviteOpen] = useState(false)
  const [mName, setMName] = useState('')
  const [mRole, setMRole] = useState('')
  const [mFields, setMFields] = useState('')
  const [notice, setNotice] = useState('')

  const today = todayStr()
  const taskCountOf = (name: string) =>
    tasks.filter((t) => t.date === today && t.assignee === name && t.status !== 'done').length

  const submitInvite = () => {
    if (!mName.trim()) return
    addMember({
      name: mName.trim(),
      role: mRole.trim() || '成员',
      fields: mFields.trim() || '待定',
      online: true,
      tasksToday: 0,
    })
    setInviteOpen(false)
    setMName('')
    setMRole('')
    setMFields('')
  }

  const publish = () => {
    if (!notice.trim()) return
    addAnnouncement({ author: settings.displayName, text: notice.trim(), time: '刚刚' })
    setNotice('')
  }

  return (
    <div>
      <PageHeader
        title="团队协作"
        desc={`${members.length} 名成员 · ${members.filter((m) => m.online).length} 人在线`}
        extra={
          <button onClick={() => setInviteOpen(true)} className={`${btnPrimary} flex items-center gap-1.5`}>
            <UserPlus className="h-4 w-4" />
            邀请成员
          </button>
        }
      />

      <div className="flex items-start gap-5">
        {/* 成员网格 */}
        <div className="grid min-w-0 flex-1 grid-cols-3 gap-5 max-[1500px]:grid-cols-2">
          {members.map((m, i) => (
            <PageCard key={m.id}>
              <div className="flex items-start justify-between">
                <div className={`flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br text-[17px] font-bold text-white ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}>
                  {m.name.slice(0, 1)}
                </div>
                <span className="flex items-center gap-1.5 text-[11.5px] font-semibold">
                  <span className={`h-2 w-2 rounded-full ${m.online ? 'bg-[#1fa756]' : 'bg-[#c8d8cf]'}`} />
                  <span className={m.online ? 'text-[#178a45]' : 'text-[#a4bcb1]'}>
                    {m.online ? '在线' : '离线'}
                  </span>
                </span>
              </div>
              <div className="mt-3 text-[15px] font-bold text-[#17352a]">{m.name}</div>
              <div className="text-[12px] text-[#8aa398]">{m.role}</div>
              <div className="mt-3 space-y-1.5 border-t border-[#f0f6f3] pt-3 text-[12.5px] text-[#5f7a6e]">
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-[#a4bcb1]" />
                  负责：{m.fields}
                </div>
                <div className="flex items-center gap-1.5">
                  <ClipboardList className="h-3.5 w-3.5 text-[#a4bcb1]" />
                  今日待办任务：{taskCountOf(m.name)} 项
                </div>
              </div>
            </PageCard>
          ))}
        </div>

        {/* 公告区 */}
        <div className="w-[340px] shrink-0">
          <PageCard>
            <div className="flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-[#178a45]" />
              <span className="text-[15px] font-bold text-[#17352a]">公告栏</span>
            </div>

            <div className="mt-3 space-y-2">
              <textarea
                value={notice}
                onChange={(e) => setNotice(e.target.value)}
                placeholder="发布公告，全员可见…"
                rows={3}
                className={`${inputCls} resize-none`}
              />
              <div className="flex justify-end">
                <button onClick={publish} disabled={!notice.trim()} className={`${btnPrimary} flex items-center gap-1.5 disabled:opacity-50`}>
                  <Send className="h-3.5 w-3.5" />
                  发布
                </button>
              </div>
            </div>

            <ul className="mt-3 max-h-[420px] space-y-2.5 overflow-y-auto">
              {announcements.map((a) => (
                <li key={a.id} className="rounded-xl bg-[#f5faf7] p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[12.5px] font-bold text-[#17352a]">{a.author}</span>
                    <span className="text-[11px] text-[#a4bcb1]">{a.time}</span>
                  </div>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-[#3d5a4d]">{a.text}</p>
                </li>
              ))}
            </ul>
          </PageCard>
        </div>
      </div>

      {/* 邀请成员对话框 */}
      <Modal open={inviteOpen} title="邀请成员" onClose={() => setInviteOpen(false)} width="w-[380px]">
        <div className="space-y-3.5">
          <Field label="姓名">
            <input value={mName} onChange={(e) => setMName(e.target.value)} placeholder="例如：孙小满" className={inputCls} />
          </Field>
          <Field label="角色">
            <input value={mRole} onChange={(e) => setMRole(e.target.value)} placeholder="例如：植保专员" className={inputCls} />
          </Field>
          <Field label="负责地块">
            <input value={mFields} onChange={(e) => setMFields(e.target.value)} placeholder="例如：A1 / B2" className={inputCls} />
          </Field>
          <div className="flex justify-end gap-2 pt-1">
            <button onClick={() => setInviteOpen(false)} className={btnGhost}>取消</button>
            <button onClick={submitInvite} disabled={!mName.trim()} className={`${btnPrimary} disabled:opacity-50`}>
              添加成员
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
