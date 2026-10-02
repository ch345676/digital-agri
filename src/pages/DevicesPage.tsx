import { useEffect, useState } from 'react'
import { COMMAND_NAMES } from '../workflow-model'
import { usePageState } from '../use-page-state'
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
import { Count } from '../components/Motion'

const KIND_ICONS: Record<Device['kind'], typeof Radar> = {
  soil: Gauge,
  weather: CloudSun,
  valve: Droplets,
  pest: Bug,
}

function DeviceCard({ device }: { device: Device }) {
  const { readings, valves, toggleValve, deviceModes, lastSeen, setDeviceMode, workflow, sendValve } = useStore()
  const online = deviceModes[device.id] !== 'offline'
  const command = workflow.commands.find(c=>c.deviceId===device.id)
  const busy = !!command && !['done','failed'].includes(command.phase)
  const [now,setNow]=useState(Date.now)
  useEffect(()=>{const t=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(t)},[])
  const age=lastSeen[device.id]?Math.max(0,Math.floor((now-lastSeen[device.id])/1000)):null
  const stale=age!==null&&age>=12
  const r = readings[device.id] ?? { v1: device.base, v2: device.base2 ?? 0 }
  const isValve = device.kind === 'valve'
  const valveOn = !!valves[device.id]
  const Icon = KIND_ICONS[device.kind]

  return (
    <PageCard data-motion-item={`device-${device.id}`} className={`device-card flex flex-col ${!online ? 'device-offline' : ''}`}>
      <div className="device-card-heading flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-xl ${
              online ? 'bg-[#e4f7ec]' : 'bg-[#f3f4f6]'
            }`}
          >
            <Icon className={`h-5 w-5 ${online ? 'text-[#178a45]' : 'text-[#9ca3af]'}`} />
          </div>
          <div>
            <div className="text-[14.5px] font-bold text-[#17352a]">{device.name}</div>
            <div className="text-[12px] text-[#8aa398]">{device.field}</div>
          </div>
        </div>
        <span
          className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
            online ? 'bg-[#e4f7ec] text-[#178a45]' : 'bg-[#fdeeee] text-[#e05252]'
          }`}
        >
          {online ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
          {!online?'离线':stale?'数据过期':'在线'}
        </span>
      </div>

      <div data-motion-key={isValve?String(valveOn):device.id} data-irrigating={isValve&&valveOn} data-ambient-motion className="device-values mt-4 flex items-end justify-between rounded-xl bg-[#f5faf7] p-3.5">
        {online ? (
          <>
            <div>
              <div className="text-[12px] text-[#8aa398]">{isValve && !valveOn ? '当前状态' : device.metricLabel}</div>
              <div className="mt-0.5 text-[24px] font-extrabold leading-none text-[#17352a]">
                {isValve && !valveOn ? (
                  <span className="text-[16px] font-bold text-[#8aa398]">已关闭</span>
                ) : (
                  <>
                    <Count value={r.v1} decimals={Number.isInteger(r.v1)?0:1}/>
                    <span className="ml-1 text-[13px] font-semibold text-[#8aa398]">{device.metricUnit}</span>
                  </>
                )}
              </div>
            </div>
            {device.metric2Label && (
              <div className="text-right">
                <div className="text-[12px] text-[#8aa398]">{device.metric2Label}</div>
                <div className="mt-0.5 text-[16px] font-bold text-[#17352a]">
                  <Count value={r.v2} decimals={Number.isInteger(r.v2)?0:1}/>
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

      {isValve && (
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
          <Switch on={valveOn} disabled={busy} onChange={() => toggleValve(device.id)} />
        </div>
      )}

      <div className="device-connection-control"><label>通信演示<select aria-label={device.id+' 通信演示'} value={deviceModes[device.id]} onChange={e=>setDeviceMode(device.id,e.target.value as 'online'|'offline'|'stale')}><option value="online">正常接收</option><option value="offline">模拟断线</option><option value="stale">暂停数据</option></select></label><span className={stale?'warning':''}>{age===null?'尚无接收记录':age+' 秒前接收'}{stale?' · 数据已过期':''}</span></div>
      {command&&<div className="command-status" data-state={command.phase} aria-live="polite"><div><b>{COMMAND_NAMES[command.phase]}</b><span>{command.target?'开启':'关闭'}指令</span></div><ol className="command-rail">{(['sending','confirmed','executing','done'] as const).map(p=><li key={p} className={command.steps.some(s=>s.phase===p)?'reached':''}>{COMMAND_NAMES[p]}</li>)}</ol><small>{command.message}</small>{command.phase==='failed'&&<button className="secondary-btn" onClick={()=>sendValve(device.id,command.target)}>重试相同指令</button>}</div>}
      <DevicePhoto id={device.id}/>
      <div className="device-update mt-auto pt-3 text-[11px] text-[#a4bcb1]">
        {online ? '演示数据 · 每 3 秒模拟更新，后台暂停' : '模拟离线 · 恢复通信后可重试'}
      </div>
    </PageCard>
  )
}

export default function DevicesPage() {
  const { readings, valves, deviceModes, context, workflow } = useStore()
  const [status, setStatus] = usePageState<string>('devices-status','all')
  const [kind, setKind] = usePageState<string>('devices-kind','all')
  const scoped=DEVICES.filter(d=>!context.fieldId||d.field.includes(context.fieldId)||d.kind==='weather')
  const visible = scoped.filter(d => (status === 'all' || (deviceModes[d.id]!=='offline') === (status === 'online')) && (kind === 'all' || d.kind === kind))
  const online = scoped.filter((d) => deviceModes[d.id]!=='offline').length
  const onlineRate = Math.round((online / scoped.length) * 100)
  const lowMoisture = scoped.filter(
    (d) => d.kind === 'soil' && deviceModes[d.id]!=='offline' && (readings[d.id]?.v1 ?? d.base) < 55,
  ).length
  const alarms = scoped.length - online + lowMoisture
  const irrigating = scoped.filter(d=>d.kind==='valve'&&valves[d.id]).length

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
              {online} / {scoped.length}
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
          <div className="text-[20px] font-extrabold text-[#1e8fe0]"><Count value={irrigating}/></div>
          <div className="text-[12px] text-[#8aa398]">灌溉中阀门</div>
        </div>
      </PageCard>

      <div className="device-toolbar"><div className="segmented" aria-label="设备状态筛选">{[{id:'all',label:'全部设备 '+scoped.length},{id:'online',label:'在线 '+online},{id:'offline',label:'离线 '+(scoped.length-online)}].map(item=><button key={item.id} aria-pressed={status===item.id} className={status===item.id?'active':''} onClick={()=>setStatus(item.id)}>{item.label}</button>)}</div><label>设备类型<select value={kind} onChange={e=>setKind(e.target.value)}><option value="all">全部类型</option><option value="soil">土壤墒情</option><option value="weather">气象站</option><option value="valve">灌溉阀门</option><option value="pest">虫情监测</option></select></label></div>
      <div className="device-grid">
        {visible.map((d) => (
          <DeviceCard key={d.id} device={d} />
        ))}
      </div>
      <details className="panel command-log"><summary>模拟指令日志 · {workflow.commands.length} 条</summary>{workflow.commands.length?workflow.commands.map(c=><div key={c.id}><span>{c.deviceId} · {c.target?'开启':'关闭'}</span><b>{COMMAND_NAMES[c.phase]}</b><time>{c.at.replace('T',' ')}</time><small>{c.message}</small></div>):<p>发送一次阀门指令后，可查看确认、执行与失败记录。</p>}</details>
      {visible.length===0&&<div className="device-empty" role="status"><Radar size={24}/><p>当前筛选下没有设备</p><button className="secondary-btn" onClick={()=>{setStatus('all');setKind('all')}}>显示全部设备</button></div>}
    </div>
  )
}
