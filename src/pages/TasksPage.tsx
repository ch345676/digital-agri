import BrandMark from '../components/BrandMark'
import { useMemo, useState } from 'react'
import { Plus, Search, Play, Check, Trash2, CalendarDays, User } from 'lucide-react'
import {
  useStore,
  TASK_TYPE_COLORS,
  todayStr,
  nowTimeStr,
  type TaskStatus,
  type TaskType,
} from '../store'
import { PageCard, PageHeader, Modal, Field, inputCls, btnPrimary, btnGhost } from '../components/bits'
import { Count } from '../components/Motion'
import { TaskIllustration } from '../components/TaskIllustration'

type FilterKey = 'all' | TaskStatus

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待完成' },
  { key: 'in-progress', label: '进行中' },
  { key: 'done', label: '已完成' },
]

const STATUS_META: Record<TaskStatus, { label: string; cls: string }> = {
  pending: { label: '待完成', cls: 'bg-[#fff6ea] text-[#e08a00]' },
  'in-progress': { label: '进行中', cls: 'bg-[#e3f0fe] text-[#3b82f6]' },
  done: { label: '已完成', cls: 'bg-[#e4f7ec] text-[#178a45]' },
}

const TASK_TYPES: TaskType[] = ['日常任务', '灌溉施肥', '会议', '植保', '采收', '农机']

/** 今日完成率环形进度 */
function CompletionRing({ pct }: { pct: number }) {
  const r = 26
  const c = 2 * Math.PI * r
  return (
    <div className="flex items-center gap-3">
      <svg width="64" height="64" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r={r} fill="none" stroke="#e0ece5" strokeWidth="7" />
        <circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          stroke="#1fa756"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct / 100)}
          transform="rotate(-90 32 32)"
        />
        <text x="32" y="37" textAnchor="middle" fontSize="14" fontWeight="800" fill="#17352a">
          {pct}%
        </text>
      </svg>
      <div>
        <div className="text-[13px] font-semibold text-[#17352a]">今日完成率</div>
        <div className="text-[12px] text-[#8aa398]">今日任务完成情况</div>
      </div>
    </div>
  )
}

