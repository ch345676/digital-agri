import { useEffect } from 'react'
import { useMotion } from './motion-context'
export default function ButtonMotion(){
 const {enabled}=useMotion()
 useEffect(()=>{
  if(!enabled)return
  const timers=new Set<ReturnType<typeof setTimeout>>()
  const nodes=new Set<HTMLElement>()
  const pulse=(button:HTMLButtonElement,x?:number,y?:number)=>{
    if(button.disabled||button.classList.contains('mobile-scrim'))return
    const r=button.getBoundingClientRect()
    const span=document.createElement('span');span.className='button-ripple';span.setAttribute('aria-hidden','true')
    const size=Math.min(350,Math.max(r.width,r.height)*1.7)
    span.style.width=span.style.height=`${size}px`;span.style.left=`${(x??r.left+r.width/2)-r.left-size/2}px`;span.style.top=`${(y??r.top+r.height/2)-r.top-size/2}px`
    button.appendChild(span);nodes.add(span)
    button.classList.remove('button-fired');void button.offsetWidth;button.classList.add('button-fired')
    const timer=setTimeout(()=>{span.remove();nodes.delete(span);button.classList.remove('button-fired');timers.delete(timer)},650);timers.add(timer)
  }
  const pointer=(event:PointerEvent)=>{const button=(event.target as Element).closest('button');if(button)pulse(button,event.clientX,event.clientY)}
  const keyboard=(event:KeyboardEvent)=>{if(event.repeat||!['Enter',' '].includes(event.key))return;const button=(event.target as Element).closest('button');if(button)pulse(button)}
  document.addEventListener('pointerdown',pointer);document.addEventListener('keydown',keyboard)
  return()=>{document.removeEventListener('pointerdown',pointer);document.removeEventListener('keydown',keyboard);timers.forEach(clearTimeout);nodes.forEach(n=>n.remove());document.querySelectorAll('.button-fired').forEach(n=>n.classList.remove('button-fired'))}
 },[enabled])
 return null
}
