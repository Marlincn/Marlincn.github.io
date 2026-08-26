'use strict'
/* 工程页生成器(P3):输出 /projects/index.html,由 themes/butterfly/layout/projects.pug 渲染。
   - 数据源:scripts/projects-data.js(5 个工程,字段来自 deymo-site info.json 与 manifest)
   - 结构仿 nova-tags:hero/底部片段沿用 idx-parts 体系(工程页 top 在 project-parts/top.html)
   - 封面图:source/img/projects/*.webp(sharp 质量 80 转换) */

const fs = require('fs')
const path = require('path')

const projects = require('./projects-data')

const projectParts = path.join(__dirname, '..', 'themes', 'butterfly', 'layout', 'project-parts')
const idxParts = path.join(__dirname, '..', 'themes', 'butterfly', 'layout', 'idx-parts')
const PROJECT_TOP = fs.readFileSync(path.join(projectParts, 'top.html'), 'utf8')
const IDX_BOTTOM = fs.readFileSync(path.join(idxParts, 'bottom.html'), 'utf8')

const DL_BASE = 'https://deymocn.github.io'

const SITE = (hexo.config.url || '').replace(/\/+$/, '')

const CATEGORIES = [
  {
    key: 'mcu',
    name: '单片机',
    eyebrow: 'MCU PROJECTS',
    motto: '硬件与嵌入式：从开源复刻到课程设计。'
  },
  {
    key: 'model',
    name: '建模',
    eyebrow: 'MODELLING',
    motto: '形从意起：Blender 入门与机械课程设计。'
  }
]

function dlHref(p) {
  return DL_BASE + encodeURI(p.url)
}

function projectLdjson() {
  const url = encodeURI(SITE + '/projects/')
  return '<script type="application/ld+json">{"@context":"https://schema.org","@type":"CollectionPage","@id":"' + url + '#webpage","name":"\u5de5\u7a0b","url":"' + url + '","description":"\u5355\u7247\u673a\u4e0e\u5efa\u6a21\u7684\u52a8\u624b\u5b9e\u5f55\u2014\u2014\u4ece\u5f00\u6e90\u590d\u523b\u5230\u8bfe\u7a0b\u8bbe\u8ba1\u3002","inLanguage":"zh-CN","isPartOf":{"@type":"WebSite","@id":"' + SITE + '/#website","url":"' + SITE + '/","name":"Marlin"}}</script>'
}

hexo.extend.generator.register('nova-projects', function () {
  const prepared = projects.map(p => ({
    id: p.id,
    title: p.title,
    category: p.category,
    categoryKey: p.categoryKey,
    subtitle: p.subtitle,
    date: p.date,
    description: p.description,
    intro: p.intro || '',
    tags: p.tags,
    link: p.link,
    linkLabel: p.linkLabel || 'GitHub',
    link2: p.link2,
    link2Label: p.link2Label || '更多信息',
    cover: p.cover,
    coverW: p.coverW,
    coverH: p.coverH,
    downloads: (p.downloads || []).map(d => ({ name: d.name, href: dlHref(d), sizeLabel: d.sizeLabel || '' }))
  }))

  const uniqueTags = new Set()
  prepared.forEach(p => p.tags.forEach(t => uniqueTags.add(t)))

  const stats = [
    { value: String(prepared.length), en: 'PROJECTS', zh: '有效项目' },
    { value: String(CATEGORIES.length), en: 'CATEGORIES', zh: '工程分类' },
    { value: String(uniqueTags.size), en: 'TAGS', zh: '技术标签' },
    { value: 'WIP', en: 'IN PROGRESS', zh: '持续更新中' }
  ]

  const files = [
    {
      path: 'projects/index.html',
      layout: 'projects',
      data: {
        stats: stats,
        projects: prepared,
        ldjson: projectLdjson(),
        idxTop: PROJECT_TOP,
        idxBottom: IDX_BOTTOM
      }
    }
  ]

  return files
})
