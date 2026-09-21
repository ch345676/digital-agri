import { FARM_IMAGERY, type ReferencePhoto } from '../real-media'

export function ImageryCredit() {
  return <div className="imagery-credit"><span>真实遥感影像 · {FARM_IMAGERY.location}</span><span>地块、作物、面积与路线为演示标注，不代表影像所在地的实测数据。</span><a href={FARM_IMAGERY.source} target="_blank" rel="noreferrer">影像 © {FARM_IMAGERY.credit} ↗</a></div>
}

export function PhotoReference({ photo }: { photo: ReferencePhoto }) {
  return <figure className="photo-reference"><img src={photo.image} alt={photo.title}/><figcaption><b>{photo.title}</b><p>{photo.caption}</p><small>摄影：{photo.author} · <a href={photo.source} target="_blank" rel="noreferrer">原图来源 ↗</a> · <a href={photo.licenseUrl} target="_blank" rel="noreferrer">{photo.license}</a> · 缩略显示</small></figcaption></figure>
}
