# FamilyArchive — CLAUDE.md

> 이 파일은 Claude Code가 세션 시작 시 자동으로 읽습니다.
> 새 기능 구현 전 반드시 "빌드 스텝 현황"을 확인하세요.

---

## 제품 개요

가족의 글·사진·여행 기록을 Toss 톤 고급 UI/UX로 남기는 플랫폼.
공개/링크공유/가족전용 권한을 안전하게 관리하고, 관리자 페이지에서 모바일로도 쉽게 업로드할 수 있어야 한다.

---

## 기술 스택

| 레이어 | 선택 |
|---|---|
| Framework | Next.js 15 (App Router) + TypeScript strict |
| Styling | Tailwind CSS v3 (Toss 디자인 토큰) |
| Auth | NextAuth v5 beta (`next-auth@beta`) |
| DB | PostgreSQL + Prisma 7.4.1 |
| Image | Sharp (서버사이드) |
| Storage | S3-compatible (개발: 로컬 파일시스템, 운영: Cloudflare R2) |
| Map | Leaflet + OpenStreetMap |
| Search | PostgreSQL FTS + pg_trgm |

---

## 디자인 토큰 (Toss 톤)

```
Brand:          #3182F6
Brand Hover:    #1B64DA
BG Primary:     #FFFFFF
BG Secondary:   #F2F4F6
Text Primary:   #191F28
Text Secondary: #4E5968
Text Tertiary:  #8B95A1
Border:         #E5E8EB
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

- `prisma.config.ts`: schema 경로 지정 (tsconfig.json의 `exclude`에 추가됨)
- `lib/prisma.ts`: `PrismaPg` 어댑터에 `connectionString` 주입
- migrate 실행 시 `DATABASE_URL` 환경변수 필요

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
| DevOps | `docs/agents/devops.md` | 배포·인프라 (Step 11 이전 대기) |

### Step별 활성 에이전트

| Step | 활성 에이전트 |
|------|--------------|
| 0 | Orchestrator · Backend · Data/DB |
| 1A | Orchestrator · **Frontend** · QA |
| 1B | Orchestrator · **Frontend** · **Backend** · Data/DB · QA |
| 2 | Orchestrator · **Backend** · **Data/DB** · QA |
| 3 | Orchestrator · **Media Pipeline** · Backend · QA |
| 4 | Orchestrator · **Frontend** · Backend · QA |
| 5 | Orchestrator · **Frontend** · Backend · QA |
| 6 | Orchestrator · **Frontend** · Backend · QA |
| 7 | Orchestrator · **Frontend** · QA |
| 8 | Orchestrator · **Frontend** · **Backend** · Data/DB · QA |
| 9 | Orchestrator · **Frontend** · Backend · Data/DB · QA |
| 10 | Orchestrator · **Frontend** · Backend · QA |
| 11 | Orchestrator · Frontend · Backend · Data/DB · **DevOps** · QA |

### 업무 루프 (모든 Step 공통)

```
1. Orchestrator  → Step 목표·AC 정의, 작업 티켓 분배
2. 구현 에이전트 → 티켓 구현 + 빌드 확인
3. QA           → AC 체크리스트 검증, P0/P1/P2 이슈 발행
4. Orchestrator  → P0/P1 이슈 담당자에게 재할당
5. 구현 에이전트 → 수정
6. QA 재검증    → 통과 시 다음 Step
```

### 이슈 등급
- **P0**: 빌드 실패·보안·인증 우회 → 즉시 블록
- **P1**: AC 미달·기능 오작동 → Step 내 필수 수정
- **P2**: Warning·권고사항 → 백로그, 다음 Step 가능

### 모델 선택 정책
- **기본: Sonnet 4.6** — 모든 에이전트 기본
- **Opus 4.6 전환** (에이전트별 조건, 상세는 `docs/agents/README.md` 참고):
  - Orchestrator: 스코프 트레이드오프·아키텍처 설계 충돌·전체 정리
  - Frontend: Lightbox 엣지케이스·디자인 시스템 일관성 붕괴 분석
  - Backend: RBAC 복잡화·private/unlisted 노출 차단 설계
  - Media Pipeline: 재현 어려운 업로드 버그·대량 업로드 성능 분석
  - Data/DB: 검색·권한·연결 한 번에 최적화
  - QA/Release: 출시 전 최종 보안 감사·치명 AC 검증
  - DevOps: 배포 환경 꼬임(권한·도메인·캐시) 원인 추적
- **승인 원칙**: 위 목록 외 상황에서 Opus 전환 필요 시 **사용자 승인을 먼저 구한다**

---

## 빌드 스텝 현황

### 완료
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
- **Step 10**: Milestones + Guestbook + Moderation + Audit Log UI — `GuestbookEntry` 스키마 추가, `/admin/milestones`(CRUD 모달), `/admin/guestbook`(승인·삭제), `/guestbook`(공개 폼+목록), `/admin/audit`(OWNER only 페이지네이션), Dashboard 실통계, 헤더 방명록 링크
- **Step 11**: RSS·Sitemap·OG + 성능 폴리싱 — `/rss.xml`(RSS 2.0·PUBLIC only), `/sitemap.xml`(PUBLIC 포스트·앨범), `/robots.txt`, Root layout metadataBase+OG+Twitter, 커스텀 404, 보안 headers, `/api/files/*` 캐시 1년, 공개 목록 ISR(60s/300s)

### 대기
- 배포 (Railway/Supabase/Neon + Cloudflare R2) — npx prisma migrate deploy 실행 필요

---

## 주요 파일 위치

```
CLAUDE.md                           이 파일
docs/agents/README.md               에이전트 팀 가이드 (Step별 배정표·업무루프)
docs/agents/{role}.md               각 에이전트 역할 정의
.env.example                        환경변수 템플릿
.env.local                          로컬 개발용 (git 제외)
docs/decisions.md                   기술 결정 문서
docs/architecture.md                C4 아키텍처 다이어그램

prisma/schema.prisma                전체 DB 스키마
prisma.config.ts                    Prisma 7 설정 (tsconfig exclude)
lib/prisma.ts                       PrismaClient 싱글턴
lib/                                서버 유틸리티 모음

auth.config.ts                      Edge-safe 공통 설정 (JWT callbacks, pages)
auth.ts                             NextAuth v5 풀 설정 (Credentials + Prisma + bcrypt + AuditLog)
middleware.ts                       라우트 가드 (auth.config.ts만 import → Edge-safe)
lib/audit.ts                        AuditLog 생성 헬퍼
lib/media.ts                        Sharp 이미지 처리 (EXIF 제거+WebP+썸네일)
lib/storage.ts                      스토리지 어댑터 (local | s3 | r2)
prisma/seed.ts                      관리자 계정 초기 시드 (tsx prisma/seed.ts)

app/api/admin/upload/route.ts       이미지 업로드 POST (인증 필요)
app/api/files/[...path]/route.ts    로컬 파일 서빙 (STORAGE_PROVIDER=local 전용)

app/globals.css                     CSS 변수 (디자인 토큰)
app/layout.tsx                      루트 레이아웃 + SessionProvider
app/providers.tsx                   클라이언트 Provider 묶음
app/(auth)/login/page.tsx           로그인 페이지
app/admin/layout.tsx                Admin 사이드바 레이아웃 (역할별)
app/admin/page.tsx                  대시보드 (실통계: 글·앨범·사진·방명록·마일스톤)
app/api/auth/[...nextauth]/         NextAuth 핸들러
app/(public)/layout.tsx             Public 헤더·푸터 레이아웃
app/(public)/blog/                  블로그 목록·상세
app/(public)/albums/                앨범 목록·상세

components/ui/                      디자인 시스템 컴포넌트 (Step 1A)
components/editor/RichEditor.tsx    TipTap 리치 에디터 (Step 5)
types/next-auth.d.ts                Session/JWT 타입 확장
```

---

## 개발 명령어

```bash
npm run dev      # 개발 서버 (http://localhost:3000)
npm run build    # 프로덕션 빌드 (AC 검증용)
npm run lint     # ESLint

# DB (PostgreSQL 연결 후)
npx prisma migrate dev   # 마이그레이션 실행
npx prisma studio        # DB GUI
npx prisma db seed       # 시드 데이터 (Step 2에서 생성)
```

---

## 수용 기준 (AC) 요약

| AC | 내용 | 담당 Step | 상태 |
|---|---|---|---|
| AC1 | 모바일 앨범 생성+사진 20장+캡션+게시 5분 이내 | Step 4 | 구현완료 |
| AC2 | private 콘텐츠 미인증 접근 불가 | Step 1B | ✅ |
| AC3 | unlisted 목록·검색·RSS·사이트맵 미노출 | Step 6 | 목록 구현완료 |
| AC4 | 공개 경로에 GPS EXIF 원본 없음 | Step 3 | 구현완료 |
| AC5 | 핀 클릭 → 연결 글/앨범 진입 | Step 9 | 대기 |
