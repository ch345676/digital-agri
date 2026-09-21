import type { ALERTS } from './agronomy'

export const FARM_IMAGERY = {
  image: './media/real/farm-satellite.jpg',
  location: '美国加州 · 戴维斯农田',
  credit: 'Esri, Vantor, Earthstar Geographics, and the GIS User Community',
  source: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer',
  // Geographic request bounds, not surveyed project boundaries.
  bounds: [-121.825, 38.529, -121.801, 38.540],
}
export interface ReferencePhoto {
  image: string
  title: string
  caption: string
  author: string
  source: string
  license: string
  licenseUrl: string
}
const commons = (file: string) => `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file.replaceAll(' ', '_'))}`
export const ALERT_PHOTOS = {
  A01: { image: './media/real/powdery-mildew.jpg', title: '白粉病实拍参考', caption: '大豆叶片上的白粉病病征，供病征对照；不是 A1 水稻的现场照片。', author: 'Madan_subedi01', source: commons('Powdery Mildew on Soyabean leaves.jpg'), license: 'CC BY 3.0', licenseUrl: 'https://creativecommons.org/licenses/by/3.0/' },
  A02: { image: './media/real/saline-soil.jpg', title: '土壤盐渍化实拍参考', caption: '土壤表面盐分积聚的参考照片；EC 数值必须由仪器测定，不能凭照片推断。', author: 'USDA Employee', source: commons('Salinity.jpg'), license: 'Public domain', licenseUrl: 'https://commons.wikimedia.org/wiki/Template:PD-USGov-USDA' },
  A03: { image: './media/real/downy-mildew.jpg', title: '大豆霜霉病实拍参考', caption: '大豆霜霉病（Peronospora manshurica）叶片病征，供人工复核对照。', author: 'Clemson University – USDA Cooperative Extension Slide Series / Bugwood.org', source: commons('Peronospora manshurica on soybean leaf.jpg'), license: 'CC BY 3.0', licenseUrl: 'https://creativecommons.org/licenses/by/3.0/' },
  A04: { image: './media/real/aphids.jpg', title: '蚜虫聚集实拍参考', caption: '羽衣甘蓝叶片上的蚜虫群落，供虫情对照；不是该次巡检的采集画面。', author: 'Sanjay Acharya', source: commons('Aphids on Kale leaf.jpg'), license: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/' },
  A05: { image: './media/real/dry-soil.jpg', title: '干燥土壤实拍参考', caption: '干燥开裂土壤的参考照片；水分数值来自演示数据，不由照片测算。', author: 'Tomas Castelazo', source: commons('Drought.jpg'), license: 'CC BY 3.0', licenseUrl: 'https://creativecommons.org/licenses/by/3.0/' },
} satisfies Record<(typeof ALERTS)[number]['id'], ReferencePhoto>
