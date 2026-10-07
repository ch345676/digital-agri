import { FARM_IMAGERY } from '../farm-data'
import { PLOTS } from '../components/FarmMapSVG'
import { fieldLabel } from '../workflow-model'
import type { FarmReport } from './report-model'

const INK = '#243c31', MUTED = '#708278'
function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise(resolve => {
    const img = new Image()
    const timer = setTimeout(() => resolve(null), 8000)
    img.onload = () => { clearTimeout(timer); resolve(img) }
    img.onerror = () => { clearTimeout(timer); resolve(null) }
    img.src = src
  })
}

export async function drawReport(report: FarmReport): Promise<{ canvas: HTMLCanvasElement; missingImages: number }> {
  const canvas = document.createElement('canvas')
  canvas.width = 1080; canvas.height = 1528
  const ctx = canvas.getContext('2d')!
  const box = (x: number, y: number, w: number, h: number, fill: string) => {
    ctx.fillStyle = fill; ctx.fillRect(x, y, w, h)
  }
  const text = (value: string, x: number, y: number, size = 24, color = INK, weight = 400, maxWidth = 952) => {
    ctx.fillStyle = color; ctx.font = `${weight} ${size}px "Microsoft YaHei", "Noto Sans CJK SC", sans-serif`
    let fitted = value
    while (fitted.length && ctx.measureText(fitted).width > maxWidth) fitted = fitted.slice(0, -1)
    if (fitted !== value) { fitted = fitted.slice(0, -1) + '…' }
    ctx.fillText(fitted, x, y)
  }
  const cover = (img: HTMLImageElement, x: number, y: number, w: number, h: number) => {
    const scale = Math.max(w / img.width, h / img.height), sw = w / scale, sh = h / scale
    ctx.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, x, y, w, h)
  }
  const photoItems = report.photos.slice(0, 3)
  const images = await Promise.all([loadImage(FARM_IMAGERY.image), ...photoItems.map(p => loadImage(p.photo!))])
  const [map, ...photos] = images
  box(0, 0, 1080, 1528, '#ffffff')
  box(0, 0, 1080, 164, '#eef5fc')
  text('惠农 / 智慧农场', 64, 48, 22, MUTED, 500)
  text('农场作业报告', 64, 104, 42, INK, 700)
  text(`${report.scope} · ${report.label}`, 64, 140, 22, MUTED)
  const stats = [
    [String(report.completed.length), '期间完成任务'],
    [report.water.toFixed(2) + ' 吨', '已记录演示用水'],
    [String(report.pending.length), '当前待办任务'],
    [String(report.incidents.length), '当前未解决预警'],
  ]
  stats.forEach(([value, label], i) => {
    const x = 64 + i * 242
    box(x, 188, 226, 108, i === 0 ? '#e4edb3' : '#f3f6f1')
    text(value, x + 18, 235, 32, INK, 650, 195)
    text(label, x + 18, 274, 18, MUTED)
  })
  box(64, 325, 952, 390, '#e4ebe4')
  if (map) {
    ctx.save(); ctx.beginPath(); ctx.rect(64, 325, 952, 390); ctx.clip()
    ctx.drawImage(map, 64, 325, 952, 952 * 560 / 1000)
    ctx.translate(64, 325); ctx.scale(952 / 1000, 952 / 1000)
    for (const plot of PLOTS) {
      if (report.field !== 'all' && plot.id !== report.field) continue
      ctx.beginPath()
      plot.points.split(' ').forEach((pair, i) => {
        const [x, y] = pair.split(',').map(Number)
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
      })
      ctx.closePath(); ctx.fillStyle = '#daef9f40'; ctx.fill(); ctx.strokeStyle = '#edffa2'; ctx.lineWidth = 3; ctx.stroke()
      box(plot.x - 35, plot.y - 26, 70, 45, '#243c31')
      text(plot.id, plot.x - 20, plot.y + 5, 26, '#fff', 650)
    }
    ctx.restore()
  } else text('卫星影像暂不可用', 370, 525, 28, MUTED)
  text('示例农田 / 演示边界 · 影像：Esri, Vantor, Earthstar Geographics, GIS User Community', 64, 744, 15, MUTED)
  text('地块快照', 64, 791, 26, INK, 650)
  text('当前墒情', 598, 791, 19, MUTED)
  text('待办 / 未解决预警', 797, 791, 19, MUTED)
  report.fields.forEach((field, i) => {
    const y = 834 + i * 38
    text(`${fieldLabel(field.id)} · ${field.area} 亩`, 64, y, 22)
    text(`${report.moisture[field.id].toFixed(1)}%`, 620, y, 22)
    text(`${report.pending.filter(t => t.fieldId === field.id).length} / ${report.incidents.filter(e => e.fieldId === field.id).length}`, 875, y, 22)
    box(64, y + 13, 952, 1, '#edf1eb')
  })
  text('作业摘要', 64, 1047, 26, INK, 650)
  text(`期间 ${report.eventCount} 条记录 · 展示最近 3 条`, 607, 1047, 18, MUTED)
  if (!report.events.length) text('所选范围暂无作业记录。', 64, 1092, 22, MUTED)
  report.events.slice(0, 3).forEach((event, i) => {
    const stamp = new Date(event.at).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })
    text(stamp, 64, 1093 + i * 37, 18, MUTED, 400, 175)
    text(`${event.fieldId} · ${event.title}`, 250, 1093 + i * 37, 22, INK, 400, 760)
  })
  text('现场记录', 64, 1214, 26, INK, 650)
  text(`${report.photos.length} 张照片 · 展示最近 3 张`, 697, 1214, 18, MUTED)
  if (!photoItems.length) {
    box(64, 1238, 952, 152, '#f3f6f1')
    text('完成作业并上传照片后，将自动汇入报告。', 250, 1326, 22, MUTED)
  }
  photoItems.forEach((photo, i) => {
    const x = 64 + i * 322
    box(x, 1238, 308, 152, '#f3f6f1')
    if (photos[i]) cover(photos[i]!, x, 1238, 308, 152)
    else text('图片暂不可用', x + 68, 1326, 20, MUTED)
    text(`${photo.fieldId} · ${photo.detail}`, x, 1415, 16, MUTED, 400, 308)
  })
  box(64, 1440, 952, 1, '#dfe7dc')
  text('本机演示数据 · 非真实设备采集；当前状态为生成时快照。', 64, 1470, 18, MUTED)
  text(`生成于 ${new Date(report.generatedAt).toLocaleString('zh-CN', { hour12: false })} · 历史最多保留 600 条`, 64, 1500, 16, MUTED)
  return { canvas, missingImages: images.filter(img => !img).length }
}

