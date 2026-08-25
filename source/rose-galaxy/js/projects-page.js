'use strict'
;(() => {
  if (window.__novaProjectsReady) return
  window.__novaProjectsReady = true

  const payloadEl = document.getElementById('nova-projects-payload')
  const dialog = document.getElementById('nova-project-modal')
  if (!payloadEl || !dialog) return

  let projects = []
  try {
    projects = JSON.parse(payloadEl.textContent)
  } catch (e) {
    return
  }

  const el = (tag, className) => {
    const node = document.createElement(tag)
    if (className) node.className = className
    return node
  }

  const fillModal = p => {
    dialog.textContent = ''

    const close = el('button', 'nova-project-modal__close')
    close.type = 'button'
    close.setAttribute('aria-label', '关闭')
    close.textContent = '×'
    close.addEventListener('click', () => dialog.close())
    dialog.appendChild(close)

    if (p.cover) {
      const coverWrap = el('div', 'nova-project-modal__cover')
      const img = el('img')
      img.src = p.cover
      img.alt = p.title
      img.loading = 'eager'
      img.decoding = 'async'
      img.onerror = () => { img.onerror = null; img.src = '/img/404.jpg' }
      coverWrap.appendChild(img)
      dialog.appendChild(coverWrap)
    }

    const body = el('div', 'nova-project-modal__body')

    const meta = el('div', 'nova-project-modal__meta')
    if (p.date) {
      const time = el('time')
      time.textContent = p.date
      meta.appendChild(time)
    } else {
      const live = el('span')
      live.textContent = '持续更新中'
      meta.appendChild(live)
    }
    const sep = el('span')
    sep.setAttribute('aria-hidden', 'true')
    sep.textContent = '·'
    meta.appendChild(sep)
    const cat = el('span')
    cat.textContent = p.subtitle || p.category
    meta.appendChild(cat)
    body.appendChild(meta)

    const h3 = el('h3')
    h3.textContent = p.title
    body.appendChild(h3)

    const desc = el('p')
    desc.textContent = p.description
    body.appendChild(desc)

    if (p.tags && p.tags.length) {
      const tagsWrap = el('div', 'nova-project-modal__tags')
      p.tags.forEach(t => {
        const tag = el('span')
        tag.textContent = t
        tagsWrap.appendChild(tag)
      })
      body.appendChild(tagsWrap)
    }

    const actions = el('div', 'nova-project-modal__actions')
    const addBtn = (href, label) => {
      const a = el('a', 'nova-project-btn')
      a.href = href
      a.target = '_blank'
      a.rel = 'noopener'
      const span = el('span', 'nova-project-btn-label')
      span.textContent = label
      a.appendChild(span)
      const arrow = el('i')
      arrow.setAttribute('aria-hidden', 'true')
      arrow.textContent = '→'
      a.appendChild(arrow)
      actions.appendChild(a)
    }
    if (p.link) addBtn(p.link, p.linkLabel || 'GitHub')
    if (p.link2) addBtn(p.link2, p.link2Label || '更多信息')

    const downloads = p.downloads || []
    if (downloads.length === 1) {
      const a = el('a', 'nova-project-btn')
      a.href = downloads[0].href
      a.target = '_blank'
      a.rel = 'noopener'
      const span = el('span', 'nova-project-btn-label')
      span.textContent = '下载'
      a.appendChild(span)
      const arrow = el('i')
      arrow.setAttribute('aria-hidden', 'true')
      arrow.textContent = '↓'
      a.appendChild(arrow)
      actions.appendChild(a)
    } else if (downloads.length > 1) {
      const resources = el('details', 'nova-project-modal__resources')
      const summary = el('summary', 'nova-project-btn')
      summary.textContent = '资料下载'
      const arrow = el('i')
      arrow.setAttribute('aria-hidden', 'true')
      arrow.textContent = '↓'
      summary.appendChild(arrow)
      resources.appendChild(summary)
      const ul = el('ul')
      downloads.forEach(d => {
        const li = el('li')
        const a = el('a')
        a.href = d.href
        a.target = '_blank'
        a.rel = 'noopener'
        const span = el('span')
        span.textContent = d.name
        a.appendChild(span)
        if (d.sizeLabel) {
          const small = el('small')
          small.textContent = d.sizeLabel
          a.appendChild(small)
        }
        li.appendChild(a)
        ul.appendChild(li)
      })
      resources.appendChild(ul)
      actions.appendChild(resources)
    }
    body.appendChild(actions)
    dialog.appendChild(body)
  }

  const openProject = id => {
    const p = projects.find(x => x.id === id)
    if (!p) return
    fillModal(p)
    dialog.showModal()
  }

  document.querySelectorAll('.nova-project-card[data-project]').forEach(card => {
    const id = card.dataset.project
    card.addEventListener('click', () => openProject(id))
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        openProject(id)
      }
    })
  })

  dialog.addEventListener('click', e => {
    if (e.target === dialog) dialog.close()
  })
})()
