import fs from 'node:fs'
import path from 'node:path'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..')
const server=await createServer({root,configFile:false,optimizeDeps:{noDiscovery:true,include:[]},server:{middlewareMode:true},appType:'custom'})
let farmReport
try{({farmReport}=await server.ssrLoadModule('/mobile/src/lib/report-model.ts'))}finally{await server.close()}
const at=Date.now(),upload='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aLeoAAAAASUVORK5CYII='
const events=[
 {id:'reference',photo:'./media/reference/wheat-powdery.jpg'},
 {id:'legacy',photo:'./images/leaf-disease.jpg'},
 {id:'demo-map',photo:'./media/real/farm-satellite.jpg'},
 {id:'upload',photo:upload},
 {id:'same-upload',photo:upload},
].map(e=>({...e,fieldId:'A1',at,kind:'photo',title:e.id,detail:'test'}))
const report=farmReport({events,tasks:[],incidents:[],moisture:{A1:82}},'all','all',new Date(at+100))
assert.deepEqual(report.photos.map(p=>p.id),['upload'],'reports must include uploaded media only, once')
assert.equal(report.events.length,events.length,'historical records must remain intact')

// A renamed copy of a known retired AI picture must still fail the build gate.
const probe=path.join(root,'public/__qa-retired-photo.jpg')
assert(!fs.existsSync(probe))
try{
 const original=execFileSync('git',['show','3807b5d:mobile/public/images/leaf-disease.jpg'],{cwd:root,maxBuffer:1024*1024})
 fs.writeFileSync(probe,original)
 let rejected=false
 try{execFileSync(process.execPath,[path.join(root,'scripts/verify-photo-integrity.mjs')],{cwd:root,encoding:'utf8',stdio:'pipe'})}
 catch(error){rejected=true;assert.match(error.stderr,/Retired AI or unverified asset/)}
 assert(rejected,'media check accepted retired media')
}finally{if(fs.existsSync(probe))fs.unlinkSync(probe)}
execFileSync(process.execPath,[path.join(root,'scripts/verify-photo-integrity.mjs')],{cwd:root,stdio:'inherit'})
console.log('PASS report photo provenance and renamed retired-asset regression checks')
