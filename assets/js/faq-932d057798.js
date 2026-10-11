// The existing scene controller scrolls; move keyboard focus to the matching answer.
(() => {
 document.querySelectorAll('[data-faq-focus]').forEach(button => {
  button.addEventListener('click', () => {
   const target = document.getElementById(button.dataset.faqFocus);
   if (!target) return; const root=document.getElementById('snapRoot'); if(root)root.style.scrollSnapType='none'; target.style.scrollMarginTop='20px'; target.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'}); target.focus({preventScroll:true});
  });
 });
})();
