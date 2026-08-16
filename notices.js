const notices = [
  {
    id: 4,
    title: "모딩 iOS 앱 안정화 업데이트 안내",
    date: "2026-08-10",
    tag: "업데이트",
    body: `
      <p>모딩 iOS 앱의 안정화 업데이트가 배포되었습니다.</p>
      <p>원활한 이용을 위해 App Store에서 최신 버전으로 업데이트해 주세요.</p>
    `
  },
  {
    id: 3,
    title: "모딩 iOS · Android 정식 서비스 안내",
    date: "2026-07-01",
    tag: "서비스 안내",
    body: `
      <p>외식업 사장님을 위한 B2B 식품 거래 플랫폼 <strong>모딩(Moding)</strong>의 정식 서비스를 시작했습니다.</p>
      <p>Android와 iPhone에서 모딩 앱을 설치하고 상품 탐색부터 주문·결제·거래 증빙까지 이용할 수 있습니다.</p>
    `
  },
  {
    id: 2,
    title: "이용약관 및 개인정보처리방침 적용 안내",
    date: "2026-07-01",
    tag: "약관 안내",
    body: `
      <p>모딩 서비스 이용약관과 개인정보처리방침이 2026년 7월 1일부터 적용됩니다.</p>
      <p>자세한 내용은 홈페이지 하단의 이용약관과 개인정보처리방침에서 확인할 수 있습니다.</p>
    `
  }
];

function sortedNotices() {
  return [...notices].sort((a, b) => b.date.localeCompare(a.date));
}

function noticeIdFromUrl() {
  const value = Number.parseInt(new URLSearchParams(window.location.search).get("notice"), 10);
  return Number.isFinite(value) ? value : null;
}

function setNoticeOpen(id, open) {
  const card = document.querySelector(`[data-notice-id="${id}"]`);
  const button = card?.querySelector(".notice-header");
  const body = card?.querySelector(".notice-body");
  if (!card || !button || !body) return;

  card.classList.toggle("is-open", open);
  body.classList.toggle("open", open);
  button.setAttribute("aria-expanded", String(open));
}

function openNotice(id) {
  document.querySelectorAll("[data-notice-id]").forEach(card => {
    setNoticeOpen(Number(card.dataset.noticeId), Number(card.dataset.noticeId) === id);
  });
}

function renderNoticeList() {
  const list = document.getElementById("notice-list");
  if (!list) return;

  const sorted = sortedNotices();
  list.innerHTML = sorted.map(notice => `
    <article class="notice-card" data-notice-id="${notice.id}">
      <button
        class="notice-header"
        type="button"
        aria-expanded="false"
        aria-controls="notice-body-${notice.id}"
      >
        <span class="notice-title">${notice.title}</span>
        <span class="notice-date">${notice.date}</span>
      </button>
      <span class="notice-tag">${notice.tag}</span>
      <div class="notice-body" id="notice-body-${notice.id}">${notice.body}</div>
    </article>
  `).join("");

  list.addEventListener("click", event => {
    const button = event.target.closest(".notice-header");
    if (!button) return;
    const card = button.closest("[data-notice-id]");
    const id = Number(card?.dataset.noticeId);
    const isOpen = button.getAttribute("aria-expanded") === "true";
    if (Number.isFinite(id)) isOpen ? setNoticeOpen(id, false) : openNotice(id);
  });

  const requested = noticeIdFromUrl();
  const firstId = sorted[0]?.id;
  const initial = notices.some(notice => notice.id === requested) ? requested : firstId;
  if (initial) openNotice(initial);
}

document.addEventListener("DOMContentLoaded", renderNoticeList);
