import type { ReferencePhoto } from './real-media'
const source=(file:string)=>`https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file.replaceAll(' ','_'))}`
export const CROP_PHOTOS:Record<string,ReferencePhoto & {position:string}>={
 A1:{image:'./media/crops/rice.jpg',title:'水稻稻穗实拍',caption:'水稻作物公开实拍参考，不代表本地块当前长势或所标品种。',author:'Plant Industry, CSIRO',source:source('CSIRO ScienceImage 383 Head of rice in a field.jpg'),license:'CC BY 3.0',licenseUrl:'https://creativecommons.org/licenses/by/3.0/',position:'50% 74%'},
 A2:{image:'./media/crops/maize.jpg',title:'玉米植株实拍',caption:'玉米植株及果穗实拍参考，不代表本地块实时状态。',author:'Royalesignature',source:source('Mature Maize plant 2.jpg'),license:'CC BY-SA 4.0',licenseUrl:'https://creativecommons.org/licenses/by-sa/4.0/',position:'50% 65%'},
 B1:{image:'./media/crops/soybean.jpg',title:'大豆豆荚实拍',caption:'大豆豆荚实拍参考；页面成熟度为独立演示数据，并非由本照片测算。',author:'United Soybean Board',source:source('Soybean Pods (10059842724).jpg'),license:'CC BY 2.0',licenseUrl:'https://creativecommons.org/licenses/by/2.0/',position:'62% 55%'},
 B2:{image:'./media/crops/bok-choy.jpg',title:'青菜植株实拍',caption:'青菜（Bok choy）实拍参考，不代表本地块实时照片或特定品种鉴定。',author:'JS and new VpuipV',source:source('Bok Choy.JPG'),license:'CC BY-SA 3.0',licenseUrl:'https://creativecommons.org/licenses/by-sa/3.0/',position:'50% 55%'},
 C1:{image:'./media/crops/wheat-close.jpg',title:'小麦麦穗实拍',caption:'小麦麦穗公开实拍参考，不代表试验田实时长势。',author:'User:Bluemoose',source:source('Wheat close-up.JPG'),license:'CC BY-SA 3.0',licenseUrl:'https://creativecommons.org/licenses/by-sa/3.0/',position:'50% 50%'},
}
