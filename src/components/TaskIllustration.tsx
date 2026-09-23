import { Sprout, Thermometer, Route, RadioTower, Droplets, Wrench, Bug, Leaf, Scissors, Users, ClipboardList, FlaskConical } from 'lucide-react'
import type { TaskType } from '../store'

export function TaskIllustration({title,type}:{title:string;type:TaskType}) {
  const item = /移栽|播种|育苗/.test(title) ? {Icon:Sprout,label:'移栽育苗'}
    : /温度|测温/.test(title) ? {Icon:Thermometer,label:'温度检查'}
    : /校准|气象/.test(title) ? {Icon:RadioTower,label:'传感校准'}
    : /除草/.test(title) ? {Icon:Scissors,label:'田间除草'}
    : /虫|植保|病害/.test(title) ? {Icon:Bug,label:'病虫监测'}
    : /土壤|采样|复核/.test(title) ? {Icon:FlaskConical,label:'采样复核'}
    : /施肥|追肥|水肥/.test(title) ? {Icon:Leaf,label:'水肥管理'}
    : /灌溉|补水/.test(title) ? {Icon:Droplets,label:'灌溉补水'}
    : /设备|农机|维护/.test(title) ? {Icon:Wrench,label:'设备维护'}
    : /巡查|巡检/.test(title) ? {Icon:Route,label:'田间巡查'}
    : /采摘|采收|收获/.test(title) || type==='采收' ? {Icon:Scissors,label:'采摘作业'}
    : type==='会议' ? {Icon:Users,label:'协作会议'}
    : type==='农机' ? {Icon:Wrench,label:'农机作业'}
    : type==='灌溉施肥' ? {Icon:Droplets,label:'水肥作业'}
    : type==='植保' ? {Icon:Bug,label:'植保作业'} : {Icon:ClipboardList,label:'农事任务'}
  return <span className="task-illustration" role="img" aria-label={item.label}><item.Icon size={27} strokeWidth={1.5}/><small>{item.label}</small></span>
}
