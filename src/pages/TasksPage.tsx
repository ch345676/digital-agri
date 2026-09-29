import {FarmEmpty} from '../components/AgriArtwork'
import TaskBoard from '../components/TaskBoard'
import { useMemo, useState } from 'react'
import { Plus, Search, Play, Check, Trash2, CalendarDays, User } from 'lucide-react'
import {
  useStore,
  todayStr,
  nowTimeStr,
  type TaskStatus,
  type TaskType,
} from '../store'
import { PageHeader, Modal, Field, inputCls, btnPrimary, btnGhost } from '../components/bits'
import { Count } from '../components/Motion'

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
    <div className="completion-ring">
      <svg width="64" height="64" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r={r} fill="none" stroke="#e0ece5" strokeWidth="7" />
        <circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          stroke="#28604c"
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
        <div className="text-[12px] text-[#8aa398]">按今天安排的任务统计</div>
      </div>
    </div>
  )
}

export default function TasksPage() {
  const { tasks, members, addTask, setTaskStatus, deleteTask } = useStore()
  const [view,setView]=useState<'list'|'board'>('list')
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
    <div className="task-workspace">
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

      <section className="task-summary" aria-label="作业统计">
        <CompletionRing pct={pct} />
        <div className="task-summary-stat"><span>今日安排</span><b><Count value={todayTasks.length}/><small> 项</small></b></div>
        <div className="task-summary-stat"><span>全部待完成</span><b><Count value={counts.pending}/><small> 项</small></b></div>
        <div className="task-summary-stat"><span>正在执行</span><b><Count value={counts['in-progress']}/><small> 项</small></b></div>
      </section>
      <section className="task-register">
        <div className="task-toolbar">
          <div className="task-status-tabs" data-motion-tabs aria-label="任务状态筛选">
            {FILTERS.map(f => <button key={f.key} aria-pressed={filter === f.key} onClick={() => setFilter(f.key)}>{f.label}<span>{counts[f.key]}</span></button>)}
          </div>
          <div className="task-toolbar-tools">
            <label className="task-search"><Search size={16}/><input aria-label="搜索任务或负责人" value={keyword} onChange={e=>setKeyword(e.target.value)} placeholder="搜索任务或负责人…" className={inputCls}/></label>
            <div className="task-view-switch segmented" aria-label="任务视图"><button aria-pressed={view==='list'} className={view==='list'?'active':''} onClick={()=>setView('list')}>列表视图</button><button aria-pressed={view==='board'} className={view==='board'?'active':''} onClick={()=>{setView('board');setFilter('all')}}>看板视图</button></div>
          </div>
        </div>
        <div data-motion-key={view}>{view==='board'?<TaskBoard tasks={list} onCreate={()=>setDialogOpen(true)}/>:<>
          <div className="task-column-head" aria-hidden="true"><span>作业内容</span><span>负责人</span><span>计划时间</span><span>状态</span><span>操作</span></div>
          {list.length===0 && <FarmEmpty title="没有符合条件的任务" description="清除筛选重新查看，或创建第一项农事。" action={()=>{setKeyword('');setFilter('all');if(!tasks.length)setDialogOpen(true)}} label={tasks.length?'清除筛选':'新建农事'}/>}
          <ul className="task-list">
            {list.map(t => <li key={t.id} data-motion-item={`task-${t.id}`} data-status={t.status} className="task-record">
              <div className="task-record-title"><span className="task-type-label">{t.type}</span><b>{t.title}</b></div>
              <div className="task-owner"><span className="member-initial" aria-hidden="true">{t.assignee.slice(-2,-1)||t.assignee.slice(0,1)}</span><User size={14}/><span>{t.assignee}</span></div>
              <div className="task-date"><CalendarDays size={14}/><span>{dayLabel(t.date)}<small>{t.time}</small></span></div>
              <span className={`task-state state-${t.status}`}><i/>{STATUS_META[t.status].label}</span>
              <div className="task-record-actions">
                {t.status==='pending' && <button onClick={()=>setTaskStatus(t.id,'in-progress')} className="task-start"><Play size={13}/>开始</button>}
                {t.status!=='done' && <button onClick={()=>setTaskStatus(t.id,'done')} className="task-finish"><Check size={14}/>完成</button>}
                {t.status==='done' && <button onClick={()=>setTaskStatus(t.id,'pending')} className="task-reopen">重新打开</button>}
                <button onClick={()=>deleteTask(t.id)} title="删除" aria-label={`删除任务：${t.title}`} className="task-delete"><Trash2 size={15}/></button>
              </div>
            </li>)}
          </ul>
        </>}</div>
        <footer className="task-register-footer"><span>共 {list.length} 项作业</span><span>按计划时间排序 · 操作自动保存</span></footer>
      </section>
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
