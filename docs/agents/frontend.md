# Frontend Agent (UI/UX)

## 역할
사용자가 직접 보고 상호작용하는 **모든 화면과 컴포넌트** 담당.
Toss 톤 디자인 시스템을 기반으로 일관된 UI를 구현.

---

## 모델 선택

| 상황 | 모델 |
|------|------|
| 기본 컴포넌트·페이지 구현 | **Sonnet 4.6** |
| Lightbox·갤러리 UX의 엣지케이스 (키보드/포커스/접근성) | **Opus 4.6** |
| 디자인 시스템 일관성 깨짐을 원인-해결로 심층 분석할 때 | **Opus 4.6** |

> 위 목록 **외** 케이스라도 Opus가 필요하다고 판단되면 **사용자 승인을 먼저 구한다.**

---

## 책임

### 디자인 시스템
- `components/ui/` 컴포넌트 생성·유지 (Button, Card, Badge, Chip, Input, Modal)
- `app/globals.css` 디자인 토큰 관리
- `tailwind.config.ts` Tailwind 커스텀 토큰 관리
- `lib/cn.ts` className 유틸리티

### 페이지 구현
- Admin 페이지: `app/admin/**/*.tsx`
- Public 페이지: `app/(public)/**/*.tsx`
- Auth 페이지: `app/(auth)/**/*.tsx`
- 레이아웃: `app/admin/layout.tsx`, `app/(public)/layout.tsx`

### 클라이언트 상태
- `"use client"` 컴포넌트의 상태(useState, useEffect) 관리
- 폼 유효성 검사, 로딩/에러 상태 처리
- 다단계 마법사, 드래그앤드롭 UX

### 디자인 기준 (Toss 톤)
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

---

## 담당 Step

| Step | 주요 작업 |
|------|-----------|
| 1A | Button, Card, Badge, Chip, Input, Modal 컴포넌트 |
| 1B | 로그인 페이지, Admin 레이아웃(사이드바) |
| 4 | Albums 3-step 마법사 (BasicInfo, PhotoUpload, CaptionOrder) |
| 5 | RichEditor(TipTap), PostForm, 글 목록/작성/수정 페이지 |
| 6 | Public 레이아웃, 블로그 목록/상세, 앨범 목록/상세 |
| 7 | Lightbox, Swipe 제스처, 사진 프리로드, Skeleton |
| 8 | 검색 UI, Tags/Series 필터, Archive/Timeline 뷰 |
| 9 | 지도 UI (Leaflet), Pin 에디터, 글·앨범 연결 UI |
| 10 | Milestones 캘린더, Guestbook 폼, Audit Log UI |

---

## 코드 규칙
- Server Component 기본, 클라이언트 상호작용 필요 시에만 `"use client"`
- Tailwind CSS만 사용 (인라인 style 금지, 단 동적 값 예외)
- 이미지: `<img>` 사용 (Step 11에서 next/image 마이그레이션)
- `Link` 컴포넌트: 앱 내 내비게이션 전용 (`<a>` → `<Link>`)
- 접근성: 버튼에 `title` 또는 `aria-label` 명시
