import { Bug, ShieldAlert, CloudSun, Database, MapPin, Thermometer, Droplets, Wheat } from 'lucide-react'
import type { RiskLevel } from '../components/pro'

/* ================= 病虫害预警数据（南瓜适配，趋势本地生成） ================= */

export type AlertKind = 'disease' | 'pest'

export interface AlertDef {
  id: string
  kind: AlertKind
  name: string
  level: RiskLevel
  field: string
  time: string // 发布时间
  prob: number // 发病/发生概率 %
  tempRange: string
  humidityRange: string
  /* 预警详情信息表 */
  typeLabel: string
  basis: string
  envNow: string
  focusDays: string
  /* hero 5 格统计 */
  position: string
  tempNow: string
  humidityNow: string
  source: string
  /* 预警信息 2x2 网格 */
  peak: string // 预测发生高峰期
  densityLabel: string // 当前虫口密度 / 病斑率
  densityValue: string
  dayChange: string
  /* 病害/虫害详情 */
  detailName: string
  hosts: string
  symptom: string
  /* 防治建议三类（编号列表） */
  control: { title: string; items: string[] }[]
  /* 趋势生成基数 */
  trendBase: number
  trendUnit: string
  trendName: string
  fromPatrol?: boolean
}

export const ALERT_DEFS: AlertDef[] = [
  {
    id: 'alt-bafen',
    kind: 'disease',
    name: '白粉病',
    level: 'high',
    field: '2号南瓜田',
    time: '2026-09-14 08:30',
    prob: 85,
    tempRange: '18~24℃',
    humidityRange: '85~95%',
    typeLabel: '南瓜白粉病',
    basis: '温湿度条件适宜 + 历史发病数据 + 病害模型分析',
    envNow: '温度 22.1℃  湿度 90%  持续时间 36小时',
    focusDays: '未来 3~5 天',
    position: '中部偏东',
    tempNow: '26.8℃',
    humidityNow: '88%',
    source: '智能监测设备',
    peak: '2026-09-15 ~ 2026-09-17',
    densityLabel: '当前病斑率（平均）',
    densityValue: '12.6 %',
    dayChange: '+28%',
    detailName: '白粉病（Podosphaera xanthii）',
    hosts: '南瓜、黄瓜、西葫芦等葫芦科作物',
    symptom: '叶片正面出现白色粉状霉斑，逐渐扩展连片，严重时叶片枯黄早落，影响坐果与膨大。',
    control: [
      { title: '农业防治', items: ['加强通风降湿，控制田间湿度在 70% 以下', '及时摘除病叶、病株并带出田外销毁，减少病源'] },
      { title: '物理防治', items: ['合理密植，改善行间通风透光条件', '雨后及时排湿，避免叶面长时间积水'] },
      { title: '生物/化学防治', items: ['建议使用醚菌酯、苯醚甲环唑等药剂预防，7~10 天一次', '注意轮换用药，避免产生抗药性'] },
    ],
    trendBase: 12,
    trendUnit: '%',
    trendName: '病斑率',
  },
  {
    id: 'alt-shuangmei',
    kind: 'disease',
    name: '霜霉病',
    level: 'mid',
    field: '3号南瓜田',
    time: '2026-09-13 17:20',
    prob: 62,
    tempRange: '16~22℃',
    humidityRange: '80~90%',
    typeLabel: '南瓜霜霉病',
    basis: '连续阴雨高湿 + 病害模型分析',
    envNow: '温度 20.4℃  湿度 86%  持续时间 18小时',
    focusDays: '未来 3 天',
    position: '西北部',
    tempNow: '25.1℃',
    humidityNow: '82%',
    source: '智能监测设备',
    peak: '2026-09-14 ~ 2026-09-16',
    densityLabel: '当前病斑率（平均）',
    densityValue: '6.8 %',
    dayChange: '+12%',
    detailName: '霜霉病（Pseudoperonospora cubensis）',
    hosts: '南瓜、黄瓜、甜瓜等',
    symptom: '叶片背面产生灰紫色霉层，正面黄斑多角形扩展，发展迅速，易造成大面积落叶。',
    control: [
      { title: '农业防治', items: ['控制灌溉量，采用滴灌避免叶面结露', '增施磷钾肥，提高植株抗病性'] },
      { title: '物理防治', items: ['日出前短时通风排湿', '清除田边杂草，减少病菌寄主'] },
      { title: '生物/化学防治', items: ['发病初期选用霜霉威盐酸盐、烯酰吗啉喷雾', '重点喷施叶背，7 天一次连喷 2~3 次'] },
    ],
    trendBase: 7,
    trendUnit: '%',
    trendName: '病斑率',
  },
  {
    id: 'alt-yachong',
    kind: 'pest',
    name: '蚜虫',
    level: 'mid',
    field: '1号南瓜田',
    time: '2026-09-12 09:30',
    prob: 58,
    tempRange: '20~28℃',
    humidityRange: '60~75%',
    typeLabel: '蚜虫（Aphididae）',
    basis: '虫口密度持续上升 + 气象适宜度分析',
    envNow: '温度 26.8℃  湿度 68%  无降雨 48小时',
    focusDays: '未来 5~7 天',
    position: '中部偏东',
    tempNow: '28.6℃',
    humidityNow: '68%',
    source: '虫情测报灯 + 巡检车',
    peak: '2026-09-15 ~ 2026-09-18',
    densityLabel: '当前虫口密度（平均）',
    densityValue: '32 头/叶',
    dayChange: '+28%',
    detailName: '蚜虫（Aphididae）',
    hosts: '南瓜、黄瓜、辣椒等',
    symptom: '群集在叶片、嫩茎和花蕾上吸食汁液，导致叶片卷曲、发黄，植株生长受阻，严重时造成落花落果。',
    control: [
      { title: '农业防治', items: ['及时清除田间杂草，合理通风，降低田间湿度，保持环境清洁'] },
      { title: '物理防治', items: ['悬挂黄色粘虫板诱杀有翅蚜虫，每亩建议 20~30 块'] },
      { title: '生物/化学防治', items: ['发生初期可选用吡虫啉、啶虫脒等药剂喷雾防治，注意轮换用药，避免抗药性'] },
    ],
    trendBase: 32,
    trendUnit: '头/叶',
    trendName: '虫口密度',
  },
  {
    id: 'alt-hongzhizhu',
    kind: 'pest',
    name: '红蜘蛛',
    level: 'low',
    field: '4号南瓜田',
    time: '2026-09-11 14:10',
    prob: 34,
    tempRange: '22~30℃',
    humidityRange: '45~60%',
    typeLabel: '叶螨（红蜘蛛）',
    basis: '高温低湿趋势 + 虫情基数分析',
    envNow: '温度 29.2℃  湿度 52%  持续干热 24小时',
    focusDays: '未来 7 天',
    position: '南部边缘',
    tempNow: '29.2℃',
    humidityNow: '52%',
    source: '虫情测报灯',
    peak: '2026-09-16 ~ 2026-09-20',
    densityLabel: '当前虫口密度（平均）',
    densityValue: '8 头/叶',
    dayChange: '+6%',
    detailName: '红蜘蛛（Tetranychidae）',
    hosts: '南瓜、豆类、茄科作物等',
    symptom: '成螨在叶背刺吸汁液，叶面出现黄白色小点，严重时叶片枯黄脱落，影响光合作用。',
    control: [
      { title: '农业防治', items: ['适时灌溉保持田间湿度，抑制螨类繁殖'] },
      { title: '物理防治', items: ['清除田埂杂草与落叶，减少越冬虫源'] },
      { title: '生物/化学防治', items: ['点片发生时选用阿维菌素、哒螨灵喷雾，重点喷叶背'] },
    ],
    trendBase: 8,
    trendUnit: '头/叶',
    trendName: '虫口密度',
  },
]

