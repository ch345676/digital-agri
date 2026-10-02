import puppeteer from 'puppeteer-core'
import assert from 'node:assert/strict'
import fs from 'node:fs'
const base=process.env.BASE_URL||'http://127.0.0.1:3213/'
const browser=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true})
try {
 const page=await browser.newPage()
 await page.evaluateOnNewDocument(()=>localStorage.setItem('qa-preserved-record','keep'))
 let block=true
 await page.setRequestInterception(true)
 page.on('request',r=>block&&r.resourceType()==='script'&&!r.url().endsWith('/startup.js')?r.abort():r.continue())
 await page.goto(base,{waitUntil:'domcontentloaded'})
 await page.waitForFunction(()=>window.__HUINONG_BOOT_FAILED__,{timeout:26000})
 assert.match(await page.$eval('#startup-title',n=>n.textContent),/无法打开/)
 assert.equal(await page.evaluate(()=>localStorage.getItem('qa-preserved-record')),'keep')
 block=false
 await Promise.all([page.waitForNavigation({waitUntil:'networkidle2'}),page.click('#startup-retry')])
 await page.waitForFunction(()=>window.__HUINONG_READY__&&!window.__HUINONG_BOOT_FAILED__)
 assert.equal(await page.$eval('#app-startup',n=>getComputedStyle(n).display),'none')
 // A malformed display name forces a real React render error inside the boundary.
 await page.evaluate(()=>{localStorage.setItem('agri:session',JSON.stringify({role:'user',username:'qa',nickname:{qa:'render failure'}}))})
 await page.reload({waitUntil:'networkidle2'})
 await page.waitForFunction(()=>window.__HUINONG_BOOT_FAILED__)
 assert.match(await page.$eval('#startup-detail',n=>n.textContent),/Minified React error|Objects are not valid/)
 assert.equal(await page.evaluate(()=>localStorage.getItem('qa-preserved-record')),'keep')
 fs.writeFileSync('qa/completion/startup-results.json',JSON.stringify({checks:['missing app scripts show recovery screen','retry loads the app','React errors show recovery screen','local records preserved'],passed:true},null,2))
 console.log('PASS missing bundle, retry, React failure boundary and local record preservation')
}finally{await browser.close()}
