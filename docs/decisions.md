# FamilyArchive — Decision Document

> 이 문서는 개발 착수 전 확정된 기술 결정 사항을 기록합니다.
> 변경 시 Orchestrator 검토 후 날짜와 이유를 함께 기재합니다.

---

## 1. 프레임워크

| 항목 | 결정 | 이유 |
|---|---|---|
| Framework | **Next.js 15+ (App Router)** | ISR로 Public 페이지를 정적 제공, Admin은 서버 기능 사용 |
| Language | **TypeScript (strict)** | 타입 안전성, 에디터 자동완성 |
| Runtime | **Node.js** | Sharp 이미지 처리 라이브러리 호환 |

## 2. 데이터베이스

| 항목 | 결정 | 이유 |
|---|---|---|
| DB Engine | **PostgreSQL** | 관계형 데이터(Posts↔Albums↔Places), 한국어 FTS 지원 |
| ORM | **Prisma** | 타입-세이프 쿼리, 마이그레이션 관리, NextAuth 어댑터 |
| 개발 환경 | 로컬 PostgreSQL 또는 Docker | 팀 일관성 |
| 운영 옵션 | Railway / Supabase / Neon | 서버리스 PostgreSQL, 무중단 마이그레이션 |

**선택하지 않은 것:** SQLite (개발 편의 있으나, FTS·JSON 컬럼·concurrent write에 제한)

## 3. 인증

| 항목 | 결정 | 이유 |
|---|---|---|
| 라이브러리 | **NextAuth.js v5 (Auth.js)** | Next.js App Router 공식 지원 |
| Provider | **Credentials (이메일+비밀번호)** | 가족 전용, 소셜 로그인 불필요 |
| 세션 | **Database session** (Prisma 어댑터) | 서버에서 세션 강제 만료 가능 |
| 비밀번호 | **bcrypt** | 검증된 해싱 방식 |

## 4. 이미지/미디어

| 항목 | 결정 | 이유 |
|---|---|---|
| 처리 라이브러리 | **Sharp** | Node.js 서버사이드 최고 성능 |
| 처리 시점 | **업로드 즉시 (서버)** | 클라이언트 부담 없음, EXIF 제거 보장 |
| 출력 포맷 | **WebP** (원본 JPEG/PNG 보존) | 크기 절감 40~60% |
| 파생 이미지 | 웹용(2048px), 썸네일(480px) 2종 | 갤러리·라이트박스 성능 |
| EXIF 처리 | **GPS 포함 전체 제거 (기본 ON)** | 프라이버시 AC4 준수 |

## 5. Object Storage

| 항목 | 결정 | 이유 |
|---|---|---|
| 개발 | **로컬 파일시스템** (`/uploads`) | 빠른 시작, 의존성 없음 |
| 운영 1순위 | **Cloudflare R2** | S3 호환, 무료 Egress, 한국 PoP |
| 운영 2순위 | AWS S3 | 레퍼런스 많음 |
| 접근 제어 | 원본: private 버킷만 / 파생: CDN 공개 | EXIF 원본 노출 차단 (AC4) |

## 6. 지도

| 항목 | 결정 | 이유 |
|---|---|---|
| 라이브러리 | **Leaflet + OpenStreetMap** | 무료, 경량, 한국 지도 품질 양호 |
| 좌표 스냅 | 도시 수준 (읍면동 아님) | 프라이버시 보호 |

## 7. 검색

| 항목 | 결정 | 이유 |
|---|---|---|
| 방식 | **PostgreSQL FTS + `pg_trgm`** | 추가 서비스 없이 한국어 검색 |
| 추후 업그레이드 | Algolia / Meilisearch | 검색량이 많아지면 전환 |

## 8. 스타일링

| 항목 | 결정 | 이유 |
|---|---|---|
| 방식 | **Tailwind CSS v3** | 빠른 컴포넌트 구현 |
| 디자인 톤 | **Toss 스타일** (#3182F6, 화이트/라이트그레이, 다크그레이 텍스트) | PRD 명시 |
| 다크모드 | Step 1에서 기본 토글 포함 | PRD 요구 |

## 9. 배포 (운영)

| 항목 | 결정 | 이유 |
|---|---|---|
| 호스팅 | **Vercel** (1순위) | Next.js 공식, ISR·Edge 지원 |
| 대안 | Railway / Fly.io | DB·Storage 같은 플랫폼 통합 시 |

## 10. 확정된 공개범위 규칙

```
public   → 검색·목록·사이트맵·RSS 포함
unlisted → URL 직접 접근만. 목록·검색·사이트맵·RSS 제외
private  → 로그인(Family 이상) 필수. 미인증 시 401 리다이렉트
```

> 미들웨어 레벨에서 강제 적용 (AC2, AC3 준수)
