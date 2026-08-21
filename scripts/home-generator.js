'use strict'
/* 首页生成器(P2.1/P2.2):
   输出 index.html,由 themes/butterfly/layout/home.pug 渲染。
   body 静态骨架(top/mid/bottom)由本生成器读取并原样传入,
   head 由 base.pug + _partials/head.pug 统一输出,
   LATEST SIGNAL 与精选记录卡片由模板基于 posts 动态输出。 */

const fs = require('fs')
const path = require('path')

const partsDir = path.join(__dirname, '..', 'themes', 'butterfly', 'layout', 'home-parts')

hexo.extend.generator.register('nova-home', function (locals) {
  const posts = locals.posts.sort('order', 1).toArray()
  return {
    path: 'index.html',
    layout: 'home',
    data: {
      posts: posts,
      top: fs.readFileSync(path.join(partsDir, 'top.html'), 'utf8'),
      mid: fs.readFileSync(path.join(partsDir, 'mid.html'), 'utf8'),
      bottom: fs.readFileSync(path.join(partsDir, 'bottom.html'), 'utf8')
    }
  }
})
