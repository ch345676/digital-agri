const GREEN_DEEP = '#178a45'

/** 监测点标记：白色圆形图钉 + 绿色信号塔 */
function MonitorPin({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <path d="M0 14 L-7 -2 A 15 15 0 1 1 7 -2 Z" fill="#ffffff" opacity="0.95" />
      <circle cx="0" cy="-4" r="11" fill="#ffffff" />
      <g stroke={GREEN_DEEP} strokeWidth="2" fill="none" strokeLinecap="round">
        <path d="M0 -1 L-4.5 -10 M0 -1 L4.5 -10 M-3 -7.5 L3 -7.5" />
        <path d="M-3.2 -13 A 4.5 4.5 0 0 1 3.2 -13" />
        <path d="M-5.4 -15.4 A 8 8 0 0 1 5.4 -15.4" transform="translate(0,1.6)" />
      </g>
      <circle cx="0" cy="-11" r="1.8" fill={GREEN_DEEP} />
    </g>
  )
}

/** 取水点：蓝色水滴图钉 */
function WaterPin({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <path d="M0 16 L-8 -1 A 16 16 0 1 1 8 -1 Z" fill="#1e8fe0" />
      <circle cx="0" cy="-3" r="12" fill="#1e8fe0" />
      <path
        d="M0 -10 C 3.4 -5, 5 -2.6, 5 -0.4 A 5 5 0 1 1 -5 -0.4 C -5 -2.6, -3.4 -5, 0 -10 Z"
        fill="#ffffff"
      />
    </g>
  )
}

function FieldLabel({ x, y, name, area }: { x: number; y: number; name: string; area: string }) {
  return (
    <g
      transform={`translate(${x},${y})`}
      textAnchor="middle"
      fill="#ffffff"
      style={{ paintOrder: 'stroke' }}
      stroke="rgba(23,53,42,0.35)"
      strokeWidth="3"
      fontWeight={700}
      pointerEvents="none"
    >
      <text fontSize="24">{name}</text>
      <text y="34" fontSize="22">
        {area}
        <tspan fontSize="15" dx="6">
          亩
        </tspan>
      </text>
    </g>
  )
}

/** 地块多边形定义（与标注坐标） */
const FIELD_POLYGONS: { id: string; points: string; fill: string; lx: number; ly: number }[] = [
  { id: 'A1', points: '70,160 300,140 330,290 90,310', fill: '#69bb5e', lx: 195, ly: 215 },
  { id: 'A2', points: '630,110 940,140 950,320 660,300', fill: '#8ecf78', lx: 790, ly: 205 },
  { id: 'B1', points: '70,340 340,320 370,470 90,490', fill: '#7cc46a', lx: 215, ly: 400 },
  { id: 'B2', points: '600,390 930,410 920,545 590,530', fill: '#97d584', lx: 760, ly: 465 },
  { id: 'C1', points: '380,300 610,290 620,430 390,440', fill: '#5cb454', lx: 500, ly: 360 },
]

export interface MapLayers {
  fields: boolean
  monitors: boolean
  irrigation: boolean
}

