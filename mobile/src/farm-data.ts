export interface FieldInfo {
  id: string
  code: string
  name: string
  crop: string
  variety: string
  area: number
  stageName: string
  stagePct: number
  health: number
  soilMoisture: number
  ph: number
  harvest: string
  nextAction: string
}

export const FIELDS: FieldInfo[] = [
  { id: 'A1', code: 'A1', name: 'A1 地块', crop: '水稻', variety: '甬优 1540', area: 32.6, stageName: '分蘖期', stagePct: 65, health: 88, soilMoisture: 82, ph: 6.2, harvest: '2026-10-05', nextAction: '追施分蘖肥' },
  { id: 'A2', code: 'A2', name: 'A2 地块', crop: '玉米', variety: '先玉 335', area: 28.4, stageName: '拔节期', stagePct: 45, health: 82, soilMoisture: 56, ph: 6.5, harvest: '2026-09-25', nextAction: '中耕除草' },
  { id: 'B1', code: 'B1', name: 'B1 地块', crop: '大豆', variety: '黑河 43', area: 26.7, stageName: '开花期', stagePct: 58, health: 80, soilMoisture: 61, ph: 6.8, harvest: '2026-09-28', nextAction: '叶面喷肥' },
  { id: 'B2', code: 'B2', name: 'B2 地块', crop: '蔬菜', variety: '上海青', area: 18.3, stageName: '莲座期', stagePct: 72, health: 84, soilMoisture: 66, ph: 6.0, harvest: '2026-09-18', nextAction: '采收准备' },
  { id: 'C1', code: 'C1', name: 'C1 地块', crop: '小麦（试验）', variety: '济麦 22', area: 15.2, stageName: '苗期', stagePct: 20, health: 76, soilMoisture: 49, ph: 6.4, harvest: '2027-06-01', nextAction: '试验数据采集' },
]


export const FARM_IMAGERY = { image: "./media/real/farm-satellite.jpg" }
