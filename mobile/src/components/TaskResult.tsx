import { motion, useReducedMotion } from 'framer-motion'
import { useStore } from '../store'
import type { FarmTask } from '../workflow-model'
import { SuccessMark } from './motion'

export default function TaskResult({ task, onViewList }: { task: FarmTask; onViewList: () => void }) {
  const { setScreen } = useStore(), reduced = useReducedMotion()
  return <motion.section className="task-result" role="status" initial={{ opacity: 0, y: reduced ? 0 : 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduced ? 0 : .35 }}>
    <header><SuccessMark size={42}/><div><h3>作业完成，记录已归档</h3><p>{task.photos.length} 张现场照片{task.incidentId ? ' · 关联预警已解决' : ' · 已汇入地块档案'}</p></div></header>
    <div className="task-result-actions"><button onClick={onViewList}>查看归档任务</button><button onClick={() => setScreen('reports')}>生成农场报告</button></div>
  </motion.section>
}
