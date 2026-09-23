import { useState } from 'react'
import BrandMark from './BrandMark'
import { FIELDS } from '../store'
import { CROP_PHOTOS } from '../crop-photos'
import { Modal } from './bits'
import { PhotoReference } from './ImageryCredit'

export function CropPhoto({fieldId,className}:{fieldId:string;className:string}) {
  const [open,setOpen]=useState(false)
  const [origin,setOrigin]=useState<DOMRect|null>(null)
  const [loaded,setLoaded]=useState(false)
  const [failed,setFailed]=useState(false)
  const photo=CROP_PHOTOS[fieldId]
  if(!photo)return null
  return <><button type="button" className={`crop-reference ${className}`} onClick={e=>{setOrigin(e.currentTarget.getBoundingClientRect());setOpen(true)}} aria-label={`查看${photo.title}原图`}><img src={photo.image} alt={photo.title} style={{objectPosition:photo.position}} loading="lazy" onLoad={()=>setLoaded(true)} onError={()=>{setLoaded(true);setFailed(true)}}/>{!loaded&&<span className="photo-loading" role="status"><BrandMark/><small>正在加载田间影像</small></span>}{failed&&<span className="photo-loading">照片暂不可用 · 点击查看来源</span>}<span className="crop-photo-caption"><strong>{fieldId} · {FIELDS.find(f=>f.id===fieldId)?.crop}</strong><b>实拍参考 ↗</b></span></button><Modal origin={origin} open={open} title={photo.title} onClose={()=>setOpen(false)} width="w-[680px]"><PhotoReference photo={photo}/></Modal></>
}
