import { useId } from 'react'

/** Map-scale top view derived from the project's silver four-wheel rover. Front faces north. */
export function ProjectRoverMarker({ heading = 0 }: { heading?: number }) {
  const id = useId().replaceAll(':', '')
  return <g className="project-rover-marker" aria-label="惠农小车俯视标记" data-heading={heading}>
    <g className="rover-heading" style={{transform:`rotate(${heading}deg)`}}>
      <defs>
        <linearGradient id={id+'body'} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#f3f5f2"/><stop offset=".5" stopColor="#b7c1c0"/><stop offset="1" stopColor="#7e8e90"/></linearGradient>
        <linearGradient id={id+'roof'} x1="0" x2="1"><stop stopColor="#a4afb0"/><stop offset=".45" stopColor="#e0e5e2"/><stop offset="1" stopColor="#abb6b6"/></linearGradient>
      </defs>
      <rect x="-12" y="-15" width="26" height="33" rx="5" fill="#081c1a" opacity=".22"/>
      {[-1,1].flatMap(side=>[-10,10].map(y=><g key={side+':'+y}><rect x={side<0?-15:9} y={y-5} width="6" height="10" rx="2" fill="#202d30" stroke="#80908b" strokeWidth=".6"/><path d={'M'+(side<0?-14:10)+' '+(y-2)+'h4m-4 4h4'} stroke="#52625f" strokeWidth=".7"/></g>))}
      <rect x="-11" y="-16" width="22" height="32" rx="2" fill={'url(#'+id+'body)'} stroke="#526566" strokeWidth=".8"/>
      <rect x="-8" y="-8" width="16" height="21" rx="1" fill={'url(#'+id+'roof)'} stroke="#71817f" strokeWidth=".7"/>
      <path d="M-7-6H7M-7 11H7" stroke="#f6faf6" strokeWidth=".6"/>
      <circle cx="-5" cy="-12" r="2.2" fill="#485858" stroke="#dce4df" strokeWidth=".7"/>
      <rect x="4" y="-17" width="4" height="8" rx="2" fill="#e9eeea" stroke="#677c77" strokeWidth=".6"/>
      <circle cx="6" cy="-15" r="1.2" fill="#1c3d46"/>
      <path d="M-4-19L0-22L4-19" fill="none" stroke="#edf7cd" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </g>
  </g>
}
