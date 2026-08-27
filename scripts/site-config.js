'use strict'
/* 站点配置单一来源(P4·C5, 2026-08-27): Node 侧生成器共用。
   - SITE: 站点根 URL(去尾斜杠), 从根 _config.yml 的 url 读取
   - 本模块为纯常量模块(不依赖 hexo 作用域), 可被任意 require 链安全加载——
     注意: 被 hexo 直接加载的 scripts/*.js 才有 hexo 参数, 内部 require 的模块没有,
     因此这里不读 hexo.config, 改为直接解析 _config.yml。
   - 前端运行时配置(BILI 常量等)在 source/rose-galaxy/js/lib/site-config.js,
     Node 侧=构建期配置; 前端=浏览器运行时配置 */

const fs = require('fs')
const path = require('path')

function readSite() {
  try {
    const raw = fs.readFileSync(path.join(__dirname, '..', '_config.yml'), 'utf8')
    const m = raw.match(/^url:\s*([^\s#]+)/m)
    return m ? m[1].replace(/\/+$/, '') : ''
  } catch (e) {
    return ''
  }
}

const SITE = readSite()

module.exports = { SITE }
