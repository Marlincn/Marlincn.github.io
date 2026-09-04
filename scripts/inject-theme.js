'use strict'
/* 文章页(post)首帧主题修正:静态 source 页面已直接内联脚本,
   文章页由 hexo layout 渲染,这里通过 injector head_begin 注入相同逻辑。
   只按时间制决定主题(7:00-17:59 浅色,18:00-6:59 深色),不读任何持久偏好。 */

const THEME_SCRIPT = `<script>
;(function () {
  try {
    var hour = new Date().getHours()
    var dark = hour >= 18 || hour < 7
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
  } catch (e) {}
})()
</script>`

/* 文章详情页 hero 大图预加载(2026-09-04 遮罩优化 C): 与页面并行下载,
   遮罩淡出时 hero 已就绪 → 不再"图片后到"的突兀跳变; injector type 'post' 仅命中文章页 */
const POST_HERO_PRELOAD =
  '<link rel="preload" as="image" href="/img/hero/post-hero-banner.webp">'

hexo.extend.injector.register('head_begin', THEME_SCRIPT, 'default')
hexo.extend.injector.register('head_begin', POST_HERO_PRELOAD, 'post')
