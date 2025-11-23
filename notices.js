/* =========================================================
   Moding Notices – 공지사항 데이터 & 렌더링 스크립트
   (index.html & notice.html 공통 사용)
   ========================================================= */

const notices = [
  {
    id: 1,
    title: "모딩(Moding) 약관 업로드 안내",
    date: "2025-11-20",
    tag: "공지",
    body: `
      모딩(Moding) 플랫폼 이용약관 및 관련 정책이 
      <strong>2025년 11월 20일</strong>자로 최종 업로드되었습니다.<br><br>
      약관은 서비스 이용을 위한 기본 규정으로, 
      제조사·외식업 사장님 모두에게 적용됩니다.<br><br>
      각 페이지 하단의 ‘이용약관’ 링크를 통해 확인하실 수 있습니다.
    `
  },
  {
    id: 2,
    title: "모딩(Moding) 기본 버전 출시 예정 안내",
    date: "2025-11-23",
    tag: "서비스 안내",
    body: `
      모딩(Moding)의 B2B Food-SaaS 기능 최소화 버전이 
      <strong>곧 출시 예정</strong>입니다.<br><br>
      외식업 이용 페이지(발주, 가게 관리 기능)를 중심으로 먼저 제공되며, 
      이후 순차적으로 제조사 관리 페이지 및 세금계산서 자동화 기능 등 추가될 예정입니다.
    `
  }
];

/* =========================================================
   index.html – 최신 공지 2개만 출력 + 클릭 가능
   ========================================================= */
function renderIndexNotices() {
  const area = document.getElementById("index-notice-area");
  if (!area) return;   // index.html이 아닐 때는 통과

  // 날짜 기준 내림차순 정렬 → 상위 2개 출력
  const latest = [...notices]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 2);

  area.innerHTML = latest
    .map(
      (n) => `
      <li>
        <a href="notice.html?notice=${n.id}" class="notice-link">
          <span class="notice-item-title">${n.title}</span>
          <span class="notice-item-date">${n.date}</span>
        </a>
      </li>
    `
    )
    .join("");
}

/* =========================================================
   notice.html – 전체 공지 목록 + 접힘/펼침
   ========================================================= */
function renderNoticeList() {
  const list = document.getElementById("notice-list");
  if (!list) return;

  list.innerHTML = notices
    .map(
      (n) => `
      <article class="notice-card">
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

/* 접힘 / 펼침 기능 */
function toggleNotice(id) {
  const body = document.getElementById(`notice-body-${id}`);
  if (!body) return;
  body.classList.toggle("open");
}

/* =========================================================
   notice.html – 특정 공지 자동 펼침
   ========================================================= */
function openNoticeFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("notice");
  if (!id) return;

  setTimeout(() => {
    toggleNotice(id);
    const target = document.getElementById(`notice-body-${id}`);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, 80);
}

/* =========================================================
   페이지 자동 인식 후 실행
   ========================================================= */
document.addEventListener("DOMContentLoaded", () => {
  renderIndexNotices();  // index.html 공지 2개
  renderNoticeList();    // notice.html 전체 공지
  openNoticeFromQuery(); // notice.html 자동 펼침
});
