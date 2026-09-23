import { useState } from 'react'
import { FIELDS } from '../store'
import { CROP_PHOTOS } from '../crop-photos'
import { Modal } from './bits'
import { PhotoReference } from './ImageryCredit'

export function CropPhoto({fieldId,className}:{fieldId:string;className:string}) {
  const [open,setOpen]=useState(false)
  const photo=CROP_PHOTOS[fieldId]
  if(!photo)return null
  return <><button type="button" className={`crop-reference ${className}`} onClick={()=>setOpen(true)} aria-label={`查看${photo.title}原图`}><img src={photo.image} alt={photo.title} style={{objectPosition:photo.position}} loading="lazy"/><span className="crop-photo-caption"><strong>{fieldId} · {FIELDS.find(f=>f.id===fieldId)?.crop}<small>实拍参考 · 拍摄日期未提供</small></strong><b>查看原图 ↗</b></span></button><Modal open={open} title={photo.title} onClose={()=>setOpen(false)} width="w-[680px]"><PhotoReference photo={photo}/></Modal></>
}
