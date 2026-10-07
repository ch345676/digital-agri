export type PhotoReference = {
  image: string
  title: string
  caption: string
  author: string
  source: string
  license: string
  licenseUrl: string
}

const commons = (file: string) => `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file.replaceAll(' ', '_'))}`
const image = (file: string) => `./media/reference/${file}`

// Photographic references retain their original hosts and attribution. They are
// never evidence of an inspection, diagnosis or completed operation on this farm.
export const REFERENCE_PHOTOS = {
  wheatPowdery: { image: image('wheat-powdery.jpg'), title: '冬小麦白粉病 · 实拍参考', caption: '原照片为冬小麦白粉病，非本农场现场采集。', author: 'Agronom', source: commons('Blumeria graminis on winter wheat.JPG'), license: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/' },
  cucumberDowny: { image: image('cucumber-downy.jpg'), title: '黄瓜霜霉病 · 实拍参考', caption: '原照片为黄瓜霜霉病，非本农场现场采集。其他蔬菜不可仅凭此图确诊。', author: 'Wee Hong', source: commons('Downy mildew on leaves of Cucumis sativus.jpg'), license: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/' },
  soybeanAphid: { image: image('soybean-aphid.jpg'), title: '大豆蚜虫 · 实拍参考', caption: '原照片为有翅大豆蚜虫，非 B1 地块现场采集。', author: 'NY State IPM Program at Cornell University', source: commons('Winged Soybean Aphid (15536218135).jpg'), license: 'CC BY 2.0', licenseUrl: 'https://creativecommons.org/licenses/by/2.0/' },
  spiderMites: { image: image('spider-mites.jpg'), title: '叶螨危害 · 实拍参考', caption: '原照片展示叶螨危害，寄主未明确；不是 A2 玉米的现场照片。', author: 'Olllli', source: commons('Spinnmilben2.jpg'), license: 'CC BY-SA 3.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/' },
  soybeanDowny: { image: image('soybean-downy.jpg'), title: '大豆霜霉病 · 实拍参考', caption: '大豆霜霉病叶片参考，用于演示采集与复核流程，非本次巡检照片。', author: 'Clemson University – USDA Cooperative Extension Slide Series / Bugwood.org', source: commons('Peronospora manshurica on soybean leaf.jpg'), license: 'CC BY 3.0', licenseUrl: 'https://creativecommons.org/licenses/by/3.0/' },
  cornField: { image: image('corn-field.jpg'), title: '玉米田 · 实拍素材', caption: '外部农田影像，非本农场航拍；照片来源与演示地块无关联。', author: 'Çağrı KANMAZ / Pexels', source: 'https://www.pexels.com/video/neat-rows-of-green-corn-plants-in-a-field-27253894/', license: 'Pexels License', licenseUrl: 'https://www.pexels.com/license/' },
} satisfies Record<string, PhotoReference>

export const ISSUE_SAMPLES = [
  { name: '白粉病', photo: REFERENCE_PHOTOS.wheatPowdery },
  { name: '霜霉病', photo: REFERENCE_PHOTOS.cucumberDowny },
  { name: '蚜虫', photo: REFERENCE_PHOTOS.soybeanAphid },
  { name: '叶螨', photo: REFERENCE_PHOTOS.spiderMites },
]
export function photoForIssue(name: string): PhotoReference | undefined {
  if (name.includes('白粉')) return REFERENCE_PHOTOS.wheatPowdery
  if (name.includes('霜霉')) return REFERENCE_PHOTOS.cucumberDowny
  if (name.includes('蚜虫')) return REFERENCE_PHOTOS.soybeanAphid
  if (/红蜘蛛|叶螨/.test(name)) return REFERENCE_PHOTOS.spiderMites
}
export function photoBySrc(src?: string): PhotoReference | undefined {
  if (!src || /^(data|blob):/.test(src)) return
  const path = src.split(/[?#]/)[0]
  return Object.values(REFERENCE_PHOTOS).find(photo => path.endsWith(photo.image.slice(1)))
}
export function isRetiredPhoto(src?: string): boolean {
  if (!src || /^(data|blob):/.test(src)) return false
  return /(?:^|\/)(?:hero-field|leaf-disease|live-rover|live-feed|rover-real|avatar-expert|avatar-user|spray-[123]|team-[123]|field-(?:corn|soy|wheat)|leaf|soil|rover|agri-dusk|soil-root-profile-v2)\.(?:jpg|png|webp)(?:[?#].*)?$/.test(src)
}
export function isUserPhoto(src?: string): boolean {
  return !!src && /^data:image\/(?:jpeg|png|webp);base64,/i.test(src)
}
