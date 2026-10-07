import puppeteer from 'puppeteer-core'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const base = process.env.TEST_BASE || 'http://127.0.0.1:3213'
const out = path.resolve('qa/enhancement')
fs.mkdirSync(out, { recursive: true })
console.log('START daily/report checks')
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true })
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
try {
  const page = await browser.newPage(), errors = []
  page.setDefaultTimeout(20000)
  console.log('Browser ready')
  page.on('pageerror', e => errors.push(e.message))
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true })
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('agri:session', JSON.stringify({ role: 'admin', username: 'admin', nickname: '管理员' }))
    if (localStorage.getItem('qa-daily-seeded')) return
    const now = Date.now(), date = new Date(), local = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const yesterday = new Date(date); yesterday.setDate(date.getDate() - 1)
    const old = new Date(date); old.setDate(date.getDate() - 10)
    const task = (id, title, status, due, updatedAt = now) => ({ id, title, status, due, updatedAt, createdAt: now, fieldId: 'A2', assignee: '王师傅', device: '人工巡田', kind: '巡检', note: '测试工作流', photos: [] })
    const approval = task('qa-accept', '待验收作业', '待验收', local(date))
    approval.photos = [{ id: 'qa-photo', src: './images/leaf-disease.jpg', note: '作业照片', at: now }]
    approval.incidentId = 'qa-incident'
    localStorage.setItem('huinong-workflow-v2', JSON.stringify({ version: 2, updatedAt: now, seen: [], moisture: { A1: 82, A2: 56, B1: 61, B2: 66, C1: 49 },
      tasks: [task('qa-late', '逾期墒情复核', '待执行', local(yesterday)), approval, task('qa-old', '往期完成作业', '已完成', local(old), old.getTime())],
      incidents: [{ id: 'qa-incident', fieldId: 'A2', title: '已关联的待验收预警', status: '处理中', at: now, taskId: approval.id }],
      events: [{ id: 'qa-old-event', fieldId: 'A2', title: '往期作业', detail: '超出近七天', kind: 'task', at: old.getTime() }, { id: 'qa-photo-event', fieldId: 'A2', title: '作业照片', detail: '现场检查', kind: 'photo', at: now, taskId: approval.id, photo: './images/leaf-disease.jpg' }] }))
    localStorage.setItem('qa-daily-seeded', 'yes')
  })
  const route = async name => { await page.evaluate(name => location.hash = name, name); await page.waitForSelector('.page-' + name); await sleep(450) }
  const click = async (label, scope = 'body') => { await page.evaluate(({ label, scope }) => { const root = [...document.querySelectorAll(scope)].at(-1); const button = [...root.querySelectorAll('button')].find(b => b.textContent.includes(label)); if (!button) throw Error('Missing button ' + label); button.click() }, { label, scope }); await sleep(350) }
  const state = () => page.evaluate(() => JSON.parse(localStorage.getItem('huinong-workflow-v2')))
  await page.goto(base + '/#overview', { waitUntil: 'networkidle2' })
  console.log('daily loaded')
  assert.match(await page.$eval('.agenda-row', el => el.textContent), /逾期墒情复核/)
  await click('展开全部', '.today-work')
  assert(!(await page.$eval('.today-agenda', el => el.textContent)).includes('已关联的待验收预警'), 'linked incident must not duplicate task')
  assert(!(await page.$eval('.today-agenda', el => el.textContent)).includes('往期完成作业'))
  await page.$eval('[data-action-id="task-qa-accept"]', el=>el.scrollIntoView({block:'center'})); await sleep(500)
  await page.click('[data-action-id="task-qa-accept"]')
  await page.waitForSelector('[role=dialog]')
  await click('验收完成', '[role=dialog]')
  await page.waitForSelector('.task-result')
  assert.equal((await state()).incidents.find(i => i.id === 'qa-incident').status, '已解决')
  await click('查看归档任务', '.task-result')
  await page.waitForSelector('[role=dialog]', { hidden: true })
  assert((await page.$eval('.task-list', el => el.textContent)).includes('已完成归档'))
  await route('overview')
  assert.match(await page.$eval('.today-stats span:last-child', el => el.textContent), /1今日完成/)
  console.log('task complete')
  await route('irrigation')
  await click('一键灌溉')
  await page.evaluate(() => { window.__HUINONG_FOREGROUND__ = false })
  const paused = await state(); await sleep(5300)
  assert.equal((await state()).events.filter(e => e.irrigation).length, 0, 'background must not silently complete irrigation')
  assert.deepEqual((await state()).moisture, paused.moisture)
  await page.evaluate(() => { window.__HUINONG_FOREGROUND__ = true })
  await page.waitForSelector('.irrigation-receipt', { timeout: 10000 })
  console.log('irrigation complete')
  const completed = await state()
  assert.equal(completed.events.filter(e => e.irrigation).length, 5)
  assert.deepEqual(completed.moisture, { A1: 86, A2: 60, B1: 65, B2: 70, C1: 53 })
  assert(Math.abs(completed.events.reduce((n, e) => n + (e.irrigation?.waterTonnes || 0), 0) - 1.2) < .00001)
  assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('agri-mobile-state-v1')).valves), [false, false, false, false, false])
  await page.reload({ waitUntil: 'networkidle2' }); await page.waitForSelector('.irrigation-receipt')
  await page.screenshot({ path: path.join(out, 'irrigation-result.png'), fullPage: false })
  const beforeCancel = (await state()).events.length
  await click('一键灌溉'); await sleep(800); await route('overview'); await sleep(5200)
  assert.equal((await state()).events.length, beforeCancel, 'unmounted irrigation must not record completion')
  assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('agri-mobile-state-v1')).valves), [false, false, false, false, false])
  console.log('cancellation passed')
  await click('农场报告', '.today-work'); await page.waitForSelector('.report-preview img')
  assert.match(await page.$eval('.report-accessible-summary', el => el.textContent), /演示用水 1.20 吨/)
  await page.select('select[aria-label="选择地块"]', 'A2'); await page.waitForFunction(() => document.querySelector('.report-preview')?.getAttribute('aria-busy') === 'false')
  assert.match(await page.$eval('.report-accessible-summary', el => el.textContent), /演示用水 0.24 吨/)
  console.log('report totals passed')
  const client = await page.createCDPSession(); await client.send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: out })
  // Separate names on repeated runs; only delete the two exact test outputs here.
  const date = await page.evaluate(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` })
  for (const format of ['png', 'pdf']) {
    const file = path.join(out, `惠农农场报告-A2-${date}.${format}`)
    if (fs.existsSync(file)) fs.unlinkSync(file)
    await click(format === 'png' ? '保存图片' : '导出 PDF', '.report-export-actions')
    for (let i = 0; i < 60 && !fs.existsSync(file); i++) await sleep(150)
    assert(fs.existsSync(file), 'download not created: ' + file)
    const bytes = fs.readFileSync(file)
    assert(bytes.length > 30000)
    if (format === 'png') { assert.equal(bytes.readUInt32BE(16), 1080); assert.equal(bytes.readUInt32BE(20), 1528) }
    else {
      assert.equal(bytes.subarray(0, 8).toString(), '%PDF-1.4')
      const content = bytes.toString('latin1'), xref = Number(content.match(/startxref\n(\d+)/)[1])
      assert.equal(content.slice(xref, xref + 4), 'xref')
      const entries = content.slice(xref).split('\n').slice(3, 8)
      entries.forEach((entry, i) => assert.equal(content.slice(Number(entry.slice(0, 10)), Number(entry.slice(0, 10)) + 7), `${i + 1} 0 obj`))
    }
  }
  await page.select('select[aria-label="选择地块"]', 'all'); await click('近 7 天', '.report-controls'); await page.waitForSelector('.report-preview img')
  console.log('exports passed')
  for (const width of [320, 390, 768]) {
    await page.setViewport({ width, height: 844, isMobile: true, hasTouch: true })
    for (const name of ['overview', 'tasks', 'irrigation', 'reports']) { await route(name); assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${name} overflow at ${width}`) }
  }
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true })
  await page.waitForSelector('.report-preview img'); await page.screenshot({ path: path.join(out, 'reports.png'), fullPage: true })
  console.log('layouts passed')
  await page.setOfflineMode(true); await click('刷新报告', '.report-controls'); await page.waitForSelector('.report-preview img'); assert(!await page.$('[role=alert].inline-error')); await page.setOfflineMode(false)
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]); await route('overview'); await click('展开全部', '.today-work'); assert.equal(await page.$eval('.today-work footer button', el => el.getAttribute('aria-expanded')), 'true')
  // Exercise the native export protocol and cancellation without pretending this is a device test.
  await page.setUserAgent((await browser.userAgent()) + ' HuinongAndroid/1.1.0')
  await route('reports'); await page.waitForSelector('.report-preview img'); await click('保存图片', '.report-export-actions')
  await page.waitForFunction(() => window.__huinongExport?.mime === 'image/png')
  assert((await page.evaluate(() => window.__huinongExport.data)).startsWith('iVBOR'))
  await page.evaluate(() => window.dispatchEvent(new CustomEvent('huinong:export-result', { detail: { status: 'cancelled', message: '' } })))
  await page.waitForFunction(() => !document.querySelector('.report-export-actions button').disabled)
  assert.equal(await page.evaluate(() => window.__huinongExport), undefined)
  assert.deepEqual(errors, [])
  fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify({ passed: true, checks: ['urgent daily sorting and deduplication', 'task acceptance and archive result', 'today completion count', 'foreground-only irrigation, closed valves and persistent receipt', 'cancel on navigation', 'field-filtered water totals', 'PNG and valid one-page PDF downloads', '12 viewport/route combinations', 'offline report', 'reduced motion', 'native export payload and cancellation protocol'], errors }, null, 2))
  console.log('PASS daily work, completion feedback, offline reports, PNG/PDF and native export protocol')
} catch(error) { console.error(error); process.exitCode=1 } finally { await browser.close() }
