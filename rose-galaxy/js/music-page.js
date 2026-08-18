(function () {
  "use strict";

  if (window.__novaMusicBootstrap) {
    window.__novaMusicBootstrap.init();
    return;
  }

  // ===== 配置:腾讯云函数代理 + B 站收藏夹 =====
  const BILI_PROXY = "http://127.0.0.1:8126"; // 云函数地址
  const BILI_UID = "3546712446601247"; // B 站 UID
  const BILI_FOLDER = "music"; // 收藏夹名

  const visualImages = [
    "/img/music1.webp",
    "/img/music2.webp",
    "/img/music3.webp",
    "/img/music4.webp",
    "/img/music5.webp",
  ];
  const visibleOffsets = [-2, -1, 0, 1, 2];
  const loadedVisualImages = new Set();
  const pendingVisualImages = new Map();

  function previewImage(image) {
    return image.replace(/\.webp$/i, "-preview.webp");
  }

  function preloadVisualImage(image) {
    if (loadedVisualImages.has(image)) return Promise.resolve(image);
    if (pendingVisualImages.has(image)) return pendingVisualImages.get(image);

    const request = new Promise((resolve, reject) => {
      const loader = new Image();
      loader.decoding = "async";
      loader.onload = async () => {
        try {
          await loader.decode?.();
        } catch (_) {
          // The decoded image is still usable when decode() is unsupported or interrupted.
        }
        loadedVisualImages.add(image);
        pendingVisualImages.delete(image);
        resolve(image);
      };
      loader.onerror = () => {
        pendingVisualImages.delete(image);
        reject(new Error(`Nova music: failed to preload ${image}`));
      };
      loader.src = image;
    });

    pendingVisualImages.set(image, request);
    return request;
  }

  function assignCardImage(image, source, isCurrent, shouldPreload) {
    const currentSource = image.getAttribute("src") || "";
    image.dataset.src = source;
    image.width = 640;
    image.height = 960;
    image.decoding = "async";

    if (currentSource === source) {
      image.loading = isCurrent ? "eager" : "lazy";
      if (!isCurrent) image.removeAttribute("fetchpriority");
      if (image.complete && image.naturalWidth) loadedVisualImages.add(source);
      else image.addEventListener("load", () => loadedVisualImages.add(source), { once: true });
      return;
    }

    // 换图:旧图淡出,新图就绪后淡入
    image.loading = isCurrent ? "eager" : "lazy";
    image.removeAttribute("fetchpriority");
    const target = loadedVisualImages.has(source) ? source : previewImage(source);
    image.classList.add("nova-card-img-swap");
    image.src = target;
    void image.offsetWidth; // 强制应用 opacity:0,作为过渡起点
    const reveal = () => {
      if (image.dataset.src === source) image.classList.remove("nova-card-img-swap");
    };
    if (image.complete && image.naturalWidth) requestAnimationFrame(reveal);
    else image.addEventListener("load", reveal, { once: true });

    if (!isCurrent && !shouldPreload) return;
    preloadVisualImage(source)
      .then(loadedSource => {
        if (image.dataset.src === loadedSource) image.src = loadedSource;
      })
      .catch(error => console.warn(error.message));
  }

  function warmCardImage(image) {
    const source = image?.dataset.src;
    if (!source || loadedVisualImages.has(source)) return;
    preloadVisualImage(source)
      .then(loadedSource => {
        if (image.dataset.src === loadedSource) image.src = loadedSource;
      })
      .catch(error => console.warn(error.message));
  }

  function normalizeIndex(index, length) {
    return length ? ((index % length) + length) % length : 0;
  }

  function formatTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) return "00:00";
    const minutes = Math.floor(seconds / 60);
    const rest = Math.floor(seconds % 60).toString().padStart(2, "0");
    return `${minutes}:${rest}`;
  }

  function createMusicPageController(root) {
    const state = {
      root,
      audio: null,
      songs: [],
      currentIndex: 0,
      lastRenderedIndex: undefined,
      loadAbort: null,
      objectUrls: new Set(),
      listeners: [],
      timer: 0,
      destroyed: false,
    };

    const els = {
      title: root.querySelector(".nova-music-current-title"),
      artist: root.querySelector(".nova-music-current-artist"),
      cover: root.querySelector(".nova-music-current-cover"),
      progress: root.querySelector(".nova-music-progress-input"),
      currentTime: root.querySelector(".nova-music-current-time"),
      duration: root.querySelector(".nova-music-duration"),
      toggle: root.querySelector(".nova-music-toggle"),
      previous: root.querySelector(".nova-music-previous"),
      next: root.querySelector(".nova-music-next"),
      count: root.querySelector(".nova-music-count"),
      notesCount: root.querySelector(".nova-music-notes-count"),
      retry: root.querySelector(".nova-music-retry"),
      cards: [...root.querySelectorAll(".nova-music-card")],
    };

    const on = (target, type, handler, options) => {
      target?.addEventListener(type, handler, options);
      if (target) state.listeners.push(() => target.removeEventListener(type, handler, options));
    };

    const songName = song => song?.name || song?.title || "未命名歌曲";
    const songArtist = song => song?.artist || song?.author || "未知歌手";
    const songCover = (song, index) => song?.cover || song?.pic || visualImages[normalizeIndex(index, visualImages.length)];

    function showLoadingState() {
      window.clearTimeout(state.timer);
      els.title.textContent = "歌单载入中";
      els.artist.textContent = `B站收藏夹 · ${BILI_FOLDER}`;
      if (els.retry) els.retry.hidden = true;
    }

    function showLoadFailure(title, detail) {
      els.title.textContent = title;
      els.artist.textContent = detail;
      if (els.retry) els.retry.hidden = false;
    }

    function renderCurrentSong() {
      const song = state.songs[state.currentIndex];
      if (!song) return;
      const name = songName(song);
      const artist = songArtist(song);
      els.title.textContent = name;
      els.artist.textContent = artist;
      const cover = songCover(song, state.currentIndex);
      if (els.cover) {
        const hasSquarePlaylistCover = Boolean(song?.cover || song?.pic);
        els.cover.src = cover;
        els.cover.width = 640;
        els.cover.height = hasSquarePlaylistCover ? 640 : 960;
        els.cover.alt = `${name} - ${artist}`;
      }
      els.count.textContent = `共 ${state.songs.length} 首 · 当前第 ${state.currentIndex + 1} 首`;
      if (els.notesCount) els.notesCount.textContent = `${state.songs.length} TRACKS`;
      state.root.classList.toggle("is-playing", Boolean(state.audio && !state.audio.paused));
      els.toggle.textContent = state.audio && !state.audio.paused ? "Ⅱ" : "▶";
      els.toggle.setAttribute("aria-label", state.audio && !state.audio.paused ? "暂停" : "播放");
    }

    function renderVisibleCards() {
      const total = state.songs.length;
      els.cards.forEach((card, slot) => {
        const previousIndex = card.dataset.songIndex;
        const index = normalizeIndex(state.currentIndex + visibleOffsets[slot], total);
        const song = state.songs[index];
        const name = songName(song);
        const artist = songArtist(song);
        const image = songCover(song, index); // B站视频封面优先,回退本地视觉图
        card.dataset.songIndex = String(index);
        card.setAttribute("aria-label", slot === 2 ? `${name}，播放或暂停` : `播放 ${name} - ${artist}`);
        card.toggleAttribute("aria-current", slot === 2);
        const img = card.querySelector("img");
        assignCardImage(img, image, slot === 2, slot === 3);
        img.alt = `${name} - ${artist}`;
        card.querySelector("strong").textContent = slot === 2 ? name : "";
        card.querySelector("small").textContent = slot === 2 ? artist : "";
        if (slot === 2 && previousIndex !== String(index)) {
          // 主卡切换:呼吸放大(remove+reflow+add 支持连续快速切换重启动画)
          card.classList.remove("nova-card-pop");
          void card.offsetWidth;
          card.classList.add("nova-card-pop");
          card.addEventListener("animationend", () => card.classList.remove("nova-card-pop"), { once: true });
        }
      });
    }

    function updateProgress() {
      const current = Number.isFinite(state.audio?.currentTime) ? state.audio.currentTime : 0;
      const duration = Number.isFinite(state.audio?.duration) ? state.audio.duration : 0;
      els.currentTime.textContent = formatTime(current);
      els.duration.textContent = formatTime(duration);
      const value = duration > 0 ? Math.round((current / duration) * 1000) : 0;
      els.progress.value = String(value);
      els.progress.style.setProperty("--nova-music-progress", `${value / 10}%`);
    }

    // ---- 云函数:取音频(base64 -> Blob)----
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
      const url = URL.createObjectURL(blob);
      state.objectUrls.add(url);
      state.audio.src = url;
    }

    // 连续切换:每次点击立即响应,上一次未完成的加载被中断(最新优先)
    async function playSongAt(index, autoplay) {
      if (!state.songs.length) return;
      state.loadAbort?.abort();
      const ac = new AbortController();
      state.loadAbort = ac;
      state.currentIndex = normalizeIndex(index, state.songs.length);
      const song = state.songs[state.currentIndex];
      renderCurrentSong();
      renderVisibleCards();
      updateProgress();
      els.artist.textContent = "音频加载中…";
      try {
        const blob = await fetchAudioBlob(song.bvid, ac.signal);
        if (ac.signal.aborted) return;
        setAudioSource(blob);
        if (autoplay !== false) {
          const result = state.audio.play();
          if (result?.catch) result.catch(() => console.warn("Nova music: playback was blocked."));
        }
        renderCurrentSong();
      } catch (e) {
        if (ac.signal.aborted) return; // 被更新的切换取代,不视为错误
        els.title.textContent = "当前歌曲暂时无法播放";
        els.artist.textContent = String(e?.message || e).slice(0, 90);
        console.error("Nova music: audio failed.", e);
      } finally {
        if (state.loadAbort === ac) state.loadAbort = null;
      }
    }

    function playNext() {
      playSongAt(state.currentIndex + 1, true);
    }

    function playPrevious() {
      playSongAt(state.currentIndex - 1, true);
    }

    function togglePlayback() {
      if (!state.audio || state.loadAbort) return;
      if (state.audio.paused) {
        const result = state.audio.play();
        if (result?.catch) result.catch(() => console.warn("Nova music: playback failed."));
      } else {
        state.audio.pause();
      }
    }

    function seekTo(percent) {
      const duration = Number.isFinite(state.audio?.duration) ? state.audio.duration : 0;
      if (!duration) return;
      state.audio.currentTime = Math.max(0, Math.min(1, percent)) * duration;
    }

    function bindMusicControls() {
      on(els.previous, "click", playPrevious);
      on(els.next, "click", playNext);
      on(els.toggle, "click", togglePlayback);
      on(els.progress, "input", event => seekTo(Number(event.target.value) / 1000));
      els.cards.forEach((card, slot) => {
        const warm = () => warmCardImage(card.querySelector("img"));
        on(card, "pointerenter", warm);
        on(card, "focusin", warm);
        on(card, "click", () => {
          if (slot === 2) togglePlayback();
          else playSongAt(Number(card.dataset.songIndex), true);
        });
      });
      on(document, "keydown", event => {
        if (!state.root.isConnected || event.target?.matches("input, textarea, [contenteditable]")) return;
        if (event.key === "ArrowLeft") playPrevious();
        if (event.key === "ArrowRight") playNext();
      });
    }

    function bindPlayerEvents() {
      on(state.audio, "play", renderCurrentSong);
      on(state.audio, "pause", renderCurrentSong);
      on(state.audio, "timeupdate", updateProgress);
      on(state.audio, "durationchange", updateProgress);
      on(state.audio, "loadedmetadata", updateProgress);
      on(state.audio, "ended", playNext);
      on(state.audio, "error", () => {
        els.title.textContent = "当前歌曲暂时无法播放";
        els.artist.textContent = "请尝试切换下一首";
        console.error("Nova music: audio source failed.", state.songs[state.currentIndex]);
      });
    }

    function loadPlaylist() {
      showLoadingState();
      if (!state.audio) state.audio = new Audio();
      fetch(BILI_PROXY + "/api/playlist?uid=" + BILI_UID + "&folder=" + encodeURIComponent(BILI_FOLDER))
        .then(resp => resp.json())
        .then(j => {
          if (j.error) throw new Error(j.error);
          if (!Array.isArray(j.songs) || !j.songs.length) throw new Error("收藏夹为空");
          state.songs = j.songs;
          if (els.retry) els.retry.hidden = true;
          bindMusicControls();
          bindPlayerEvents();
          renderCurrentSong();
          renderVisibleCards();
          updateProgress();
          playSongAt(0, false); // 预载第一首,不自动播放
        })
        .catch(e => {
          showLoadFailure("收藏夹加载失败", String(e?.message || e).slice(0, 90));
          console.error("Nova music: playlist failed.", e);
        });
    }

    function destroyMusicPage() {
      state.destroyed = true;
      window.clearTimeout(state.timer);
      state.loadAbort?.abort();
      state.loadAbort = null;
      state.listeners.splice(0).forEach(remove => remove());
      state.objectUrls.forEach(url => URL.revokeObjectURL(url));
      state.objectUrls.clear();
      state.audio?.pause();
      state.audio = null;
    }

    on(els.retry, "click", loadPlaylist);
    loadPlaylist();
    return { root, destroy: destroyMusicPage };
  }

  function initMusicPage() {
    const root = document.querySelector(".nova-music-page");
    if (!root) return;
    if (window.__novaMusicController?.root === root) return;
    window.__novaMusicController?.destroy();
    window.__novaMusicController = createMusicPageController(root);
  }

  function leaveMusicPage() {
    window.__novaMusicController?.destroy();
    window.__novaMusicController = null;
  }

  window.__novaMusicBootstrap = {
    init: initMusicPage,
    destroy: leaveMusicPage,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initMusicPage, { once: true });
  } else {
    initMusicPage();
  }
  document.addEventListener("pjax:send", leaveMusicPage);
  document.addEventListener("pjax:complete", initMusicPage);
})();
