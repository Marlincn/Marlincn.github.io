'use strict'
/* 公共页面片段(P1 去重建模, 2026-08-27):
   单源组件: loading / sidebar(可选统计卡) / nav / footer(公共尾部)。
   页级差异由插槽注入:
     - SIDEBAR: <!--NOVA-SITE-DATA--> 统计卡(href/label/count, 生成器动态计算)
     - FOOTER:  <!--NOVA-RIGHTSIDE-HIDE--> hide 组扩展按钮(单双栏切换)
               <!--NOVA-RIGHTSIDE-SHOW--> show 组扩展按钮(去评论)
               <!--NOVA-PAGE-SCRIPTS-->  页级脚本(js-pjax 内, mermaid 之后)
   组装 API(生成器/页面配置使用):
     composeShellTop(opts)    页头壳: loading + [pre] + sidebar + body-wrap 开 + header 开 + nav
     composeShellBottom(opts) 页尾壳: footer 主体(可关) + rightside + 公共脚本 + local-search
     composeShell(opts)       完整壳(静态页): 头壳 + </header> + <main> + 内容 + </main> + 尾壳 */

const fs = require('fs')
const path = require('path')
const { VERSION } = require('./site-config')

const cmnDir = path.join(__dirname, '..', 'themes', 'butterfly', 'layout', 'parts-common')
const read = f => fs.readFileSync(path.join(cmnDir, f), 'utf8')

const LOADING = read('nova-loading.html')
const NAV = read('nav.html')
const SIDEBAR = read('sidebar.html')
const FOOTER = read('footer.html')

// 页级扩展组件(按页注入)
const WALINE_COMMENT = read('waline-comment.html')
const RIGHTSIDE_COMMENT = read('rightside-comment.html')
const RIGHTSIDE_ASIDE = read('rightside-aside.html')

/* 页级 CSS(与各 pug headOpts.extraCss 同值):
   - head 里输出一份(首屏直出, 避免 FOUC)
   - body-wrap 内再输出一份(由生成器经 pageCss 注入): PJAX 切换时随内容替换,
     使页级样式在 PJAX 下自动生效/失效, 无需注入器。
   注意: custom.css / project-detail-page.css / nova-player.css / nova-visitor.css
   已在 _config.butterfly.yml 全局注入 head, 不需要这里声明。 */
const PAGE_STYLES = {
  home: '<link rel="stylesheet" href="/rose-galaxy/css/nova-home.css?v=' + VERSION + '" data-nova-home-style="">',
  music: '<link href="/rose-galaxy/css/music-page.css?v=' + VERSION + '" rel="stylesheet" data-nova-music-style="">',
  about: '<link href="/rose-galaxy/css/about-page.css?v=' + VERSION + '" rel="stylesheet" data-nova-about-style="">',
  tag: '<link rel="stylesheet" href="/rose-galaxy/css/tag-page.css?v=' + VERSION + '">',
  projects: '<link rel="stylesheet" href="/rose-galaxy/css/tag-page.css?v=' + VERSION + '"><link href="/rose-galaxy/css/projects-page.css?v=' + VERSION + '" rel="stylesheet" data-nova-projects-style="">',
  moments: '<link rel="stylesheet" href="/rose-galaxy/css/tag-page.css?v=' + VERSION + '"><link href="/rose-galaxy/css/moments-page.css?v=' + VERSION + '" rel="stylesheet" data-nova-moments-style="">'
}

// footer 拆段: 主体(含 body-wrap 闭合</div>) / 尾部(rightside+脚本+local-search)
const FOOTER_BODY = FOOTER.slice(0, FOOTER.indexOf('<div id="rightside">'))
const FOOTER_TAIL = FOOTER.slice(FOOTER.indexOf('<div id="rightside">'))

const SITE_DATA_RE = /<!--NOVA-SITE-DATA-->/
const HIDE_RE = /<!--NOVA-RIGHTSIDE-HIDE-->/
const SHOW_RE = /<!--NOVA-RIGHTSIDE-SHOW-->/
const SCRIPTS_RE = /<!--NOVA-PAGE-SCRIPTS-->/

function buildSidebar(siteData) {
  const sd = siteData
    ? '<div class="site-data text-center"><a href="' + siteData.href + '"><div class="headline">' + siteData.label + '</div><div class="length-num">' + siteData.count + '</div></a></div>'
    : ''
  return SIDEBAR.replace(SITE_DATA_RE, sd)
}

function buildFooter(opts) {
  const o = opts || {}
  const body = o.withFooter !== false ? FOOTER_BODY : ''
  const tail = FOOTER_TAIL
    .replace(HIDE_RE, o.hideExtra || '')
    .replace(SHOW_RE, o.showExtra || '')
    .replace(SCRIPTS_RE, o.pageScripts || '')
  return body + tail
}

function composeShellTop(opts) {
  const o = opts || {}
  let out = LOADING + '\n'
  if (o.pre) out += o.pre + '\n'
  out += buildSidebar(o.siteData) + '\n'
  out += '<div class="page' + (o.pageClass ? ' ' + o.pageClass : '') + '" id="body-wrap">'
  // 页级 CSS(PJAX 随内容切换): 置于 header 之前, 保证样式先于内容解析
  if (o.pageCss) out += o.pageCss + '\n'
  out += '<header' + (o.headerCls ? ' class="' + o.headerCls + '"' : '') + ' id="page-header"'
  if (o.headerStyle) out += ' style="' + o.headerStyle + '"'
  out += '>' + NAV
  if (o.closeHeader !== false) out += '</header>'
  return out
}

function composeShell(opts) {
  /* 完整页壳(静态页): 页头闭合 header, main 与内容由调用者给出 */
  const o = opts || {}
  const top = composeShellTop({
    pageClass: o.pageClass,
    headerCls: o.headerCls,
    pre: o.pre,
    pageCss: o.pageCss,
    siteData: o.siteData
  })
  let main = '<main' + (o.mainCls ? ' class="' + o.mainCls + '"' : '') + ' id="content-inner">'
  main += (o.mainInner || '')
  main += '</main>'
  // 静态页 header 无页级内容: 闭合 header 已由上一步完成(closeHeader 默认 true)
  return top + main + '\n' + buildFooter({
    hideExtra: o.hideExtra,
    showExtra: o.showExtra,
    pageScripts: o.pageScripts,
    withFooter: o.withFooter
  })
}

module.exports = {
  // 组件
  LOADING, NAV, SIDEBAR, FOOTER,
  WALINE_COMMENT, RIGHTSIDE_COMMENT, RIGHTSIDE_ASIDE,
  PAGE_STYLES,
  // 构建函数
  buildSidebar, buildFooter, composeShellTop, composeShell
}
