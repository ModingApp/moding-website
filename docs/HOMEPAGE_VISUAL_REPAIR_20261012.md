# 홈페이지 화면 규격 수정 매핑 · 2026-10-12

기준 운영 커밋: `0afc32fa32770ab7af8dddae2e08ae2cae0d3ae6` (PR #23).
대표 승인: 전체 화면 검수에서 확인한 항목을 최종 매핑하고 수정·맥 검수·운영 배포.

| 확인한 문제 | 수정 위치 | 완료 판정 |
| --- | --- | --- |
| 모바일 고정 문의 버튼의 로고·문자 비율 | site-presentation.css | 원형 PC 64 / 좁은 화면 60, 로고 26 / 24, 글자 12px·700, 중앙 정렬 |
| 흰색 메뉴 닫기, 페이지별 메뉴 규격 차이 | site-presentation.css | 초록색 닫기, 44px 조작 영역, 같은 메뉴 배치와 글꼴 |
| 공지·오시는 길·약관·개인정보의 중복 헤더 | notice/location/terms/privacy.html, site-presentation.css | 헤더 한 개, 로고와 메뉴가 같은 행, 본문은 헤더 아래 |
| 회사정보 9px 축소와 고정 문의 버튼의 가림 | 공개 HTML footer-company, site-roles.js, site-presentation.css/js | 회사정보 12px, 보이는 푸터 높이만큼 고정 버튼을 올려 문구와 링크를 가리지 않음 |
| FAQ 다운로드 규격 누락 | faq.html, site-presentation.css | 공통 다운로드 66 / 62px, 기존 /download.html 분기 |
| 입점 문의·판매자센터·안내서 크기 차이 | site-roles.js, site-presentation.css | 일반 행동 버튼 54px·15px·700, 상담 로고 26px |
| 한진 카드가 모바일 오른쪽에서 잘림 | site-presentation.css | 카드와 그림이 가용 폭 안에 표시됨, 제휴 링크 보존 |
| 문구 끝 한 글자 줄바꿈·고정 이동 버튼 겹침 | site-presentation.css/js, site-roles.js, site-navigation.js | 강조 구절 묶음, 콘텐츠 하단 안전 공간, 긴 장면 전체 읽기, 보이는 푸터 위에 화살표 배치 |
| 낮은 창에서 다운로드 카드가 고정 헤더에 가림 | site-presentation.css | 헤더 높이와 하단 문의 버튼 공간을 반영한 본문 여백 |
| 상담 뒤로·닫기·첨부 조작 영역 | homepage-consultation.css | 모바일 최소 44px, 기존 상담 흐름 보존 |

## 보존 범위

- 7종 애니메이션 파일과 문구, 진입·새로고침 무작위 선택, 박스→식당 연출.
- 메뉴 URL, 화면 단위 스크롤·좌우 스와이프·화살표·뒤로가기.
- 한진 `https://hanjinoneclick.co.kr/member-regist?affliateCode=moding`.
- 홈페이지 비회원 상담 계약, 다운로드 OS 판정과 추적.
- 공개 본문·법적 고지·canonical·JSON-LD·robots·검색 제목. 사이트맵 변경일만 실제 변경 일자로 갱신.
- API·어드민·앱 저장소는 변경하지 않음.

## 검수

1. `node --test test/*.test.mjs`.
2. Mac Chrome·WebKit: `test/browser-presentation.mjs`로 11개 페이지의 헤더·메뉴·본문·푸터·버튼·안쪽 장면을 검사하고 화면 확인.
3. `test/browser-navigation.mjs`로 원래의 휠·스와이프·화살표·상담·FAQ·다운로드 링크 회귀검사.
4. 운영 배포 성공과 실제 제공 파일 확인 후 운영 화면 재검사.
5. 모바일 폭 검수와 실물 모바일 기기 검수를 구분해서 기록. 프로덕션 문의 메시지는 만들지 않음.

## 배포 전 확인 결과

- 기존 Node 회귀검사 25개 통과.
- Mac Chrome·WebKit, 1440×900 / 1280×720 / 390×844 / 320×720 / 840×960 / 960×540: 132개 페이지 조합, 안쪽 장면 312회, 메인 7종 84회 통과. 브라우저 오류와 상담 쓰기 요청 0건.
- 이동 검수: 같은 132개 페이지 조합, 양방향 이동 20회, 링크 211건 검사 통과. 휠·화살표·터치·뒤로가기·메뉴·FAQ·문의 열기/닫기·심볼 및 당겨 새로고침 포함. Chrome 터치는 브라우저 입력, WebKit 터치는 DOM 이벤트로 검사.
- 최종 푸터 중앙 정렬 보정 후 두 엔진의 PC·모바일 44개 페이지 조합, 안쪽 장면 104회, 메인 28회 재검사 통과. 대표 화면 캡처로 문의 버튼 비율·메뉴 대비·헤더·카드·하단 정렬 확인.
- 한진 제휴 / 판매자센터 / Play Store / App Store 주소 HTTP 200 확인.
- 11개 HTML head, 약관·개인정보 본문, 7종 장면·박스 연출·상담·다운로드·추적 코드와 robots는 기준 운영본과 대조하여 보존 확인.
- 실제 iPhone·Android·폴더블 기기 조작 검수는 이번 결과에 포함하지 않음. 운영 배포 성공 및 실제 제공 파일 확인은 배포 후 별도로 기록.

## 가독성 적용 및 맥 검수 · 2026-10-12

본문 18/16px, 보조 15/14px, 주요 문의·다운로드 외형 및 문구 중심, 저높이 숨김 제거, 서비스 프레임/격자 역할 분리, 메인 7종 표시 비율, 문서·독립 웹 도구의 읽기 규격을 적용했습니다. 좁거나 낮은 창은 조작 영역과 읽기 영역을 분리합니다. 인증·신청·상담 API와 원본 7종 자산은 변경하지 않았습니다.

맥 자동 검수 결과: `{"staticTests":25,"chrome":{"pages":110,"scenes":260,"heroes":70},"webkit":{"pages":55,"scenes":130,"heroes":35},"tools":24,"navigation":{"layouts":132,"moves":20,"links":210},"errors":0,"realMessagesSent":0,"productionUpdated":false}`. WebKit의 터치 이동은 DOM 이벤트 검수이며 실제 iPhone/Android 앱 실기기 검수가 아닙니다. 실제 상담·신청 전송은 실행하지 않았습니다. 운영 반영은 별도로 Pages 빌드 커밋과 실제 응답을 확인합니다.
