/* =========================================================
   Moding Notices – 공지사항 데이터 & 렌더링 스크립트
   (index.html & notice.html 공통 사용)
   ========================================================= */

/* 공지 데이터 (여기만 수정해서 공지 추가/변경하면 됨) */
const notices = [
  {
    id: 2,
    title: "모딩 기본 버전 출시 예정 안내",
    date: "2025-11-23",
    tag: "서비스 안내",
    body: `
      <p>
        B2B Food-SaaS 플랫폼 <strong>모딩(Moding)</strong>의
        기본 버전(1차 릴리즈)이 곧 공개될 예정입니다.
      </p>
      <p>
        이번 기본 버전에는 제조사–외식업 간 <strong>주문·정산 흐름</strong>을
        실제로 테스트할 수 있는 최소 기능과,<br>
        관리자 및 정산 화면의 주요 골격이 포함됩니다.
      </p>
      <p>
        정식 오픈 일정과 세부 기능 구성은 추후 공지를 통해
        다시 한 번 안내드리겠습니다.
      </p>
    `
  },
  {
    id: 1,
    title: "모딩 이용약관 업로드 안내",
    date: "2025-11-20",
    tag: "약관 안내",
    body: `
      <p>
        모딩(Moding) 서비스 이용과 관련된
        <strong>공식 이용약관</strong>이 웹사이트 및 앱 내에 업로드되었습니다.
      </p>
      <p>
        · 적용 대상: 모딩 플랫폼을 이용하는 모든 회원(제조사, 외식업 사장님 등)<br>
        · 주요 내용: 통신판매중개자로서의 회사 지위, 정산 구조, PB/OEM 관련 책임 범위,
          서비스 이용 제한 사유 등
      </p>
      <p>
        자세한 내용은 하단 메뉴의 <strong>‘이용약관’</strong> 페이지에서
        전문을 확인하실 수 있으며,<br>
        약관은 공지된 날짜를 기준으로 효력이 발생합니다.
      </p>
    `
  }
];

/* 날짜 내림차순 정렬 헬퍼 */
function getSortedNotices() {
  return [...notices].sort((a, b) => b.date.localeCompare(a.date));
}

/* =========================================================
   index.html – 최신 공지 2개만 출력 (리스트 클릭 시 notice.html 이동)
   ========================================================= */
function renderIndexNotices() {
  const area = document.getElementById("index-notice-area");
  if (!area) return;   // index.html이 아니면 종료

  const latest = getSortedNotices().slice(0, 2);

  area.innerHTML = latest
    .map(
      (n) => `
        <li class="index-notice-row" onclick="goNotice(${n.id})">
          <span class="notice-item-title">${n.title}</span>
          <span class="notice-item-date">${n.date}</span>
        </li>
      `
    )
    .join("");
}

/* index 공지 클릭 시 notice.html로 이동 */
function goNotice(id) {
  window.location.href = `notice.html?notice=${id}`;
}

/* =========================================================
   notice.html – 전체 공지 카드형 + 접힘/펼침 기능
   ========================================================= */
function renderNoticeList() {
  const list = document.getElementById("notice-list");
  if (!list) return; // notice.html이 아니면 종료

  const sorted = getSortedNotices();

  list.innerHTML = sorted
    .map(
      (n) => `
      <article class="notice-card" data-notice-id="${n.id}">
        <header class="notice-header" onclick="toggleNotice(${n.id})">
          <div class="notice-title">${n.title}</div>
          <div class="notice-date">${n.date}</div>
        </header>

        <span class="notice-tag">${n.tag}</span>

        <div class="notice-body" id="notice-body-${n.id}">
          ${n.body}
        </div>
      </article>
    `
    )
    .join("");
}

/* 접힘 / 펼침 기능 (카드 단일 오픈) */
function toggleNotice(id) {
  const body = document.getElementById(`notice-body-${id}`);
  if (!body) return;

  const card = body.closest(".notice-card");
  const isOpen = body.classList.contains("open");

  // 모두 접기
  document.querySelectorAll(".notice-body").forEach((b) => b.classList.remove("open"));
  document.querySelectorAll(".notice-card").forEach((c) => c.classList.remove("is-open"));

  // 원래 닫혀 있던 카드만 다시 열기
  if (!isOpen) {
    body.classList.add("open");
    if (card) card.classList.add("is-open");
  }
}

/* URL 파라미터 (?notice=ID) 가져오기 */
function getNoticeParamId() {
  const params = new URLSearchParams(window.location.search);
  const idStr = params.get("notice");
  if (!idStr) return null;
  const num = parseInt(idStr, 10);
  return Number.isNaN(num) ? null : num;
}

/* =========================================================
   페이지 로드 후 자동 실행
   ========================================================= */
document.addEventListener("DOMContentLoaded", () => {
  // index.html 공지 2개
  renderIndexNotices();

  // notice.html 전체 리스트
  renderNoticeList();

  // notice.html인 경우: 파라미터/기본 오픈 처리
  const listEl = document.getElementById("notice-list");
  if (listEl) {
    const paramId = getNoticeParamId();
    const sorted = getSortedNotices();

    if (paramId && notices.some((n) => n.id === paramId)) {
      toggleNotice(paramId);
    } else if (sorted.length > 0) {
      // 파라미터 없으면 최신 공지 열어둠
      toggleNotice(sorted[0].id);
    }
  }
});
