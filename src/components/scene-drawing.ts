export type Point = [number, number]
export type Curve = [Point, Point, Point, Point]
export function curvePoint(points: Curve, t: number): Point {
  const u = 1 - t
  return [0, 1].map(axis => u ** 3 * points[0][axis] + 3 * u * u * t * points[1][axis] + 3 * u * t * t * points[2][axis] + t ** 3 * points[3][axis]) as Point
}
export function traceCurve(ctx: CanvasRenderingContext2D, p: Curve) {
  ctx.beginPath(); ctx.moveTo(...p[0]); ctx.bezierCurveTo(...p[1], ...p[2], ...p[3])
}
export function glow(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color: string, alpha = 1) {
  const light = ctx.createRadialGradient(x, y, 0, x, y, radius)
  light.addColorStop(0, color + Math.round(alpha * 180).toString(16).padStart(2, '0'))
  light.addColorStop(1, color + '00')
  ctx.fillStyle = light; ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill()
}
