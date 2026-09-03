'use strict'
/* 工程更新日期(唯一实现, A1 2026-09-02): 供列表页/详情页/首页 LATEST SIGNAL 共用。
   判定链: ①显式 updated 字段(如详情页"更新于"= 本时刻) → ②资产目录内最新文件的 mtime
   (robocopy 保留源文件时间, 同步不污染) → ③目录 mtime → ④date 兜底 */
const fs = require('fs')
const path = require('path')
const { fmtDate } = require('./date')

function projectUpdated(p) {
  if (p.updated) return String(p.updated)
  const dl = (p.downloads && p.downloads[0] && (p.downloads[0].href || p.downloads[0].url)) || ''
  const d = decodeURIComponent(String(dl).replace(/^https?:\/\/[^/]+/, ''))
  const m = d.match(/^\/assets\/projects\/([^/]+)\//)
  if (m) {
    const dir = path.join(__dirname, '..', '..', 'source', 'assets', 'projects', m[1])
    try {
      if (fs.existsSync(dir)) {
        let maxM = 0
        for (const f of fs.readdirSync(dir)) {
          try { maxM = Math.max(maxM, fs.statSync(path.join(dir, f)).mtime.getTime()) } catch (e) {}
        }
        if (maxM) return new Date(maxM).toISOString().slice(0, 10)
      }
    } catch (e) { /* 继续兜底 */ }
    try { return fmtDate(fs.statSync(dir).mtime) } catch (e) { /* 目录缺失则继续兜底 */ }
  }
  return p.date || ''
}

module.exports = { projectUpdated }
