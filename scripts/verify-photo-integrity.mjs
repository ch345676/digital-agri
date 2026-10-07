import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..')
const manifest=JSON.parse(fs.readFileSync(path.join(root,'shared/photo-manifest.json'),'utf8'))
const entries=new Map(manifest.entries.flatMap(entry=>entry.paths.map(p=>[p,entry])))
const failures=[],seen=new Set()
for(const dir of ['public','mobile/public','rover-control/assets']){
  const full=path.join(root,dir)
  for(const relative of fs.readdirSync(full,{recursive:true})){
    if(!/\.(?:png|jpe?g|webp|gif|mp4|webm)$/i.test(relative))continue
    const p=path.posix.join(dir,relative.replaceAll('\\','/')),file=path.join(root,p)
    const sha=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')
    const entry=entries.get(p);seen.add(p)
    if(manifest.retiredHashes.includes(sha))failures.push(`Retired AI or unverified asset: ${p}`)
    else if(!entry)failures.push(`No reviewed source record: ${p}`)
    else if(entry.sha256!==sha)failures.push(`Photo changed since source review: ${p}`)
    else if(entry.kind==='photograph'&&!entry.source)failures.push(`Missing source: ${p}`)
  }
}
for(const p of entries.keys())if(!seen.has(p))failures.push(`Manifest points to missing asset: ${p}`)
if(failures.length){console.error(failures.join('\n'));process.exitCode=1}
else console.log(`Photo integrity passed: ${seen.size} files, ${manifest.entries.length} reviewed media records; no retired or unreviewed media.`)
