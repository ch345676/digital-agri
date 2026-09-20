import { useRef, useState } from 'react'
import { ChevronLeft, ClipboardList, Camera, Image as ImageIcon, Leaf, SprayCan, Wind, ShieldCheck, ChevronRight, X, Send, BadgeCheck, Lock } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { Glass, SectionTitle, stagger, fadeUp, EASE } from '../components/anim'
import { useStore } from '../store'
import { usePerm } from '../auth'

type Phase = 'idle' | 'scanning' | 'done'

const STEPS = [
  { icon: Leaf, title: '清除病叶', desc: '减少病源' },
  { icon: SprayCan, title: '药剂防治', desc: '交替用药' },
  { icon: Wind, title: '加强管理', desc: '通风降湿' },
  { icon: ShieldCheck, title: '持续监测', desc: '定期巡查' },
]

const EXPERT_REPLIES = [
  '您好，我是张农业。从识别结果看属于早疫病典型症状，建议先摘除病叶并带出田外销毁。',
  '药剂可选择代森锰锌或苯醚甲环唑，7-10 天喷一次，注意交替用药避免抗药性。',
  '近期湿度偏高，请加强通风降湿，灌溉避免叶面长时间积水。',
]

export default function Identify() {
  const { setScreen, identifyRecords, addIdentifyRecord } = useStore()
  const { isGuest, needLogin } = usePerm()
  const [phase, setPhase] = useState<Phase>('idle')
  const [img, setImg] = useState<string | null>(null)
  const [consultOpen, setConsultOpen] = useState(false)
  const [consultMsgs, setConsultMsgs] = useState<{ who: 'me' | 'expert'; text: string }[]>([])
  const [consultInput, setConsultInput] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const replyIdx = useRef(0)

  const runIdentify = (dataUrl: string | null) => {
    setImg(dataUrl)
    setPhase('scanning')
    setTimeout(() => {
      setPhase('done')
      addIdentifyRecord({
        crop: '南瓜',
        disease: '早疫病',
        confidence: 92,
        date: new Date().toISOString().slice(5, 10),
        img: dataUrl ?? undefined,
        tone: '#8fae4c',
      })
    }, 2000)
  }

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => runIdentify(reader.result as string)
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const sendConsult = () => {
    const text = consultInput.trim()
    if (!text) return
    setConsultMsgs((m) => [...m, { who: 'me', text }])
    setConsultInput('')
    setTimeout(() => {
      setConsultMsgs((m) => [
        ...m,
        { who: 'expert', text: EXPERT_REPLIES[replyIdx.current % EXPERT_REPLIES.length] },
      ])
      replyIdx.current += 1
    }, 1200)
  }

  return (
    <div className="px-4 pb-32 pt-5">
      <header className="flex items-center justify-between">
        <button onClick={() => setScreen('overview')} className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-black/[0.08] bg-black/[0.05]">
          <ChevronLeft className="h-5 w-5 text-black/60" strokeWidth={1.5} />
        </button>
        <h1 className="text-[17px] font-semibold tracking-[-0.02em] text-[#1a2b23]">病虫害识别</h1>
        <button className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-black/[0.08] bg-black/[0.05]">
          <ClipboardList className="h-[18px] w-[18px] text-black/60" strokeWidth={1.5} />
        </button>
      </header>

      <motion.div variants={stagger} initial="hidden" animate="show" className="mt-4 space-y-3.5">
        {/* 取景框 */}
        <motion.div variants={fadeUp}>
          <div className="relative h-[300px] overflow-hidden rounded-[14px] border border-black/[0.09]">
            {img ? (
              <img src={img} alt="识别照片" className="h-full w-full object-cover" />
            ) : (
              /* 默认示例：真实病叶照片 */
              <img src="images/leaf-disease.jpg" alt="示例叶片" className="h-full w-full object-cover" />
            )}
            {/* 四角扫描框 */}
            {(['left-4 top-4 border-l-2 border-t-2', 'right-4 top-4 border-r-2 border-t-2', 'left-4 bottom-4 border-l-2 border-b-2', 'right-4 bottom-4 border-r-2 border-b-2'] as const).map((cls) => (
              <span key={cls} className={`absolute h-7 w-7 rounded-sm border-[rgba(22,163,74,0.55)] ${cls}`} />
            ))}
            {/* 扫描线 */}
            <span
              className={`absolute left-4 right-4 h-[2px] rounded-full bg-[#16a34a] ${phase === 'scanning' ? 'scan-line-fast' : 'scan-line'}`}
            />
            {phase === 'scanning' && (
              <div className="absolute inset-x-0 bottom-5 flex justify-center">
                <span className="rounded-full bg-[rgba(255,255,255,0.9)] px-4 py-1.5 text-[12px] font-medium text-[#16a34a]">
                  AI 识别中，正在分析叶片特征…
                </span>
              </div>
            )}
          </div>
        </motion.div>

        {/* 拍照按钮 */}
        <motion.div variants={fadeUp} className="flex gap-3">
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => needLogin() && fileRef.current?.click()}
            className="flex flex-1 items-center justify-center gap-2 rounded-[14px] bg-[#16a34a] py-3 text-[15px] font-semibold text-white"
          >
            {isGuest ? <Lock className="h-5 w-5" strokeWidth={1.5} /> : <Camera className="h-5 w-5" strokeWidth={1.5} />}
            拍照识别
          </motion.button>
          <button
            onClick={() => needLogin() && runIdentify(null)}
            className="flex items-center justify-center gap-1.5 rounded-[14px] border border-black/[0.1] bg-black/[0.05] px-4 text-[13px] font-medium text-black/60"
          >
            {isGuest ? <Lock className="h-4 w-4" strokeWidth={1.5} /> : <ImageIcon className="h-4 w-4" strokeWidth={1.5} />}
            使用示例图
          </button>
        </motion.div>

        {/* 识别结果 */}
        <AnimatePresence>
          {phase === 'done' && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: EASE }}
            >
              <Glass className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[10px]">
                    <img src={img ?? 'images/leaf-disease.jpg'} alt="" className="h-full w-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[16px] font-semibold text-[#1a2b23]">
                      南瓜 <span className="text-[#e8a04c]">早疫病</span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <span className="text-[11px] text-black/40">置信度</span>
                      <div className="h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-black/[0.09]">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: '92%' }}
                          transition={{ duration: 1.2, delay: 0.3, ease: EASE }}
                          className="h-full rounded-full bg-[#16a34a]"
                        />
                      </div>
                      <span className="text-[13px] font-semibold text-[#16a34a]">92%</span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-black/[0.08] pt-3 text-[11.5px]">
                  <span className="text-black/40">
                    发生部位 <span className="ml-1 font-medium text-[#1a2b23]">叶片</span>
                  </span>
                  <span className="text-black/40">
                    危害程度
                    <span className="ml-1.5 rounded-md bg-[rgba(232,160,76,0.1)] px-2 py-0.5 font-medium text-[#e8a04c]">中等</span>
                  </span>
                </div>
              </Glass>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 防治建议 */}
        <motion.div variants={fadeUp}>
          <Glass className="p-4">
            <SectionTitle title="防治建议" />
            <div className="flex items-start justify-between">
              {STEPS.map((s, i) => {
                const lit = phase === 'done'
                return (
                  <div key={s.title} className="flex flex-1 items-start">
                    <div className="flex flex-col items-center gap-1.5 text-center">
                      <motion.span
                        initial={false}
                        animate={{ opacity: lit ? 1 : 0.4 }}
                        transition={{ delay: lit ? 0.4 + i * 0.3 : 0, duration: 0.4, ease: EASE }}
                        className={`flex h-11 w-11 items-center justify-center rounded-full border transition-colors duration-500 ${
                          lit ? 'border-[rgba(22,163,74,0.25)] bg-[rgba(22,163,74,0.08)] text-[#16a34a]' : 'border-black/[0.08] bg-black/[0.05] text-black/40'
                        }`}
                      >
                        <s.icon className="h-5 w-5" strokeWidth={1.5} />
                      </motion.span>
                      <div className={`text-[10.5px] font-medium ${lit ? 'text-[#1a2b23]' : 'text-black/40'}`}>{s.title}</div>
                      <div className="text-[9.5px] text-black/40">{s.desc}</div>
                    </div>
                    {i < STEPS.length - 1 && <span className="mt-5 h-px min-w-2 flex-1 bg-black/[0.08]" />}
                  </div>
                )
              })}
            </div>
          </Glass>
        </motion.div>

        {/* 专家复核 */}
        <motion.div variants={fadeUp}>
          <Glass className="p-4">
            <SectionTitle title="专家复核" />
            <div className="flex items-center gap-3">
              <img src="images/avatar-expert.jpg" alt="张农业" className="h-12 w-12 shrink-0 rounded-full border border-black/[0.12] object-cover" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[14px] font-medium text-[#1a2b23]">张农业</span>
                  <span className="flex items-center gap-0.5 rounded-md bg-[rgba(22,163,74,0.08)] px-1.5 py-0.5 text-[9.5px] font-medium text-[#16a34a]">
                    <BadgeCheck className="h-3 w-3" strokeWidth={1.5} />
                    农技专家
                  </span>
                </div>
                <div className="text-[10.5px] text-black/40">高级农艺师 · 10年经验</div>
              </div>
              <button
                onClick={() => needLogin() && setConsultOpen(true)}
                className="flex shrink-0 items-center gap-1 rounded-[10px] bg-[#16a34a] px-3.5 py-2 text-[12px] font-semibold text-white"
              >
                {isGuest && <Lock className="h-3 w-3" strokeWidth={2} />}
                去咨询
              </button>
            </div>
            <p className="mt-2.5 rounded-[10px] bg-black/[0.04] p-2.5 text-[11.5px] leading-snug text-black/55">
              建议及时防治，注意田间通风与排水。
            </p>
          </Glass>
        </motion.div>

        {/* 识别记录 */}
        <motion.div variants={fadeUp}>
          <SectionTitle
            title="识别记录"
            extra={
              <button className="flex items-center text-[11px] text-black/40">
                全部记录 <ChevronRight className="h-3 w-3" strokeWidth={1.5} />
              </button>
            }
          />
          <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
            {identifyRecords.map((r) => (
              <div key={r.id} className="w-[104px] shrink-0 overflow-hidden rounded-[14px] border border-black/[0.08]">
                <div className="flex h-[76px] items-center justify-center">
                  <img src={r.img ?? 'images/leaf-disease.jpg'} alt="" className="h-full w-full object-cover" />
                </div>
                <div className="bg-black/[0.05] p-2">
                  <div className="truncate text-[11px] font-medium text-[#1a2b23]">
                    {r.crop} {r.disease}
                  </div>
                  <div className="text-[9.5px] text-black/40">{r.date}</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>

      {/* 专家咨询弹窗 */}
      <AnimatePresence>
        {consultOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConsultOpen(false)}
              className="fixed inset-0 z-40 bg-black/60"
            />
            <motion.div
              initial={{ y: 320 }}
              animate={{ y: 0 }}
              exit={{ y: 320 }}
              transition={{ duration: 0.3, ease: EASE }}
              className="fixed bottom-0 left-1/2 z-50 flex h-[460px] w-full max-w-[420px] center-x flex-col rounded-t-[14px] border-t border-black/[0.09] bg-white"
            >
              <div className="flex items-center justify-between border-b border-black/[0.08] p-4">
                <div className="flex items-center gap-2.5">
                  <img src="images/avatar-expert.jpg" alt="张农业" className="h-9 w-9 rounded-full border border-black/[0.12] object-cover" />
                  <div>
                    <div className="text-[13.5px] font-medium text-[#1a2b23]">张农业 · 高级农艺师</div>
                    <div className="text-[10px] text-[#16a34a]">在线，通常 5 分钟内回复</div>
                  </div>
                </div>
                <button onClick={() => setConsultOpen(false)} className="flex h-7 w-7 items-center justify-center rounded-lg bg-black/[0.07]">
                  <X className="h-4 w-4 text-black/55" strokeWidth={1.5} />
                </button>
              </div>
              <div className="flex-1 space-y-2.5 overflow-y-auto p-4">
                {consultMsgs.length === 0 && (
                  <p className="pt-16 text-center text-[11.5px] text-black/40">
                    向专家描述田间情况，例如「南瓜叶片出现褐色斑点」
                  </p>
                )}
                {consultMsgs.map((m, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, ease: EASE }}
                    className={`flex ${m.who === 'me' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-[12.5px] leading-relaxed ${
                        m.who === 'me'
                          ? 'rounded-br-md bg-[#16a34a] text-white'
                          : 'rounded-bl-md bg-black/[0.07] text-[#1a2b23]'
                      }`}
                    >
                      {m.text}
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="flex items-center gap-2 border-t border-black/[0.08] p-3 pb-6">
                <input
                  value={consultInput}
                  onChange={(e) => setConsultInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendConsult()}
                  placeholder="描述病情，咨询专家…"
                  className="min-w-0 flex-1 rounded-[10px] border border-black/[0.1] bg-black/[0.06] px-3.5 py-2.5 text-[12.5px] text-[#1a2b23] outline-none placeholder:text-black/40"
                />
                <button onClick={sendConsult} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#16a34a]">
                  <Send className="h-4 w-4 text-white" strokeWidth={1.5} />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
