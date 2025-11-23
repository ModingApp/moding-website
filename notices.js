/* =========================================================
   Moding Notices – 공지사항 데이터 & 렌더링 스크립트
   (index.html & notice.html 공통 사용)
   ========================================================= */

const notices = [
  {
    id: 1,
    title: "모딩(Moding) 베타 서비스 오픈 안내",
    date: "2025-01-15",
    tag: "서비스 안내",
    body: `
      식품 제조사와 외식업 사장님을 연결하는 B2B Food-SaaS 플랫폼
      <strong>모딩(Moding)</strong>의 베타 서비스를 시작합니다.<br><br>
      베타 기간 동안 기능이 순차적으로 오픈되며,
      정식 버전 공개 전까지 일부 메뉴가 제한될 수 있습니다.
    `
  },
  {
    id: 2,
    title: "정산 시스템 점검 예정",
    date: "2025-02-01",
    tag: "시스템 점검",
    body: `
      보다 안정적인 서비스를 제공하기 위하여<br>
      <strong>2월 3일(월) 02:00 ~ 04:00</strong> 정산 모듈 점검이 진행됩니다.<br><br>
      해당 시간 동안 정산 화면 접속이 일시적으로 제한됩니다.
    `
  },
  {
    id: 3,
    title: "신규 제조사 입점 기능 추가",
    date: "2025-02-10",
    tag: "업데이트",
    body: `
      신규 제조사가 보다 쉽게 입점할 수 있도록
      <strong>입점 신청 폼 기능</strong>이 추가되었습니다.<br><br>
      제휴·입점 문의 페이지를 통해 확인하시기 바랍니다.
    `
  }
];

/* =========================================================
   index.html – 최신 공지 2개만 출력
   ========================================================= */
function renderIndexNotices() {
  const area = document.getElementById("index-notice-area");
  if (!area) return;

  const latest = notices.slice(0, 2); // 최신 2개만

  area.innerHTML = latest
    .map(
      n => `
      <div class="index-notice-item">
        <div class="index-notice-title">${n.title}</div>
        <div class="index-notice-date">${n.date}</div>
      </div>`
    )
    .join("");
}

/* =========================================================
   notice.html – 전체 공지 + 접힘/펼침 기능
   ========================================================= */
function renderNoticeList() {
  const list = document.getElementById("notice-list");
  if (!list) return;

  list.innerHTML = notices
    .map(
      n => `
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
   페이지 자동 인식 후 렌더링
   ========================================================= */
document.addEventListener("DOMContentLoaded", () => {
  renderIndexNotices();
  renderNoticeList();
});
