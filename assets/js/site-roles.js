// Only mark semantic roles; retain source structure, copy, artwork and links.
(() => {
 const page=document.documentElement.dataset.modingPage;
 const marketing=['index','about','brand','services','alliance','faq'].includes(page);
 function mark(selector,role){document.querySelectorAll(selector).forEach(n=>n.dataset.modingRole=role)}
 if(marketing){
  mark('.hero-copy h1,.hero-title,.scene-title,.hero-variant h1,.scene-content>h1,.scene-content>h2,.scene-copy h1,.scene-copy h2,.contact-copy h2,.service-copy h3,.vision-copy h2,.logo-copy h2,.final-copy h2','display');
  mark('.hero-copy>p,.scene-desc,.hero-desc,.service-copy>p,.contact-copy>p,.vision-copy>p,.final-copy>p','description');
  mark('.scene-frame,.hero-frame,.logo-frame,.service-panel>.container,.final-main,.vision-main,.contact-main','frame');
  mark('.scene-grid,.service-grid,.logo-grid','grid');
 }
 if(!marketing)mark('h1','document-title');
 mark('.app-cta','download');mark('.app-cta-main','download-label');mark('.app-cta-sub','download-sub');
 mark('.hero-cta,.contact-btn,.store-btn','action');mark('.menu-toggle,.menu-close,.scene-next,.section-next,.site-side-nav','icon-control');
 mark('.nav','navigation');mark('.nav-logo img','nav-logo');mark('.footer-company','footer-copy');
 mark('.hero-actions,.contact-actions,.store-buttons','action-group');
 const root=document.getElementById('snapRoot');if(root)root.dataset.modingRoot='scenes';
})();
