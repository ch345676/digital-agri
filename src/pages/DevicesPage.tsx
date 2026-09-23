import { useState } from 'react'
import {
  Radar,
  CloudSun,
  Droplets,
  Bug,
  Wifi,
  WifiOff,
  AlertTriangle,
  Gauge,
} from 'lucide-react'
import { useStore, DEVICES, type Device } from '../store'
import { PageCard, PageHeader, Switch } from '../components/bits'
import DevicePhoto from '../components/DevicePhoto'

const KIND_ICONS: Record<Device['kind'], typeof Radar> = {
  soil: Gauge,
  weather: CloudSun,
  valve: Droplets,
  pest: Bug,
}

function DeviceCard({ device }: { device: Device }) {
  const { readings, valves, toggleValve } = useStore()
  const r = readings[device.id] ?? { v1: device.base, v2: device.base2 ?? 0 }
  const isValve = device.kind === 'valve'
  const valveOn = !!valves[device.id]
  const Icon = KIND_ICONS[device.kind]

  return (
    <PageCard className={`device-card flex flex-col ${!device.online ? 'device-offline' : ''}`}>
      <div className="device-card-heading flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-xl ${
              device.online ? 'bg-[#e4f7ec]' : 'bg-[#f3f4f6]'
            }`}
          >
            <Icon className={`h-5 w-5 ${device.online ? 'text-[#178a45]' : 'text-[#9ca3af]'}`} />
          </div>
          <div>
            <div className="text-[14.5px] font-bold text-[#17352a]">{device.name}</div>
            <div className="text-[12px] text-[#8aa398]">{device.field}</div>
          </div>
        </div>
        <span
          className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
            device.online ? 'bg-[#e4f7ec] text-[#178a45]' : 'bg-[#fdeeee] text-[#e05252]'
          }`}
        >
          {device.online ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
          {device.online ? '在线' : '离线'}
        </span>
      </div>

      <div className="device-values mt-4 flex items-end justify-between rounded-xl bg-[#f5faf7] p-3.5">
        {device.online ? (
          <>
            <div>
              <div className="text-[12px] text-[#8aa398]">{isValve && !valveOn ? '当前状态' : device.metricLabel}</div>
              <div className="mt-0.5 text-[24px] font-extrabold leading-none text-[#17352a]">
                {isValve && !valveOn ? (
                  <span className="text-[16px] font-bold text-[#8aa398]">已关闭</span>
                ) : (
                  <>
                    {r.v1}
                    <span className="ml-1 text-[13px] font-semibold text-[#8aa398]">{device.metricUnit}</span>
                  </>
                )}
              </div>
            </div>
            {device.metric2Label && (
              <div className="text-right">
                <div className="text-[12px] text-[#8aa398]">{device.metric2Label}</div>
                <div className="mt-0.5 text-[16px] font-bold text-[#17352a]">
                  {r.v2}
                  <span className="ml-0.5 text-[12px] font-semibold text-[#8aa398]">{device.metric2Unit}</span>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex w-full items-center gap-2 text-[13px] text-[#a4bcb1]">
            <AlertTriangle className="h-4 w-4 text-[#e05252]" />
            设备离线，暂无数据
          </div>
        )}
      </div>

      {isValve && device.online && (
        <div className="mt-3 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[12.5px] font-semibold">
            {valveOn ? (
              <>
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#2196e8] opacity-60" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#2196e8]" />
                </span>
                <span className="text-[#1e8fe0]">灌溉中</span>
              </>
            ) : (
              <span className="text-[#8aa398]">阀门关闭</span>
            )}
          </span>
          <Switch on={valveOn} onChange={() => toggleValve(device.id)} />
        </div>
      )}

      <DevicePhoto id={device.id}/>
      <div className="device-update mt-auto pt-3 text-[11px] text-[#a4bcb1]">
        {device.online ? '演示数据 · 每 3 秒模拟更新' : '请检查设备电源与网络'}
      </div>
    </PageCard>
  )
}

export default function DevicesPage() {
  const { readings, valves } = useStore()
  const [status, setStatus] = useState('all')
  const [kind, setKind] = useState('all')
  const visible = DEVICES.filter(d => (status === 'all' || d.online === (status === 'online')) && (kind === 'all' || d.kind === kind))
  const online = DEVICES.filter((d) => d.online).length
  const onlineRate = Math.round((online / DEVICES.length) * 100)
  const lowMoisture = DEVICES.filter(
    (d) => d.kind === 'soil' && d.online && (readings[d.id]?.v1 ?? d.base) < 55,
  ).length
  const alarms = DEVICES.length - online + lowMoisture
  const irrigating = Object.values(valves).filter(Boolean).length

  return (
    <div>
      <PageHeader title="设备监控" desc="关注设备连通、田间读数与灌溉状态；点击照片查看现场参考。" />

      {/* 汇总条 */}
      <PageCard className="device-summary mb-5 flex items-center gap-10">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e4f7ec]">
            <Radar className="h-5 w-5 text-[#178a45]" />
          </div>
          <div>
            <div className="text-[20px] font-extrabold text-[#17352a]">
              {online} / {DEVICES.length}
            </div>
            <div className="text-[12px] text-[#8aa398]">在线设备</div>
          </div>
        </div>
        <div>
          <div className="text-[20px] font-extrabold text-[#178a45]">{onlineRate}%</div>
          <div className="text-[12px] text-[#8aa398]">在线率</div>
        </div>
        <div>
          <div className={`text-[20px] font-extrabold ${alarms > 0 ? 'text-[#e05252]' : 'text-[#17352a]'}`}>
            {alarms}
          </div>
          <div className="text-[12px] text-[#8aa398]">告警数（离线 + 墒情偏低）</div>
        </div>
        <div>
          <div className="text-[20px] font-extrabold text-[#1e8fe0]">{irrigating}</div>
          <div className="text-[12px] text-[#8aa398]">灌溉中阀门</div>
        </div>
      </PageCard>

      <div className="device-toolbar"><div className="segmented" aria-label="设备状态筛选">{[{id:'all',label:'全部设备 '+DEVICES.length},{id:'online',label:'在线 '+online},{id:'offline',label:'离线 '+(DEVICES.length-online)}].map(item=><button key={item.id} aria-pressed={status===item.id} className={status===item.id?'active':''} onClick={()=>setStatus(item.id)}>{item.label}</button>)}</div><label>设备类型<select value={kind} onChange={e=>setKind(e.target.value)}><option value="all">全部类型</option><option value="soil">土壤墒情</option><option value="weather">气象站</option><option value="valve">灌溉阀门</option><option value="pest">虫情监测</option></select></label></div>
      <div className="device-grid">
        {visible.map((d) => (
          <DeviceCard key={d.id} device={d} />
        ))}
      </div>
      {visible.length===0&&<div className="device-empty" role="status"><Radar size={24}/><p>当前筛选下没有设备</p><button className="secondary-btn" onClick={()=>{setStatus('all');setKind('all')}}>显示全部设备</button></div>}
    </div>
  )
}
