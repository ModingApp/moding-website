/* Available window classification. No reload or DOM replacement on resize.
 * Existing website typography boundary stays 820px. These classes do not
 * themselves implement three native app layouts or hinge avoidance.
 */
(() => {
  if (window.__modingResponsiveInstalled) return;
  window.__modingResponsiveInstalled = true;
  const root = document.documentElement;
  let scheduled = false;
  const update = () => {
    scheduled = false;
    const width = root.clientWidth;
    const height = window.visualViewport?.height ?? window.innerHeight;
    root.dataset.modingWindow = width < 600 ? 'compact' : width < 1024 ? 'medium' : 'expanded';
    root.dataset.modingShort = String(height < 600);
    root.style.setProperty('--moding-visible-height', `${height}px`);
  };
  const schedule = () => {
    if (!scheduled) { scheduled = true; requestAnimationFrame(update); }
  };
  window.addEventListener('resize', schedule, {passive: true});
  window.visualViewport?.addEventListener('resize', schedule, {passive: true});
  update();
})();
