import { soilHistory, type SoilSample } from './agronomy'
export type HistoryMetric = 'ec' | 'moisture' | 'temperature'
export const HISTORY_METRICS = [
  {key:'ec' as const,name:'EC 值',unit:'mS/cm',color:'#42785b',digits:2},
  {key:'moisture' as const,name:'土壤水分',unit:'%',color:'#578a99',digits:1},
  {key:'temperature' as const,name:'土壤温度',unit:'°C',color:'#b18952',digits:1},
]
export function historyBounds(sample:SoilSample,key:HistoryMetric):[number,number]{return key==='ec'?[1,1.7]:key==='temperature'?[18,28]:sample.crop==='水稻'?[70,90]:[55,75]}
export function dayWarnings(day:ReturnType<typeof soilHistory>[number],sample:SoilSample){return HISTORY_METRICS.filter(m=>{const [low,high]=historyBounds(sample,m.key);return day[m.key]<low||day[m.key]>high})}
export function metricPosition(value:number,range:string){
 const [low,high]=range.split('–').map(Number);const span=high-low
 const min=Math.min(Math.max(0,low-span*.6),value*.9),max=Math.max(high+span*.6,value*1.1)
 return {low,high,min,max,start:(low-min)/(max-min)*100,width:span/(max-min)*100,pin:(value-min)/(max-min)*100,direction:value<low?'偏低':value>high?'偏高':'范围内',difference:value<low?low-value:value>high?value-high:0}
}
function seeded(seed:number){let s=seed;return()=>{s=(s*9301+49297)%233280;return s/233280}}
const monthLabels=Array.from({length:12},(_,i)=>{const date=new Date();date.setMonth(date.getMonth()-(11-i),1);return `${date.getMonth()+1}月`})
const randomMonthly=seeded(42),randomWeekly=seeded(7)
export const MONTHLY_OPERATIONS=monthLabels.map((month,i)=>({month,water:Math.round(2800+randomMonthly()*1400+Math.sin(i/2)*500),fertilizer:Math.round(60+randomMonthly()*50+(i>5?25:0)),completion:Math.round(68+randomMonthly()*28)}))
export const WEEKLY_PRODUCTION=Array.from({length:52},(_,i)=>({week:`W${i+1}`,yield:Math.round(12+randomWeekly()*16+i/6)}))
export function resourceScenario(water:number,fertilizer:number,waterPrice:number,fertilizerPrice:number,waterReduction:number,fertilizerReduction:number){
 const waterCost=water*waterPrice,fertilizerCost=fertilizer*fertilizerPrice
 const nextWater=water*(1-waterReduction/100),nextFertilizer=fertilizer*(1-fertilizerReduction/100)
 const baseline=waterCost+fertilizerCost,next=nextWater*waterPrice+nextFertilizer*fertilizerPrice
 return{waterCost,fertilizerCost,baseline,next,nextWater,nextFertilizer,saving:baseline-next,savingRate:baseline?(baseline-next)/baseline*100:0}
}
