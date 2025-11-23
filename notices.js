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
   Moding Notices – 공지사항 데이터 & 렌더링 스크립트
   (index.html & notice.html 공통 사용)
   ========================================================= */

/**
 * 공지 데이터는 여기에서만 관리합니다.
 * id는 숫자로만, date는 YYYY-MM-DD 형식으로 맞춰 주세요.
 */
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
   index.html – 최신 공지 2개만 출력
   ========================================================= */
function renderIndexNotices() {
  const area = document.getElementById("index-notice-area");
  if (!area) return;   // index.html이 아닐 때는 그냥 종료

  // 날짜 기준 내림차순 정렬 후 상위 2개
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
   notice.html – 전체 공지 리스트 렌더링 + 아코디언
   ========================================================= */

/**
 * notice.html의 #notice-list 안에
 * 전체 공지 카드를 동적으로 렌더링합니다.
 * ?notice=ID 파라미터가 있으면 해당 카드만 기본 open.
 */
function renderNoticeList() {
  const list = document.getElementById("notice-list");
  if (!list) return; // notice.html이 아닐 때는 종료

  const params = new URLSearchParams(window.location.search);
  const targetId = params.get("notice");

  list.innerHTML = notices
    .sort((a, b) => b.date.localeCompare(a.date)) // 최신 순 정렬
    .map((n, idx) => {
      const isOpen = targetId
        ? String(n.id) === String(targetId)
        : idx === 0; // 쿼리 없으면 첫 번째 공지 펼침

      const tagClass = n.tagType ? ` ${n.tagType}` : "";

      return `
        <article class="notice-card${isOpen ? " is-open" : ""}" data-id="${n.id}">
          <button type="button" class="notice-toggle">
            <div class="notice-header-text">
              <div class="notice-title-text">${n.title}</div>
              <div class="notice-meta-row">
                <span class="notice-date">${n.date}</span>
                <span class="notice-tag${tagClass}">${n.tag}</span>
              </div>
            </div>
            <div class="notice-arrow">▶</div>
          </button>
          <div class="notice-body">
            <div class="notice-body-inner">
              ${n.body}
            </div>
          </div>
        </article>
      `;
    })
    .join("");

  bindNoticeAccordion();
}

/**
 * 카드 아코디언(펼치기/접기) 바인딩
 */
function bindNoticeAccordion() {
  const cards = document.querySelectorAll(".notice-card");
  cards.forEach((card) => {
    const toggle = card.querySelector(".notice-toggle");
    if (!toggle) return;

    toggle.addEventListener("click", () => {
      // 이미 열려 있으면 닫기
      if (card.classList.contains("is-open")) {
        card.classList.remove("is-open");
        return;
      }

      // 다른 카드들은 닫고 현재만 열기
      cards.forEach((c) => c.classList.remove("is-open"));
      card.classList.add("is-open");
    });
  });
}

/* =========================================================
   공통: DOM 로드 후 자동 실행
   ========================================================= */
document.addEventListener("DOMContentLoaded", () => {
  renderIndexNotices();  // index 공지 2개
  renderNoticeList();    // notice 전체 목록
});
