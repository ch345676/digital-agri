/* ============================================================
 * 真实世界数据接入：浏览器定位 + Open-Meteo 天气（免费无 Key）
 * - 定位成功 → 真实位置；失败/拒绝/8s 超时 → 演示坐标
 * - 坐标持久化 localStorage，下次先用缓存秒开、后台刷新
 * - 天气请求缓存 10 分钟；API 失败静默回退演示数据
 * ============================================================ */
import { useCallback, useEffect, useRef, useState } from 'react'

export interface DailyForecast {
  date: string // YYYY-MM-DD
  code: number
  tMax: number
  tMin: number
  precipMax: number
}

export interface WeatherData {
  temperature: number
  weatherCode: number
  humidity: number
  /** m/s */
  windSpeed: number
  windDirection: number
  /** 当前小时降雨概率 % */
  precipProb: number
  /** 未来 24 小时逐小时降雨概率 % */
  hourlyPrecip24: number[]
  daily: DailyForecast[]
}

export type DataSource = 'live' | 'demo'

/* ---------------- 演示回退数据 ---------------- */

export const DEMO_LOCATION = { lat: 40.1, lon: 116.34 } // 北京郊区农田

export const DEMO_WEATHER: WeatherData = {
  temperature: 26,
  weatherCode: 2,
  humidity: 62,
  windSpeed: 1.8,
  windDirection: 135,
  precipProb: 20,
  hourlyPrecip24: Array(24).fill(10),
  daily: [
    { date: '', code: 2, tMax: 28, tMin: 18, precipMax: 10 },
    { date: '', code: 61, tMax: 25, tMin: 17, precipMax: 60 },
    { date: '', code: 1, tMax: 24, tMin: 16, precipMax: 20 },
  ],
}

/* ---------------- WMO / 风向 / 风级 ---------------- */

export function weatherCodeText(code: number): string {
  if (code === 0) return '晴'
  if (code <= 3) return '多云'
  if (code === 45 || code === 48) return '雾'
  if (code >= 51 && code <= 67) return '雨'
  if (code >= 71 && code <= 77) return '雪'
  if (code >= 80 && code <= 82) return '阵雨'
  if (code >= 95) return '雷暴'
  return '多云'
}

/** 简化图标分组：sunny | cloudy | fog | rain | snow | storm */
export function weatherCodeGroup(code: number): 'sunny' | 'cloudy' | 'fog' | 'rain' | 'snow' | 'storm' {
  if (code === 0) return 'sunny'
  if (code <= 3) return 'cloudy'
  if (code === 45 || code === 48) return 'fog'
  if (code >= 51 && code <= 67) return 'rain'
  if (code >= 71 && code <= 77) return 'snow'
  if (code >= 80 && code <= 82) return 'rain'
  if (code >= 95) return 'storm'
  return 'cloudy'
}

const DIRS = ['北', '东北', '东', '东南', '南', '西南', '西', '西北']
export function windDirectionCN(deg: number): string {
  return DIRS[Math.round(((deg % 360) + 360) % 360 / 45) % 8] + '风'
}

/** m/s → 蒲福风级 */
export function beaufort(ms: number): number {
  const scale = [0.3, 1.6, 3.4, 5.5, 8.0, 10.8, 13.9, 17.2, 20.8]
  for (let i = 0; i < scale.length; i++) if (ms < scale[i]) return i
  return 9
}

/* ---------------- 定位 ---------------- */

const GEO_KEY = 'agri-geo-v1'

interface CachedGeo {
  lat: number
  lon: number
  real: boolean
  ts: number
}

function readCachedGeo(): CachedGeo | null {
  try {
    const raw = localStorage.getItem(GEO_KEY)
    if (raw) return JSON.parse(raw) as CachedGeo
  } catch {
    /* ignore */
  }
  return null
}

export interface GeoState {
  lat: number
  lon: number
  /** 是否真实定位（false=演示位置） */
  located: boolean
  /** 是否还在首次请求中 */
  pending: boolean
  /** 手动重新定位 */
  relocate: () => void
}

