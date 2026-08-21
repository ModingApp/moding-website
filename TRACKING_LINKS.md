# 모딩 채널별 추적 링크

외부 채널에는 일반 홈페이지 주소 대신 아래처럼 `src`와 `cid`가 포함된 링크를 사용합니다.
이 링크로 들어온 방문은 관리자 화면에서 **확정 출처**로 분류됩니다.

## 바로 사용할 링크

| 채널 | 위치 | 링크 |
|---|---|---|
| 스레드 | 프로필 | `https://moding.app/?src=threads&cid=threads_profile` |
| 스레드 | 게시물 | `https://moding.app/?src=threads&cid=threads_post` |
| 인스타그램 | 프로필 | `https://moding.app/?src=instagram&cid=instagram_profile` |
| 네이버 블로그 | 본문 | `https://moding.app/?src=naver_blog&cid=naver_blog_post` |
| 네이버 카페 | 게시물 | `https://moding.app/?src=naver_cafe&cid=naver_cafe_post` |
| 카카오톡 | 채널·메시지 | `https://moding.app/?src=kakao&cid=kakao_message` |
| 유튜브 | 설명란 | `https://moding.app/?src=youtube&cid=youtube_description` |
| 전단 | QR | `https://moding.app/?src=leaflet&cid=leaflet_01` |

앱 다운로드 화면으로 바로 연결하려면 도메인 뒤 경로만 바꿉니다.

`https://moding.app/download.html?src=threads&cid=threads_profile_download`

## 운영 규칙

1. `src`는 채널명을 나타내며 같은 채널에서는 동일하게 유지합니다.
2. `cid`는 링크가 놓인 위치마다 다르게 지정합니다.
3. 영문 소문자, 숫자, 밑줄, 하이픈만 사용합니다.
4. 링크를 단축할 때도 최종 주소의 `src`와 `cid`가 보존되는지 확인합니다.
5. 과거의 미확인 방문은 근거가 없으므로 소급하여 특정 채널로 바꾸지 않습니다.

## 판정 기준

- **확정**: `src`·`utm_source` 태그 또는 외부 리퍼러가 확인된 방문
- **추정**: 30일 이내 저장된 이전 유입 또는 인앱 브라우저 정보로 추정한 방문
- **미확인**: 브라우저가 출처 근거를 보내지 않은 방문
