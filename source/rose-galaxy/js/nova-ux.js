(() => {
  'use strict'

  if (window.__novaUxReady) return
  window.__novaUxReady = true

  const INITIAL_MIN_DURATION = 150
  const INITIAL_MAX_DURATION = 2000
  const EXIT_DURATION = 180
  const ROUTE_CLASSES = [
    'nova-home-active',
    'nova-music-route',
    'nova-category-route',
    'nova-tag-route',
    'nova-tags-route',
    'nova-template-route',
    'nova-shuoshuo-route',
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
        <a href="/shuoshuo/">说说</a>
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

  function finishInitialLoading() {
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
      ['main.nova-tag-content:not(.nova-tags-overview)', ['nova-tag-route']],
      ['.nova-template-page', ['nova-template-route']],
      ['.nova-shuoshuo-page', ['nova-shuoshuo-route']],
      ['.nova-about-page', ['nova-about-route']],
      ['[data-gallery-root]', ['nova-gallery-route']]
    ]
    const match = routeMarkers.find(([selector]) => document.querySelector(selector))
    if (match) document.body.classList.add(...match[1])
  }

  document.addEventListener('pjax:send', beginNavigation)
  document.addEventListener('pjax:complete', finishNavigation)
  document.addEventListener('pjax:error', finishNavigation)
  document.addEventListener('DOMContentLoaded', enhanceSearch, { once: true })
  document.addEventListener('DOMContentLoaded', initRightsideEnhancement, { once: true })
  document.addEventListener('DOMContentLoaded', initStatsFallback, { once: true })
  document.addEventListener('DOMContentLoaded', syncNavigationSemantics, { once: true })
  document.addEventListener('DOMContentLoaded', syncRouteState, { once: true })
  document.addEventListener('pjax:complete', enhanceSearch)
  document.addEventListener('pjax:complete', initRightsideEnhancement)
  document.addEventListener('pjax:complete', initStatsFallback)
  document.addEventListener('pjax:complete', syncNavigationSemantics)
  document.addEventListener('pjax:complete', syncRouteState)
  window.addEventListener('pageshow', finishInitialLoading)
  window.addEventListener('pageshow', scheduleInitialFinish, { once: true })
  window.addEventListener('resize', syncNavigationSemantics)

  /* 时间自动主题 (2026-08-16): 7:00-17:59 浅色, 18:00-6:59 深色。
     手动切换(任意页面 #darkmode)写入 localStorage 偏好:切页/刷新保持,
     到下一时间边界自动清除并拉回时间制(方案 2.B,2026-08-17)。
     定时器精确排到下一个边界,到点原地切换并复用现有过渡。 */
  const THEME_DARK_START = 18
  const THEME_DARK_END = 7
  const THEME_PREF_KEY = 'marlin-theme-pref'
  let themeScheduleTimer = 0

  const isDarkTime = () => {
    const hour = new Date().getHours()
    return hour >= THEME_DARK_START || hour < THEME_DARK_END
  }

  const getThemePref = () => {
    try {
      const value = window.localStorage.getItem(THEME_PREF_KEY)
      return value === 'dark' || value === 'light' ? value : null
    } catch (e) {
      return null
    }
  }

  const setThemePref = mode => {
    try {
      if (mode === 'dark' || mode === 'light') {
        window.localStorage.setItem(THEME_PREF_KEY, mode)
      } else {
        window.localStorage.removeItem(THEME_PREF_KEY)
      }
    } catch (e) {
      /* storage unavailable: fall back to time-based only */
    }
  }

  const clearThemePref = () => setThemePref(null)

  /* 捕获任意页面的 #darkmode 手动切换(含首页 home-theme-toggle 转发的 click),
     切换完成后记录偏好;main.js 的处理器先执行,故用 setTimeout 延后读取。 */
  document.addEventListener(
    'click',
    event => {
      const target = event.target
      const button = target && target.closest ? target.closest('#darkmode') : null
      if (!button) return
      setTimeout(() => {
        setThemePref(document.documentElement.getAttribute('data-theme'))
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

  /* 偏好优先:手动选择过则保持(切页/刷新不拉回);无偏好时按时间制。 */
  const applyTimeTheme = () => {
    const pref = getThemePref()
    const target = pref === 'dark' || pref === 'light' ? pref : isDarkTime() ? 'dark' : 'light'
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

  /* 边界到点:清除手动偏好,按时间制切换(方案 B 语义)。 */
  const scheduleThemeTick = () => {
    window.clearTimeout(themeScheduleTimer)
    themeScheduleTimer = window.setTimeout(() => {
      clearThemePref()
      applyTimeTheme()
      scheduleThemeTick()
    }, nextBoundaryDelay())
  }

  const initThemeSchedule = () => {
    applyTimeTheme()
    scheduleThemeTick()
  }
  window.addEventListener('visibilitychange', () => {
    if (!document.hidden) applyTimeTheme()
  })
  document.addEventListener('pjax:complete', applyTimeTheme)

  initInitialLoading()
  initThemeSchedule()
  if (document.readyState !== 'loading') {
    enhanceSearch()
    initRightsideEnhancement()
    initStatsFallback()
    syncNavigationSemantics()
    syncRouteState()
  }
})()
