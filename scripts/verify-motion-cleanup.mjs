import puppeteer from 'puppeteer-core'
import assert from 'node:assert/strict'
const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true })
const page = await browser.newPage()
try {
  await page.setViewport({ width: 1440, height: 1000 })
  await page.evaluateOnNewDocument(() => {
    // Deliberately stall the compositor animation, but let queued layout work run.
    // This isolates the deadline guarantee from GPU/occlusion timing on Windows.
    window.requestAnimationFrame = callback => setTimeout(() => callback(performance.now()), 16)
    window.cancelAnimationFrame = clearTimeout
    window.pausedGhosts = 0
    const animate = Element.prototype.animate
    Element.prototype.animate = function (...args) {
      const animation = animate.apply(this, args)
      if (this.classList.contains('motion-ghost')) { animation.pause(); window.pausedGhosts++ }
      return animation
    }
  })
  await page.goto((process.env.TEST_BASE || 'http://127.0.0.1:5184/') + '#tasks', { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('.task-status-tabs')
  await page.$eval('.task-status-tabs button:nth-child(2)', e => e.click())
  await page.waitForFunction(() => window.pausedGhosts > 0, { polling: 30 })
  await page.waitForFunction(() => !document.querySelector('.motion-ghost'), { polling: 30, timeout: 1200 })
  assert.ok(await page.evaluate(() => window.pausedGhosts > 0))
  assert.ok(await page.$$eval('[data-motion-item]', nodes => nodes.length > 0))
  console.log('PASS: paused exit animations are removed by deadline; live task rows remain')
} finally { await browser.close() }
