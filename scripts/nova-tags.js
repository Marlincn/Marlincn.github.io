'use strict'
/* 自动生成文章标签系统(nova-tag 样式):
   - articles/index.html(标签索引)
   - articles/<tag>/index.html(每个标签页)
   模板:scripts/templates/*.html(占位符版,源自原站静态页结构)。
   新增/修改文章 tags 后执行 hexo clean && hexo generate 即自动更新,无需手工维护。 */

const fs = require('fs')
const path = require('path')

const tplDir = path.join(__dirname, '..', 'nova-templates')
const TAG_TPL = fs.readFileSync(path.join(tplDir, 'tag-template.html'), 'utf8')
const IDX_TPL = fs.readFileSync(path.join(tplDir, 'index-template.html'), 'utf8')

const COVER_RULES = [
  [/MySQL|sql|PostgreSQL|数据库/i, 'tech-mysql.webp'],
  [/数组|链表|栈|字符串|算法|LeetCode|KMP|队列/i, 'tech-algorithm.webp'],
  [/Go/i, 'tech-go.webp']
]
function coverFor(post) {
  const tags = (post.tags && post.tags.toArray ? post.tags.toArray() : (post.tags || [])).map(t => t.name)
  const name = tags.join(' ')
  for (const [re, cover] of COVER_RULES) {
    if (re.test(name)) return cover
  }
  return 'tech-notes.webp'
}

function stripMd(text) {
  return text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_~|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function summaryOf(post) {
  if (post.excerpt && post.excerpt.trim()) return stripMd(post.excerpt).slice(0, 90)
  const body = post.content ? stripMd(post.content) : ''
  return (body.slice(0, 90) || '')
}

function fmtDate(d) {
  const m = d
  const y = m.year ? m.year() : m.getFullYear()
  const mo = String((m.month ? m.month() : m.getMonth()) + 1).padStart(2, '0')
  const day = String(m.date ? m.date() : m.getDate()).padStart(2, '0')
  return y + '-' + mo + '-' + day
}

function postUrl(post) {
  let p = post.path || ''
  p = p.replace(/\/index\.html$/, '/')
  if (!p.startsWith('/')) p = '/' + p
  return p
}

function cardHtml(post, tagName, index, idSeed) {
  const url = postUrl(post)
  const title = post.title
  const cover = coverFor(post)
  const summary = summaryOf(post)
  const date = fmtDate(post.date)
  const id = 'nova-tag-note-' + idSeed + '-' + index
  return [
    '      <article class="nova-tag-post-card" id="' + id + '" data-note-title="' + title + '" data-note-index="' + index + '" data-note-href="' + url + '">',
    '        <a class="nova-tag-post-cover" href="' + url + '" aria-label="阅读 ' + title + '">',
    '          <img src="/img/covers/' + cover + '" alt="' + title + '" loading="lazy" decoding="async" onerror="this.onerror=null;this.src=\'/img/covers/tech-notes.webp\'" width="1200" height="900">',
    '        </a>',
    '        <div class="nova-tag-post-content">',
    '          <div class="nova-tag-post-meta">',
    '            <time datetime="' + date + 'T00:00:00.000Z">' + date + '</time>',
    '            <span>' + tagName + '</span>',
    '            <span>' + tagName + '</span>',
    '          </div>',
    '          <h2><a href="' + url + '">' + title + '</a></h2>',
    '          <p>' + summary + '</p>',
    '          <a class="nova-tag-post-action" href="' + url + '">阅读笔记 <span>→</span></a>',
    '        </div>',
    '      </article>'
  ].join('\n')
}

function readingLinkHtml(post, index, idSeed) {
  const id = 'nova-tag-note-' + idSeed + '-' + index
  return [
    '    <a class="nova-tag-reading-link" href="#' + id + '" data-note-target="' + id + '">',
    '      <span>' + String(index).padStart(2, '0') + '</span>',
    '      <strong>' + post.title + '</strong>',
    '      <i aria-hidden="true"></i>',
    '    </a>'
  ].join('\n')
}

function renderTagPage(tagName, posts, allTags) {
  const sorted = posts.slice().sort((a, b) => a.date - b.date)
  const count = sorted.length
  const firstYear = fmtDate(sorted[0].date).slice(0, 4)
  const last = fmtDate(sorted[sorted.length - 1].date)
  const lastDate = last.slice(5).replace('-', '·')
  const idSeed = tagName.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '').slice(0, 6) || 't'

  const cards = sorted.map((p, i) => cardHtml(p, tagName, i + 1, idSeed)).join('\n')
  const reading = sorted.map((p, i) => readingLinkHtml(p, i + 1, idSeed)).join('\n')
  const related = allTags
    .filter(t => t.name !== tagName)
    .map(t => '<a class="nova-tag-related-link" href="/articles/' + t.name + '/">' + t.name + '<span>' + t.count + '</span></a>')
    .join('')

  return TAG_TPL
    .replace(/{{SEO_TITLE}}/g, '文章: ' + tagName + ' | Marlin')
    .replace(/{{GLOBAL_TITLE}}/g, '文章: ' + tagName)
    .replace(/{{META_DESC}}/g, '浏览 Marlin 博客中标记为“' + tagName + '”的文章与学习记录。')
    .replace(/{{OG_URL}}/g, 'https://deymocn.github.io/articles/' + tagName + '/')
    .replace(/{{LDJSON}}/g,
      '<script type="application/ld+json">{"@context":"https://schema.org","@type":"CollectionPage","@id":"https://deymocn.github.io/articles/' + tagName + '/#webpage","name":"' + tagName + '","url":"https://deymocn.github.io/articles/' + tagName + '/","description":"浏览 Marlin 博客中标记为“' + tagName + '”的文章与学习记录。","inLanguage":"zh-CN","isPartOf":{"@type":"WebSite","@id":"https://deymocn.github.io/#website","url":"https://deymocn.github.io/","name":"Marlin"}}</script>')
    .replace(/{{TAG_NAME}}/g, tagName)
    .replace(/{{HERO_ARIA}}/g, tagName + ' 文章概览')
    .replace(/{{NOTES_COUNT}}/g, String(count))
    .replace(/{{FIRST_YEAR}}/g, firstYear)
    .replace(/{{LAST_DATE}}/g, lastDate)
    .replace(/{{MAIN_DESC}}/g, '围绕“' + tagName + '”整理的文章与实践记录。')
    .replace(/{{POSTS}}/g, cards)
    .replace(/{{READING}}/g, reading)
    .replace(/{{RELATED}}/g, related)
}