// Embed the same report image on one A4 page. Byte offsets are calculated from
// the binary streams, avoiding font downloads and preserving Chinese offline.
export function reportPDF(canvas: HTMLCanvasElement): Blob {
  const jpeg = atob(canvas.toDataURL('image/jpeg', .92).split(',')[1])
  const parts: Uint8Array[] = []
  const offsets = [0]
  let size = 0
  const append = (s: string) => { const bytes = Uint8Array.from(s, c => c.charCodeAt(0)); parts.push(bytes); size += bytes.length }
  const object = (id: number, content: string) => { offsets[id] = size; append(`${id} 0 obj\n${content}\nendobj\n`) }
  append('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n')
  object(1, '<< /Type /Catalog /Pages 2 0 R >>')
  object(2, '<< /Type /Pages /Kids [3 0 R] /Count 1 >>')
  object(3, '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /XObject << /Report 4 0 R >> >> /Contents 5 0 R >>')
  object(4, `<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n${jpeg}\nendstream`)
  const drawing = 'q\n595.28 0 0 841.89 0 0 cm\n/Report Do\nQ\n'
  object(5, `<< /Length ${drawing.length} >>\nstream\n${drawing}endstream`)
  const xref = size
  append('xref\n0 6\n0000000000 65535 f \n')
  for (let i = 1; i <= 5; i++) append(`${String(offsets[i]).padStart(10, '0')} 00000 n \n`)
  append(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`)
  return new Blob(parts as BlobPart[], { type: 'application/pdf' })
}

export async function saveReport(canvas: HTMLCanvasElement, format: 'png' | 'pdf', filename: string) {
  const blob = format === 'pdf' ? reportPDF(canvas) : await new Promise<Blob>((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(Error('图片生成失败，请重试')), 'image/png'))
  if (navigator.userAgent.includes('HuinongAndroid/')) {
    const data = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).split(',')[1]); reader.onerror = () => reject(Error('报告读取失败')); reader.readAsDataURL(blob) })
    if (data.length > 16 * 1024 * 1024) throw Error('报告过大，请减少照片后重试')
    window.__huinongExport = { filename, mime: blob.type, data }
    window.location.href = 'huinong://save-report'
    return 'native'
  }
  const url = URL.createObjectURL(blob), a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  setTimeout(() => URL.revokeObjectURL(url), 60000)
  return 'browser'
}

declare global {
  interface Window { __huinongExport?: { filename: string; mime: string; data: string } }
}
