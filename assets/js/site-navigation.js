/* Preserve the original public-page gestures without taking over native vertical scrolling. */
(() => {
  'use strict';
  const root = document.getElementById('snapRoot');
  if (!root) return;
  const links = [...document.querySelectorAll('.site-side-nav')];
  const previous = links.find(link => link.classList.contains('prev'));
  const next = links.find(link => !link.classList.contains('prev'));
  const isHome = document.body.dataset.page === 'index';
  const interactive = 'a,button,input,textarea,select,[contenteditable="true"],[role="tab"]';
  let touch = null, wheelPull = 0, lastWheel = 0, navigating = false;

  function blocked() {
    return root.inert || !!document.querySelector('.mobile-menu-overlay.is-open,.preview-chat:not([hidden])');
  }
  function syncControls() {
    const disabled = blocked();
    links.forEach(link => { link.inert = disabled; });
    if (disabled) { touch = null; wheelPull = 0; }
  }
  new MutationObserver(syncControls).observe(root, { attributes: true, attributeFilter: ['inert'] });
  syncControls();
  const footer = document.querySelector('.site-footer');
  if (footer) new ResizeObserver(() => {
    document.documentElement.style.setProperty('--footer-height', `${Math.ceil(footer.getBoundingClientRect().height)}px`);
  }).observe(footer);

  function refresh() {
    if (navigating || blocked()) return;
    navigating = true;
    location.reload();
  }
  addEventListener('pageshow', () => { navigating = false; touch = null; wheelPull = 0; syncControls(); });
  root.addEventListener('touchstart', event => {
    touch = null;
    if (blocked() || event.touches.length !== 1 || event.target.closest(interactive)) return;
    const { clientX: x, clientY: y } = event.touches[0];
    touch = { x, y, atTop: root.scrollTop <= 1, awayFromEdge: x >= 45 && x <= innerWidth - 45 };
  }, { passive: true });
  root.addEventListener('touchcancel', () => { touch = null; }, { passive: true });
  root.addEventListener('touchend', event => {
    const start = touch;
    touch = null;
    if (!start || blocked() || navigating || event.touches.length || !event.changedTouches.length) return;
    const dx = event.changedTouches[0].clientX - start.x;
    const dy = event.changedTouches[0].clientY - start.y;
    if (start.awayFromEdge && Math.abs(dx) >= 90 && Math.abs(dx) >= Math.abs(dy) * 1.35) {
      const target = dx > 0 ? previous : next;
      if (target) { navigating = true; location.assign(target.href); }
    } else if (isHome && start.atTop && root.scrollTop <= 1 && dy >= 110 && dy > Math.abs(dx) * 1.35) {
      refresh();
    }
  }, { passive: true });

  // Original homepage pull-to-refresh: only at the top, never during pinch zoom or in a dialog.
  if (isHome) root.addEventListener('wheel', event => {
    const now = performance.now();
    if (blocked() || event.ctrlKey || event.shiftKey || root.scrollTop > 1 || event.deltaY >= 0 || Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
      wheelPull = 0;
      return;
    }
    if (now - lastWheel > 600) wheelPull = 0;
    lastWheel = now;
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? root.clientHeight : 1;
    wheelPull += Math.abs(event.deltaY) * unit;
    if (wheelPull >= 160) refresh();
  }, { passive: true });
})();
