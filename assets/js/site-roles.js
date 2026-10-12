// Only mark semantic roles; retain source structure, copy, artwork and links.
(() => {
 const page=document.documentElement.dataset.modingPage;
 const marketing=['index','about','brand','services','alliance','faq'].includes(page);
 function mark(selector,role){document.querySelectorAll(selector).forEach(n=>n.dataset.modingRole=role)}
 if(marketing){
  mark('.hero-copy h1,.hero-title,.scene-title,.hero-variant h1,.scene-content>h1,.scene-content>h2,.scene-copy h1,.scene-copy h2,.contact-copy h2,.service-copy h3,.vision-copy h2,.logo-copy h2,.final-copy h2,.name-head h2,.color-head h2,.end-title','display');
  mark('.hero-copy>p,.scene-desc,.hero-desc,.service-copy>p,.contact-copy>p,.vision-copy>p,.final-copy>p,.name-head>.section-desc,.color-head>.section-desc','description');
  mark('.scene-frame,.hero-frame,.logo-frame,.service-panel>.container,.final-main,.vision-main,.contact-main,.name-section>.container,.color-section>.container,.end-inner','frame');
  mark('.scene-grid,.service-grid,.logo-grid','grid');
  // A service container can own both the frame and the grid. Keep those roles independent.
  document.querySelectorAll('.scene-frame,.hero-frame,.logo-frame,.service-panel>.container,.final-main,.vision-main,.contact-main,.name-section>.container,.color-section>.container,.end-inner').forEach(n=>n.dataset.modingFrame='');
  mark('.logo-copy>.section-desc','description');
  mark('.who-side h3','feature-title');
  mark('.flow-item h3,.name-copy h3,.partner-flow-item h3,.icon-step h3,.partner-step h3,.utility-card h3,.type-title,.guide-title,.category-tag,.color-name,.mobile-experience-copy strong,.experience-desktop-copy strong','card-title');
  mark('.flow-item p,.who-side p,.name-copy p,.partner-flow-item p,.icon-step p,.partner-step p,.utility-card p,.type-desc,.guide-desc,.mini-faq summary,.mini-faq details p,.quick-chip,.service-note','body');
  mark('.logo-note,.color-meta,.delivery-caption,.category-note,.contact-note,.faq-nav-hint,.mobile-experience-copy span,.experience-desktop-copy span','detail');
  mark('.kicker,.hero-kicker,.section-kicker,.end-kicker,.guide-kicker,.name-number,.who-label,.type-label','kicker');
  document.querySelectorAll('.scene-grid,.service-grid,.hero-frame:not(.centered-native),.logo-frame,.contact-main,.final-main,.delivery-layout').forEach(n=>n.dataset.modingLayout='split');
 }
 if(!marketing)mark('h1','document-title');
 if(!marketing){
  mark('.policy-sub,.terms-sub,.document-desc,.notice-sub,.desc,.visit-main','body');
  mark('.policy-card p,.policy-card li,.policy-card td,.policy-card th,.terms-card p,.terms-card li,.terms-card td,.terms-card th,.notice-body p','body');
  mark('.policy-card h3,.terms-card h3,.notice-header .notice-title','card-title');
  mark('.address-main','address-title');
  mark('.address-sub,.visit-sub,.visit-desc,.card-desc,.download-info,.note,.notice-date,.notice-tag,.notice-meta,.policy-meta,.terms-meta,.summary-label,.summary-value,.eyebrow,.card-kicker','detail');
  mark('.top-return-btn,.back-btn','action');
 }
 mark('.app-cta','download');mark('.app-cta-main','download-label');mark('.app-cta-sub','download-sub');
 mark('.hero-cta,.contact-btn,.store-btn,.guide-btn,.connection-admission','action');mark('.menu-toggle,.menu-close,.scene-next,.section-next,.site-side-nav','icon-control');
 mark('.nav','navigation');mark('.nav-logo img','nav-logo');mark('.footer-company','footer-copy');
 mark('.hero-actions,.contact-actions,.store-buttons','action-group');
 document.querySelectorAll('.consultation-entry,.contact-actions>.seller,.connection-admission').forEach(n=>n.dataset.modingCta='primary');
 const root=document.getElementById('snapRoot');if(root)root.dataset.modingRoot='scenes';
})();
