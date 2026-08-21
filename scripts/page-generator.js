'use strict'
/* 静态页面生成器(P2.2):music/shuoshuo/about/courses/404
   由 layout 渲染,head 走 base 统一输出,body 静态片段原样注入。 */

const fs = require('fs')
const path = require('path')

const partsDir = path.join(__dirname, '..', 'themes', 'butterfly', 'layout', 'page-parts')
const PAGES = ['music', 'shuoshuo', 'about', 'courses', '404']

hexo.extend.generator.register('nova-pages', function () {
  return PAGES.map(name => ({
    path: name === '404' ? '404.html' : name + '/index.html',
    layout: name === '404' ? 'nova-404' : name,
    data: { body: fs.readFileSync(path.join(partsDir, name + '.html'), 'utf8') }
  }))
})