export function useGeoLocation(): GeoState {
  const cached = useRef<CachedGeo | null>(readCachedGeo())
  const [state, setState] = useState<{ lat: number; lon: number; located: boolean; pending: boolean }>(
    () =>
      cached.current
        ? { lat: cached.current.lat, lon: cached.current.lon, located: cached.current.real, pending: false }
        : { ...DEMO_LOCATION, located: false, pending: true },
  )

  const request = useCallback(() => {
    if (!navigator.geolocation) {
      setState({ ...DEMO_LOCATION, located: false, pending: false })
      return
    }
    setState((s) => ({ ...s, pending: true }))
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Math.round(pos.coords.latitude * 10000) / 10000
        const lon = Math.round(pos.coords.longitude * 10000) / 10000
        try {
          localStorage.setItem(GEO_KEY, JSON.stringify({ lat, lon, real: true, ts: Date.now() }))
        } catch {
          /* ignore */
        }
        setState({ lat, lon, located: true, pending: false })
      },
      () => {
        // 拒绝/失败/超时：有缓存用缓存，否则演示坐标
        const c = cached.current
        setState(
          c
            ? { lat: c.lat, lon: c.lon, located: false, pending: false }
            : { ...DEMO_LOCATION, located: false, pending: false },
        )
      },
      { timeout: 8000, maximumAge: 10 * 60 * 1000 },
    )
  }, [])

  useEffect(() => {
    // 有缓存：秒开 + 后台静默刷新；无缓存：首次请求
    request()
  }, [request])

  return { ...state, relocate: request }
}

/* ---------------- 天气 ---------------- */

const WX_KEY = 'agri-weather-v1'
const WX_TTL = 10 * 60 * 1000

interface CachedWx {
  key: string
  ts: number
  data: WeatherData
}

function readCachedWx(key: string): WeatherData | null {
  try {
    const raw = localStorage.getItem(WX_KEY)
    if (!raw) return null
    const c = JSON.parse(raw) as CachedWx
    if (c.key === key && Date.now() - c.ts < WX_TTL) return c.data
  } catch {
    /* ignore */
  }
  return null
}

async function fetchWeather(lat: number, lon: number): Promise<WeatherData> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m` +
    `&hourly=precipitation_probability&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max` +
    `&forecast_days=3&timezone=auto`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const j = await res.json()
  const nowHour = new Date().getHours()
  const hourly: number[] = (j.hourly?.precipitation_probability ?? []).slice(nowHour, nowHour + 24)
  const daily: DailyForecast[] = (j.daily?.time ?? []).map((d: string, i: number) => ({
    date: d,
    code: j.daily.weather_code[i],
    tMax: j.daily.temperature_2m_max[i],
    tMin: j.daily.temperature_2m_min[i],
    precipMax: j.daily.precipitation_probability_max?.[i] ?? 0,
  }))
  return {
    temperature: j.current.temperature_2m,
    weatherCode: j.current.weather_code,
    humidity: j.current.relative_humidity_2m,
    windSpeed: j.current.wind_speed_10m,
    windDirection: j.current.wind_direction_10m,
    precipProb: j.hourly?.precipitation_probability?.[nowHour] ?? 0,
    hourlyPrecip24: hourly.length === 24 ? hourly : DEMO_WEATHER.hourlyPrecip24,
    daily,
  }
}

export interface WeatherState {
  data: WeatherData
  /** live=Open-Meteo 实时；demo=演示/离线回退 */
  source: DataSource
}

export function useWeather(lat: number, lon: number): WeatherState {
  const key = `${lat.toFixed(2)},${lon.toFixed(2)}`
  const [state, setState] = useState<WeatherState>(() => {
    const c = readCachedWx(key)
    return c ? { data: c, source: 'live' } : { data: DEMO_WEATHER, source: 'demo' }
  })

  useEffect(() => {
    let cancelled = false
    const cached = readCachedWx(key)
    if (cached) {
      setState({ data: cached, source: 'live' })
      return
    }
    fetchWeather(lat, lon)
      .then((data) => {
        if (cancelled) return
        try {
          localStorage.setItem(WX_KEY, JSON.stringify({ key, ts: Date.now(), data } satisfies CachedWx))
        } catch {
          /* ignore */
        }
        setState({ data, source: 'live' })
      })
      .catch(() => {
        if (!cancelled) setState({ data: DEMO_WEATHER, source: 'demo' })
      })
    return () => {
      cancelled = true
    }
  }, [key, lat, lon])

  return state
}

/** 未来 24 小时是否有明显降雨可能（任一小时 ≥40%） */
export function rainSoon(d: WeatherData): boolean {
  return d.hourlyPrecip24.some((p) => p >= 40)
}
