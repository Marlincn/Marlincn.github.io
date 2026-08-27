(() => {
  'use strict'

  // Decorative click effects removed on purpose (site customization: 2026-08-15):
  //   - activate-power-mode (POWERMODE): colored particle burst on click / input
  //   - click-show-text: floating text ("I,MISS,LOVE,YOU") on click
  // Previously these were lazy-loaded from butterfly-extsrc CDN.
  // Keep this file as a no-op so every page's script reference stays valid;
  // restore effects by re-adding the appendScript calls below if ever wanted.
})()
