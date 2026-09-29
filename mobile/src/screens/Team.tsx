import { Reveal, Disclosure } from '../components/motion'
import { useEffect, useRef, useState } from 'react'
import { Search, Bell, ChevronRight, Camera, Send, AlertTriangle, Droplets, Bug, Car, Lock } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import FarmMap from '../components/FarmMap'
import { Glass, SectionTitle, Ring, CountUp, stagger, EASE } from '../components/anim'

import { useStore, nowHM } from '../store'
import { usePerm } from '../auth'
import { useFarm } from '../FarmContext'
import { FieldSelect, PhotoGallery, readPhoto } from '../components/workflow'
import { toast } from 'sonner'
import { PEOPLE, fieldLabel } from '../workflow-model'

const REPLIES = [
  '收到，我马上过去看看。',
  '好的，这边作业预计半小时后完成。',
  '没问题，完成后我在群里同步照片。',
  '墒情数据我看过了，下午安排补灌。',
]

export default function Team() {
  const { chat, addChat, checkins, addCheckin, setScreen, valves } = useStore()
  const {state,activeField,selectField}=useFarm()
  const [gallery,setGallery]=useState<number|null>(null)
  const STAFF=PEOPLE.slice(0,3).map(name=>{const tasks=state.tasks.filter(t=>t.assignee===name&&t.status!=='已完成');return {name,task:tasks[0]?.title??'暂无待办',status:tasks.length?`${tasks.length} 项`:'空闲',cls:'text-[#637823]',tone:'from-[#e3edb5] to-[#e9f3de]'}})
  const MACHINES=[{icon:Car,name:'巡检小车',device:'巡检小车'},{icon:Droplets,name:'灌溉系统',device:'灌溉系统'},{icon:Bug,name:'喷淋系统',device:'喷淋系统'}].map(m=>{const tasks=state.tasks.filter(t=>t.device.startsWith(m.device));const complete=tasks.filter(t=>t.status==='已完成').length;const running=tasks.filter(t=>t.status==='执行中').length;return {...m,pct:Math.round(complete/Math.max(1,tasks.length)*100),active:running>0,status:m.device==='灌溉系统'?`${valves.filter(Boolean).length} / 5 阀门开启`:`${running} 项执行中 · ${complete} 项完成`}})
  const ALERTS=state.incidents.filter(i=>i.status!=='已解决').slice(0,3).map(i=>({icon:Bug,tone:'#c79a50',title:i.title,desc:`${fieldLabel(i.fieldId)} · ${i.status}`,time:new Date(i.at).toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'})}))
  const completion=Math.round(state.tasks.filter(t=>t.status==='已完成').length/Math.max(1,state.tasks.length)*100)
  const { isGuest, needLogin } = usePerm()
  const reduced = useReducedMotion()
  const [pending, setPending] = useState(0)
  const replies = useRef<ReturnType<typeof setTimeout>[]>([])
  const messages = useRef<HTMLDivElement>(null)
  const followMessages = useRef(true)
  useEffect(() => () => replies.current.forEach(clearTimeout), [])
  useEffect(() => { if (followMessages.current) messages.current?.scrollTo({top:messages.current.scrollHeight,behavior:reduced?'instant':'smooth'}) }, [chat.length,pending,reduced])
  const [input, setInput] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const replyIdx = useRef(0)
  const send = () => {
    if (!needLogin()) return
    const text = input.trim()
    if (!text) return
    addChat({ who: 'me', name: '我', text, time: nowHM() })
    setInput('')
    followMessages.current = true
    setPending(n => n + 1)
    replies.current.push(setTimeout(() => {
      addChat({
        who: 'other',
        name: '张师傅',
        text: REPLIES[replyIdx.current % REPLIES.length],
        time: nowHM(),
      })
      replyIdx.current += 1
      setPending(n => n - 1)
    }, 2000))
  }

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file=e.target.files?.[0];if(!file)return
    try {addCheckin({img:await readPhoto(file),time:nowHM(),fieldId:activeField});toast('打卡照片已加入地块档案')}
    catch(error){toast((error as Error).message)}
    e.target.value=''
  }

  return (
    <div className="px-4 pb-32 pt-5">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-[19px] font-semibold tracking-[-0.02em] text-[#1a2b23]">农事协作</h1>
          <p className="mt-0.5 text-[11px] text-black/40">人机高效配合，任务高效落地</p>
        </div>
        <div className="flex items-center gap-2">
          <button aria-label="搜索农事任务" onClick={()=>setScreen('tasks')} className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-black/[0.08] bg-black/[0.05]">
            <Search className="h-[18px] w-[18px] text-black/60" strokeWidth={1.5} />
          </button>
          <button aria-label="查看通知" onClick={()=>setScreen('notifications')} className="relative flex h-9 w-9 items-center justify-center rounded-[10px] border border-black/[0.08] bg-black/[0.05]">
            <Bell className="h-[18px] w-[18px] text-black/60" strokeWidth={1.5} />
            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#e8a04c]" />
          </button>
        </div>
      </header>

      <motion.div variants={stagger} initial="hidden" animate="show" className="mt-4 space-y-3.5">
        {/* 今日任务 */}
        <Reveal>
          <Glass className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[15px] font-medium text-[#1a2b23]">今日任务</span>
                <span className="rounded-md bg-[rgba(22,163,74,0.08)] px-1.5 py-0.5 text-[9.5px] font-medium text-[#16a34a]">{state.tasks.filter(t=>t.status==='执行中').length}项进行中</span>
              </div>
              <button onClick={()=>setScreen('tasks')} className="flex items-center text-[11px] text-black/40">
                查看全部 <ChevronRight className="h-3 w-3" strokeWidth={1.5} />
              </button>
            </div>
            <div className="mt-3 flex items-center">
              <div className="grid flex-1 grid-cols-3 text-center">
                {[
                  [state.tasks.length, '全部任务'],
                  [state.tasks.filter(t=>t.status==='执行中').length, '进行中'],
                  [state.tasks.filter(t=>t.status==='已完成').length, '已完成'],
                ].map(([v, label]) => (
                  <div key={label as string}>
                    <div className="font-num text-[26px] font-semibold tracking-[-0.02em] text-[#1a2b23]">
                      <CountUp to={v as number} />
                    </div>
                    <div className="text-[10.5px] text-black/40">{label}</div>
                  </div>
                ))}
              </div>
              <Ring value={completion} size={68} stroke={6}>
                <span className="text-[15px] font-semibold text-[#16a34a]">
                  <CountUp to={completion} />%
                </span>
                <span className="text-[8.5px] text-black/40">完成进度</span>
              </Ring>
            </div>
          </Glass>
        </Reveal>

        {/* 人员分配 + 农机调度 */}
        <Reveal className="grid grid-cols-2 gap-3.5">
          <Glass className="p-3.5">
            <SectionTitle title="人员分配" extra={<button aria-label="查看相关任务" onClick={()=>setScreen('tasks')}><ChevronRight className="h-3.5 w-3.5 text-black/40" strokeWidth={1.5}/></button>} />
            <ul className="space-y-2.5">
              {STAFF.map((s) => (
                <li key={s.name} className="flex items-center gap-2">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-black/[0.1] bg-gradient-to-br text-[11px] font-medium text-[#1a2b23] ${s.tone}`}>
                    {s.name.slice(0, 1)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[12px] font-medium text-[#1a2b23]">{s.name}</span>
                      <span className={`shrink-0 rounded px-1 py-0.5 text-[8.5px] font-medium ${s.cls}`}>{s.status}</span>
                    </div>
                    <div className="truncate text-[9.5px] text-black/40">{s.task}</div>
                  </div>
                </li>
              ))}
            </ul>
          </Glass>
          <Glass className="p-3.5">
            <SectionTitle title="农机调度" extra={<button aria-label="查看相关任务" onClick={()=>setScreen('tasks')}><ChevronRight className="h-3.5 w-3.5 text-black/40" strokeWidth={1.5}/></button>} />
            <ul className="space-y-2.5">
              {MACHINES.map((m, i) => (
                <li key={m.name}>
                  <div className="flex items-center gap-2">
                    <m.icon className="h-4 w-4 shrink-0 text-black/60" strokeWidth={1.5} />
                    <span className="min-w-0 flex-1 truncate text-[11.5px] font-medium text-[#1a2b23]">{m.name}</span>
                    <span className={`text-[10px] font-semibold ${m.active ? 'text-[#16a34a]' : 'text-black/40'}`}>{m.pct}%</span>
                  </div>
                  <div className="ml-6 mt-1 h-1 overflow-hidden rounded-full bg-black/[0.09]">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${m.pct}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.2, delay: 0.3 + i * 0.2, ease: EASE }}
                      className={`h-full rounded-full ${m.active ? 'bg-[#16a34a]' : 'bg-black/25'}`}
                    />
                  </div>
                  <div className="ml-6 mt-0.5 text-[9px] text-black/40">{m.status}</div>
                </li>
              ))}
            </ul>
          </Glass>
        </Reveal>

        {/* 任务地图 + 拍照打卡 */}
        <Reveal className="grid grid-cols-1 gap-3.5">
          <Glass className="p-3.5">
            <SectionTitle title="任务地图" />
            <div className="overflow-hidden rounded-[10px] border border-black/[0.08]">
              <FarmMap compact />
            </div>
            <div className="mt-1.5 flex items-center gap-3 text-[9px] text-black/40">
              <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-[#16a34a]" />进行中</span>
              <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-[#e8a04c]" />待开始</span>
              <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-black/30" />已完成</span>
            </div>
          </Glass>
          <Glass className="p-3.5">
            <SectionTitle title="拍照打卡" extra={<button aria-label="查看相关任务" onClick={()=>setScreen('tasks')}><ChevronRight className="h-3.5 w-3.5 text-black/40" strokeWidth={1.5}/></button>} />
            <FieldSelect value={activeField} onChange={selectField}/>
            <div className="grid grid-cols-2 gap-2">
              {checkins.slice(0, 3).map((c,i) => (
                <motion.div layout initial={{opacity:0,scale:.85}} animate={{opacity:1,scale:1}} key={c.id} className="relative h-[62px] overflow-hidden rounded-lg">
                  <button aria-label="查看打卡照片" className="h-full w-full" onClick={()=>setGallery(i)}><img src={c.img} alt="打卡" className="h-full w-full object-cover" /></button>
                  <span className="absolute bottom-1 right-1 rounded bg-[rgba(10,15,11,0.75)] px-1 text-[8.5px] text-[rgba(217,249,157,0.9)]">{c.time}</span>
                </motion.div>
              ))}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
              <button
                onClick={() => needLogin() && fileRef.current?.click()}
                className="flex h-[62px] flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-black/[0.15] text-black/45"
              >
                {isGuest ? <Lock className="h-4 w-4" strokeWidth={1.5} /> : <Camera className="h-4 w-4" strokeWidth={1.5} />}
                <span className="text-[9.5px] font-medium">拍照打卡</span>
              </button>
            </div>
          </Glass>
        </Reveal>

        {/* 团队沟通 + 预警提醒 */}
        <Reveal className="grid grid-cols-2 gap-3.5">
          <Glass className="flex flex-col p-3.5">
            <SectionTitle title="团队沟通 · 模拟回复" />
            <div ref={messages} role="log" aria-label="团队消息" aria-live="polite" onScroll={e => { const el=e.currentTarget; followMessages.current=el.scrollHeight-el.scrollTop-el.clientHeight<40 }} className="max-h-[190px] flex-1 space-y-2.5 overflow-y-auto">
              {chat.map((m) => (
                <motion.div layout="position" key={m.id} initial={{ opacity: 0, x: m.who === 'me' ? 12 : -12, scale: .96 }} animate={{ opacity: 1, x: 0, scale: 1 }} transition={{ duration: 0.25, ease: EASE }} className="flex items-start gap-2">
                  <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-medium ${m.who === 'me' ? 'bg-[#16a34a] text-white' : 'border border-black/[0.1] bg-black/[0.09] text-[#1a2b23]'}`}>
                    {m.name.slice(0, 1)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-[10px] font-medium text-black/55">{m.name}</span>
                      <span className="text-[8.5px] text-black/40">{m.time}</span>
                    </div>
                    <p className={`mt-0.5 rounded-lg px-2 py-1.5 text-[10.5px] leading-snug ${m.who === 'me' ? 'bg-black/[0.09] text-[#1a2b23]' : 'bg-black/[0.05] text-[#1a2b23]'}`}>
                      {m.text}
                    </p>
                  </div>
                </motion.div>
              ))}
              <Disclosure open={pending>0}><span className="typing-dots" role="status" aria-label="模拟回复中"><i/><i/><i/></span></Disclosure>
            </div>
            <div className="mt-2 flex items-center gap-1.5">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send()}
                placeholder="发送消息…"
                className="min-w-0 flex-1 rounded-lg border border-black/[0.1] bg-black/[0.06] px-2.5 py-2 text-[11px] text-[#1a2b23] outline-none placeholder:text-black/40"
              />
              <button aria-label="发送消息" onClick={send} disabled={!input.trim()} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#16a34a]">
                <Send className="h-3.5 w-3.5 text-white" strokeWidth={1.5} />
              </button>
            </div>
          </Glass>
          <Glass className="p-3.5">
            <SectionTitle title="预警提醒" extra={<button aria-label="查看全部预警" onClick={()=>setScreen('notifications')}><ChevronRight className="h-3.5 w-3.5 text-black/40" strokeWidth={1.5}/></button>} />
            <ul className="space-y-2.5">
              {ALERTS.map((a, i) => (
                <motion.li
                  key={a.title}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + i * 0.12, duration: 0.4, ease: EASE }}
                  className="flex items-start gap-2"
                >
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${a.tone}1a` }}>
                    <a.icon className="h-3.5 w-3.5" color={a.tone} strokeWidth={1.5} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="flex items-center gap-1 text-[11.5px] font-medium text-[#1a2b23]">
                        <AlertTriangle className="h-3 w-3" color={a.tone} strokeWidth={1.5} />
                        {a.title}
                      </span>
                      <span className="shrink-0 text-[8.5px] text-black/40">{a.time}</span>
                    </div>
                    <p className="mt-0.5 text-[9.5px] leading-snug text-black/40">{a.desc}</p>
                  </div>
                </motion.li>
              ))}
            </ul>
          </Glass>
        </Reveal>
      </motion.div>
      <PhotoGallery photos={checkins.map(c=>({id:c.id,src:c.img,note:`${c.fieldId??"A1"} · ${c.time}`}))} index={gallery} onClose={()=>setGallery(null)}/>
    </div>
  )
}