function renderIndexPage(tags, posts) {
  const sortedTags = tags.slice().sort((a, b) => b.count - a.count)
  const top = sortedTags[0]
  const latest = posts.slice().sort((a, b) => b.date - a.date)[0]
  const cards = sortedTags
    .map((t, i) => {
      return [
        '      <a class="nova-tags-card" href="/articles/' + t.name + '/">',
        '        <span>' + String(i + 1).padStart(2, '0') + '</span>',
        '        <div><h2>' + t.name + '</h2><p>围绕' + t.name + '整理的文章与学习记录。</p></div>',
        '        <strong>' + t.count + '<small> NOTES</small></strong>',
        '        <i aria-hidden="true">→</i>',
        '      </a>'
      ].join('\n')
    })
    .join('\n')
  return IDX_TPL
    .replace(/{{TOPICS_COUNT}}/g, String(tags.length))
    .replace(/{{ARTICLES_COUNT}}/g, String(posts.length))
    .replace(/{{TOP_TOPIC_COUNT}}/g, String(top.count))
    .replace(/{{TOP_TOPIC_NAME}}/g, top.name)
    .replace(/{{LATEST_DATE}}/g, fmtDate(latest.date))
    .replace(/{{LATEST_TITLE}}/g, latest.title)
    .replace(/{{CARDS}}/g, cards)
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
      // strip H1 title from body so snippets start from real content;
      // title matching still works via the <title> element
      let bodyHtml = (p.content || '').replace(/<h1[^>]*>[\s\S]*?<\/h1>/gi, '')
      // exclude source code (hexo highlight blocks and inline <code>) from the
      // index so hits and snippets only ever land on rendered prose
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
      return '  <url>\n    <loc>https://deymocn.github.io' + escXml(postUrl(p)) + '</loc>\n    <lastmod>' + fmtDate(p.date) + '</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>'
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
    const catXml = cats.map(c => '<category term="' + escXml(c) + '" scheme="https://deymocn.github.io/articles/' + escXml(encodeURIComponent(c)) + '/"/>').join('\n    ')
    return '  <entry>\n    <author>\n      <name>Marlin</name>\n    </author>\n    ' + catXml + '\n    <id>https://deymocn.github.io' + escXml(url) + '</id>\n    <link href="https://deymocn.github.io' + escXml(url) + '"/>\n    <published>' + fmtDate(p.date) + 'T00:00:00.000Z</published>\n    <summary>' + escXml(summaryOf(p)) + '</summary>\n    <title>' + escXml(p.title) + '</title>\n    <updated>' + fmtDate(p.date) + 'T00:00:00.000Z</updated>\n  </entry>'
  }).join('\n')
  return '<?xml version="1.0" encoding="utf-8"?>\n<feed xmlns="http://www.w3.org/2005/Atom">\n  <author>\n    <name>Marlin</name>\n  </author>\n  <generator uri="https://hexo.io/">Hexo</generator>\n  <id>https://deymocn.github.io/</id>\n  <link href="https://deymocn.github.io/" rel="alternate"/>\n  <link href="https://deymocn.github.io/atom.xml" rel="self"/>\n  <rights>All rights reserved 2026, Marlin</rights>\n  <subtitle>个人学习与生活记录。</subtitle>\n  <title>Marlin</title>\n  <updated>' + updated + '</updated>\n' + entries + '\n</feed>\n'
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
  const files = [
    { path: 'articles/index.html', data: renderIndexPage(allTags, posts) },
    { path: 'search.xml', data: renderSearchXml(posts) },
    { path: 'sitemap.xml', data: renderSitemap(posts) },
    { path: 'atom.xml', data: renderAtom(posts) }
  ]
  allTags.forEach(t => {
    files.push({ path: 'articles/' + t.name + '/index.html', data: renderTagPage(t.name, t.posts, allTags) })
  })
  return files
})
