// Responsive delivery variants. Originals and their attribution stay available in the photo dialog.
// Run with sharp installed, or SHARP_MODULE pointing to its installed entry point.
import { createRequire } from 'node:module'
import fs from 'node:fs/promises'
const require=createRequire(import.meta.url)
const sharp=require(process.env.SHARP_MODULE||'sharp')
const names=['soil-logger','soil-cosmic','soil-cornfield','weather-vineyard','valve-field','irrigation-valve','trap-paddy']
for(const name of names) {
  const original=`public/media/devices/${name}.jpg`
  const source=await sharp(original).metadata()
  for(const width of [640,1280]) {
    const target=`public/media/devices/${name}-${width}.webp`
    await sharp(original).rotate().resize({width,withoutEnlargement:true}).webp({quality:86,effort:5}).toFile(target)
    console.log(name,width,(await fs.stat(target)).size,'bytes',`original ${source.width}×${source.height}`)
  }
}
