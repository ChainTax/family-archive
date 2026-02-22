# 재린월드 — CLAUDE.md

> 이 파일은 Claude Code가 세션 시작 시 자동으로 읽습니다.
> 새 기능 구현 전 반드시 "빌드 스텝 현황"을 확인하세요.

---

## 제품 개요

**재린월드** — 가족의 글·사진·여행 기록을 남기는 플랫폼.
공개/링크공유/가족전용 권한을 안전하게 관리하고, 관리자 페이지에서 모바일로도 쉽게 업로드할 수 있다.

> 이전 코드명: FamilyArchive

---

## 기술 스택

| 레이어 | 선택 |
|---|---|
| Framework | Next.js 15 (App Router) + TypeScript strict |
| Styling | Tailwind CSS v3 (커스텀 Warm 디자인 토큰) |
| Font | Noto Sans KR (Google Fonts, `@import` in globals.css) |
| Auth | NextAuth v5 beta (`next-auth@beta`) |
| DB | PostgreSQL + Prisma 7.4.1 |
| Image | Sharp (서버사이드) |
| Storage | S3-compatible (개발: 로컬 파일시스템, 운영: Cloudflare R2) |
| Map | Leaflet + OpenStreetMap |
| Search | PostgreSQL FTS + pg_trgm |
| Deploy | Vercel (GitHub 자동 배포) |

---

## 디자인 토큰 (Warm Palette)

```
Brand:          #CC7A4A   (따뜻한 테라코타)
Brand Hover:    #B5622E
BG Primary:     #FAFAF8   (따뜻한 오프화이트)
BG Secondary:   #F2F0E8
Text Primary:   #1C1B18
Text Secondary: #5C5850
Text Tertiary:  #9C9890
Border Default: #E5E0D8
Border Strong:  #CFC9BF
```

CSS 변수는 `app/globals.css`에 정의됨.
Tailwind 토큰은 `tailwind.config.ts`에 정의됨 (`bg-brand`, `text-text-primary` 등).

---

## 권한 모델

| Role | 권한 |
|---|---|
| `OWNER` | 전권 |
| `EDITOR` | 글/앨범/핀 작성·수정 |
| `VIEWER` | private 콘텐츠 열람만 |

## 공개범위 규칙 (AC2, AC3 핵심)

| Visibility | 동작 |
|---|---|
| `PUBLIC` | 검색·목록·사이트맵·RSS 포함 |
| `UNLISTED` | URL 직접 접근만. 목록·검색·사이트맵·RSS **제외** |
| `PRIVATE` | 로그인(VIEWER 이상) 필수. 미인증 → 로그인 리다이렉트 |

> **AC4**: GPS EXIF 제거된 파생 이미지만 공개 경로 노출. 원본은 private 버킷에만.

---

## Prisma 7 주의사항 (중요)

### datasource 설정 변경

Prisma 7부터 `schema.prisma`의 datasource에 `url` 속성이 제거됨.

```prisma
// ✅ 올바른 방식 (Prisma 7)
datasource db {
  provider = "postgresql"
}

// ❌ 틀린 방식 (Prisma 6 이하)
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

- `prisma.config.ts`: schema 경로 + connectionString 지정
- `lib/prisma.ts`: `PrismaPg` 어댑터에 connectionString + SSL 옵션 주입
- migrate 실행 시 `DATABASE_URL` 환경변수 필요

### enum 타입 export 변경

Prisma 7에서 `@prisma/client`가 enum(`Visibility`, `PostStatus`)과 `Prisma` 네임스페이스를 **export하지 않음**.

```typescript
// ❌ Prisma 7에서 동작하지 않음
import { Visibility, Prisma } from "@prisma/client";

// ✅ 로컬 타입으로 직접 정의
type Visibility = "PUBLIC" | "UNLISTED" | "PRIVATE";
type PostStatus = "DRAFT" | "SCHEDULED" | "PUBLISHED";

