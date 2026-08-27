(() => {
  'use strict'

  if (window.__novaUxReady) return
  window.__novaUxReady = true

  const INITIAL_MIN_DURATION = 150
  const INITIAL_MAX_DURATION = 2000
  const EXIT_DURATION = 480
  // 首页首屏 loading 最小展示时长:即使内容/背景图已就绪,loading 也至少展示这么久,
  // 避免"一闪而过"显得不稳定。退场时同时满足"已展示 ≥ INITIAL_MIN_SHOW" 与"背景图 ready"。
  const INITIAL_MIN_SHOW = 400
  // 首页 hero 背景图(深色 night.webp / 浅色 day.webp):loading 需等其渲染完成再退场,
  // 否则首屏会"粒子先动、图片后到"。最长等待 HOME_BG_MAX_WAIT 兜底防弱网卡死。
  const HOME_BG = { dark: '/img/hero/night.webp', light: '/img/hero/day.webp' }
  const HOME_BG_MAX_WAIT = 3000
  let homeBgReady = false
  const ROUTE_CLASSES = [
    'nova-home-active',
    'nova-music-route',
    'nova-category-route',
    'nova-tag-route',
    'nova-tags-route',
    'nova-projects-route',
    'nova-project-detail-route',
    'nova-template-route',
    'nova-moments-route',
    'nova-about-route',
    'nova-gallery-route'
  ]
  let initialFinishTimer = 0
  let initialFallbackTimer = 0
  let removeTimer = 0
  let initialFinishScheduled = false
  let statsTimer = 0
  let navigationObserver = null
  let searchObserver = null

  function getLoader() {
    const loaders = Array.from(document.querySelectorAll('[data-nova-loading]'))
    let loader = loaders.shift()
    loaders.forEach(item => item.remove())
    if (loader) return loader

    loader = document.createElement('div')
    loader.className = 'nova-page-loading'
    loader.dataset.novaLoading = ''
    loader.setAttribute('aria-hidden', 'true')
    loader.innerHTML = `
      <div class="nova-page-loading__inner">
        <span class="nova-page-loading__mark" aria-hidden="true"></span>
        <strong>MARLIN</strong>
        <small>LOADING THE NIGHT...</small>
      </div>`
    document.body.appendChild(loader)
    return loader
  }

  function enhanceSearch() {
    const dialog = document.querySelector('#local-search .search-dialog')
    const input = dialog?.querySelector('.local-search-input input')
    const results = dialog?.querySelector('#local-search-results')
    if (!dialog || !input || !results || dialog.dataset.novaSearchReady === 'true') return
    dialog.dataset.novaSearchReady = 'true'

    searchObserver?.disconnect()
    searchObserver = null

    const state = document.createElement('div')
    state.className = 'nova-search-state'
    state.innerHTML = `
      <span class="nova-search-state__eyebrow">QUICK PASSAGE</span>
      <strong>从这里进入夜航档案</strong>
      <p>输入关键词，或先浏览常用页面。</p>
      <nav aria-label="搜索快速入口">
        <a href="/articles/">文章</a>
        <a href="/moments/">说说</a>
        <a href="/music/">音乐</a>
      </nav>`
    results.before(state)

    const renderState = () => {
      const query = input.value.trim()
      const hasResults = Boolean(results.querySelector('.local-search-hit-item'))
      state.hidden = Boolean(query && hasResults)
      state.classList.toggle('is-empty-result', Boolean(query && !hasResults))
      if (query && !hasResults) {
        state.querySelector('.nova-search-state__eyebrow').textContent = 'NO SIGNAL'
        state.querySelector('strong').textContent = '没有找到相关记录'
        state.querySelector('p').textContent = '换一个更短的关键词，或从快速入口继续浏览。'
      } else {
        state.querySelector('.nova-search-state__eyebrow').textContent = 'QUICK PASSAGE'
        state.querySelector('strong').textContent = '从这里进入夜航档案'
        state.querySelector('p').textContent = '输入关键词，或先浏览常用页面。'
      }
    }

    input.addEventListener('input', () => window.setTimeout(renderState, 0))
    searchObserver = new MutationObserver(renderState)
    searchObserver.observe(results, { childList: true, subtree: true })
    renderState()
  }

  function cleanupSearch() {
    searchObserver?.disconnect()
    searchObserver = null
  }

  // 等待首页 hero 背景图加载完成(方案 A)。仅首页生效;非首页立即回调。
  // 用真实 <img> 预加载当前主题背景图,onload 后才让 loading 退场;
  // 超过 HOME_BG_MAX_WAIT 也回调,防弱网/失败卡死在 loading。
  let homeBgWaitScheduled = false
  function whenHomeBgReady(cb) {
    if (homeBgReady || !isHomePage()) {
      cb()
      return
    }
    if (homeBgWaitScheduled) return
    homeBgWaitScheduled = true

    const theme = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark'
    const src = HOME_BG[theme]
    const img = new Image()
    const done = () => {
      homeBgReady = true
      cb()
    }
    img.onload = done
    img.onerror = done
    img.src = src
    // 兜底:无论加载成败,最长等 HOME_BG_MAX_WAIT 后放行,避免弱网卡 loading
    window.setTimeout(done, HOME_BG_MAX_WAIT)
  }

  function finishInitialLoading() {
    // 首页首屏:退场须同时满足 ①背景图渲染完成 ②已展示 ≥ INITIAL_MIN_SHOW 最小时长,
    // 否则会"粒子先动、图片后到"或"loading 一闪而过"。非首页直接进入退场。
    if (isHomePage()) {
      const shownFor = Date.now() - (Number(window.__novaLoaderVisibleAt) || 0)
      const minNotMet = shownFor < INITIAL_MIN_SHOW
      if (!homeBgReady) {
        whenHomeBgReady(finishInitialLoading)
        return
      }
      if (minNotMet) {
        window.setTimeout(finishInitialLoading, INITIAL_MIN_SHOW - shownFor)
        return
      }
    }
    window.clearTimeout(window.__novaLoaderDelayTimer)
    window.__novaLoaderDelayTimer = 0
    const loader = document.querySelector('[data-nova-loading]')
    if (!loader) {
      document.body.classList.remove('nova-loading-active')
      return
    }
    if (loader.dataset.novaLoadingState === 'leaving') return

    if (!loader.classList.contains('is-visible')) {
      window.clearTimeout(initialFinishTimer)
      window.clearTimeout(initialFallbackTimer)
      window.clearTimeout(removeTimer)
      loader.remove()
      document.body.classList.remove('nova-loading-active')
      return
    }

    loader.dataset.novaLoadingState = 'leaving'
    loader.setAttribute('aria-hidden', 'true')
    loader.classList.add('is-leaving')
    loader.classList.remove('is-visible')
    window.clearTimeout(initialFinishTimer)
    window.clearTimeout(initialFallbackTimer)
    window.clearTimeout(removeTimer)
    removeTimer = window.setTimeout(() => {
      loader.remove()
      document.body.classList.remove('nova-loading-active')
    }, EXIT_DURATION)
  }

  function scheduleInitialFinish() {
    if (initialFinishScheduled) return
    initialFinishScheduled = true
    window.clearTimeout(window.__novaLoaderDelayTimer)
    window.__novaLoaderDelayTimer = 0
    const loader = document.querySelector('[data-nova-loading]')
    if (!loader?.classList.contains('is-visible')) {
      finishInitialLoading()
      return
    }
    const visibleAt = Number(window.__novaLoaderVisibleAt) || Date.now()
    const elapsed = Date.now() - visibleAt
    initialFinishTimer = window.setTimeout(
      finishInitialLoading,
      Math.max(0, INITIAL_MIN_DURATION - elapsed)
    )
  }

  function initInitialLoading() {
    // 只在"从网站首次进入"时显示 loading(本次会话第一次);
    // 之后站内 PJAX 回首页不再弹。用 sessionStorage 记录本次会话已显示。
    let alreadyShown = false
    try { alreadyShown = sessionStorage.getItem('__novaLoadingShown') === '1' } catch (_) {}
    if (alreadyShown) {
      // 非首次:清理可能残留的 loading,直接放行
      const stale = document.querySelector('[data-nova-loading]')
      if (stale) stale.remove()
      document.body.classList.remove('nova-loading-active')
      return
    }
    try { sessionStorage.setItem('__novaLoadingShown', '1') } catch (_) {}

    const loader = getLoader()
    loader.classList.remove('is-leaving')
    if (loader.classList.contains('is-visible')) {
      loader.dataset.novaLoadingState = 'visible'
      loader.setAttribute('aria-hidden', 'false')
      document.body.classList.add('nova-loading-active')
    } else {
      loader.dataset.novaLoadingState = 'pending'
      loader.setAttribute('aria-hidden', 'true')
      document.body.classList.remove('nova-loading-active')
    }

    initialFallbackTimer = window.setTimeout(finishInitialLoading, INITIAL_MAX_DURATION)
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', scheduleInitialFinish, { once: true })
    } else {
      scheduleInitialFinish()
    }
  }

  function beginNavigation() {
    cleanupSearch()
    document.body.classList.remove(...ROUTE_CLASSES)
    finishInitialLoading()
  }

  function finishNavigation() {
    finishInitialLoading()
  }

  function normalizePath(value) {
    const path = `/${value || ''}`.replace(/\/+/g, '/')
    return path.length > 1 ? path.replace(/\/$/, '') : path
  }

  function isHomePage() {
    if (
      document.body.classList.contains('nova-home-active') ||
      document.body.classList.contains('page-type-index') ||
      document.body.classList.contains('home')
    ) {
      return true
    }

    return normalizePath(location.pathname) === normalizePath(window.GLOBAL_CONFIG?.root || '/')
  }

  function syncHomeThemeToggle() {
    const button = document.getElementById('home-theme-toggle')
    if (!button) return

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark'
    const label = isDark ? '切换到浅色模式' : '切换到深色模式'
    button.setAttribute('aria-label', label)
    button.setAttribute('title', label)
  }

  function createHomeThemeToggle() {
    const button = document.createElement('button')
    button.id = 'home-theme-toggle'
    button.className = 'marlin-rightside-button'
    button.type = 'button'
    button.innerHTML = `
      <span class="home-theme-toggle__icons" aria-hidden="true">
        <svg class="home-theme-toggle__icon home-theme-toggle__icon--moon" viewBox="0 0 24 24" focusable="false">
          <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"></path>
        </svg>
        <svg class="home-theme-toggle__icon home-theme-toggle__icon--sun" viewBox="0 0 24 24" focusable="false">
          <circle cx="12" cy="12" r="4"></circle>
          <path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.41M17.66 6.34l1.41-1.41"></path>
        </svg>
      </span>`

    button.addEventListener('click', event => {
      event.preventDefault()
      event.stopPropagation()
      document.getElementById('darkmode')?.click()
    })
    button.dataset.bound = 'true'
    return button
  }

  function initRightsideEnhancement() {
    const rightside = document.getElementById('rightside')
    const goUpButton = document.getElementById('go-up')
    if (!rightside || !goUpButton) return

    rightside
      .querySelectorAll('button[id], a[id]')
      .forEach(button => button.classList.add('marlin-rightside-button'))

    let homeThemeToggle = document.getElementById('home-theme-toggle')
    if (!homeThemeToggle) homeThemeToggle = createHomeThemeToggle()

    const visibleControls = goUpButton.parentElement
    if (homeThemeToggle.parentElement !== visibleControls || homeThemeToggle.nextElementSibling !== goUpButton) {
      visibleControls.insertBefore(homeThemeToggle, goUpButton)
    }

    rightside.classList.toggle('is-home-minimal', isHomePage())
    syncHomeThemeToggle()

    if (!window.__marlinRightsideThemeObserver) {
      window.__marlinRightsideThemeObserver = new MutationObserver(syncHomeThemeToggle)
      window.__marlinRightsideThemeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme']
      })
    }
  }

  function initStatsFallback() {
    window.clearTimeout(statsTimer)
    const targets = [
      document.getElementById('busuanzi_value_site_uv'),
      document.getElementById('busuanzi_value_site_pv'),
      document.getElementById('last-push-date')
    ].filter(Boolean)
    if (!targets.length) return

    statsTimer = window.setTimeout(() => {
      targets.forEach(target => {
        if (!target.isConnected || !target.querySelector('.fa-spinner')) return
        target.textContent = '—'
        target.title = '统计服务暂时不可用'
      })
    }, 9000)
  }

  function syncNavigationSemantics() {
    const desktopMenu = document.getElementById('menus')
    const desktopMenuItems = desktopMenu?.querySelector('.menus_items')
    const mobileMenu = document.getElementById('sidebar-menus')
    const isMobile = window.matchMedia('(max-width: 768px)').matches
    const mobileMenuOpen = Boolean(isMobile && mobileMenu?.classList.contains('open'))

    if (desktopMenu) {
      desktopMenu.inert = false
      desktopMenu.removeAttribute('aria-hidden')
    }
    if (desktopMenuItems) {
      desktopMenuItems.inert = isMobile
      desktopMenuItems.setAttribute('aria-hidden', String(isMobile))
    }
    if (mobileMenu) {
      mobileMenu.inert = !mobileMenuOpen
      mobileMenu.setAttribute('aria-hidden', String(!mobileMenuOpen))
    }

    navigationObserver?.disconnect()
    if (mobileMenu) {
      navigationObserver = new MutationObserver(syncNavigationSemantics)
      navigationObserver.observe(mobileMenu, { attributes: true, attributeFilter: ['class'] })
    }
  }

  function syncRouteState() {
    document.body.classList.remove(...ROUTE_CLASSES)
    const routeMarkers = [
      ['[data-nova-home]', ['nova-home-active']],
      ['.nova-music-page', ['nova-music-route']],
      ['main.nova-category-content', ['nova-category-route']],
      ['main.nova-tags-overview', ['nova-tag-route', 'nova-tags-route']],
      ['main.nova-projects-overview', ['nova-tag-route', 'nova-projects-route']],
      ['main.nova-tag-content:not(.nova-tags-overview)', ['nova-tag-route']],
      ['.nova-project-detail', ['nova-project-detail-route']],
      ['.nova-project-detail', ['nova-project-detail-route']],
      ['.nova-template-page', ['nova-template-route']],
      ['.nova-moments-page', ['nova-moments-route']],
      ['.nova-about-page', ['nova-about-route']],
      ['[data-gallery-root]', ['nova-gallery-route']]
    ]
    const match = routeMarkers.find(([selector]) => document.querySelector(selector))
    if (match) document.body.classList.add(...match[1])
  }

  function syncMenuActive() {
    const path = (location.pathname || '/').replace(/\/+$/, '') || '/'
    const isPost = /^\/\d{4}\/\d{2}\/\d{2}\//.test(path)

    const matches = (href) => {
      const h = (href || '').replace(/\/+$/, '') || '/'
      if (h === '/') return path === '/'
      if (h === '/articles') return path.startsWith('/articles') || isPost
      return path === h || path.startsWith(h + '/')
    }

    document.querySelectorAll(
      '#nav .menus_items .menus_item, #sidebar-menus .menus_items .menus_item'
    ).forEach(item => {
      const link = item.querySelector(':scope > a.site-page')
      item.classList.toggle('active', Boolean(link && matches(link.getAttribute('href'))))
    })
  }

  document.addEventListener('pjax:send', beginNavigation)
  document.addEventListener('pjax:complete', finishNavigation)
  document.addEventListener('pjax:error', finishNavigation)
  document.addEventListener('DOMContentLoaded', enhanceSearch, { once: true })
  document.addEventListener('DOMContentLoaded', initRightsideEnhancement, { once: true })
  document.addEventListener('DOMContentLoaded', initStatsFallback, { once: true })
  document.addEventListener('DOMContentLoaded', syncNavigationSemantics, { once: true })
  document.addEventListener('DOMContentLoaded', syncRouteState, { once: true })
  document.addEventListener('DOMContentLoaded', syncMenuActive, { once: true })
  document.addEventListener('pjax:complete', enhanceSearch)
  document.addEventListener('pjax:complete', initRightsideEnhancement)
  document.addEventListener('pjax:complete', initStatsFallback)
  document.addEventListener('pjax:complete', syncNavigationSemantics)
  document.addEventListener('pjax:complete', syncRouteState)
  document.addEventListener('pjax:complete', syncMenuActive)
  window.addEventListener('pageshow', finishInitialLoading)
  window.addEventListener('pageshow', scheduleInitialFinish, { once: true })
  window.addEventListener('resize', syncNavigationSemantics)

  /* 时间自动主题 (2026-08-16): 7:00-17:59 浅色, 18:00-6:59 深色。
     手动切换(任意页面 #darkmode)写入 localStorage 偏好:切页/刷新保持,
     到下一时间边界自动清除并拉回时间制(方案 2.B,2026-08-17)。
     定时器精确排到下一个边界,到点原地切换并复用现有过渡。
     2026-08-18:偏好增加时段归属(period),每次打开页面时校验:
     偏好时段与当前时段一致才生效,跨时段(如白天选的浅色,晚上打开)视为过期,
     拉回时间制。
     2026-08-18(改):打开页面不再读取任何持久偏好,只按当前时间决定主题;
     手动切换仅对当前会话生效(不写入 localStorage)。 */
  const THEME_DARK_START = 18
  const THEME_DARK_END = 7
  let themeScheduleTimer = 0

  const isDarkTime = () => {
    const hour = new Date().getHours()
    return hour >= THEME_DARK_START || hour < THEME_DARK_END
  }

  /* 会话级主题偏好(2026-08-18):手动切换写入 sessionStorage,
     会话内(含 PJAX 导航)全局生效;关闭浏览器/新标签自动清空,
     重新打开只按时间制,不读任何持久记忆。 */
  const THEME_SESSION_KEY = 'marlin-theme-session'

  const getSessionTheme = () => {
    try {
      const value = window.sessionStorage.getItem(THEME_SESSION_KEY)
      return value === 'dark' || value === 'light' ? value : null
    } catch (e) {
      return null
    }
  }

  const setSessionTheme = mode => {
    try {
      if (mode === 'dark' || mode === 'light') {
        window.sessionStorage.setItem(THEME_SESSION_KEY, mode)
      } else {
        window.sessionStorage.removeItem(THEME_SESSION_KEY)
      }
    } catch (e) {
      /* storage unavailable: fall back to time-based only */
    }
  }

  /* 手动切换(任意页面 #darkmode,含首页 home-theme-toggle 转发):
     main.js 的处理器先执行切换(只改 data-theme 不持久化),
     这里在切换完成后把结果记入 sessionStorage,供会话内全局保持。
     setTimeout 延后读取,确保读到 main.js 切换后的最终值。 */
  document.addEventListener(
    'click',
    event => {
      const target = event.target
      const button = target && target.closest ? target.closest('#darkmode') : null
      if (!button) return
      setTimeout(() => {
        setSessionTheme(document.documentElement.getAttribute('data-theme'))
      }, 0)
    },
    true
  )

  const fireThemeChange = mode => {
    const globalFn = window.globalFn || {}
    const themeChange = globalFn.themeChange
    if (!themeChange) return
    Object.keys(themeChange).forEach(key => {
      const fn = themeChange[key]
      if (typeof fn === 'function') fn(mode)
    })
  }

  /* 主题:会话内有手动选择则保持(导航不拉回);无则只按时间制。 */
  const applyTimeTheme = () => {
    const session = getSessionTheme()
    const target = session === 'dark' || session === 'light' ? session : isDarkTime() ? 'dark' : 'light'
    const current = document.documentElement.getAttribute('data-theme')
    if (current !== target) {
      target === 'dark' ? btf.activateDarkMode() : btf.activateLightMode()
      fireThemeChange(target)
    }
  }

  const nextBoundaryDelay = () => {
    const now = new Date()
    const hour = now.getHours()
    const next = new Date(now)
    if (hour < THEME_DARK_END) {
      next.setHours(THEME_DARK_END, 0, 0, 0)
    } else if (hour < THEME_DARK_START) {
      next.setHours(THEME_DARK_START, 0, 0, 0)
    } else {
      next.setDate(next.getDate() + 1)
      next.setHours(THEME_DARK_END, 0, 0, 0)
    }
    return next.getTime() - now.getTime()
  }

  /* 边界到点:清除会话偏好,按时间制切换。 */
  const scheduleThemeTick = () => {
    window.clearTimeout(themeScheduleTimer)
    themeScheduleTimer = window.setTimeout(() => {
      setSessionTheme(null)
      applyTimeTheme()
      scheduleThemeTick()
    }, nextBoundaryDelay())
  }

  const initThemeSchedule = () => {
    applyTimeTheme()
    scheduleThemeTick()
  }

  // 方案3:首页加载时,用浏览器原生 <link rel="prefetch"> 预取导航的其他页 HTML。
  // 只预取一级导航页(文章/音乐/说说/关于),不预取子页;浏览器空闲时进行,不阻塞首屏。
  // 预取资源进入 HTTP 缓存,用户跳转时加载更快、避免未渲染界面。
  const NAV_PREFETCH = ['/articles/', '/music/', '/moments/', '/about/']
  function prefetchNavPages() {
    if (!isHomePage()) return
    const run = () => {
      if (document.hidden) return
      NAV_PREFETCH.forEach(href => {
        if (href === location.pathname) return
        if (document.querySelector(`link[rel="prefetch"][href="${href}"]`)) return
        const link = document.createElement('link')
        link.rel = 'prefetch'
        link.href = href
        link.as = 'document'
        document.head.appendChild(link)
      })
    }
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(run, { timeout: 3000 })
    } else {
      window.setTimeout(run, 800)
    }
  }
  window.addEventListener('visibilitychange', () => {
    if (!document.hidden) applyTimeTheme()
  })
  document.addEventListener('pjax:complete', applyTimeTheme)

  initInitialLoading()
  initThemeSchedule()
  prefetchNavPages()
  if (document.readyState !== 'loading') {
    enhanceSearch()
    initRightsideEnhancement()
    initStatsFallback()
    syncNavigationSemantics()
    syncRouteState()
  }
})()
