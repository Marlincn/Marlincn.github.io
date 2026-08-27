/* =============================================================
   前端共享工具(单一来源, P1·R7 2026-08-27)
   - 全站统一加载(yml inject.head, 位于 nova-player.js 之前)
   ============================================================= */
(function () {
  "use strict";
  window.NOVA_UTILS = {
    /* 秒数 -> "m:ss"(mm 不补零, ss 补零); 非法/负数 -> "00:00" */
    formatTime: function (seconds) {
      if (!Number.isFinite(seconds) || seconds < 0) return "00:00";
      var m = Math.floor(seconds / 60);
      var s = Math.floor(seconds % 60).toString().padStart(2, "0");
      return m + ":" + s;
    }
  };
})();
