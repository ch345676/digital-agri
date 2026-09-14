/* 交互验证脚本：新建任务、切换灌溉阀、日程勾选、地图点击地块、通知下拉 */
import puppeteer from 'puppeteer-core'

const OUT = 'C:\\Users\\程浩\\Documents\\kimi\\tasks\\2026-09-14\\12-30-55-b8d12e2c\\reference'
const BASE = 'http://localhost:5210'

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: 'new',
  args: ['--window-size=1680,950'],
})
const page = await browser.newPage()
await page.setViewport({ width: 1680, height: 950 })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const gotoPage = async (hash) => {
  await page.goto(`${BASE}/#${hash}`, { waitUntil: 'networkidle0' })
  await page.reload({ waitUntil: 'networkidle0' })
  await sleep(500)
}

// 0. 清空本地数据，确保可重复
await page.goto(BASE, { waitUntil: 'networkidle0' })
await page.evaluate(() => localStorage.clear())

// 1. 新建任务
await gotoPage('tasks')
await page.evaluate(() => {
  const btns = [...document.querySelectorAll('button')]
  btns.find((b) => b.textContent.includes('新建任务'))?.click()
})
await sleep(400)
await page.type('input[placeholder*="例如：A1"]', 'B2 蔬菜夜间补光')
await page.screenshot({ path: `${OUT}\\verify-new-task-dialog.png` })
await page.evaluate(() => {
  const btns = [...document.querySelectorAll('button')]
  btns.find((b) => b.textContent.trim() === '创建任务')?.click()
})
await sleep(500)
const taskCreated = await page.evaluate(() => document.body.innerText.includes('B2 蔬菜夜间补光'))
console.log('1 新建任务出现在列表:', taskCreated)
await page.screenshot({ path: `${OUT}\\verify-task-created.png` })

// 2. 切换灌溉阀
await gotoPage('devices')
const switchExists = await page.evaluate(() => !!document.querySelector('button.relative.h-6'))
console.log('2 找到阀门开关:', switchExists)
await page.evaluate(() => document.querySelector('button.relative.h-6')?.click())
await sleep(3300) // 等一个数据刷新周期
const after = await page.evaluate(() => document.body.innerText.includes('灌溉中'))
const valveState = await page.evaluate(() => JSON.parse(localStorage.getItem('agri-platform-state-v1')).valves)
console.log('2 切换后页面显示「灌溉中」:', after, '持久化阀门状态:', JSON.stringify(valveState))
await page.screenshot({ path: `${OUT}\\verify-valve-on.png` })

// 3. 工作台：日程勾选 KPI 联动 + 通知下拉
await gotoPage('dashboard')
const grabKpi = () =>
  page.evaluate(() => {
    const card = [...document.querySelectorAll('div')].find((d) => d.textContent === '待完成 / 总数')
    return card?.closest('div.flex.flex-col.justify-between')?.innerText?.replace(/\n/g, ' ')
  })
const kpiBefore = await grabKpi()
await page.evaluate(() => document.querySelector('button[title="标记完成"]')?.click())
await sleep(400)
const kpiAfter = await grabKpi()
console.log('3 日程勾选 KPI:', JSON.stringify(kpiBefore), '→', JSON.stringify(kpiAfter))
await page.evaluate(() => document.querySelector('button.relative.flex.h-10.w-10')?.click())
await sleep(400)
const notifOpen = await page.evaluate(() => document.body.innerText.includes('通知中心'))
console.log('3 通知下拉打开:', notifOpen)
await page.screenshot({ path: `${OUT}\\verify-notifications.png` })
await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find((x) => x.textContent.includes('全部标为已读'))
  b?.click()
})
await sleep(300)
const unreadGone = await page.evaluate(
  () => JSON.parse(localStorage.getItem('agri-platform-state-v1')).notifications.every((n) => n.read),
)
console.log('3 全部标已读已持久化:', unreadGone)

// 4. 地图点击地块 → 详情侧栏 → 安排灌溉
await gotoPage('map')
// 直接点击 A1 多边形（SVG 元素）
await page.evaluate(() => {
  const poly = [...document.querySelectorAll('polygon')].find((p) =>
    p.getAttribute('points')?.startsWith('70,160'),
  )
  poly?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
})
await sleep(400)
const panelOpen = await page.evaluate(
  () => document.body.innerText.includes('土壤湿度') && document.body.innerText.includes('安排灌溉'),
)
console.log('4 地块详情侧栏打开:', panelOpen)
await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === '安排灌溉')
  b?.click()
})
await sleep(400)
const irrCreated = await page.evaluate(() => document.body.innerText.includes('已创建灌溉任务'))
const irrTask = await page.evaluate(() =>
  JSON.parse(localStorage.getItem('agri-platform-state-v1')).tasks.some((t) => t.title.includes('灌溉作业')),
)
console.log('4 安排灌溉创建任务:', irrCreated, '已持久化:', irrTask)
await page.screenshot({ path: `${OUT}\\verify-field-panel.png` })

// 5. 作物页添加生长记录
await gotoPage('crops')
await page.evaluate(() => {
  const card = [...document.querySelectorAll('button')].find((b) => b.textContent.includes('A1 水稻'))
  card?.click()
})
await sleep(400)
await page.type('textarea[placeholder*="记录作物长势"]', '无人机巡田：分蘖均匀，无病虫害。')
await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find((x) => x.textContent.includes('添加记录'))
  b?.click()
})
await sleep(400)
const recordSaved = await page.evaluate(() =>
  JSON.parse(localStorage.getItem('agri-platform-state-v1')).growthRecords.some((r) =>
    r.text.includes('无人机巡田'),
  ),
)
console.log('5 生长记录已保存:', recordSaved)
await page.screenshot({ path: `${OUT}\\verify-growth-record.png` })

await browser.close()
console.log('ALL-DONE')