export default function TasksPage() {
  const { tasks, members, addTask, setTaskStatus, deleteTask } = useStore()
  const [filter, setFilter] = useState<FilterKey>('all')
  const [keyword, setKeyword] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)

  // 新建任务表单
  const [fTitle, setFTitle] = useState('')
  const [fType, setFType] = useState<TaskType>('日常任务')
  const [fAssignee, setFAssignee] = useState(members[0]?.name ?? '')
  const [fDate, setFDate] = useState(todayStr())
  const [fTime, setFTime] = useState(nowTimeStr())

  const today = todayStr()
  const todayTasks = tasks.filter((t) => t.date === today)
  const todayDone = todayTasks.filter((t) => t.status === 'done').length
  const pct = todayTasks.length ? Math.round((todayDone / todayTasks.length) * 100) : 0

  const list = useMemo(() => {
    return tasks
      .filter((t) => (filter === 'all' ? true : t.status === filter))
      .filter((t) =>
        keyword ? t.title.includes(keyword) || t.assignee.includes(keyword) : true,
      )
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
  }, [tasks, filter, keyword])

  const counts = useMemo(() => {
    const c: Record<FilterKey, number> = { all: tasks.length, pending: 0, 'in-progress': 0, done: 0 }
    for (const t of tasks) c[t.status] += 1
    return c
  }, [tasks])

  const submit = () => {
    if (!fTitle.trim()) return
    addTask({
      title: fTitle.trim(),
      type: fType,
      assignee: fAssignee || '未分配',
      date: fDate,
      time: fTime,
    })
    setDialogOpen(false)
    setFTitle('')
  }

  const dayLabel = (date: string) =>
    date === today ? '今天' : date === todayStr(1) ? '明天' : date.slice(5).replace('-', '/')

  return (
    <div>
      <PageHeader
        title="任务管理"
        desc="安排与跟踪农场日常作业任务"
        extra={
          <button onClick={() => setDialogOpen(true)} className={`${btnPrimary} flex items-center gap-1.5`}>
            <Plus className="h-4 w-4" />
            新建任务
          </button>
        }
      />

      {/* 统计条 */}
      <PageCard className="mb-5 flex items-center justify-between">
        <CompletionRing pct={pct} />
        <div className="flex gap-8 pr-2 text-center">
          <div>
            <div className="text-[22px] font-extrabold text-[#17352a]"><Count value={todayTasks.length}/></div>
            <div className="text-[12px] text-[#8aa398]">今日任务</div>
          </div>
          <div>
            <div className="text-[22px] font-extrabold text-[#e08a00]"><Count value={counts.pending}/></div>
            <div className="text-[12px] text-[#8aa398]">待完成</div>
          </div>
          <div>
            <div className="text-[22px] font-extrabold text-[#3b82f6]"><Count value={counts['in-progress']}/></div>
            <div className="text-[12px] text-[#8aa398]">进行中</div>
          </div>
          <div>
            <div className="text-[22px] font-extrabold text-[#178a45]"><Count value={counts.done}/></div>
            <div className="text-[12px] text-[#8aa398]">已完成</div>
          </div>
        </div>
      </PageCard>

      {/* 筛选 + 搜索 */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-lg px-3.5 py-1.5 text-[13px] transition-colors ${
                filter === f.key
                  ? 'border border-[#1fa756] bg-white font-semibold text-[#178a45]'
                  : 'border border-transparent bg-[#f2f7f4] text-[#7b9489] hover:text-[#4f6b5f]'
              }`}
            >
              {f.label}（{counts[f.key]}）
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a4bcb1]" />
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜索任务或负责人…"
            className={`${inputCls} w-[240px] pl-9`}
          />
        </div>
      </div>

      {/* 任务列表 */}
      <PageCard className="!p-2">
        {list.length === 0 && (
          <div className="guided-empty"><BrandMark/><h3>没有符合条件的任务</h3><p>清除筛选，重新看看今天的农事安排。</p><button className="secondary-btn" onClick={()=>{setKeyword('');setFilter('all')}}>清除筛选</button></div>
        )}
        <ul className="divide-y divide-[#f0f6f3]">
          {list.map((t) => (
            <li key={t.id} data-motion-item={`task-${t.id}`} data-status={t.status} className="flex items-center gap-3 px-3 py-3.5">
              <TaskIllustration title={t.title} type={t.type}/>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[14px] font-semibold ${t.status === 'done' ? 'text-[#a4bcb1] line-through' : 'text-[#17352a]'}`}
                  >
                    {t.title}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${TASK_TYPE_COLORS[t.type]}`}>
                    {t.type}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_META[t.status].cls}`}>
                    {STATUS_META[t.status].label}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-4 text-[12px] text-[#8aa398]">
                  <span className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5" />
                    {t.assignee}
                  </span>
                  <span className="flex items-center gap-1">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {dayLabel(t.date)} {t.time}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {t.status === 'pending' && (
                  <button
                    onClick={() => setTaskStatus(t.id, 'in-progress')}
                    className="flex items-center gap-1 rounded-lg bg-[#e3f0fe] px-2.5 py-1.5 text-[12px] font-semibold text-[#3b82f6] hover:bg-[#d5e8fd]"
                  >
                    <Play className="h-3.5 w-3.5" />
                    开始
                  </button>
                )}
                {t.status !== 'done' && (
                  <button
                    onClick={() => setTaskStatus(t.id, 'done')}
                    className="flex items-center gap-1 rounded-lg bg-[#e4f7ec] px-2.5 py-1.5 text-[12px] font-semibold text-[#178a45] hover:bg-[#d5f0e0]"
                  >
                    <Check className="h-3.5 w-3.5" />
                    完成
                  </button>
                )}
                {t.status === 'done' && (
                  <button
                    onClick={() => setTaskStatus(t.id, 'pending')}
                    className="rounded-lg bg-[#f2f7f4] px-2.5 py-1.5 text-[12px] font-semibold text-[#7b9489] hover:bg-[#e7f0ea]"
                  >
                    重新打开
                  </button>
                )}
                <button
                  onClick={() => deleteTask(t.id)}
                  title="删除"
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-[#c0a8a8] hover:bg-[#fdeeee] hover:text-[#e05252]"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </PageCard>

      {/* 新建任务对话框 */}
      <Modal open={dialogOpen} title="新建任务" onClose={() => setDialogOpen(false)}>
        <div className="space-y-3.5">
          <Field label="任务标题">
            <input
              value={fTitle}
              onChange={(e) => setFTitle(e.target.value)}
              placeholder="例如：A1 水稻追肥"
              className={inputCls}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="任务类型">
              <select value={fType} onChange={(e) => setFType(e.target.value as TaskType)} className={inputCls}>
                {TASK_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </Field>
            <Field label="负责人">
              <select value={fAssignee} onChange={(e) => setFAssignee(e.target.value)} className={inputCls}>
                {members.map((m) => (
                  <option key={m.id}>{m.name}</option>
                ))}
              </select>
            </Field>
            <Field label="日期">
              <input type="date" value={fDate} onChange={(e) => setFDate(e.target.value)} className={inputCls} />
            </Field>
            <Field label="时间">
              <input type="time" value={fTime} onChange={(e) => setFTime(e.target.value)} className={inputCls} />
            </Field>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button onClick={() => setDialogOpen(false)} className={btnGhost}>
              取消
            </button>
            <button onClick={submit} disabled={!fTitle.trim()} className={`${btnPrimary} disabled:opacity-50`}>
              创建任务
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
