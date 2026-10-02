import puppeteer from 'puppeteer-core'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'

const base = process.env.TEST_BASE || 'http://127.0.0.1:5184/'
// Keep the Windows headless compositor advancing during intermediate-frame checks.
const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, protocolTimeout:30000, args: ['--no-sandbox', '--disable-background-timer-throttling', '--disable-backgrounding-occluded-windows', '--disable-renderer-backgrounding', '--disable-features=CalculateNativeWinOcclusion', '--run-all-compositor-stages-before-draw', '--disable-gpu'] })
const page = await browser.newPage(), errors = [], checks = []
const capture=options=>process.env.SKIP_SCREENSHOTS==='1'?Promise.resolve():page.screenshot(options)
page.on('pageerror', e => errors.push(e.message))
const wait = ms => new Promise(resolve => setTimeout(resolve, ms))
const go = async route => { await page.goto(base + '#' + route, { waitUntil: 'networkidle0' }); await page.waitForSelector('.page-'+route); await wait(600) }
const click = async (text, scope = 'main') => page.evaluate((text, scope) => { const b = [...document.querySelectorAll(scope + ' button')].find(e => e.textContent.includes(text)); if (!b) throw Error('Missing ' + text); b.click() }, text, scope)
const noOverflow = async () => { const result=await page.$eval('main', e => ({client:e.clientWidth,scroll:e.scrollWidth,route:location.hash,width:innerWidth})); assert.ok(result.scroll<=result.client+2,JSON.stringify(result)) }
try {
  await fs.mkdir('qa', { recursive: true }); await page.setViewport({ width: 1440, height: 1000 }); await page.bringToFront()
  await go('tasks')
  const button = await page.$('.page-heading-actions button'), rect = await button.boundingBox()
  await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2); await page.mouse.down(); await wait(60)
  assert.ok(await page.$('.interaction-wave')); await page.mouse.up(); await page.waitForSelector('[role="dialog"]')
  await page.keyboard.press('Escape'); await wait(650); assert.equal(await page.$('.interaction-wave'), null)
  await page.$eval('.task-view-switch button:last-child', e => e.focus()); await page.keyboard.down(' '); await wait(60)
  assert.equal(await page.$('.interaction-wave'),null); await page.keyboard.up(' '); await wait(600)
  assert.ok(await page.$('.task-board')); checks.push('Primary actions receive a pulse; keyboard view switching remains quiet and responsive')

  await click('列表视图', '.task-view-switch'); await wait(450)
  const travel=await page.$eval('.task-status-tabs',async e=>{
    const start=getComputedStyle(e,'::before').transform
    e.querySelectorAll('button')[1].click()
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))
    getComputedStyle(e,'::before').transform
    const transitions=e.getAnimations({subtree:true}).filter(a=>a instanceof CSSTransition&&a.transitionProperty==='transform')
    const moving=transitions.some(a=>{const k=a.effect.getKeyframes();return k[0].transform!==k.at(-1).transform})
    // Seek the real CSS transition deterministically; Windows headless can
    // pause its compositor clock while DOM and input processing continue.
    transitions.forEach(a=>{a.pause();a.currentTime=180})
    const middle=getComputedStyle(e,'::before').transform
    transitions.forEach(a=>a.finish())
    const end=getComputedStyle(e,'::before').transform
    return {start,middle,end,moving}
  })
  assert.ok(travel.moving);assert.notEqual(travel.start,travel.end);assert.notEqual(travel.middle,travel.end)
  await page.$$eval('.motion-ghost', nodes => nodes.forEach(node => node.getAnimations().forEach(a => a.pause())))
  await wait(450)
  await page.waitForFunction(() => !document.querySelector('.motion-ghost'), { polling:'mutation', timeout:1500 })
  await page.evaluate(() => { const buttons = [...document.querySelectorAll('.task-status-tabs button')]; buttons[2].click(); buttons[0].click(); buttons[1].click() }); await wait(500)
  assert.equal(await page.$$eval('.task-status-tabs [aria-pressed="true"]', nodes => nodes.length), 1)
  await capture({ path: 'qa/motion-system-tasks.png' })
  checks.push('Selection background travels; rapid filtering and paused rendering leave no departing copies')

  await go('devices'); await click('离线', '.device-toolbar'); await wait(600)
  await page.waitForFunction(() => !document.querySelector('.motion-ghost'), { polling:'mutation', timeout:1500 })
  assert.equal(await page.$$eval('.device-card', cards => cards.length), 2)
  await click('全部设备', '.device-toolbar'); await wait(500)
  await page.select('.device-toolbar select', 'valve'); await wait(500)
  await page.$eval('button[role="switch"]',e=>e.click()); await page.waitForSelector('.device-values[data-irrigating="true"]'); await wait(350)
  assert.ok(await page.$('.device-values[data-irrigating="true"]'))
  assert.equal(await page.$eval('.device-values[data-irrigating="true"]', e => getComputedStyle(e, '::after').animationPlayState), 'running')
  await capture({ path: 'qa/motion-system-devices.png' })
  checks.push('Device filtering animates the collection and valve state drives the water-flow accent')

  const toast = await page.$('.feedback-item'); assert.ok(toast)
  await page.$eval('.feedback-toast [aria-label="关闭提示"]',e=>e.click()); await wait(45)
  assert.equal(await page.$eval('.feedback-item', e => e.inert), true)
  await wait(250); assert.equal(await page.$('.feedback-item'), null)
  checks.push('Actual valve feedback receives a success seal, then collapses and becomes inert on dismissal')

  await go('alerts'); await click('查看与处置'); await page.waitForSelector('[role="dialog"]'); await wait(350)
  const content = await page.$eval('.alert-detail h2', e => e.textContent)
  await page.keyboard.press('Escape'); await wait(40)
  assert.equal(await page.$eval('.agri-modal .alert-detail h2', e => e.textContent), content)
  assert.equal(await page.$eval('.agri-modal', e => e.inert), true)
  await wait(230); assert.equal(await page.$('.agri-modal'), null)
  checks.push('Closing detail dialogs retain their content until exit finishes, with no blank flash')

  await go('map'); await page.$eval('.map-field-picker button', e => e.click()); await wait(400)
  assert.equal(await page.$eval('.map-detail-shell', e => Math.round(e.getBoundingClientRect().width)), 320)
  await page.$eval('[aria-label="收起地块详情"]', e => e.click()); await wait(90)
  await page.$eval('.map-detail-shell',e=>e.getAnimations().forEach(a=>{a.pause();a.currentTime=140}))
  assert.ok(await page.$eval('.map-detail-shell', e => e.inert && e.getBoundingClientRect().width > 0 && e.getBoundingClientRect().width < 320))
  await wait(300); assert.equal(await page.$('.map-detail-shell'), null)
  await click('灌溉管线', '.page-heading-actions'); await wait(60)
  assert.equal(await page.$eval('.irrigation-overlay', e => e.getAttribute('data-closing')), 'true')
  await wait(260); assert.equal(await page.$('.irrigation-overlay'), null)
  await page.$eval('.map-field-picker button:nth-child(2)', e => e.click()); await wait(500)
  await capture({ path: 'qa/motion-system-map.png' }); await noOverflow()
  checks.push('Map details collapse in layout; map layers fade out before unmounting')

  await go('history'); await page.$eval('.replay-day', e => e.scrollIntoView({ block: 'center' })); await wait(400)
  await page.$eval('[aria-label="前一天"]', e => e.click()); await wait(60)
  assert.ok(await page.$eval('.replay-day', e => e.getAnimations().some(a => a.playState === 'running')))
  await wait(500)
  await page.$eval('main', e => { e.scrollTo({top:e.scrollHeight,behavior:'instant'});e.dispatchEvent(new Event('scroll')) }); await wait(350)
  await page.$eval('.reading-progress>div',e=>e.getAnimations().forEach(a=>a.finish()))
  const reading=await page.evaluate(()=>{const main=document.querySelector('main'),bar=document.querySelector('.reading-progress>div');return {scale:new DOMMatrix(getComputedStyle(bar).transform).a,top:main.scrollTop,total:main.scrollHeight-main.clientHeight}})
  assert.ok(reading.scale>.99,JSON.stringify(reading))
  checks.push('Replay date changes animate the connected reading; scroll line reflects the real page position')

  await go('soil'); await page.$eval('.soil-inspector', e => e.scrollIntoView({ block: 'center' })); await wait(400)
  await page.$eval('.soil-metric-picker button:nth-child(5)', e => e.click()); await wait(60)
  assert.ok(await page.$eval('.soil-metric-detail', e => e.getAnimations().some(a => a.playState === 'running')))
  await wait(500); assert.ok(await page.$('.soil-element-node[aria-pressed="true"]'))
  await capture({ path: 'qa/motion-system-soil.png' })
  checks.push('Soil metric changes animate without remounting the scale, while N/P/K/OM annotations remain visible')

  for (const width of [768, 390, 320]) {
    await page.setViewport({ width, height: 960 }); await go('map')
    await page.$eval('.map-field-picker button', e => e.click()); await wait(500); await noOverflow()
    await page.$eval('[aria-label="收起地块详情"]', e => e.click()); await wait(330); assert.equal(await page.$('.map-detail-shell'), null)
    await go('tasks'); await click('待完成', '.task-status-tabs'); await wait(550); await noOverflow()
    const fit = await page.$eval('.task-status-tabs', e => {
      const a = e.querySelector('[aria-pressed="true"]').getBoundingClientRect(), p = e.getBoundingClientRect()
      return a.left >= p.left - 1 && a.right <= p.right + 1
    }); assert.ok(fit)
    if (width === 390) await capture({ path: 'qa/motion-system-mobile.png' })
  }
  checks.push('Expanded maps and travelling filters fit at 768, 390 and 320 pixels')

  await page.setViewport({ width: 1440, height: 1000 }); await go('devices')
  await page.$eval('[aria-label="关闭动画"]',e=>e.click()); await wait(250)
  await click('离线', '.device-toolbar'); await wait(100)
  assert.equal(await page.$('.interaction-wave, .motion-ghost, .motion-pending'), null)
  assert.equal(await page.$$eval('[data-motion-track]', nodes => nodes.length), 0)
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]); await go('map')
  await page.$eval('.map-field-picker button', e => e.click()); await wait(100); await noOverflow()
  assert.equal(await page.$eval('.map-detail-shell', e => getComputedStyle(e).transitionDuration), '0s')
  checks.push('Motion-off and reduced-motion keep details and controls available without animated layers')
  assert.deepEqual(errors, [])
  await fs.writeFile('qa/motion-system-verification.json', JSON.stringify({ passed: true, base, checks, errors }, null, 2))
  console.log(JSON.stringify({ passed: true, checks, errors }, null, 2))
} catch(error) { console.log(await page.evaluate(()=>({route:location.hash,stage:document.querySelector('.page-stage')?.className,commands:JSON.parse(localStorage.getItem('agri-platform-state-v1')||'{}').workflow?.commands,visible:document.hidden}))); throw error } finally { await browser.close() }
