document.addEventListener("DOMContentLoaded", function () {
  const toggleBtn = document.querySelector(".nav-toggle");
  const closeBtn = document.querySelector(".nav-close");
  const overlay = document.querySelector(".nav-overlay");
  const mobileLinks = document.querySelectorAll(".mobile-nav-menu a, .mobile-nav-meta a");

  function openNav() {
    document.body.classList.add("nav-open");
  }

  function closeNav() {
    document.body.classList.remove("nav-open");
  }

  if (toggleBtn) {
    toggleBtn.addEventListener("click", function () {
      if (document.body.classList.contains("nav-open")) {
        closeNav();
      } else {
        openNav();
      }
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", closeNav);
  }

  if (overlay) {
    overlay.addEventListener("click", closeNav);
  }

  // 모바일 메뉴 항목 클릭 시 자동 닫기
  mobileLinks.forEach(function (link) {
    link.addEventListener("click", closeNav);
  });
});

