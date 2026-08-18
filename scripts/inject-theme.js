'use strict'
/* 文章页(post)首帧主题修正:静态 source 页面已直接内联脚本,
   文章页由 hexo layout 渲染,这里通过 injector head_begin 注入相同逻辑。
   时段感知:偏好记录所属时段,跨时段(如白天选的浅色,晚上打开)视为过期,
   拉回时间制(7:00-17:59 浅色,18:00-6:59 深色)。
   旧格式纯字符串偏好无时段信息,一律忽略按时间制。 */

const THEME_SCRIPT = `<script>
;(function () {
  try {
    var raw = null;
    try { raw = window.localStorage.getItem('marlin-theme-pref') } catch (e) {}
    var now = new Date()
    var hour = now.getHours()
    var dark = hour >= 18 || hour < 7
    var mode = null
    if (raw && raw !== 'dark' && raw !== 'light') {
      try {
        var parsed = JSON.parse(raw)
        if (parsed && (parsed.mode === 'dark' || parsed.mode === 'light')) {
          var period = Number(parsed.period)
          if (period) {
            var anchor = new Date(now)
            if (hour < 7) {
              anchor.setDate(anchor.getDate() - 1)
              anchor.setHours(18, 0, 0, 0)
            } else if (hour < 18) {
              anchor.setHours(7, 0, 0, 0)
            } else {
              anchor.setHours(18, 0, 0, 0)
            }
            if (period === anchor.getTime()) mode = parsed.mode
          }
        }
      } catch (e2) {}
    }
    if (mode === 'dark' || mode === 'light') dark = mode === 'dark'
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
  } catch (e) {}
})()
</script>`

hexo.extend.injector.register('head_begin', THEME_SCRIPT, 'default')
