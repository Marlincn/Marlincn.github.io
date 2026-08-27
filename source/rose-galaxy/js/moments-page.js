(() => {
  'use strict'

  if (window.__novaMomentsBootstrap) {
    window.__novaMomentsBootstrap.init()
    return
  }

  function initialiseMomentsPage() {
    const page = document.querySelector('.nova-moments-page')
    if (!page || page.dataset.ready === 'true') return
    page.dataset.ready = 'true'

    page.querySelectorAll('.nova-moments-like').forEach(button => {
      const count = button.querySelector('b')
      const icon = button.querySelector('span')
      const baseCount = Number(button.dataset.baseCount || 0)
      const storageKey = button.dataset.storageKey
      const applyState = liked => {
        button.classList.toggle('is-liked', liked)
        button.setAttribute('aria-pressed', String(liked))
        count.textContent = String(baseCount + (liked ? 1 : 0))
        icon.textContent = liked ? '♥' : '♡'
      }

      let liked = false
      try {
        liked = localStorage.getItem(storageKey) === 'true'
      } catch (_) {
        liked = false
      }
      applyState(liked)

      button.addEventListener('click', () => {
        liked = !liked
        try {
          localStorage.setItem(storageKey, String(liked))
        } catch (_) {
          // Visual feedback remains available when storage is blocked.
        }
        applyState(liked)
      })
    })
  }

  window.__novaMomentsBootstrap = { init: initialiseMomentsPage }
  document.addEventListener('DOMContentLoaded', initialiseMomentsPage, { once: true })
  document.addEventListener('pjax:complete', initialiseMomentsPage)
  if (document.readyState !== 'loading') initialiseMomentsPage()
})()
