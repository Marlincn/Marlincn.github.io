'use strict'
/* 浏览量获取器(P5, 2026-08-27): 部署前运行一次即可, 生成 scripts/views-cache.json。
   - 数据源: busuanzi(ibruce) 服务端 API——带 Referer=线上页面 URL 查询 page_pv(已实测可行)
     Referer 必须为线上精确 URL; 中文路径请使用编码后的 URL。
   - 枚举范围: 全部文章(source/_posts/*.md → /posts/<文件名>/) + 全部工程(projects-data id → /projects/<id>/) + 首页(/)
   - 输出: scripts/views-cache.json
       { fetchedAt: ms,                    // 本次抓取时间
         pv: { "/path/": n },              // ★显示值(排序用) = busuanzi 真实值 + shift
         shift: { "/path/": n },           // 人工偏移(手动修改 pv 后自动记录, 永不重置)
         lastRaw: { "/path/": n },         // 上次抓取的 busuanzi 真实值(诊断用)
         lastDisplay: { "/path/": n } }    // 上次写入的显示值(用于检测手动修改)
   - 手动修改语义: 直接编辑 pv 段的值即可。下次抓取时检测到该值与基线不同 ->
     差值并入 shift, 之后显示值 = 真实值 + shift, 即"在手动修改后的数字上继续累加真实增量"。
   - 容错: 单条失败跳过(不改动该页); 24h 内已有缓存且未传 --force 时直接复用。
   用法: node scripts/lib/fetch-views.js [--force]
   注意: 本文件放在 scripts/lib/(hexo 不递归加载), 避免被 hexo 启动时误执行。 */

const fs = require('fs')
const path = require('path')
const https = require('https')
const { SITE } = require('../site-config')

const CACHE_FILE = path.join(__dirname, '..', 'views-cache.json')
const CACHE_TTL = 24 * 60 * 60 * 1000
const API_HOST = 'busuanzi.ibruce.info'

// 枚举全部需要统计浏览量的页面(与 home-generator 的 viewMap 键规则保持一致)
function entries() {
  const list = []
  const postsDir = path.join(__dirname, '..', '..', 'source', '_posts')
  for (const f of fs.readdirSync(postsDir)) {
    if (f.endsWith('.md')) list.push({ key: '/posts/' + f.slice(0, -3) + '/', label: f.slice(0, -3) })
  }
  const projects = require('../projects-data')
  for (const p of projects) list.push({ key: '/projects/' + p.id + '/', label: p.id })
  list.push({ key: '/', label: 'home' })
  return list
}

// 单页查询: 返回数值或 null(失败)
function fetchPv(pageKey) {
  return new Promise(resolve => {
    const req = https.request({
      hostname: API_HOST,
      path: '/busuanzi?jsonpCallback=BusuanziCallback',
      method: 'GET',
      headers: {
        Referer: SITE + encodeURI(pageKey),
        'User-Agent': 'Mozilla/5.0 (compatible; Marlin-builder/1.0)'
      },
      timeout: 8000
    }, res => {
      let body = ''
      res.on('data', c => { body += c })
      res.on('end', () => {
        // 响应形如: try{BusuanziCallback({"site_uv":61,"page_pv":8,...});}catch(e){}
        const m = body.match(/"page_pv"\s*:\s*(\d+)/)
        resolve(m ? parseInt(m[1], 10) : null)
      })
    })
    req.on('error', () => resolve(null))
    req.on('timeout', () => { req.destroy(); resolve(null) })
    req.end()
  })
}

;(async function main() {
  const force = process.argv.includes('--force')
  let cache = { fetchedAt: 0, pv: {}, shift: {}, lastRaw: {}, lastDisplay: {} }
  try { cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8')) } catch (e) { /* 无缓存 */ }
  if (!force && cache.fetchedAt && Date.now() - cache.fetchedAt < CACHE_TTL) {
    const t = new Date(cache.fetchedAt).toISOString()
    console.log('[fetch-views] 缓存未过期(24h, ' + t + '), 直接复用; 需要刷新请加 --force')
    return
  }
  const pv = cache.pv || {}
  const shift = cache.shift || {}
  const lastRaw = cache.lastRaw || {}
  const lastDisplay = cache.lastDisplay || {}
  let ok = 0; let fail = 0; let manual = 0
  for (const it of entries()) {
    const v = await fetchPv(it.key)
    if (v === null) {
      fail++
      console.log('  [skip] ' + it.label + ' (接口失败, 保留旧值 ' + (pv[it.key] ?? '无') + ')')
      await new Promise(r => setTimeout(r, 250))
      continue
    }
    // 手动修改检测: 当前 pv 与上次写入的显示值不一致 => 用户改过, 差值并入 shift
    const prevDisplay = lastDisplay[it.key]
    const current = pv[it.key]
    if (current != null && prevDisplay != null && current !== prevDisplay) {
      shift[it.key] = (shift[it.key] || 0) + (current - prevDisplay)
      manual++
      console.log('  [manual] ' + it.label + ' 手动值 ' + current + ' (基线 ' + prevDisplay + ') -> 偏移 ' + shift[it.key])
    }
    // 显示值 = 真实值 + 累计偏移(未手动过的页面偏移为 0, 即纯自动)
    const display = v + (shift[it.key] || 0)
    pv[it.key] = display
    lastRaw[it.key] = v
    lastDisplay[it.key] = display
    ok++
    await new Promise(r => setTimeout(r, 250))   // 温和节流
  }
  fs.writeFileSync(CACHE_FILE, JSON.stringify({ fetchedAt: Date.now(), pv, shift, lastRaw, lastDisplay }, null, 2), 'utf8')
  console.log('[fetch-views] 完成: ok=' + ok + ' fail=' + fail + ' 手动偏移=' + manual + ' -> ' + CACHE_FILE)
})().catch(e => { console.error('[fetch-views] FAILED: ' + e.message); process.exit(1) })
