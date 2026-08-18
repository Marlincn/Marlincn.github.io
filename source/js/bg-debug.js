/* BG drag debugger - article header background tuning (demo only)
 * Model: image width = frame width (X locked), height auto-scaled,
 * vertical pan free — image top may slide out of the frame upward,
 * so you can pick which vertical slice of the image shows in the frame.
 */
(function () {
  var header = document.getElementById('page-header')
  if (!header) return

  var IMGS = ['/img/bg-test-a.png', '/img/bg-test-b.png']
  var IMG_W = 1672
  var IMG_H = 941
  var state = { img: 0, y: 0, opacity: 1, zoom: 1 } // y: 0=top aligned, 100=bottom aligned

  var layer = document.createElement('div')
  layer.id = 'bg-debug-layer'
  header.appendChild(layer)
  document.body.classList.add('nova-bg-debug')

  var panel = document.createElement('div')
  panel.id = 'bg-debug-panel'
  panel.innerHTML =
    '<div class="bgd-title">文章标题框背景调试(演示站)</div>' +
    '<div class="bgd-row"><label>图片</label><select id="bgd-img" style="flex:1;background:#1a1e33;color:#e8e1e8;border:1px solid rgba(215,130,160,.3);border-radius:6px;padding:2px 4px;">' +
    '<option value="0">A(第一张)</option><option value="1">B(第二张)</option></select></div>' +
    '<div class="bgd-row"><label>Y 位置</label><input type="range" id="bgd-y" min="0" max="100" step="0.5"><span class="bgd-val" id="bgd-yv">0%</span></div>' +
    '<div class="bgd-row"><label>不透明度</label><input type="range" id="bgd-o" min="0" max="100" step="1"><span class="bgd-val" id="bgd-ov">100%</span></div>' +
    '<div class="bgd-row"><label>缩放</label><input type="range" id="bgd-z" min="1" max="3" step="0.05"><span class="bgd-val" id="bgd-zv">1x</span></div>' +
    '<div class="bgd-btns"><button id="bgd-copy">复制参数</button><button id="bgd-reset">重置</button></div>' +
    '<div class="bgd-hint" id="bgd-selftest"></div>' +
    '<div class="bgd-hint">提示:图片宽度已铺满框(不可平移)。按住标题框内上下拖动,图片上下滑动,顶部可移出框外——选择留在框内的图片部分。调好点"复制参数"发给我。</div>'
  document.body.appendChild(panel)

  function scaledImgHeight() {
    var w = header.getBoundingClientRect().width
    return w * (IMG_H / IMG_W) * state.zoom
  }

  function apply() {
    var z = state.zoom
    var y = state.y
    // width = 100% of frame (X locked); height scales by aspect ratio * zoom
    layer.style.backgroundSize = '100% auto'
    // vertical position: 0% = image top at frame top, 100% = image bottom at frame bottom
    layer.style.backgroundPosition = '50% ' + y + '%'
    layer.style.backgroundImage = 'url(' + IMGS[state.img] + ')'
    layer.style.opacity = state.opacity
    document.getElementById('bgd-yv').textContent = y.toFixed(1) + '%'
    document.getElementById('bgd-ov').textContent = Math.round(state.opacity * 100) + '%'
    document.getElementById('bgd-zv').textContent = z.toFixed(2) + 'x'
    // self-check
    var cs = window.getComputedStyle(layer)
    var hr = header.getBoundingClientRect()
    var dbg = document.getElementById('bgd-selftest')
    if (dbg) dbg.textContent = 'pos=' + cs.position + ' frame=' + Math.round(hr.width) + 'x' + Math.round(hr.height) + ' imgH=' + Math.round(scaledImgHeight()) + ' bg=' + (cs.backgroundImage.indexOf('bg-test') > -1 ? 'OK' : 'MISSING')
  }

  document.getElementById('bgd-img').addEventListener('change', function () {
    state.img = parseInt(this.value, 10)
    apply()
  })
  document.getElementById('bgd-y').addEventListener('input', function () {
    state.y = parseFloat(this.value)
    apply()
  })
  document.getElementById('bgd-o').addEventListener('input', function () {
    state.opacity = parseFloat(this.value) / 100
    apply()
  })
  document.getElementById('bgd-z').addEventListener('input', function () {
    state.zoom = parseFloat(this.value)
    apply()
  })
  document.getElementById('bgd-reset').addEventListener('click', function () {
    state.y = 0
    state.opacity = 1
    state.zoom = 1
    document.getElementById('bgd-y').value = 0
    document.getElementById('bgd-o').value = 100
    document.getElementById('bgd-z').value = 1
    apply()
  })
  document.getElementById('bgd-copy').addEventListener('click', function () {
    var text = '图片' + (state.img === 0 ? 'A' : 'B') + ' | Y=' + state.y.toFixed(1) + '% | 不透明度=' + Math.round(state.opacity * 100) + '% | 缩放=' + state.zoom.toFixed(2) + 'x'
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        document.getElementById('bgd-copy').textContent = '已复制!'
        setTimeout(function () { document.getElementById('bgd-copy').textContent = '复制参数' }, 1500)
      })
    } else {
      window.prompt('复制以下参数:', text)
    }
  })

  // vertical drag only, inside the header frame
  var dragging = false
  var startY = 0
  var startPy = 0

  function isControl(el) {
    return el && !!el.closest('input, select, button, a, #bg-debug-panel')
  }

  document.addEventListener('pointerdown', function (e) {
    if (isControl(e.target)) return
    var r = header.getBoundingClientRect()
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) return
    dragging = true
    document.body.classList.add('bgd-dragging')
    startY = e.clientY
    startPy = state.y
    try { document.body.setPointerCapture(e.pointerId) } catch (err) {}
  })
  document.addEventListener('pointermove', function (e) {
    if (!dragging) return
    var hr = header.getBoundingClientRect()
    var imgH = scaledImgHeight()
    var overH = imgH - hr.height
    var dy = e.clientY - startY
    if (overH > 0) state.y = Math.min(100, Math.max(0, startPy + (dy / overH) * 100))
    document.getElementById('bgd-y').value = state.y
    apply()
  })
  function endDrag() {
    if (!dragging) return
    dragging = false
    document.body.classList.remove('bgd-dragging')
  }
  document.addEventListener('pointerup', endDrag)
  document.addEventListener('pointercancel', endDrag)

  apply()
})()
