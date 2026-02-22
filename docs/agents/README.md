# FamilyArchive — 에이전트 팀 가이드

## 에이전트 구성

| 에이전트 | 파일 | 주요 역할 |
|----------|------|-----------|
| **Orchestrator** | `orchestrator.md` | Step 목표·AC 정의, 티켓 분배, 이슈 재할당, 완료 승인 |
| **Frontend** | `frontend.md` | 화면·컴포넌트·디자인 시스템·클라이언트 상태 |
| **Backend** | `backend.md` | 인증·권한·API 라우트·비즈니스 로직 |
| **Media Pipeline** | `media-pipeline.md` | 이미지 업로드·EXIF 제거·썸네일·스토리지 |
| **Data/DB** | `data-db.md` | 스키마·마이그레이션·쿼리 최적화·인덱스 |
| **QA/Release** | `qa-release.md` | AC 검증·이슈 등록·회귀 테스트·보안 체크 |
| **DevOps** | `devops.md` | 배포·환경변수·인프라 (Step 11 이전 대기) |

---

## Step별 담당 에이전트

| Step | 내용 | 활성 에이전트 |
|------|------|--------------|
| **0** | 초기화, tsconfig, env, tailwind | Orchestrator · Backend · Data/DB |
| **1A** | 디자인 시스템 컴포넌트 | Orchestrator · **Frontend** · QA |
| **1B** | 인증 플로우, 미들웨어, Admin 레이아웃 | Orchestrator · **Frontend** · **Backend** · Data/DB · QA |
| **2** | Prisma DB 인증, bcrypt, 시드 | Orchestrator · **Backend** · **Data/DB** · QA |
| **3** | 미디어 파이프라인 (EXIF·Sharp·스토리지) | Orchestrator · **Media Pipeline** · Backend · QA |
| **4** | Admin Albums 마법사 | Orchestrator · **Frontend** · Backend · QA |
| **5** | Admin Posts TipTap 에디터 | Orchestrator · **Frontend** · Backend · QA |
| **6** | Public 페이지 + Visibility 규칙 | Orchestrator · **Frontend** · Backend · QA |
| **7** | 갤러리 UX (Lightbox·Swipe·Skeleton) | Orchestrator · **Frontend** · QA |
| **8** | Search + Tags/Series + Archive | Orchestrator · **Frontend** · **Backend** · Data/DB · QA |
| **9** | Map + Pin Editor + 글·앨범 연결 | Orchestrator · **Frontend** · Backend · Data/DB · QA |
| **10** | Milestones · Guestbook · Moderation · Audit Log UI | Orchestrator · **Frontend** · Backend · QA |
| **11** | RSS·Sitemap·OG + 배포 + 성능 폴리싱 | Orchestrator · Backend · Frontend · Data/DB · **DevOps** · QA |

> **굵은** 에이전트 = 해당 Step의 주도 에이전트

---

## 업무 루프 (모든 Step 공통)

```
┌─────────────────────────────────────────────────────────┐
│ 1. Orchestrator                                         │
│    - Step 목표 / AC 정의                                 │
│    - 작업 티켓 분배 (T{N}-01, T{N}-02 ...)              │
│    - 타입·인터페이스 먼저 확정 (병렬 구현 전)             │
└──────────────┬──────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────┐
│ 2. Implementation 에이전트 (FE / BE / Media / DB)       │
│    - 티켓별 구현                                         │
│    - 빌드 확인 (npm run build)                          │
│    - 커밋                                               │
└──────────────┬──────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────┐
│ 3. QA                                                   │
│    - Step별 AC 체크리스트 전체 검증                      │
│    - 이슈 등록: P0 / P1 / P2                            │
└──────────────┬──────────────────────────────────────────┘
               │
         P0/P1 있음?
          │         │
         Yes        No
          │         │
          ▼         ▼
┌──────────────┐  ┌────────────────┐
│ 4. Orchestrator│  │  Step 완료 ✅  │
│  이슈 재할당   │  │  다음 Step 진행│
│  담당자 수정   │  └────────────────┘
└──────┬───────┘
       │
       ▼
┌─────────────────┐
│ 5. QA 재검증    │
│  → 통과 시 완료 │
└─────────────────┘
```

---

## 모델 선택 정책

**기본: Sonnet 4.6** — 모든 에이전트의 기본 모델

| 에이전트 | Opus 4.6 전환 조건 |
|----------|-------------------|
| Orchestrator | 스코프 트레이드오프, 아키텍처 설계 충돌, "전체를 한 번에 정리" |
| Frontend | Lightbox·갤러리 엣지케이스(키보드/포커스/접근성), 디자인 시스템 일관성 붕괴 분석 |
| Backend | RBAC 정책 복잡화, private·unlisted 노출 차단 설계 |
| Media Pipeline | 재현 어려운 업로드 버그, 대량 업로드 성능·메모리 분석 |
| Data/DB | 검색·권한·연결(Posts↔Places↔Albums) 한 번에 최적화 |
| QA/Release | 출시 전 최종 보안 감사, 치명 AC(unlisted/private 차단) 최종 검증 |
| DevOps | 배포 환경 꼬임(권한·도메인·캐시) 원인 추적 |

> **승인 원칙**: 위 목록 외 상황에서 Opus 전환이 필요하다고 판단되면, 실행 전 **사용자에게 먼저 물어보고 승인을 받는다.**

---

## 이슈 등급

| 등급 | 기준 | 처리 |
|------|------|------|
| **P0** | 빌드 실패, 보안 취약점, 데이터 손실, 인증 우회 | 즉시 블록 |
| **P1** | AC 미달, 기능 오작동, 권한 오적용 | Step 내 필수 수정 |
| **P2** | Warning, UX 권고, 코드 품질 | 백로그, 다음 Step 가능 |

---

## 병렬 실행 주의사항

- **타입·인터페이스 먼저 확정** 후 병렬 구현 시작
- **동일 파일 동시 수정 금지** (충돌 위험)
- **`npm install`** 은 한 에이전트만 (lock 파일 충돌)
- DB 스키마 변경 시 마이그레이션 먼저, 이후 API/UI 구현