export function FarmMapSVG({
  layers,
  zoom = 1,
  selectedField,
  onFieldClick,
}: {
  layers: MapLayers
  zoom?: number
  selectedField?: string | null
  onFieldClick?: (fieldId: string) => void
}) {
  return (
    <svg viewBox="0 0 1000 560" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="mapBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#e3f1dc" />
          <stop offset="100%" stopColor="#cfe8cf" />
        </linearGradient>
        <linearGradient id="river" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8fd2f0" />
          <stop offset="100%" stopColor="#63bce8" />
        </linearGradient>
      </defs>

      <g transform={`translate(500 280) scale(${zoom}) translate(-500 -280)`}>
        {/* 底色 */}
        <rect x={-500 * (zoom - 1) - 200} y={-280 * (zoom - 1) - 200} width={1000 * zoom + 400} height={560 * zoom + 400} fill="url(#mapBg)" />

        {/* 远处零散田地 */}
        <g opacity="0.55">
          <polygon points="40,60 220,40 260,140 60,150" fill="#bfe0ae" />
          <polygon points="700,30 950,50 930,140 720,120" fill="#c4e3b3" />
          <polygon points="60,470 300,500 280,560 40,560" fill="#c8e5b6" />
          <polygon points="880,420 1000,430 1000,560 900,560" fill="#bcdcad" />
        </g>

        {/* 河流 */}
        <path
          d="M520 -10 C 500 80, 560 150, 540 230 C 525 300, 590 340, 640 380 C 700 430, 760 460, 850 480 C 920 495, 960 520, 980 570"
          fill="none"
          stroke="#a8dcf4"
          strokeWidth="46"
          strokeLinecap="round"
        />
        <path
          d="M520 -10 C 500 80, 560 150, 540 230 C 525 300, 590 340, 640 380 C 700 430, 760 460, 850 480 C 920 495, 960 520, 980 570"
          fill="none"
          stroke="url(#river)"
          strokeWidth="32"
          strokeLinecap="round"
        />

        {/* 地块 */}
        <g stroke="#ffffff" strokeWidth="3" strokeLinejoin="round">
          {FIELD_POLYGONS.map((f) => (
            <polygon
              key={f.id}
              points={f.points}
              fill={f.fill}
              onClick={onFieldClick ? () => onFieldClick(f.id) : undefined}
              style={onFieldClick ? { cursor: 'pointer' } : undefined}
              opacity={selectedField && selectedField !== f.id ? 0.75 : 1}
            />
          ))}
          <polygon points="330,150 500,140 520,230 360,250" fill="#a5d98d" />
          <polygon points="420,450 580,440 590,540 430,550" fill="#aadca0" />
        </g>

        {/* 选中高亮 */}
        {selectedField && (
          <polygon
            points={FIELD_POLYGONS.find((f) => f.id === selectedField)?.points ?? ''}
            fill="none"
            stroke="#ffffff"
            strokeWidth="6"
            strokeLinejoin="round"
            opacity="0.9"
            pointerEvents="none"
          />
        )}

        {/* 田埂纹理 */}
        <g stroke="#ffffff" strokeWidth="1.2" opacity="0.45" pointerEvents="none">
          <line x1="110" y1="165" x2="130" y2="305" />
          <line x1="160" y1="160" x2="180" y2="300" />
          <line x1="210" y1="155" x2="230" y2="297" />
          <line x1="260" y1="150" x2="280" y2="293" />
          <line x1="680" y1="115" x2="690" y2="300" />
          <line x1="740" y1="120" x2="750" y2="305" />
          <line x1="800" y1="125" x2="810" y2="310" />
          <line x1="860" y1="132" x2="870" y2="315" />
          <line x1="110" y1="345" x2="130" y2="485" />
          <line x1="170" y1="340" x2="190" y2="482" />
          <line x1="230" y1="335" x2="250" y2="478" />
          <line x1="290" y1="330" x2="310" y2="474" />
          <line x1="640" y1="395" x2="630" y2="530" />
          <line x1="700" y1="398" x2="690" y2="533" />
          <line x1="760" y1="402" x2="750" y2="536" />
          <line x1="820" y1="405" x2="810" y2="540" />
          <line x1="420" y1="305" x2="430" y2="437" />
          <line x1="470" y1="302" x2="480" y2="435" />
          <line x1="520" y1="298" x2="530" y2="432" />
        </g>

        {/* 灌溉管线图层 */}
        {layers.irrigation && (
          <g>
            <g fill="none" stroke="#2196e8" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="540,230 430,255 330,270 190,285 100,292" />
              <polyline points="540,230 560,330 640,380 760,410 900,420" />
              <polyline points="640,380 600,470 590,530" />
              <polyline points="330,270 350,380 370,470" />
              <polyline points="760,410 850,350 940,335" />
            </g>
            <g fill="#2196e8" stroke="#ffffff" strokeWidth="3">
              <circle cx="430" cy="255" r="8" />
              <circle cx="330" cy="270" r="8" />
              <circle cx="190" cy="285" r="8" />
              <circle cx="560" cy="330" r="8" />
              <circle cx="760" cy="410" r="8" />
              <circle cx="600" cy="470" r="8" />
              <circle cx="350" cy="380" r="8" />
              <circle cx="850" cy="350" r="8" />
            </g>
            <WaterPin x={640} y={368} />
          </g>
        )}

        {/* 监测点图层 */}
        {layers.monitors && (
          <g>
            <MonitorPin x={140} y={150} />
            <MonitorPin x={340} y={250} />
            <MonitorPin x={180} y={470} />
            <MonitorPin x={500} y={320} />
            <MonitorPin x={880} y={160} />
            <MonitorPin x={950} y={380} />
            <MonitorPin x={700} y={500} />
          </g>
        )}

        {/* 地块标注图层 */}
        {layers.fields && (
          <g>
            <FieldLabel x={195} y={215} name="A1 水稻" area="32.6" />
            <FieldLabel x={790} y={205} name="A2 玉米" area="28.4" />
            <FieldLabel x={215} y={400} name="B1 大豆" area="26.7" />
            <FieldLabel x={760} y={465} name="B2 蔬菜" area="18.3" />
            <FieldLabel x={500} y={360} name="C1 试验田" area="15.2" />
          </g>
        )}
      </g>
    </svg>
  )
}
