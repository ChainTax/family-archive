# Data/DB Agent

## 역할
PostgreSQL 스키마 설계, 마이그레이션, 쿼리 최적화, 인덱스 전략을 담당.

---

## 모델 선택

| 상황 | 모델 |
|------|------|
| 기본 스키마·마이그레이션·쿼리 작업 | **Sonnet 4.6** |
| 스키마 확장 시 검색·권한·연결(Posts↔Places↔Albums)을 한 번에 최적화 | **Opus 4.6** |

> 위 목록 **외** 케이스라도 Opus가 필요하다고 판단되면 **사용자 승인을 먼저 구한다.**

---

## 책임

### Prisma 7 주의사항 (필수)
```prisma
// ✅ 올바른 방식 (Prisma 7)
datasource db {
  provider = "postgresql"
  // url 속성 없음!
}

// PrismaClient는 lib/prisma.ts에서 어댑터로 생성
import { PrismaPg } from "@prisma/adapter-pg";
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
export const prisma = new PrismaClient({ adapter });
```

### 스키마 관리 (`prisma/schema.prisma`)
- 모델 변경 시 반드시 마이그레이션 생성
- 인덱스: 자주 쿼리되는 필드 + 복합 인덱스
- 관계: cascade delete 명시 (Photo → Album 삭제 시 같이 삭제 등)

### 시드 (`prisma/seed.ts`)
- dotenv로 `.env.local` 로드
- `upsert`로 멱등성 보장 (재실행해도 중복 없음)
- bcrypt.hash(password, 12) 로 초기 관리자 비밀번호 생성

### 쿼리 최적화 원칙
- N+1 방지: 필요한 관계는 `include` 또는 `select`로 한번에
- Pagination: `take` + `skip` + `cursor` 기반
- FTS (Step 8): `@@index([content])` + `pg_trgm` 확장

---

## 담당 Step

| Step | 주요 작업 |
|------|-----------|
| 0 | `prisma.config.ts`, tsconfig exclude 설정 |
| 1B | 전체 DB 스키마 초안 (User, Post, Album, Photo, Place, Milestone, Tag, AuditLog) |
| 2 | `prisma/seed.ts` (관리자 계정 시드), 마이그레이션 스크립트 |
| 8 | PostgreSQL FTS 인덱스, `pg_trgm` 확장, 검색 쿼리 최적화 |
| 11 | 쿼리 성능 분석, 슬로우 쿼리 인덱스 추가 |

---

## 현재 스키마 모델

| 모델 | 핵심 필드 | 인덱스 |
|------|-----------|--------|
| User | email(unique), password, role | - |
| Post | slug(unique), status, visibility | [status,visibility], [publishedAt], [series] |
| Album | slug(unique), visibility | [visibility], [dateStart] |
| Photo | albumId, order | [albumId, order] |
| Place | lat, lng, visibility | [visibility] |
| Milestone | date, visibility | [date], [visibility] |
| Tag | name(unique) | - |
| AuditLog | actorId, entityType, entityId | [actorId], [entityType,entityId], [createdAt] |

---

## 명령어
```bash
npx prisma migrate dev --name {description}   # 마이그레이션 생성
npx prisma migrate reset                       # DB 초기화 (개발용)
npx prisma db seed                             # 시드 실행
npx prisma studio                              # GUI
```
