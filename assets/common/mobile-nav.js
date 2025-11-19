document.addEventListener("DOMContentLoaded", function () {
  const btn = document.getElementById("hamburgerBtn");
  const menu = document.getElementById("mobileMenu");

  if (!btn || !menu) return;

  btn.addEventListener("click", function () {
    menu.style.display = (menu.style.display === "flex") ? "none" : "flex";
  });
});
