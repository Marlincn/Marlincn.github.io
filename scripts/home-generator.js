'use strict'
/* 首页生成器(P2.1/P2.2, P1 重建 2026-08-27, LATEST 修复 2026-08-27):
   输出 index.html,由 themes/butterfly/layout/home.pug 渲染。
   公共壳(loading/sidebar/header/nav)由 composeShellTop 组装;
   页级内容: 顶部 hero(home-parts/top.html, LATEST SIGNAL 动态注入占位) + 中部卡片骨架(mid.html)
           + 尾部(页级 bottom + 公共尾)。
   head 由 base.pug + _partials/head.pug 统一输出,
   精选记录卡片由模板基于 posts 动态输出。 */

const fs = require('fs')
const path = require('path')
const { composeShellTop, buildFooter, RIGHTSIDE_ASIDE } = require('./parts-common')
const { fmtDate } = require('./lib/date')

const partsDir = path.join(__dirname, '..', 'themes', 'butterfly', 'layout', 'home-parts')
const read = f => fs.readFileSync(path.join(partsDir, f), 'utf8')

// 首页专有: 全屏背景动画层(body 直接子元素, loading 与 sidebar 之间)
const WEB_BG = '<div class="bg-animation" id="web_bg"></div>'

// LATEST SIGNAL(hero 内动态): 结构与旧版一致, 数据实时取最新文章
function latestSignal(p) {
  const url = encodeURI('/' + p.path.replace(/\/?index\.html$/, ''))
  return '<a class="nova-latest-signal" href="' + url + '" aria-label="最新文章：' + p.title + '，发布于 ' + fmtDate(p.date) + '"><span>LATEST SIGNAL</span><strong>' + p.title + '</strong><time>' + fmtDate(p.date) + '</time></a>'
}

hexo.extend.generator.register('nova-home', function (locals) {
  const posts = locals.posts.sort('order', 1).toArray()
  const latest = posts[0]
  return {
    path: 'index.html',
    layout: 'home',
    data: {
      posts: posts,
      // 公共壳 + 页级 hero 段(nova-homepage 开/hero/滚动提示; LATEST 动态注入原位置)
      shellTop: composeShellTop({ headerCls: 'full_page', pre: WEB_BG }) + '\n' +
        read('top.html').split('<!--NOVA-LATEST-->').join(latest ? latestSignal(latest) : ''),
      mid: read('mid.html'),
      // 页级尾部(碎片+自定义页脚+容器闭合) + 公共尾(rightside/脚本/local-search, 无公共页脚)
      shellBottom: read('bottom.html') + '\n' + buildFooter({
        withFooter: false,
        hideExtra: RIGHTSIDE_ASIDE,
        pageScripts: read('page-scripts.html')
      })
    }
  }
})
