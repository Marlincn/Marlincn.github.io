'use strict'
/* 工程页生成器(P3):输出 /projects/index.html,由 themes/butterfly/layout/projects.pug 渲染。
   - 数据源:scripts/projects-data.js(5 个工程,字段来自 deymo-site info.json 与 manifest)
   - 结构仿 nova-tags:hero/底部片段沿用 idx-parts 体系(工程页 top 在 project-parts/top.html)
   - 封面图:source/img/projects/*.webp(sharp 质量 80 转换) */

const fs = require('fs')
const path = require('path')
const { composeShellTop, buildFooter } = require('./parts-common')
const { fmtDate } = require('./lib/date')

const projects = require('./projects-data')
const INTRO_BLOCKS = require('./projects-intro')   // 工程介绍文案(自包含, 见 projects-intro.js)

const projectParts = path.join(__dirname, '..', 'themes', 'butterfly', 'layout', 'project-parts')
const readProjectTop = fs.readFileSync(path.join(projectParts, 'top.html'), 'utf8')

// 工程二级页样式: 读入后内联进 <head> <style>, 首帧同步生效(不依赖外部 CSS 时序),
// 修复"第一次进入背景框/侧边栏框/按钮框未加载"的时序 bug
const PROJECT_DETAIL_CSS = fs.readFileSync(
  path.join(__dirname, '..', 'source', 'rose-galaxy', 'css', 'project-detail-page.css'), 'utf8'
)

const { SITE } = require('./site-config')

// 下载文件本站托管(source/assets/projects/_files/): deymocn 已删除, 链接指向本站
const DL_BASE = SITE

// "本时刻" 发表于/更新于: 无 date 的工程(或想保持更新的)用当前时间 YYYY-MM-DD 填充
const TODAY = fmtDate(new Date())

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
    detailHref: '/projects/' + p.id + '/',
    link: p.link,
    linkLabel: p.linkLabel || 'GitHub',
    link2: p.link2,
    link2Label: p.link2Label || '更多信息',
    cover: p.cover,
    coverW: p.coverW,
    coverH: p.coverH,
    downloads: (p.downloads || []).map(d => ({
      name: d.name,
      href: dlHref(d),
      sizeLabel: d.sizeLabel || '',
      desc: d.desc || '',
      files: (d.files || []).map(f => ({ name: f.name, sizeLabel: f.sizeLabel || '', desc: f.desc || '' }))
    }))
  }))

  const uniqueTags = new Set()
  prepared.forEach(p => p.tags.forEach(t => uniqueTags.add(t)))

  const stats = [
    { value: String(prepared.length), en: 'PROJECTS', zh: '有效项目' },
    { value: String(CATEGORIES.length), en: 'CATEGORIES', zh: '工程分类' },
    { value: String(uniqueTags.size), en: 'TAGS', zh: '技术标签' },
    { value: 'WIP', en: 'IN PROGRESS', zh: '持续更新中' }
  ]

  // 公共壳(P1 重建): sidebar 统计卡数字动态计算
  const projectsStat = { href: '/projects/', label: '工程', count: String(prepared.length) }
  const shellTop = composeShellTop({
    pageClass: 'type-projects',
    headerCls: 'not-home-page nova-tag-hero',
    headerStyle: 'background-image:url(/img/hero/projects-hero.webp)',
    siteData: projectsStat,
    closeHeader: false
  }) + '\n' + readProjectTop
  const shellBottom = buildFooter()
  // 二级详情页壳: 文章式 header(post-bg), hero 内容(post-info)由模板输出
  const detailShellTop = composeShellTop({
    pageClass: 'post',
    headerCls: 'post-bg',
    headerStyle: 'background-image:url(/img/hero/projects-detail-hero.webp)',
    siteData: projectsStat,
    closeHeader: false
  })

  const files = [
    {
      path: 'projects/index.html',
      layout: 'projects',
      data: {
        stats: stats,
        projects: prepared,
        ldjson: projectLdjson(),
        shellTop: shellTop,
        shellBottom: shellBottom
      }
    }
  ]

  // 工程二级页(详情页):每个工程一页,共 5 页
  prepared.forEach(p => {
    files.push({
      path: 'projects/' + p.id + '/index.html',
      layout: 'project-detail',
      data: {
        projectId: p.id,
        title: p.title,
        category: p.category,
        categoryKey: p.categoryKey,
        subtitle: p.subtitle,
        // 发表于: 有 date 用原值, 否则本时刻; 更新于: 一律本时刻(工程持续更新中)
        date: p.date || TODAY,
        updated: TODAY,
        description: p.description,
        tags: p.tags,
        demoCover: '/img/projects/demo-' + p.id + '.webp',
        link: p.link,
        linkLabel: p.linkLabel,
        link2: p.link2,
        link2Label: p.link2Label,
        introBlocks: INTRO_BLOCKS[p.id] || null,
        downloads: p.downloads,
        others: prepared.filter(o => o.id !== p.id),
        allProjects: prepared,
        // 侧边栏统计(PROFILE 卡): 工程总数 / 分类数 / 全站标签数
        projectCount: prepared.length,
        categoryCount: CATEGORIES.length,
        tagCount: uniqueTags.size,
        detailCss: PROJECT_DETAIL_CSS,
        shellTop: detailShellTop,
        shellBottom: shellBottom
      }
    })
  })

  return files
})
