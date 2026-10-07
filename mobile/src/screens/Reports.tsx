import { useEffect, useMemo, useRef, useState } from 'react'
import { Download, FileText, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { useFarm } from '../FarmContext'
import { FieldSelect, PageHeader } from '../components/workflow'
import { farmReport, type ReportPeriod } from '../lib/report-model'
import { drawReport, saveReport } from '../lib/report-export'
import { localDate } from '../lib/daily-work'

export default function Reports() {
  const { state, saveError } = useFarm()
  const [field, setField] = useState('all'), [period, setPeriod] = useState<ReportPeriod>('today')
  const [snapshot, setSnapshot] = useState(() => ({ state, now: new Date() }))
  const [preview, setPreview] = useState(''), [error, setError] = useState(''), [missing, setMissing] = useState(0)
  const [building, setBuilding] = useState(true), [saving, setSaving] = useState(false)
  const canvas = useRef<HTMLCanvasElement | null>(null)
  const report = useMemo(() => farmReport(snapshot.state, field, period, snapshot.now), [snapshot, field, period])
  const stale = state !== snapshot.state
  useEffect(() => {
    let cancelled = false
    setBuilding(true); setError(''); canvas.current = null
    drawReport(report).then(result => {
      if (cancelled) return
      canvas.current = result.canvas
      setPreview(result.canvas.toDataURL('image/jpeg', .9)); setMissing(result.missingImages); setBuilding(false)
    }).catch(() => { if (!cancelled) { setError('报告生成失败，请刷新重试。'); setBuilding(false) } })
    return () => { cancelled = true }
  }, [report])
  useEffect(() => {
    const result = (e: Event) => {
      const detail = (e as CustomEvent<{ status: string; message: string }>).detail
      setSaving(false); window.__huinongExport = undefined
      if (detail.status === 'saved') toast.success('报告已保存到所选位置')
      else if (detail.status === 'error') toast.error(detail.message || '保存失败，请重试')
      else toast('已取消保存，可以重新导出')
    }
    window.addEventListener('huinong:export-result', result)
    return () => { window.removeEventListener('huinong:export-result', result); window.__huinongExport = undefined }
  }, [])
  const download = async (format: 'png' | 'pdf') => {
    if (!canvas.current || saving || building) return
    setSaving(true)
    try {
      const destination = await saveReport(canvas.current, format, `惠农农场报告-${field}-${localDate(snapshot.now)}.${format}`)
      if (destination === 'browser') { toast('报告已生成，请在下载列表中查看'); setSaving(false) }
    } catch (err) { toast.error((err as Error).message); setSaving(false) }
  }
  return <div className="work-page reports-page"><PageHeader title="农场报告" sub="把每一次田间作业，整理成可保存的记录"/>
    <section className="report-controls"><div className="report-control-heading"><FileText size={21}/><div><b>选择报告范围</b><small>地图 · 作业摘要 · 上传照片</small></div></div><label>地块范围<FieldSelect value={field} onChange={setField} all/></label><div className="filter-strip" aria-label="报告时间范围">{([['today', '今天'], ['week', '近 7 天'], ['all', '全部记录']] as const).map(([value, label]) => <button key={value} aria-pressed={period === value} onClick={() => setPeriod(value)}>{label}</button>)}</div><div className="report-freshness"><span>{snapshot.now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })} 的数据快照{stale ? ' · 有新记录' : ''}</span><button disabled={building} onClick={() => setSnapshot({ state, now: new Date() })}><RefreshCw size={13}/>刷新报告</button></div></section>
    {saveError && <p role="alert" className="inline-error">部分记录尚未写入本机存储，报告包含当前页面上的记录。</p>}
    <div className="report-preview" aria-busy={building}>{building ? <div className="report-loading" role="status"><span className="skeleton"/>正在整理作业与照片…</div> : error ? <p role="alert">{error}</p> : <img src={preview} alt={`${report.scope}，${report.label}农场报告预览`} />}</div>
    <div className="report-accessible-summary"><b>{report.scope} · {report.label}</b><span>期间完成 {report.completed.length} 项任务，演示用水 {report.water.toFixed(2)} 吨；当前待办 {report.pending.length} 项、未解决预警 {report.incidents.length} 条；{report.photos.length} 张用户上传照片。</span></div>
    {!!missing && <p className="muted">{missing} 张图片暂不可用，报告保留文字记录。可刷新后再次导出。</p>}
    <div className="report-export-actions"><button className="work-primary" disabled={building || !!error || saving} onClick={() => download('png')}><Download size={16}/>{saving ? '正在保存…' : '保存图片'}</button><button className="report-pdf" disabled={building || !!error || saving} onClick={() => download('pdf')}><FileText size={16}/>导出 PDF</button></div>
    <p className="muted">报告为本机演示数据摘要，展示最近 3 条作业及最多 3 张用户上传照片；参考样例和旧版示意图不作为现场证据。旧记录未记录的用水量不计入统计，当前墒情与待办为生成时快照。</p>
  </div>
}
