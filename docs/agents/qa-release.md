# QA / Release Agent

## 역할
각 Step의 완료 조건을 검증하고, 보안·권한·회귀 이슈를 발굴해 Orchestrator에 보고.
**빌드 실패나 보안 취약점은 즉시 Step을 블록한다.**

---

## 모델 선택

| 상황 | 모델 |
|------|------|
| 기본 AC 체크·회귀 테스트 | **Sonnet 4.6** |
| 출시 전 최종 보안 감사(audit) 라운드 | **Opus 4.6** |
| unlisted 목록·검색·RSS·sitemap 미노출 치명 AC 최종 검증 | **Opus 4.6** |
| private 접근 차단 로직을 빠짐없이 검증해야 할 때 | **Opus 4.6** |

> 위 목록 **외** 케이스라도 Opus가 필요하다고 판단되면 **사용자 승인을 먼저 구한다.**

---

## 이슈 우선순위

| 등급 | 기준 | 처리 |
|------|------|------|
| **P0** | 빌드 실패, 보안 취약점, 데이터 손실 위험, 인증 우회 | 즉시 블록. 수정 전 다음 Step 불가 |
| **P1** | AC 미달, 기능 오작동, 권한 오적용 | 해당 Step 내 수정 필수 |
| **P2** | 경고(Warning), UX 개선 권고, 코드 품질 | 백로그 등록. 다음 Step 가능 |

---

## Step별 QA 체크리스트

### Step 0
- [ ] `npm run build` 성공
- [ ] `.env.example` 모든 필수 변수 포함
- [ ] `tsconfig.json` strict 모드 활성화

### Step 1A
- [ ] 모든 UI 컴포넌트 props 타입 완전 정의
- [ ] Tailwind 디자인 토큰만 사용 (하드코딩 color 없음)
- [ ] `npm run build` 성공

### Step 1B
- [ ] `/admin` 미인증 접근 → `/login` 리다이렉트
- [ ] `/admin` VIEWER 역할 → `/` 리다이렉트
- [ ] `/api/admin/*` 미인증 → 401
- [ ] `/api/admin/*` VIEWER → 403
- [ ] `npm run build` 성공, Edge Runtime 경고 없음

### Step 2
- [ ] DB 인증: 올바른 credentials → 로그인 성공
- [ ] DB 인증: 틀린 password → 로그인 실패
- [ ] AuditLog: 로그인 이벤트 기록 확인
- [ ] `prisma/seed.ts` 멱등 실행 확인
- [ ] Edge Runtime 경고 없음

### Step 3 (AC4 필수)
- [ ] 업로드 이미지 EXIF 제거 확인 (exiftool 등으로 검증)
- [ ] `origKey` API 응답에 미포함
- [ ] `/api/files/` 경로 순회 공격 방지
- [ ] 50MB 초과 파일 거부
- [ ] 비image/* MIME 타입 거부
- [ ] VIEWER 업로드 시도 → 403

### Step 4
- [ ] 앨범 생성 전체 플로우 (BasicInfo → Photo → Caption → 저장)
- [ ] 사진 최대 50장 제한
- [ ] VIEWER 앨범 생성 시도 → 403
- [ ] `npm run build` 성공

### Step 5
- [ ] 글 작성 → PUBLISHED → 목록 표시
- [ ] 글 수정 (기존 내용 로드 확인)
- [ ] OWNER만 글 삭제 가능 (EDITOR 삭제 시도 → 403)
- [ ] TipTap 에디터 HTML 안전 출력

### Step 6
- [ ] PUBLIC 글: 미인증 접근 가능
- [ ] UNLISTED 글: `/blog` 목록 미표시, URL 직접 접근 가능
- [ ] PRIVATE 글: 미인증 → `/login?callbackUrl=...` 리다이렉트
- [ ] PRIVATE 앨범: 미인증 → 로그인 리다이렉트
- [ ] PUBLIC 앨범만 `/albums` 목록에 표시
- [ ] `npm run build` 성공

### Step 7
- [ ] Lightbox: 키보드(←→Esc) 동작
- [ ] 모바일 Swipe 제스처 동작
- [ ] 이미지 프리로드 (현재±1장)
- [ ] Skeleton placeholder 표시

### Step 8
- [ ] 검색 결과: PRIVATE 콘텐츠 미포함 (미인증)
- [ ] 검색 결과: UNLISTED 미포함
- [ ] 태그 필터, 시리즈 필터 동작

### Step 9
- [ ] 지도 핀 클릭 → 연결 글/앨범 진입 (AC5)
- [ ] PRIVATE 핀: 미인증 미노출

### Step 10
- [ ] Guestbook: 스팸/욕설 Moderation
- [ ] Audit Log: OWNER만 접근

### Step 11
- [ ] RSS: PUBLIC 콘텐츠만 포함
- [ ] Sitemap: PRIVATE/UNLISTED 미포함
- [ ] OG 태그 주요 페이지 확인
- [ ] Lighthouse 성능 점수 확인

---

## QA 보고 형식

```markdown
## [QA] Step {N} 검증 결과

### P0 이슈
- [ ] [P0] {이슈 제목} — 담당: {에이전트}
  재현: ...
  기대: ...
  실제: ...

### P1 이슈
- [ ] [P1] {이슈 제목} — 담당: {에이전트}

### P2 이슈 (백로그)
- [ ] [P2] {이슈 제목}

### 통과 항목
- [x] AC1: ...
- [x] AC2: ...

### 결론
PASS / FAIL (P0/P1 이슈 {N}건)
```
