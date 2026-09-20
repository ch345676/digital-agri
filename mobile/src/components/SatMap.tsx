import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useGeoLocation } from '../lib/weather'

export interface SatCenter {
  lat: number
  lon: number
}

/**
 * 移动端暗色卫星地图底座（Esri World Imagery + Leaflet）
 * - 复用 weather 模块定位逻辑（agri-geo-v1 缓存 / 拒绝回退演示坐标）
 * - 暗色罩 + 暗色 attribution，徽标「已定位/演示位置」
 * - onView：地图就绪或定位变化时回调，由调用方重建业务覆盖物
 */
export function SatMap({
  onView,
  onMapReady,
  className = '',
  badgeSide = 'right',
}: {
  /** 地图就绪 / 定位中心变化时调用（map 已指向新中心） */
  onView?: (map: L.Map, center: SatCenter) => void
  /** 仅首次就绪时回调（用于挂控件引用） */
  onMapReady?: (map: L.Map) => void
  className?: string
  /** 徽标位置：right（默认）/ left（避让右侧控件栈） */
  badgeSide?: 'left' | 'right'
}) {
  const geo = useGeoLocation()
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const viewRef = useRef(onView)
  const readyRef = useRef(onMapReady)
  viewRef.current = onView
  readyRef.current = onMapReady

  /* 初始化（一次） */
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    const map = L.map(containerRef.current, {
      center: [geo.lat, geo.lon],
      zoom: 16,
      zoomControl: false,
      attributionControl: true,
      scrollWheelZoom: false,
    })
    map.attributionControl.setPrefix(false)
    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      { attribution: 'Esri', maxZoom: 19 },
    ).addTo(map)
    const labels = L.tileLayer(
      'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
      { maxZoom: 19, opacity: 0.8 },
    )
    mapRef.current = map
    ;(map as L.Map & { _labelsLayer?: L.TileLayer })._labelsLayer = labels
    const t = setTimeout(() => map.invalidateSize(), 120)
    readyRef.current?.(map)
    return () => {
      clearTimeout(t)
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* 定位中心变化 */
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    map.setView([geo.lat, geo.lon], map.getZoom())
    viewRef.current?.(map, { lat: geo.lat, lon: geo.lon })
  }, [geo.lat, geo.lon])

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div ref={containerRef} className="lm-dark h-full w-full" />
      {/* 极淡暗色罩，统一暗色 UI */}
      <div className="pointer-events-none absolute inset-0 z-[401] bg-[rgba(6,9,6,0.15)]" />
      {/* 定位徽标 */}
      <div className={`absolute top-3 z-[500] flex items-center gap-1.5 rounded-full border border-white/[0.1] bg-[rgba(10,15,11,0.8)] px-2.5 py-1 text-[10px] font-medium ${badgeSide === 'left' ? 'left-3' : 'right-3'}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${geo.located ? 'bg-[#a3e635]' : 'bg-white/30'}`} />
        <span className={geo.located ? 'text-[#a3e635]' : 'text-white/40'}>
          {geo.pending ? '定位中…' : geo.located ? '已定位' : '演示位置'}
        </span>
      </div>
    </div>
  )
}

/** 切换注记层显隐（图层按钮用） */
export function toggleLabels(map: L.Map): boolean {
  const m = map as L.Map & { _labelsLayer?: L.TileLayer }
  if (!m._labelsLayer) return false
  if (map.hasLayer(m._labelsLayer)) {
    map.removeLayer(m._labelsLayer)
    return false
  }
  m._labelsLayer.addTo(map)
  return true
}
