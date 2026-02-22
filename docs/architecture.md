# FamilyArchive — Architecture Overview

> C4 Model Level 1~2 (간략)

---

## Level 1: System Context

```
[브라우저]
    │
    ├─► [FamilyArchive Web App] ─── Next.js 15 on Vercel
    │         │
    │         ├── Public 페이지 (ISR, 정적 제공)
    │         └── Admin 페이지 (서버 기능, 인증 필요)
    │
    ├─► [PostgreSQL DB] ─────────── Railway / Supabase / Neon
    │
    └─► [Object Storage] ─────────── Cloudflare R2 / S3
              │
              ├── /originals/* (private, GPS EXIF 원본)
              └── /web/*       (public CDN, EXIF 제거 파생)
```

---

## Level 2: App Router 구조

```
app/
├── (public)/               # Public 레이아웃 그룹
│   ├── page.tsx            # Home
│   ├── blog/               # 블로그 목록/상세
│   ├── albums/             # 앨범 목록/상세
│   ├── timeline/           # 타임라인/아카이브
│   ├── search/             # 검색
│   ├── map/                # 지도
│   ├── milestones/         # 성장 기록
│   └── guestbook/          # 방명록
│
├── (auth)/                 # 인증 레이아웃 그룹
│   ├── login/
│   └── logout/
│
├── admin/                  # Admin 레이아웃 (인증 필수)
│   ├── layout.tsx          # Admin 공통 레이아웃
│   ├── page.tsx            # Dashboard
│   ├── posts/              # 글 관리
│   ├── albums/             # 앨범 관리
│   ├── media/              # 미디어 라이브러리
│   ├── map/                # 핀 에디터
│   ├── milestones/
│   ├── guestbook/          # 모더레이션
│   ├── users/              # 사용자/역할 관리
│   └── settings/
│
└── api/                    # API Routes
    ├── auth/[...nextauth]/  # NextAuth
    ├── upload/              # 미디어 업로드 파이프라인
    ├── posts/
    ├── albums/
    ├── photos/
    ├── places/
    └── milestones/
```

---

## 미디어 업로드 파이프라인

```
클라이언트 (Admin)
    │
    │ multipart/form-data
    ▼
POST /api/upload
    │
    ├── 1. MIME 타입 검증
    ├── 2. Sharp: EXIF 전체 제거
    ├── 3. Sharp: 웹용 리사이즈 (long-edge 2048, WebP)
    ├── 4. Sharp: 썸네일 생성 (long-edge 480, WebP)
    ├── 5. Storage에 저장
    │       ├── originals/{year}/{uuid}.jpg  (private)
    │       ├── web/{year}/{uuid}.webp       (public CDN)
    │       └── thumbs/{year}/{uuid}.webp    (public CDN)
    └── 6. DB Photo 레코드 생성
```

---

## 공개범위 적용 레이어

```
middleware.ts          ← private/admin 라우트 보호 (최상위)
    │
API Route Handler      ← visibility 필터 쿼리 (DB 레벨)
    │
Page Component         ← unlisted 항목 목록 제외 (렌더링 레벨)
```

---

## 데이터 모델 (요약)

```
User ──────────────────── Role: owner | editor | viewer
 │
 └── AuditLog           actorId, action, entityType, diff

Post ──────────────────── visibility: public | unlisted | private
 ├── tags[]
 ├── series?
 └── linkedPlaces[]

Album ─────────────────── visibility: public | unlisted | private
 ├── Photos[]
 └── place?

Photo ─────────────────── albumId, url(web), thumbUrl, caption

Place (Pin) ────────────── lat/lng (도시 수준), linkedPosts[], linkedAlbums[]

Milestone ──────────────── visibility: private (기본)
```