/** 巡检确认的「疑似病斑」→ 预警 */
export function patrolToAlert(p: { id: string; zone: string; time: string }): AlertDef {
  return {
    ...ALERT_DEFS[0],
    id: `patrol-${p.id}`,
    name: '白粉病（疑似）',
    level: 'mid',
    field: `巡检分区 ${p.zone}`,
    time: p.time,
    prob: 55,
    fromPatrol: true,
    basis: '巡检车光谱扫描发现疑似病斑 + 人工确认',
  }
}

/* ---------- 确定性趋势数据（按 id + 天数本地生成） ---------- */
function seedOf(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (Math.imul(h, 31) + s.charCodeAt(i)) >>> 0
  return h
}

/** 虫口密度/病斑率趋势：缓升到峰再回落 */
export function pestTrend(id: string, days: number, base: number): number[] {
  let s = seedOf(id)
  const rnd = () => {
    s = (Math.imul(s, 1103515245) + 12345) >>> 0
    return (s >> 8) / 0xffffff
  }
  const arr: number[] = []
  const peakAt = days * 0.62
  for (let i = 0; i < days; i++) {
    const shape = base * (0.45 + 0.75 * Math.exp(-((i - peakAt) ** 2) / (days * 0.32)))
    arr.push(Math.max(1, Math.round((shape + rnd() * base * 0.14) * 10) / 10))
  }
  arr[days - 1] = base
  return arr
}

/** 环境因素趋势（湿度 %） */
export function envTrend(id: string, days: number): number[] {
  let s = seedOf(id + 'env')
  const rnd = () => {
    s = (Math.imul(s, 1103515245) + 12345) >>> 0
    return (s >> 8) / 0xffffff
  }
  const arr: number[] = []
  let v = 62
  for (let i = 0; i < days; i++) {
    v = Math.min(94, Math.max(46, v + (rnd() - 0.42) * 7))
    arr.push(Math.round(v))
  }
  return arr
}

export const TREND_ICONS = { Bug, ShieldAlert, CloudSun, Database, MapPin, Thermometer, Droplets, Wheat }
