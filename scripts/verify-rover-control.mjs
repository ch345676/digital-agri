import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { resolve, extname, sep } from 'node:path'
import puppeteer from 'puppeteer-core'

const root = resolve('rover-control')
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' }
const server = createServer(async (req, res) => {
  const file = resolve(root, decodeURIComponent((req.url || '/').split('?')[0].replace(/^\//, '') || 'index.html'))
  if (file !== root && !file.startsWith(root + sep)) { res.writeHead(403).end(); return }
  try { const content = await readFile(file); res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream' }).end(content) }
  catch { res.writeHead(404).end() }
})
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
const port = server.address().port
const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--no-sandbox'] })
const page = await browser.newPage()
const errors = []
page.on('pageerror', error => errors.push(error.message))
const wait = ms => new Promise(resolve => setTimeout(resolve, ms))
try {
  for (const width of [320, 390, 768]) {
    await page.setViewport({ width, height: 860, deviceScaleFactor: 1 })
    await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'networkidle0' })
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `horizontal overflow at ${width}px`)
    assert.equal(await page.$eval('.map-frame img, .map-frame image', el => el.tagName.toLowerCase()), 'image')
  }
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 })
  await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'networkidle0' })
  assert.match(await page.$eval('.fine-print', el => el.textContent), /不是实时 GPS/)
  const initial = await page.$eval('#progress', el => el.textContent)
  await page.click('#cruise-btn'); await wait(800)
  assert.notEqual(await page.$eval('#progress', el => el.textContent), initial, 'cruise moves along route')
  await page.click('#cruise-btn')
  assert.equal(await page.$eval('#status', el => el.textContent), '待命')
  await page.click('#manual-mode')
  const before = await page.$eval('#rover-marker', el => el.getAttribute('transform'))
  const button = await page.$('[data-direction="right"]')
  const box = await button.boundingBox()
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down(); await wait(350); await page.mouse.up()
  const moved = await page.$eval('#rover-marker', el => el.getAttribute('transform'))
  assert.notEqual(moved, before, 'manual hold moves rover')
  await wait(250)
  assert.equal(await page.$eval('#rover-marker', el => el.getAttribute('transform')), moved, 'releasing direction stops rover')
  await page.click('#stop-btn')
  assert.equal(await page.$eval('#status', el => el.textContent), '已紧急停止')
  await page.click('#auto-mode')
  assert.equal(await page.$eval('#mode-label', el => el.textContent), '手动模式', 'emergency stop blocks mode change')
  await page.click('#stop-btn')
  await page.click('#return-btn')
  await page.waitForFunction(() => document.querySelector('#status')?.textContent === '充电桩待命', { timeout: 15000 })
  await page.click('#capture-btn')
  await page.click('#light-btn')
  await page.click('#pan-right-btn')
  assert.equal(await page.$eval('#capture-count', el => el.textContent), '1 张')
  assert.equal(await page.$eval('#pan-angle', el => el.textContent), '15°')
  assert.equal(await page.$eval('#light-btn', el => el.getAttribute('aria-pressed')), 'true')
  assert.deepEqual(errors, [])
  console.log('Rover control: layout 320/390/768, cruise, manual hold/release, emergency stop, return, camera controls passed')
} finally { await browser.close(); await new Promise(resolve => server.close(resolve)) }
