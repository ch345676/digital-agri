export const ROUTE = [[196,358],[196,91],[286,91],[286,358],[378,358],[378,91],[468,91],[468,365],[520,365],[520,175],[863,175],[863,300],[590,300]]
export const ROUTE_PATH = ROUTE.map(([x,y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' ')
export function routePosition(progress: number) {
  const lengths = ROUTE.slice(1).map(([x,y], i) => Math.hypot(x-ROUTE[i][0], y-ROUTE[i][1]))
  let heading = 0
  let distance = lengths.reduce((a,b) => a+b, 0) * Math.max(0, Math.min(100, progress)) / 100
  for (let i=0;i<lengths.length;i++) {
    const [dx,dy] = [ROUTE[i+1][0]-ROUTE[i][0],ROUTE[i+1][1]-ROUTE[i][1]]
    const angle = Math.atan2(dy,dx)*180/Math.PI+90
    heading += ((angle-heading+540)%360)-180
    if (distance <= lengths[i]) {
      const fraction = distance / lengths[i]
      return [ROUTE[i][0] + (ROUTE[i+1][0]-ROUTE[i][0])*fraction, ROUTE[i][1] + (ROUTE[i+1][1]-ROUTE[i][1])*fraction, heading]
    }
    distance -= lengths[i]
  }
  return [...ROUTE[ROUTE.length-1], heading]
}
