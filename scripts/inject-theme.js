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

hexo.extend.injector.register('head_begin', THEME_SCRIPT, 'default')
