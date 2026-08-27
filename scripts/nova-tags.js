'use strict'
/* 自动生成文章标签系统(P2.2 重构):
   - articles/index.html     → layout: tags-index(数据驱动,head 由 base 统一输出)
   - articles/<tag>/index.html → layout: tag(数据驱动)
   - search.xml / sitemap.xml / atom.xml(字符串生成)
   不再使用 nova-templates 占位符模板;域名从 _config.yml url 读取。 */

const fs = require('fs')
const path = require('path')
const { composeShellTop, buildFooter, RIGHTSIDE_ASIDE } = require('./parts-common')
const { fmtDate } = require('./lib/date')

const tagParts = path.join(__dirname, '..', 'themes', 'butterfly', 'layout', 'tag-parts')
const idxParts = path.join(__dirname, '..', 'themes', 'butterfly', 'layout', 'idx-parts')
const readTagTop = fs.readFileSync(path.join(tagParts, 'top.html'), 'utf8')
const readTagBottom = fs.readFileSync(path.join(tagParts, 'bottom.html'), 'utf8')
const readIdxTop = fs.readFileSync(path.join(idxParts, 'top.html'), 'utf8')

const SITE = (hexo.config.url || '').replace(/\/+$/, '')

function stripMd(text) {
  return text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&(#x2F|#47|#X2F|nbsp|amp|lt|gt|quot);/gi, m => ({ '&#x2F;': '/', '&#x2f;': '/', '&#47;': '/', '&nbsp;': ' ', '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"' }[m] || m))
    .replace(/[#>*_~|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function summaryOf(post) {
  if (post.excerpt && post.excerpt.trim()) return stripMd(post.excerpt).slice(0, 90)
  const body = post.content ? stripMd(post.content) : ''
  return (body.slice(0, 90) || '')
}

function escXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function htmlToText(html) {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|td|tr|li|ol|ul|h[1-6]|pre|blockquote|section|article)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\u00a0/g, ' ')
}

function renderSearchXml(posts) {
  const entries = posts
    .slice()
    .sort((a, b) => b.date - a.date)
    .map(p => {
      const url = postUrl(p)
      let bodyHtml = (p.content || '').replace(/<h1[^>]*>[\s\S]*?<\/h1>/gi, '')
      bodyHtml = bodyHtml
        .replace(/<figure class="highlight[^>]*>[\s\S]*?<\/figure>/gi, '\n')
        .replace(/<pre[^>]*>[\s\S]*?<\/pre>/gi, '\n')
        .replace(/<code[^>]*>[\s\S]*?<\/code>/gi, ' ')
      const text = htmlToText(bodyHtml).replace(/\n{3,}/g, '\n\n').trim()
      const content = text.replace(/\]\]>/g, '] ]>')
      return '<entry>\n    <title>' + escXml(p.title) + '</title>\n    <url>' + escXml(url) + '</url>\n    <content><![CDATA[' + content + ']]></content>\n  </entry>'
    })
    .join('\n')
  return '<?xml version="1.0" encoding="utf-8"?>\n<search>\n' + entries + '\n</search>\n'
}

function renderSitemap(posts) {
  const urls = posts
    .slice()
    .sort((a, b) => b.date - a.date)
    .map(p => {
      return '  <url>\n    <loc>' + escXml(encodeURI(SITE + postUrl(p))) + '</loc>\n    <lastmod>' + fmtDate(p.date) + '</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>'
    })
    .join('\n')
  return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls + '\n</urlset>\n'
}

function renderAtom(posts) {
  const sorted = posts.slice().sort((a, b) => b.date - a.date)
  const updated = fmtDate(sorted[0].date) + 'T00:00:00.000Z'
  const entries = sorted.map(p => {
    const url = postUrl(p)
    const cats = (p.tags && p.tags.toArray ? p.tags.toArray() : (p.tags || [])).map(t => t.name)
    const catXml = cats.map(c => '<category term="' + escXml(c) + '" scheme="' + SITE + '/articles/' + escXml(encodeURIComponent(c)) + '/"/>').join('\n    ')
    return '  <entry>\n    <author>\n      <name>Marlin</name>\n    </author>\n    ' + catXml + '\n    <id>' + SITE + escXml(url) + '</id>\n    <link href="' + SITE + escXml(url) + '"/>\n    <published>' + fmtDate(p.date) + 'T00:00:00.000Z</published>\n    <summary>' + escXml(summaryOf(p)) + '</summary>\n    <title>' + escXml(p.title) + '</title>\n    <updated>' + fmtDate(p.date) + 'T00:00:00.000Z</updated>\n  </entry>'
  }).join('\n')
  return '<?xml version="1.0" encoding="utf-8"?>\n<feed xmlns="http://www.w3.org/2005/Atom">\n  <author>\n    <name>Marlin</name>\n  </author>\n  <generator uri="https://hexo.io/">Hexo</generator>\n  <id>' + SITE + '/</id>\n  <link href="' + SITE + '/" rel="alternate"/>\n  <link href="' + SITE + '/atom.xml" rel="self"/>\n  <rights>All rights reserved 2026, Marlin</rights>\n  <subtitle>个人学习与生活记录。</subtitle>\n  <title>Marlin</title>\n  <updated>' + updated + '</updated>\n' + entries + '\n</feed>\n'
}

