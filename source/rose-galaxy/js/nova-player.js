/* =============================================================
   Nova Global Player (2026-08-27)
   - 全局单例 Audio: 跨 PJAX 页面常驻, 离开音乐页不停止
   - 歌单缓存(内存 + localStorage): 恢复最后歌曲, 不恢复进度, 不自动出声
   - 迷你悬浮条(非音乐页): 歌名/进度/三键(上一首/暂停/下一首), 可拖动, 可关闭
   - 音乐页 UI 通过 window.__novaPlayerBridge 订阅事件
   - 需要页面: 全站 inject.bottom
   ============================================================= */
(function () {
  "use strict";

  if (window.__novaPlayer) return;

  const BILI_PROXY = "https://1470690781-6b1hcscil5.ap-guangzhou.tencentscf.com";
  const BILI_UID = "3546712446601247";
  const BILI_FOLDER = "music";
  const STORAGE_KEY = "novaPlayerState";
  const PROGRESS_SAVE_INTERVAL = 15;

  // 跨 PJAX 脚本重跑持久: audio/进度/歌单放全局 core(pjax 同文档切换保留)
  const state = (window.__novaPlayerCore || (window.__novaPlayerCore = {
    audio: null,
    songs: [],
    currentIndex: -1,
    loadAbort: null,
    objectUrls: new Set(),
    loading: false,
    initialized: false,
    lastPlayedIndex: -1,
  }));

  // ---- localStorage 记忆: { songIndex, songs } (songs 仅元信息, 含 bvid/name/artist/cover) ----
  function loadMemory() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const j = JSON.parse(raw);
      if (!Number.isInteger(j.songIndex) || j.songIndex < 0) return null;
      return j;
    } catch (_) {
      return null;
    }
  }

  function saveMemory(played) {
    try {
      const prev = loadMemory() || {};
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        songIndex: state.currentIndex,
        played: played === true ? true : Boolean(prev.played), // 仅显式 true 才标记真正播放过
        songs: state.songs.map(s => ({
          bvid: s.bvid,
          name: s?.name || s?.title || "",
          artist: s?.artist || s?.author || "",
          cover: s?.cover || s?.pic || "",
        })),
      }));
    } catch (_) {}
  }

  // ---- 云函数音频流(与音乐页同源) ----
  async function fetchAudioBlob(bvid, signal) {
    const resp = await fetch(BILI_PROXY + "/stream2?bvid=" + bvid, { signal });
    if (!resp.ok) throw new Error("音频请求失败 HTTP " + resp.status);
    const ct = resp.headers.get("Content-Type") || "";
    if (ct.includes("json")) {
      const text = await resp.text();
      if (text.trim().startsWith("{")) {
        const j = JSON.parse(text);
        throw new Error(j.error || "音频获取失败");
      }
      const bin = atob(text.trim());
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      return new Blob([bytes], { type: "audio/mp4" });
    }
    return resp.blob();
  }

  function setAudioSource(blob) {
    const audio = ensureAudio();
    const url = URL.createObjectURL(blob);
    state.objectUrls.add(url);
    const old = audio.src;
    audio.src = url;
    // 旧 blob 稍后回收
    if (old) setTimeout(() => URL.revokeObjectURL(old), 60_000);
    state.objectUrls.delete(url); // 当前 url 由 audio 持有, 不共管
  }

  function ensureAudio() {
    if (state.audio) return state.audio;
    const audio = new Audio();
    audio.preload = "metadata";
    audio.addEventListener("play", () => {
      // 真正开始播放: 标记 played + 清除关闭态(悬浮条可重新出现)
      miniClosed = false;
      try { sessionStorage.removeItem("novaMiniClosed"); } catch (_) {}
      saveMemory(true);
      emit("play");
    });
    audio.addEventListener("pause", () => emit("pause"));
    audio.addEventListener("timeupdate", () => emit("timeupdate"));
    audio.addEventListener("durationchange", () => emit("durationchange"));
    audio.addEventListener("loadedmetadata", () => emit("loadedmetadata"));
    audio.addEventListener("ended", () => {
      state.currentIndex = (state.currentIndex + 1) % state.songs.length;
      saveMemory();
      playSongAt(state.currentIndex, true);
    });
    audio.addEventListener("error", () => emit("error"));
    state.audio = audio;
    return audio;
  }

  // ---- 订阅: 音乐页 UI 与悬浮条共用 ----
  const listeners = new Set();
  function emit(type, payload) {
    listeners.forEach(fn => {
      try { fn(type, payload || currentSnapshot()); } catch (_) {}
    });
  }
  function currentSnapshot() {
    return {
      songs: state.songs,
      currentIndex: state.currentIndex,
      playing: Boolean(state.audio && !state.audio.paused),
      loading: state.loading,
      currentTime: state.audio ? state.audio.currentTime : 0,
      duration: state.audio ? state.audio.duration : 0,
      song: state.songs[state.currentIndex] || null,
      hasMemory: Boolean(loadMemory()),
    };
  }

  // ---- 歌单 ----
  function setPlaylist(songs) {
    if (!Array.isArray(songs) || !songs.length) return;
    state.songs = songs;
    if (state.currentIndex < 0 || state.currentIndex >= songs.length) {
      const mem = loadMemory();
      state.currentIndex = mem ? Math.min(mem.songIndex, songs.length - 1) : 0;
    }
    saveMemory(false); // 歌单持久化(未播放, 不触发悬浮条)
    emit("playlist");
  }

  // ---- 控制 ----
  async function playSongAt(index, autoplay) {
    if (!state.songs.length) return;
    state.loadAbort?.abort();
    const ac = new AbortController();
    state.loadAbort = ac;
    state.currentIndex = ((index % state.songs.length) + state.songs.length) % state.songs.length;
    state.loading = true;
    emit("loadstart");
    const song = state.songs[state.currentIndex];
    try {
      const blob = await fetchAudioBlob(song.bvid, ac.signal);
      if (ac.signal.aborted) return;
      setAudioSource(blob);
      state.lastPlayedIndex = state.currentIndex;
      saveMemory();
      if (autoplay !== false) {
        const result = state.audio.play();
        if (result?.catch) result.catch(() => emit("play-blocked"));
      }
    } catch (e) {
      if (ac.signal.aborted) return;
      emit("load-error", { message: String(e?.message || e).slice(0, 90) });
    } finally {
      if (state.loadAbort === ac) {
        state.loadAbort = null;
        state.loading = false;
        emit("loadend");
      }
    }
  }

  function togglePlayback() {
    if (state.loading) return;
    const audio = ensureAudio();
    // 首次点击(刷新后 audio 无 src): 先加载当前记忆歌曲再播
    if (!audio.src) {
      playSongAt(state.currentIndex, true);
      return;
    }
    if (audio.paused) {
      const result = audio.play();
      if (result?.catch) result.catch(() => emit("play-blocked"));
    } else {
      audio.pause();
    }
  }

  function playNext() { playSongAt(state.currentIndex + 1, true); }
  function playPrevious() { playSongAt(state.currentIndex - 1, true); }

  function seekTo(percent) {
    const duration = Number.isFinite(state.audio?.duration) ? state.audio.duration : 0;
    if (!duration) return;
    state.audio.currentTime = Math.max(0, Math.min(1, percent)) * duration;
  }

  // =============================================================
  // 迷你悬浮条 (非音乐页常驻)
  // =============================================================
  let miniRoot = null;
  let miniDrag = null;

  function buildMiniBar() {
    if (miniRoot) return miniRoot;
    const root = document.createElement("div");
    miniRoot = root;
    root.className = "nova-mini-player";
    root.innerHTML =
      '<div class="nova-mini-cover-wrap"><img class="nova-mini-cover" alt=""></div>' +
      '<div class="nova-mini-main">' +
      '  <div class="nova-mini-meta"><strong class="nova-mini-title">暂无播放</strong></div>' +
      '  <div class="nova-mini-progress"><i class="nova-mini-progress-bar"></i></div>' +
      '  <div class="nova-mini-times"><span class="nova-mini-time">00:00</span><span class="nova-mini-duration">00:00</span></div>' +
      '</div>' +
      '<div class="nova-mini-controls">' +
      '  <button class="nova-mini-btn nova-mini-prev" type="button" aria-label="上一首"><i class="fas fa-step-backward"></i></button>' +
      '  <button class="nova-mini-btn nova-mini-toggle" type="button" aria-label="播放"><i class="fas fa-play"></i></button>' +
      '  <button class="nova-mini-btn nova-mini-next" type="button" aria-label="下一首"><i class="fas fa-step-forward"></i></button>' +
      '</div>' +
      '<button class="nova-mini-close" type="button" aria-label="关闭播放器"><i class="fas fa-times"></i></button>' +
      '<div class="nova-mini-drag-handle" aria-hidden="true"></div>';
    document.body.appendChild(root);

    root.querySelector(".nova-mini-prev").addEventListener("click", playPrevious);
    root.querySelector(".nova-mini-next").addEventListener("click", playNext);
    root.querySelector(".nova-mini-toggle").addEventListener("click", togglePlayback);
    root.querySelector(".nova-mini-close").addEventListener("click", () => {
      state.audio?.pause();
      miniClosed = true;
      try { sessionStorage.setItem("novaMiniClosed", "1"); } catch (_) {}
      hideMiniBar();
      emit("mini-closed");
    });
    enableDrag(root);
    // 点击进度条: seek
    root.querySelector(".nova-mini-progress").addEventListener("click", e => {
      const r = e.currentTarget.getBoundingClientRect();
      seekTo((e.clientX - r.left) / r.width);
    });
    return root;
  }

  function enableDrag(root) {
    let startX = 0, startY = 0, startLeft = 0, startTop = 0, moved = false;
    root.addEventListener("pointerdown", e => {
      if (e.target.closest("button, .nova-mini-progress, .nova-mini-close")) return;
      moved = false;
      startX = e.clientX; startY = e.clientY;
      const r = root.getBoundingClientRect();
      startLeft = r.left; startTop = r.top;
      root.setPointerCapture(e.pointerId);
      root.classList.add("is-dragging");
      const move = ev => {
        const dx = ev.clientX - startX, dy = ev.clientY - startY;
        if (Math.abs(dx) + Math.abs(dy) > 3) moved = true;
        root.style.left = Math.max(0, Math.min(window.innerWidth - root.offsetWidth, startLeft + dx)) + "px";
        root.style.top = Math.max(0, Math.min(window.innerHeight - root.offsetHeight, startTop + dy)) + "px";
      };
      const up = () => {
        root.removeEventListener("pointermove", move);
        root.removeEventListener("pointerup", up);
        root.classList.remove("is-dragging");
        try { localStorage.setItem("novaMiniPos", JSON.stringify({ x: root.style.left, y: root.style.top })); } catch (_) {}
      };
      root.addEventListener("pointermove", move);
      root.addEventListener("pointerup", up);
    });
  }

  function defaultMiniPos() {
    return { x: Math.max(16, window.innerWidth - 400) + "px", y: Math.max(16, window.innerHeight - 190) + "px" };
  }

  function showMiniBar() {
    if (miniClosed) return; // 用户关闭过: 不再自动显示
    const root = buildMiniBar();
    root.hidden = false;
    if (!root.dataset.posLoaded) {
      root.dataset.posLoaded = "1";
      let pos = null;
      try { pos = JSON.parse(localStorage.getItem("novaMiniPos") || "null"); } catch (_) {}
      const p = pos || defaultMiniPos();
      root.style.left = p.x; root.style.top = p.y;
    }
    updateMiniBar();
  }

  function hideMiniBar() {
    if (miniRoot) miniRoot.hidden = true;
  }

  let miniClosed = false; // 用户点击关闭后不再自动浮现(直到重新播放)
  try { miniClosed = sessionStorage.getItem("novaMiniClosed") === "1"; } catch (_) {}

  function shouldShowMini() {
    if (document.body.classList.contains("nova-music-route")) return false;
    if (miniClosed) return false;
    const mem = loadMemory();
    // 仅在音乐页真正播放过(记忆 played)才弹出悬浮条
    return Boolean(mem && mem.played && state.songs.length);
  }

  function updateMiniBar() {
    if (!miniRoot || miniRoot.hidden) return;
    const snap = currentSnapshot();
    const song = snap.song;
    const title = miniRoot.querySelector(".nova-mini-title");
    const cover = miniRoot.querySelector(".nova-mini-cover");
    if (song) {
      title.textContent = song?.name || song?.title || "未命名歌曲";
      const coverUrl = song?.cover || song?.pic || "";
      if (coverUrl && cover.src !== coverUrl) cover.src = coverUrl;
      else if (!coverUrl) cover.removeAttribute("src");
    }
    const toggle = miniRoot.querySelector(".nova-mini-toggle i");
    toggle.className = snap.playing ? "fas fa-pause" : "fas fa-play";
    const bar = miniRoot.querySelector(".nova-mini-progress-bar");
    const pct = snap.duration > 0 ? (snap.currentTime / snap.duration) * 100 : 0;
    bar.style.width = pct + "%";
    miniRoot.querySelector(".nova-mini-time").textContent = formatTime(snap.currentTime);
    miniRoot.querySelector(".nova-mini-duration").textContent = formatTime(snap.duration);
  }

  function formatTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) return "00:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }

  // ---- 事件分发(音乐页 UI + 悬浮条) ----
  function onEvent(type, payload) {
    if (type === "playlist" || type === "loadstart" || type === "loadend" || type === "error" || type === "play" || type === "pause" || type === "timeupdate" || type === "durationchange" || type === "loadedmetadata" || type === "play-blocked" || type === "load-error") {
      updateMiniBar();
    }
    if (type === "play" || type === "pause" || type === "playlist" || type === "loadstart" || type === "loadend" || type === "error" || type === "load-error" || type === "play-blocked") {
      // 音乐页隐藏悬浮条; 离开音乐页后按记忆显示
      if (document.body.classList.contains("nova-music-route")) hideMiniBar();
      else if (shouldShowMini()) showMiniBar();
    }
  }

  listeners.add(onEvent);

  window.__novaPlayer = {
    get state() { return currentSnapshot(); },
    setPlaylist,
    playSongAt,
    togglePlayback,
    playNext,
    playPrevious,
    seekTo,
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    showMiniBar,
    hideMiniBar,
    ensureAudio,
  };

  // ---- 启动: 恢复记忆(索引 + 歌单元信息), 不出声 ----
  function bootstrap() {
    const mem = loadMemory();
    if (mem) {
      state.currentIndex = mem.songIndex;
      if (Array.isArray(mem.songs) && mem.songs.length && !state.songs.length) {
        state.songs = mem.songs;
      }
    }
    const route = document.body.classList.contains("nova-music-route");
    if (!route) {
      // 非音乐页: 若有记忆, 显示悬浮条(等待用户点击播放, 不自动出声)
      if (shouldShowMini()) showMiniBar();
      // 预载歌曲(不自动播): 悬浮条点击播放时音频已就绪, 立即出声(从头)
      if (state.songs.length && !state.loading) {
        playSongAt(state.currentIndex, false);
      }
    }
    emit("boot");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootstrap, { once: true });
  } else {
    bootstrap();
  }
})();
