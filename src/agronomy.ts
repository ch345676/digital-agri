import { FIELDS, todayStr } from './store'

// Demonstration fixtures, never presented as connected sensor measurements.
export const SAMPLES = FIELDS.map((field, i) => ({
  ...field, village: ['巨龙村', '金石村', '太平桥村', '粉店村', '巨龙村'][i],
  temperature: [22.6, 24.1, 20.8, 23.4, 21.6][i],
  ec: [1.21, 1.86, 1.22, 1.34, 1.08][i], nitrogen: [110, 98, 90, 106, 72][i],
  phosphorus: [42, 38, 45, 41, 32][i], potassium: [210, 185, 200, 220, 160][i],
  organic: [3.2, 2.6, 2.8, 3.1, 2.3][i], sampled: `${todayStr()} 08:30`,
}))
export type SoilSample = typeof SAMPLES[number]
export function soilMetrics(s: SoilSample) {
  return [
    { name: '温度', value: s.temperature, unit: '°C', range: '18–28', warning: s.temperature < 18 || s.temperature > 28 },
    { name: '水分', value: s.soilMoisture, unit: '%', range: s.crop === '水稻' ? '70–90' : '55–75', warning: s.crop === '水稻' ? s.soilMoisture < 70 || s.soilMoisture > 90 : s.soilMoisture < 55 || s.soilMoisture > 75 },
    { name: 'EC 值', value: s.ec, unit: 'mS/cm', range: '1.0–1.7', warning: s.ec < 1 || s.ec > 1.7 },
    { name: 'pH 值', value: s.ph, unit: '', range: '5.5–7.5', warning: s.ph < 5.5 || s.ph > 7.5 },
    { name: '氮含量', value: s.nitrogen, unit: 'mg/kg', range: '80–120', warning: s.nitrogen < 80 || s.nitrogen > 120 },
    { name: '磷含量', value: s.phosphorus, unit: 'mg/kg', range: '30–50', warning: s.phosphorus < 30 || s.phosphorus > 50 },
    { name: '钾含量', value: s.potassium, unit: 'mg/kg', range: '150–250', warning: s.potassium < 150 || s.potassium > 250 },
    { name: '有机质', value: s.organic, unit: '%', range: '2.5–4.0', warning: s.organic < 2.5 || s.organic > 4 },
  ]
}
export function soilScore(s: SoilSample) { return 96 - soilMetrics(s).filter(m => m.warning).length * 9 }
export const ALERTS = [
  { id: 'A01', field: 'A1', title: '白粉病疑似风险', level: '高风险', source: 'RGB 视觉识别', detail: '叶面发现白色斑点，建议人工复核并记录病斑分布。', action: '植保复查', time: '06:30', confidence: 95 },
  { id: 'A02', field: 'A2', title: 'EC 值超出示例阈值', level: '中风险', source: '土壤采样', detail: 'EC 1.86 mS/cm，超过演示上限 1.7；建议复测并检查施肥记录。', action: '土壤复测', time: '07:00', confidence: null },
  { id: 'A03', field: 'B1', title: '霜霉病疑似风险', level: '中风险', source: '多光谱筛查', detail: '局部叶片光谱异常，建议现场核查叶背及田间通风情况。', action: '植保复查', time: '07:20', confidence: 87 },
  { id: 'A04', field: 'B2', title: '蚜虫聚集预警', level: '高风险', source: 'RGB 视觉识别', detail: '虫情样本中发现蚜虫聚集，建议核查发生范围后安排处置。', action: '虫情核查', time: '07:45', confidence: 93 },
  { id: 'A05', field: 'C1', title: '土壤水分不足', level: '低风险', source: '土壤采样', detail: '采样水分 49%，低于示例下限 55%；建议现场复测后安排补水。', action: '灌溉复核', time: '08:10', confidence: null },
] as const
export function alertTaskTitle(a: typeof ALERTS[number]) { return `[${a.id}] ${a.field} ${a.action}` }
export function soilHistory(fieldId: string, days: number) {
  const s = SAMPLES.find(x => x.id === fieldId) ?? SAMPLES[0]
  const index = SAMPLES.indexOf(s)
  return Array.from({ length: days }, (_, i) => {
    const back = days - 1 - i
    return { date: todayStr(-back), label: todayStr(-back).slice(5).replace('-', '/'),
      ec: +(s.ec + Math.sin(back * 1.3 + index) * (back ? .18 : 0)).toFixed(2),
      moisture: +(s.soilMoisture + Math.sin(back * .8 + index) * (back ? 3 : 0)).toFixed(1),
      temperature: +(s.temperature + Math.sin(back * .6 + index) * (back ? 2.1 : 0)).toFixed(1),
      rgb: Math.round(8 + Math.sin(back * .6) * 4 + back * .3),
      spectral: Math.round(12 + Math.sin(back * .6) * 6 + back * .4),
      thermal: Math.round(5 + Math.sin(back * .6) * 3 + back * .2),
    }
  })
}
export const HARVEST = FIELDS.map((field, i) => ({ ...field,
  maturity: [38, 76, 61, 94, 12][i], days: [15, 5, 8, 1, 45][i],
  quality: [82, 88, 85, 92, 70][i], yieldPerMu: [560, 610, 190, 1800, 420][i],
}))
export function downloadCSV(name: string, rows: (string | number)[][]) {
  const text = '\uFEFF' + rows.map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\r\n')
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a'); a.href = url; a.download = name; a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