function postUrl(post) {
  let p = post.path || ''
  p = p.replace(/\/index\.html$/, '/')
  if (!p.startsWith('/')) p = '/' + p
  return p
}

function tagLdjson(tagName) {
  const tagUrl = encodeURI(SITE + '/articles/' + tagName + '/')
  return '<script type="application/ld+json">{"@context":"https://schema.org","@type":"CollectionPage","@id":"' + tagUrl + '#webpage","name":"' + tagName + '","url":"' + tagUrl + '","description":"浏览 Marlin 博客中标记为\u201c' + tagName + '\u201d的文章与学习记录。","inLanguage":"zh-CN","isPartOf":{"@type":"WebSite","@id":"' + SITE + '/#website","url":"' + SITE + '/","name":"Marlin"}}</script>'
}

function idxLdjson() {
  return '<script type="application/ld+json">{"@context":"https://schema.org","@type":"CollectionPage","@id":"' + SITE + '/articles/#webpage","name":"\u6587\u7ae0","url":"' + SITE + '/articles/","description":"\u901a\u8fc7\u6587\u7ae0\u67e5\u627e Marlin \u535a\u5ba2\u4e2d\u7684\u6280\u672f\u7b14\u8bb0\u3001\u7b97\u6cd5\u7ec3\u4e60\u4e0e\u5b66\u4e60\u8bb0\u5f55\u3002","inLanguage":"zh-CN","isPartOf":{"@type":"WebSite","@id":"' + SITE + '/#website","url":"' + SITE + '/","name":"Marlin"}}</script>'
}

hexo.extend.generator.register('nova-tags', function (locals) {
  const posts = locals.posts.toArray ? locals.posts.toArray() : locals.posts
  const tagMap = new Map()
  posts.forEach(p => {
    const tags = p.tags && p.tags.toArray ? p.tags.toArray() : (p.tags || [])
    tags.forEach(t => {
      if (!tagMap.has(t.name)) tagMap.set(t.name, [])
      tagMap.get(t.name).push(p)
    })
  })
  const allTags = Array.from(tagMap.entries()).map(([name, list]) => ({ name, count: list.length, posts: list }))

  const sortedTags = allTags.slice().sort((a, b) => (b.count - a.count) || (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
  const sortedAllTags = allTags.slice().sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
  const top = sortedTags[0] || { name: '', count: 0 }
  const latest = posts.slice().sort((a, b) => (b.date - a.date) || ((a.order || 999) - (b.order || 999)))[0] || { title: '', date: new Date() }

  // 公共壳(P1 重建): sidebar 统计卡数字动态计算
  const articles = { href: '/articles/', label: '文章', count: String(posts.length) }
  const idxShellTop = composeShellTop({
    pageClass: 'type-tags',
    headerCls: 'not-home-page nova-tag-hero',
    headerStyle: 'background-image:url(/img/hero/tag-hero.webp)',
    siteData: articles,
    closeHeader: false
  }) + '\n' + readIdxTop
  const idxShellBottom = buildFooter()
  const tagShellTop = composeShellTop({
    pageClass: '',
    headerCls: 'not-home-page nova-tag-hero',
    headerStyle: 'background-image:url(/img/hero/leetcode.webp)',
    siteData: articles,
    closeHeader: false
  }) + '\n' + readTagTop
  // tag 页级: 单双栏切换按钮 + 页级脚本(tag-page.js)
  const tagShellBottom = buildFooter({ hideExtra: RIGHTSIDE_ASIDE, pageScripts: readTagBottom })

  const files = [
    { path: 'search.xml', data: renderSearchXml(posts) },
    { path: 'sitemap.xml', data: renderSitemap(posts) },
    { path: 'atom.xml', data: renderAtom(posts) },
    {
      path: 'articles/index.html',
      layout: 'tags-index',
      data: {
        topicsCount: String(allTags.length),
        articlesCount: String(posts.length),
        topTopicCount: String(top.count),
        topTopicName: top.name,
        latestDate: fmtDate(latest.date),
        latestTitle: latest.title,
        tags: sortedTags.map(t => ({ name: t.name, count: t.count })),
        ldjson: idxLdjson(),
        shellTop: idxShellTop,
        shellBottom: idxShellBottom
      }
    }
  ]

  allTags.forEach(t => {
    const sorted = t.posts.slice().sort((a, b) => (a.order || 999) - (b.order || 999))
    const count = sorted.length
    const firstYear = fmtDate(sorted[0].date).slice(0, 4)
    const last = fmtDate(sorted[sorted.length - 1].date)
    const lastDate = last.slice(5).replace('-', '·')
    const yearRange = firstYear + '—' + last.slice(0, 4)
    const seed = t.name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '').slice(0, 6) || 't'
    files.push({
      path: 'articles/' + t.name + '/index.html',
      layout: 'tag',
      data: {
        tagName: t.name,
        posts: sorted,
        allTags: sortedAllTags.map(x => ({ name: x.name, count: x.count })),
        count: String(count),
        firstYear: firstYear,
        lastDate: lastDate,
        yearRange: yearRange,
        seed: seed,
        mainDesc: '围绕“' + t.name + '”整理的文章与实践记录。',
        ldjson: tagLdjson(t.name),
        shellTop: tagShellTop,
        shellBottom: tagShellBottom
      }
    })
  })

  return files
})