// lib/audit.ts의 JsonValue: null 제외 (Prisma JSON input 호환)
type JsonValue = string | number | boolean | JsonValue[] | { [key: string]: JsonValue };
```

### Vercel 서버리스 SSL 연결

`@prisma/adapter-pg`의 SSL 연결 문제 방지를 위해 `lib/prisma.ts`에서:
```typescript
ssl: connectionString.includes("localhost") ? undefined : { rejectUnauthorized: false }
```
로컬호스트가 아닌 환경(Vercel)에서는 `rejectUnauthorized: false`로 연결.

---

## 라우트 가드

`middleware.ts`가 아래 경로를 보호함:

- `/admin/*` → 미인증: `/login` 리다이렉트, VIEWER: `/` 리다이렉트
- `/api/admin/*` → 미인증: 401, VIEWER: 403

---

## 에이전트 팀 (docs/agents/ 참고)

> 상세 역할·책임: `docs/agents/README.md`

### 에이전트 구성

| 에이전트 | 파일 | 주요 역할 |
|----------|------|-----------|
| Orchestrator | `docs/agents/orchestrator.md` | Step 목표·AC·티켓 분배·완료 승인 |
| Frontend | `docs/agents/frontend.md` | 화면·컴포넌트·디자인 시스템 |
| Backend | `docs/agents/backend.md` | 인증·권한·API·비즈니스 로직 |
| Media Pipeline | `docs/agents/media-pipeline.md` | 이미지·EXIF·썸네일·스토리지 |
| Data/DB | `docs/agents/data-db.md` | 스키마·마이그레이션·쿼리 |
| QA/Release | `docs/agents/qa-release.md` | AC 검증·이슈 등록·보안 체크 |
| DevOps | `docs/agents/devops.md` | 배포·인프라 |

### 이슈 등급
- **P0**: 빌드 실패·보안·인증 우회 → 즉시 블록
- **P1**: AC 미달·기능 오작동 → Step 내 필수 수정
- **P2**: Warning·권고사항 → 백로그, 다음 Step 가능

### 모델 선택 정책
- **기본: Sonnet 4.6** — 모든 에이전트 기본
- **Opus 4.6 전환** (에이전트별 조건, 상세는 `docs/agents/README.md` 참고)
- **승인 원칙**: 위 목록 외 상황에서 Opus 전환 필요 시 **사용자 승인을 먼저 구한다**

---

## 빌드 스텝 현황

### ✅ 완료

- **Step 0**: Next.js 초기화, `docs/`, `.env.example`, Tailwind, tsconfig
- **Step 1A**: 디자인 시스템 — Button/Card/Badge/Chip/Input/Modal + `lib/cn.ts`
- **Step 1B**: Prisma 전체 스키마, NextAuth v5 hardcoded credentials, middleware, 로그인 페이지, Admin 레이아웃
- **Step 2**: Prisma DB 인증 + bcryptjs 검증, `auth.config.ts` 분리(Edge-safe), `lib/audit.ts`, `prisma/seed.ts`
- **Step 3**: Media 파이프라인 — `lib/media.ts`(Sharp EXIF 제거+WebP), `lib/storage.ts`(Local+S3/R2), `app/api/admin/upload/`, `app/api/files/[...path]/`
- **Step 4**: Admin Albums 3-step 마법사 — 앨범 목록, BasicInfoStep, PhotoUploadStep, CaptionOrderStep, `app/api/admin/albums/`
- **Step 5**: Admin Posts 에디터 — TipTap 리치 에디터, 글 목록/작성/수정, `app/api/admin/posts/`, `components/editor/`
- **Step 6**: Public 페이지 — `app/(public)/layout.tsx`, `/blog`, `/blog/[slug]`, `/albums`, `/albums/[slug]`, Visibility 규칙(PRIVATE→로그인 리다이렉트, UNLISTED→링크만)
- **Step 7**: 갤러리 UX — `components/gallery/Lightbox.tsx`(키보드·스와이프·프리로드·블러플레이스홀더), `components/gallery/PhotoGrid.tsx`, 앨범 상세 연결
- **Step 8**: Search + Tags/Series + Archive — `/search`, `/tags/[name]`, `/series/[name]`, `/archive`, 헤더 검색 아이콘, Tag/Series 링크 연결
- **Step 9**: Map + Pin Editor — Leaflet 지도, `components/map/`, `/admin/map`(분할 패널), `/map`(공개), `/api/admin/places`, `/api/public/places`, AC5 완료
- **Step 10**: Milestones + Guestbook + Moderation + Audit Log UI — `GuestbookEntry` 스키마 추가, `/admin/milestones`(CRUD 모달), `/admin/guestbook`(승인·삭제), `/guestbook`(공개 폼+목록), `/admin/audit`(OWNER only 페이지네이션), Dashboard 실통계
- **Step 11**: RSS·Sitemap·OG + 성능 폴리싱 — `/rss.xml`(RSS 2.0·PUBLIC only), `/sitemap.xml`(PUBLIC 포스트·앨범), `/robots.txt`, Root layout metadataBase+OG+Twitter, 커스텀 404, 보안 headers, `/api/files/*` 캐시 1년, 공개 목록 ISR(60s/300s)
- **Step 12**: Vercel 배포 + 배포 후 수정 (아래 상세 참고)
- **Step 13**: UI 폴리싱 + 마일스톤 공개 페이지 (아래 상세 참고)
- **Step 14**: 성장기록 기능 + 로고 추가 (아래 상세 참고)
- **Step 15**: 다크모드 + 홈 UX 개편 + 앨범 뷰어 고급화 (아래 상세 참고)
- **Step 16**: 최종 감사 — 디렉토리·코드·보안 점검 및 수정 (아래 상세 참고)

### Step 12 상세 — 배포 및 배포 후 수정

**Vercel 배포 설정**
- GitHub 자동 배포 (main 브랜치 push → 자동 트리거)
- 빌드 명령: `prisma generate && next build` (package.json에 반영)
- 환경변수: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `STORAGE_PROVIDER` 등

**Prisma 7 호환 수정 (빌드 오류 해결)**
- `Visibility`, `PostStatus` enum: `@prisma/client` export 제거 → 파일별 로컬 type 정의
- `Prisma` 네임스페이스: `lib/audit.ts`에서 로컬 `JsonValue` 타입으로 교체 (null 제외)
- implicit any 오류: `audit/page.tsx`, `posts/[id]/route.ts`, `posts/route.ts`, `sitemap.ts`, `rss.xml/route.ts` 각각 명시적 타입 추가
- `outputFileTracingRoot` 제거: Vercel에서 경로 이중화(`/vercel/path0/vercel/path0/`) 발생 → `next.config.ts`에서 삭제

**리브랜딩: FamilyArchive → 재린월드**
- 사이트명, 로그인 페이지, 헤더/푸터, 메타데이터 전부 `재린월드`로 변경

**홈페이지 개편 (`app/page.tsx`)**
- 섹션명: "기록" / "앨범" / "마일스톤"
- 최근 게시글 3개 (PUBLIC + PUBLISHED, 3열 그리드) — 커버 `object-contain` (잘림 방지)
- 최근 앨범 4개 (PUBLIC, 4열 그리드) — 업로드 날짜(`createdAt`) 표시
- 최근 마일스톤 4개 (PUBLIC, 리스트)
- `revalidate = 300` (ISR 5분)

**공개 레이아웃 개편 (`app/(public)/layout.tsx`)**
- 메뉴: 기록(블로그), 앨범, 마일스톤, 검색 아이콘 — 발자취·방명록·아카이브 제거
- 비로그인 상태: 로그인 탭 제거 (홈화면에서 로그인 가능)
- 로그인 상태: 관리자 링크만 표시
- `max-w-6xl`, `h-16`, 데스크탑 `gap-6/text-base` · 모바일 `gap-3/text-sm` 네비게이션

**디자인 시스템 변경**
- 색상: Toss 블루 → Warm 팔레트 (`#CC7A4A`, `#FAFAF8`, `#F2F0E8` 등)
- 폰트: `Noto Sans KR` (Google Fonts `@import` in `app/globals.css`)
- `tailwind.config.ts` 토큰 전면 교체

**블로그 상세 페이지 수정**
- `findUnique` → `findFirst({ where: { slug } })`로 변경 (Prisma 7 안전한 방식)
- `status` 조건을 `where`에서 제거 → `select`에 포함 후 별도 체크

**DB 연결 안정화 (`lib/prisma.ts`)**
- `DATABASE_URL` 미설정 시 명시적 에러 throw
- Vercel 서버리스 SSL 연결 문제 방지: `ssl: { rejectUnauthorized: false }` (로컬 제외)

**상세 페이지 에러 핸들링**
- `blog/[slug]`, `albums/[slug]`: `export const dynamic = "force-dynamic"` 추가
- DB 에러 rethrow (조용한 404 대신 500으로 실제 오류 노출)
- `notFound()` 전 `console.warn` 추가 (Vercel 로그 디버깅)

### Step 13 상세 — UI 폴리싱 + 마일스톤 공개 페이지

**내비게이션 개편 (`app/(public)/layout.tsx`)**
- 발자취 메뉴 제거, 마일스톤(`/milestones`) 메뉴 추가
- 모바일 반응형: `gap-3 sm:gap-6`, `text-sm sm:text-base` (작은 화면 오버플로우 방지)

**홈페이지 수정 (`app/page.tsx`)**
- 섹션명 "최근 기록" → "기록"
- 블로그 카드 커버 이미지: `object-cover` → `object-contain` + `bg-bg-secondary` (잘림 방지)
- 앨범 카드: `createdAt` 조회 추가 및 날짜 표시

**앨범 목록 수정 (`app/(public)/albums/page.tsx`)**
- `max-w-5xl` → `max-w-6xl` (헤더 로고와 좌측 정렬 통일)
- `createdAt` 날짜 표시 추가 (업로드 날짜)
- 메타데이터 "FamilyArchive" → "재린월드"

**앨범 상세 수정 (`app/(public)/albums/[slug]/page.tsx`)**
- `max-w-5xl` → `max-w-6xl` (정렬 통일)

**블로그 상세 수정 (`app/(public)/blog/[slug]/page.tsx`)**
- 커버 이미지: `object-cover` → `object-contain` (잘림 방지)

**검색 페이지 수정 (`app/(public)/search/page.tsx`)**
- 메타데이터 "FamilyArchive" → "재린월드"
- 검색 폼 `flex-row` 명시 + 버튼 `shrink-0` (모바일 가로 정렬 보장)

**마일스톤 공개 페이지 신규 생성 (`app/(public)/milestones/page.tsx`)**
- PUBLIC 마일스톤 목록 (날짜 내림차순)
- 유형별 색상 배지 (BIRTHDAY=핑크, ANNIVERSARY=퍼플, GROWTH=그린, FIRST_EXPERIENCE=블루, OTHER=브랜드)
- `revalidate = 60` (ISR 1분)

### Step 14 상세 — 성장기록 기능

**DB 모델 추가 (`prisma/schema.prisma`)**
- `GrowthRecord` 모델: date, height(Float?), weight(Float?), label(String?), visibility, createdAt, updatedAt
- `prisma db push`로 Neon DB에 반영

**관리자 CRUD (`app/admin/growth/page.tsx`)**
- 날짜별 키·몸무게 목록 (최신순)
- 모달로 추가/수정/삭제
- 공개범위 선택 (PRIVATE·UNLISTED·PUBLIC), 메모(label) 입력

**관리자 API**
- `app/api/admin/growth/route.ts`: GET (전체 목록) + POST (생성)
- `app/api/admin/growth/[id]/route.ts`: PATCH + DELETE (감사 로그 포함)

**공개 API (`app/api/public/growth/route.ts`)**
- 로그인 상태: 전체 기록 반환
- 비로그인: PUBLIC 기록만 반환

**인터랙티브 차트 (`components/growth/GrowthChart.tsx`)**
- 자연 3차 스플라인(Natural Cubic Spline) 보간 알고리즘 직접 구현
- 3일 간격 밀집 포인트 사전 생성 → Recharts `type="linear"` 라인으로 부드러운 곡선 표현
- 키/몸무게 탭 전환 시 `key={animKey}` re-mount로 차트 재애니메이션
- 실측값 점만 `ActualDot` 컴포넌트로 강조 표시 (dot 콜백: `Record<string, unknown>` 타입)
- 커스텀 툴팁: 날짜·값·실측 여부 표시
- 색상: 키 `#CC7A4A` (brand), 몸무게 `#7A8ECC`
- ReferenceLine 제거 (텍스트가 Y축 숫자에 가려지는 문제 → 완전 삭제)

**공개 성장기록 페이지 (`app/(public)/growth/page.tsx`)**
- 최근 키·몸무게 카드 (상단)
- 인터랙티브 곡선 차트
- 비로그인 + PUBLIC 기록 없음 → 로그인 리다이렉트
- 측정기록 목록 표 없음 (차트만 표시)

**내비게이션 추가**
- 공개 nav: "성장" 링크 (`/growth`)
- 관리자 사이드바: "성장기록" 링크 (`/admin/growth`)
- `lib/audit.ts`: `AuditEntityType`에 `GrowthRecord` 추가

**사이트 로고 (`public/logo.png`)**
- 새싹 아이콘 PNG (투명 배경)
- 공개 헤더 "재린월드" 왼쪽에 `w-7 h-7` 크기로 표시 (`app/(public)/layout.tsx`)
- 관리자 사이드바 "재린월드" 왼쪽에 `w-5 h-5` 크기로 표시 (`app/admin/layout.tsx`)

### Step 15 상세 — 다크모드 + 홈 UX 개편 + 앨범 뷰어 고급화

**다크모드 (`app/globals.css`, `tailwind.config.ts`, `components/ui/ThemeToggle.tsx`)**
- Claude 다크 팔레트 기반 따뜻한 다크 테마 (BG `#1C1A17`, Text `#EDE9E3`)
- CSS 변수 RGB 채널 포맷 (`--color-brand-rgb: 204 122 74`) → Tailwind opacity 수식어 지원
- `[data-theme="dark"]` selector 방식 (`tailwind.config.ts: darkMode: ['selector', ...]`)
- FOUC 방지: `app/layout.tsx` `<head>`에 인라인 스크립트로 초기 테마 즉시 적용
- `[data-theme="dark"] .bg-white` 전역 오버라이드 (`!important`)
- ThemeToggle 컴포넌트 (`components/ui/ThemeToggle.tsx`): sun/moon 아이콘, localStorage 저장
- **토글 위치: 홈페이지 우상단 고정만 유지** (공개 네비·어드민 사이드바에서 제거 — 모바일 오버플로우 방지)

**홈페이지 UX 개편 (`app/page.tsx`)**
- 블로그 카드: 앨범과 동일 포맷 (grid-cols-2 md:grid-cols-4, aspect-square, 하단 bg-bg-secondary)
- 발췌문(excerpt) 제거, 사진 장수 표시 제거
- 헤더 제거 (ThemeToggle 우상단 고정으로 대체)

**블로그 목록 모바일 수정 (`app/(public)/blog/page.tsx`)**
- 커버 이미지: `hidden sm:block` → 모바일에서도 풀 너비 표시
- 레이아웃: `flex → flex flex-col sm:flex-row`

**Admin 대시보드 수정 (`app/admin/page.tsx`)**
- "미승인 방명록" 통계 제거 → "성장기록 수" (`prisma.growthRecord.count()`)로 교체

**글 에디터 기능 추가 (`components/editor/RichEditor.tsx`)**
- 폰트 선택 드롭다운: 기본 / 명조(Georgia) / 고딕(Apple SD Gothic Neo) / 타자기(Courier New)
- 이미지 삽입: `/api/admin/upload` POST로 업로드, 글 너비에 맞게 자동 조절
- `@tiptap/extension-image`, `@tiptap/extension-text-style`, `@tiptap/extension-font-family` 추가

**revalidatePath 일괄 추가 (ISR 캐시 즉시 반영)**
- `app/api/admin/posts/route.ts` + `[id]/route.ts`: PUBLISHED 글 변경 시 `"/"`, `"/blog"`, `"/blog/[slug]"` 무효화
- `app/api/admin/milestones/route.ts` + `[id]/route.ts`: PUBLIC 마일스톤 변경 시 `"/"`, `"/milestones"` 무효화
- `app/api/admin/albums/route.ts` + `[id]/route.ts`: PUBLIC 앨범 변경 시 `"/"`, `"/albums"`, `"/albums/[slug]"` 무효화

**로고 파일 교체 및 크롭**
- `public/logo.png`: 새 투명 배경 PNG로 교체 (677×369 → Sharp로 좌측 여백 제거 → 327×332px)
- 모든 img src에 `?v=3` 캐시버스팅 적용

**앨범 뷰어 고급화 — 1단계 (`components/gallery/Lightbox.tsx`)**
- 진입/퇴장: 배경 + 이미지 페이드 (opacity 0→1, 0.25s)
- 사진 전환: scale(0.96)→scale(1) + opacity 페이드 (0.28s/0.32s cubic-bezier)
- 터치 드래그 실시간 피드백: 손가락에 이미지 딱 붙음, 양 끝 rubber-band(20%) 저항
- 캡션 펼치기/접기: 52자 초과 시 line-clamp-1 + "더 보기 ↓" 버튼
- 썸네일 스트립: 하단 수평 스크롤, 활성 항목 ring-2+scale-110, 이동 시 자동 scroll-into-view
- 프리로드 ±1 → ±2장 확장
- `.lb-thumb-strip::-webkit-scrollbar { display: none }` in globals.css

**앨범 뷰어 고급화 — 2·3단계 (줌·스와이프·팬)**
- **제스처 상태머신**: idle → swipe / pan / pinch (절대 충돌 없음)
- **스와이프**: 8px 수평 감지, 세로 12px 우선 시 무시, 22% 임계값, rubber-band 저항
- **핀치줌(모바일)**: 두 손가락 1~5배, 1.08배 미만 스냅리셋, 한 손가락 떼면 팬 전환
- **더블탭(모바일)**: 300ms/40px 이내 → 2.5배 클릭 위치 기준 확대 or 리셋
- **더블클릭(데스크톱)**: 클릭 지점 기준 2.5배 확대 (`pan = clickX * (1-newScale)`) or 리셋
- **휠줌(데스크톱)**: native listener (passive:false), 커서 위치 기준 ×1.12 스텝
  - 버그 수정: `useEffect(fn, [])` → `[mounted, clampPan]` (mounted=false 시 ref=null 문제)
- **팬(pan)**: 터치 단일 손가락 + 마우스 드래그 모두 지원, naturalWidth 기반 경계 클램프
  - 마우스 팬: `document.addEventListener("mousemove/mouseup")` 전역 리스너 (요소 밖 이탈 대응)
  - stale closure 방지: `scaleRef`, `panXRef`, `panYRef` mirror refs
- 줌 상태 UI: 좌우 버튼·썸네일·캡션 숨김, "원래 크기" 버튼 표시, 커서 grab/grabbing
- `touch-action: none` on imageArea (브라우저 기본 핀치줌·스크롤 차단)

**관리자 비밀번호 변경 방법**
```bash
SEED_ADMIN_PASSWORD="새비밀번호" npx tsx prisma/seed.ts
```
(upsert로 기존 계정 비밀번호 즉시 교체, bcrypt hash 12라운드)

---

### Step 16 상세 — 최종 감사 (디렉토리·코드·보안)

에이전트 팀 3팀 병렬 감사 + 수정 적용. 기능 변경 없음.

**감사 결과 요약**

| 영역 | 결과 |
|---|---|
| 디렉토리 구조 | ✅ 전 항목 이상 없음 (Next.js 15 컨벤션 완벽 준수) |
| `.env.local` git 이력 | ✅ 커밋된 적 없음 (안전) |
| SQL Injection | ✅ Prisma ORM, raw query 미사용 |
| CSRF | ✅ NextAuth v5 JWT 자동 보호 |
| 파일 업로드 | ✅ MIME·크기 검증, UUID 파일명, path traversal 방어 |
| EXIF/GPS | ✅ Sharp WebP 변환 시 메타데이터 완전 제거 |
| Audit Log | ✅ 모든 민감 액션 로깅됨 |
| Rate Limiting | ⏸️ 미구현 (P1 — Upstash 연동 필요, 향후 과제) |

**적용된 수정 사항**

1. **XSS 방어 (HIGH)** — `sanitize-html` 도입
   - `lib/sanitize.ts` 생성 — TipTap 출력 화이트리스트 정제 (script/iframe/on* 차단)
   - `app/(public)/blog/[slug]/page.tsx` — `dangerouslySetInnerHTML` 전 `sanitizePostContent()` 적용
   - 외부 링크 자동 `rel="noopener noreferrer"` + `target="_blank"` 추가

2. **CSP 헤더 추가 (LOW→완료)** — `next.config.ts`
   - `Content-Security-Policy` 헤더 추가
   - `object-src 'none'` (플러그인 완전 차단)
   - `frame-ancestors 'none'` (X-Frame-Options와 이중 보호)
   - Google Fonts, R2 이미지 허용 범위 명시

3. **DB 쿼리 최적화** — API GET 라우트
   - `app/api/admin/posts/route.ts` — `include: { tags: true }` → 명시적 `select` (불필요 필드 제거)
   - `app/api/admin/albums/route.ts` — `include: { _count }` → 명시적 `select` (불필요 필드 제거)

4. **Lightbox useEffect 최적화** — `components/gallery/Lightbox.tsx`
   - `scaleRef`, `panXRef`, `panYRef` 동기화 3개 별도 effect → 1개 통합 effect

**미적용 항목 (향후 과제)**
- Rate Limiting: Upstash Redis 연동 필요 (로그인/방명록/업로드 API)
- Auth 헬퍼 공통화: 13개+ 라우트 수정 필요 (기능 검증 필요로 보류)

---

## 주요 파일 위치

```
CLAUDE.md                           이 파일
docs/agents/README.md               에이전트 팀 가이드
.env.example                        환경변수 템플릿
.env.local                          로컬 개발용 (git 제외)

prisma/schema.prisma                전체 DB 스키마
prisma.config.ts                    Prisma 7 설정
lib/prisma.ts                       PrismaClient (PrismaPg 어댑터 + SSL)
lib/audit.ts                        AuditLog 헬퍼 (로컬 JsonValue 타입)
lib/media.ts                        Sharp 이미지 처리 (EXIF 제거+WebP+썸네일)
lib/storage.ts                      스토리지 어댑터 (local | s3 | r2)
lib/sanitize.ts                     HTML 정제 (sanitize-html, XSS 방어)
prisma/seed.ts                      관리자 계정 초기 시드

auth.config.ts                      Edge-safe 공통 설정 (JWT callbacks, pages)
auth.ts                             NextAuth v5 풀 설정 (Credentials + Prisma + bcrypt)
middleware.ts                       라우트 가드 (auth.config.ts만 import → Edge-safe)

public/logo.png                     사이트 로고 (새싹 아이콘, 투명 배경 PNG)
app/globals.css                     CSS 변수 + Noto Sans KR import
app/layout.tsx                      루트 레이아웃 + SessionProvider
app/page.tsx                        홈페이지 (최근 글·앨범·마일스톤, ISR 300s)
app/not-found.tsx                   커스텀 404 페이지
app/(auth)/login/page.tsx           로그인 페이지 (재린월드)
app/admin/layout.tsx                Admin 사이드바 레이아웃 (역할별)
app/admin/page.tsx                  대시보드 (실통계: 글·앨범·사진·방명록·마일스톤)
app/(public)/layout.tsx             Public 헤더·푸터 (기록·앨범·마일스톤·검색, 모바일 반응형)
app/(public)/blog/page.tsx          기록 목록 (ISR 60s, PUBLIC+PUBLISHED)
app/(public)/blog/[slug]/page.tsx   기록 상세 (force-dynamic, findFirst, 커버 object-contain)
app/(public)/albums/page.tsx        앨범 목록 (max-w-6xl, createdAt 날짜 표시)
app/(public)/albums/[slug]/page.tsx 앨범 상세 (force-dynamic, max-w-6xl)
app/(public)/milestones/page.tsx    마일스톤 공개 목록 (ISR 60s, PUBLIC, 유형별 색상 배지)
app/(public)/growth/page.tsx        성장기록 공개 페이지 (force-dynamic, 최근값 카드+차트)
app/(public)/map/page.tsx           발자취 공개 지도 (메뉴에서 제거, URL 직접 접근 가능)
app/(public)/search/page.tsx        검색 (모바일 가로 레이아웃 보장)
app/(public)/tags/[name]/page.tsx   태그별 목록
app/(public)/series/[name]/page.tsx 시리즈별 목록
app/(public)/guestbook/page.tsx     방명록 (공개 폼+승인된 목록)

app/api/admin/upload/route.ts       이미지 업로드 POST
app/api/files/[...path]/route.ts    로컬 파일 서빙 (STORAGE_PROVIDER=local)
app/rss.xml/route.ts                RSS 2.0 피드 (PUBLIC only)
app/sitemap.ts                      XML 사이트맵 (PUBLIC only)
app/robots.txt/route.ts             robots.txt

next.config.ts                      보안 headers, 서버 액션 50MB, 이미지 설정
tailwind.config.ts                  Warm 팔레트 디자인 토큰

components/ui/                      디자인 시스템 (Button/Card/Badge/Chip/Input/Modal)
components/editor/RichEditor.tsx    TipTap 리치 에디터
components/gallery/Lightbox.tsx     전체화면 갤러리 (키보드·스와이프)
components/gallery/PhotoGrid.tsx    사진 그리드 (Masonry-like)
components/map/                     Leaflet 지도 컴포넌트
components/growth/GrowthChart.tsx   성장기록 인터랙티브 차트 (자연 3차 스플라인, Recharts)
types/next-auth.d.ts                Session/JWT 타입 확장
```

---

## 개발 명령어

```bash
npm run dev      # 개발 서버 (http://localhost:3000)
npm run build    # 프로덕션 빌드 (= prisma generate && next build)
npm run lint     # ESLint

# DB (PostgreSQL 연결 후)
npx prisma migrate dev   # 마이그레이션 실행
npx prisma studio        # DB GUI
npx prisma db seed       # 시드 데이터 (관리자 계정 생성)
```

---

## 수용 기준 (AC) 요약

| AC | 내용 | 담당 Step | 상태 |
|---|---|---|---|
| AC1 | 모바일 앨범 생성+사진 20장+캡션+게시 5분 이내 | Step 4 | ✅ |
| AC2 | private 콘텐츠 미인증 접근 불가 | Step 1B | ✅ |
| AC3 | unlisted 목록·검색·RSS·사이트맵 미노출 | Step 6 | ✅ |
| AC4 | 공개 경로에 GPS EXIF 원본 없음 | Step 3 | ✅ |
| AC5 | 핀 클릭 → 연결 글/앨범 진입 | Step 9 | ✅ |
