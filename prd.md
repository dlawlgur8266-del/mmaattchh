# 충북match — Product Requirements Document (PRD)

> **버전**: v2.3  
> **최초 작성일**: 2026-05-26  
> **최종 수정일**: 2026-05-29  
> **작성자**: 충북match 개발팀  
> **상태**: 업데이트 완료 (v2.2 → v2.3)

---

## 변경 이력

| 버전 | 날짜 | 주요 변경 내용 |
|------|------|----------------|
| v1.0 | 2026-05-26 | 초안 작성 — MVP 기능 정의 |
| v2.0 | 2026-05-28 | 공모전 기능, 그룹 채팅, 신청 관리 UI, 자동화 전면 추가 |
| v2.1 | 2026-05-28 | 매치글 수정 기능 추가 (전용 페이지 + Realtime 즉시 반영) |
| v2.2 | 2026-05-28 | 개인 프로필 시스템, 스포츠 시설 예약, 신고 시스템, Claude AI 기능, 관리자 대시보드, 크롤링 확장 추가 |
| v2.3 | 2026-05-29 | 예약 신청 링크 https 수정, 시설 순서 변경(종합운동장 우선), 예약 가능 버튼 텍스트 개선, Phase 7·8 구현 완료 반영 |

---

## 목차

1. [제품 개요](#1-제품-개요)
2. [목표 및 성공 지표](#2-목표-및-성공-지표)
3. [사용자 페르소나](#3-사용자-페르소나)
4. [정보 아키텍처](#4-정보-아키텍처)
5. [기능 요구사항 상세](#5-기능-요구사항-상세)
   - 5.1~5.11: 기존 기능 (매치, 공모전, 메시지, 알림 등)
   - 5.12: 스포츠 시설 예약
   - 5.13: 개인 프로필 시스템
   - 5.14: 신고 시스템
   - 5.15: Claude AI 기능
   - 5.16: 관리자 대시보드
   - 5.17: 크롤링 시스템 확장
6. [데이터베이스 설계](#6-데이터베이스-설계)
7. [API 설계](#7-api-설계)
8. [UI/UX 가이드라인](#8-uiux-가이드라인)
9. [비기능 요구사항](#9-비기능-요구사항)
10. [개발 로드맵](#10-개발-로드맵)
11. [리스크 및 제약사항](#11-리스크-및-제약사항)

---

## 1. 제품 개요

### 1.1 제품 비전

충북대학교 학생들이 스포츠 매치 상대를 손쉽게 찾고, 경기를 신청하며, 매치 후 매너를 평가하고, 공모전 팀원을 모집·참여할 수 있는 **교내 전용 스포츠·공모전 매칭 플랫폼**을 제공한다.

### 1.2 핵심 가치 제안

| 가치 | 설명 |
|------|------|
| 간편한 매치 탐색 | 종목·수준별 필터로 원하는 상대를 빠르게 발견 |
| 실시간 커뮤니케이션 | 신청·수락·채팅 전 과정이 지연 없이 진행 |
| 신뢰 기반 생태계 | 매너 평가 시스템으로 매너 있는 경기 문화 형성 |
| 충북대 전용 | 학번 인증으로 재학생만 이용 가능한 신뢰도 높은 커뮤니티 |
| 공모전 팀 매칭 | 충청권 공모전 정보 제공 + 팀원 모집·그룹 채팅 연동 |
| 자동화 운영 | 마감일 기반 게시물 자동 만료·삭제로 운영 비용 최소화 |
| AI 매칭 추천 | Claude API로 공모전 요약·매칭 추천 이유·프로필 작성 도우미 제공 |
| 시설 예약 연동 | 충북대 스포츠 시설 예약 현황 자동 수집·표시 |

### 1.3 기술 스택

| 구분 | 기술 | 선택 이유 |
|------|------|-----------|
| Frontend | Next.js 14 (App Router, TypeScript) | SSR/SSG 지원, Vercel 최적화 |
| Styling | Tailwind CSS | 빠른 UI 구현, 일관된 디자인 시스템 |
| Database | Supabase (PostgreSQL) | 무료 플랜, Row Level Security, Realtime 내장 |
| 인증 | Supabase Auth | 세션 관리, JWT 내장 |
| 실시간 | Supabase Realtime (WebSocket) | Postgres Changes 구독, 폴링 폴백 병행 |
| 배포 | Vercel | Next.js 공식 플랫폼, Edge Network, Cron Jobs |
| Admin | Supabase Admin Client | RLS 우회 서버 사이드 작업 |
| AI | Anthropic Claude API (claude-sonnet-4-6) | 공모전 요약, 매칭 추천, 프로필 작성 보조 |
| 크롤링 | Python (BeautifulSoup / Playwright) | GitHub Actions 또는 Vercel Cron; 공모전·시설 예약 자동 수집 |
| 스토리지 | Supabase Storage | 아바타 이미지 업로드 |

---

## 2. 목표 및 성공 지표

### 2.1 제품 목표

- 충북대 재학생 간 스포츠 매치 성사율 극대화
- 매치 신청부터 수락까지 평균 1시간 이내 처리
- 매너 평가 참여율 70% 이상
- 충청권(충북·충남·세종·대전) 공모전 팀원 매칭 활성화

### 2.2 핵심 성과 지표 (KPI)

| 지표 | 목표치 |
|------|--------|
| 회원가입 수 | 서비스 오픈 1개월 내 100명 |
| 매치 게시글 수 | 주간 20건 이상 |
| 매치 성사율 | 신청 대비 50% 이상 수락 |
| 매너 평가 참여율 | 매치 확정 건 대비 70% 이상 |
| 실시간 응답 지연 | 알림·채팅 메시지 2초 이내 전달 |
| 공모전 팀 모집 게시글 | 주간 5건 이상 |

---

## 3. 사용자 페르소나

### 페르소나 A — 매치 주최자

> 충북대 체육학과 3학년 **김민준** (22세)
>
> - 주 2~3회 풋살을 즐기지만 상대팀 구하기가 어려움
> - 카카오톡 오픈채팅방으로 상대 찾는 번거로움을 느낌
> - **니즈**: 종목·수준에 맞는 상대를 빠르게 구하고, 경기 일정을 관리하고 싶다

### 페르소나 B — 매치 신청자

> 충북대 컴퓨터공학과 2학년 **이서연** (20세)
>
> - e스포츠 동호회 활동 중, 다른 팀과 스크림(연습 경기)를 원함
> - 실력 수준이 맞는 상대를 찾고 싶음
> - **니즈**: 내 실력 수준에 맞는 상대 팀을 필터로 찾고 바로 신청하고 싶다

### 페르소나 C — 일반 사용자 (평가 중심)

> 충북대 경영학과 1학년 **박지호** (19세)
>
> - 가끔 농구를 즐기며 매너 있는 상대를 원함
> - 상대팀의 매너 점수를 보고 신청 여부를 결정하고 싶음
> - **니즈**: 매너 평가 이력을 보고 신뢰할 수 있는 상대와 경기하고 싶다

### 페르소나 D — 공모전 팀 빌더

> 충북대 디자인학과 3학년 **최유진** (21세)
>
> - 공모전 참가를 원하지만 혼자서 모든 분야를 커버할 수 없음
> - IT·디자인·마케팅 역량을 갖춘 팀원을 찾고 싶음
> - **니즈**: 공모전에 맞는 팀원을 빠르게 모집하고 그룹 채팅으로 협업하고 싶다

---

## 4. 정보 아키텍처

```
충북match
├── 공개 영역 (비로그인)
│   ├── /                          ← 랜딩 페이지 (서비스 소개)
│   ├── /login                     ← 로그인
│   └── /signup                    ← 회원가입 (학과 선택 포함)
│
└── 인증 영역 (로그인 필수)
    ├── /match                     ← 매치 목록 (종목·수준 필터, 실시간)
    ├── /match/write               ← 매치글 작성 (스포츠 / 공모전 탭 모드)
    ├── /match/[id]/edit           ← 매치글 수정 (작성자 전용) ← v2.1 신규
    ├── /contest                   ← 공모전 목록 (즐겨찾기 + 지역별 탭)
    ├── /contest/matches           ← 공모전 팀원 모집 목록 (실시간 남은 자리)
    ├── /sports                    ← 스포츠 시설 예약 현황 + 파트너 찾기 ← v2.2 신규
    ├── /review                    ← 팀 후기 목록 / 별점 작성
    ├── /messages                  ← 메시지 허브 (매치 채팅 탭 / 공모전 팀 채팅 탭)
    ├── /messages/[roomId]         ← 1:1 매치 채팅방
    ├── /messages/contest/[roomId] ← 공모전 팀 그룹 채팅방 (팀원 초대 포함)
    ├── /profile                   ← 내 정보 (7개 탭 + 개인 프로필 탭)
    ├── /notifications             ← 알림 센터
    └── /admin                     ← 관리자 대시보드 (관리자 role만 접근) ← v2.2 신규
```

---

## 5. 기능 요구사항 상세

### 5.1 회원가입 (/signup)

#### 유저 스토리
> "충북대 재학생으로서, 내 학번으로 가입하여 신뢰할 수 있는 스포츠 커뮤니티에 참여하고 싶다."

#### 입력 필드 명세

| 필드 | 타입 | 제약 조건 | 오류 메시지 |
|------|------|-----------|-------------|
| 아이디 | text | 영문 소문자+숫자, 4~20자, 중복 불가 | "이미 사용 중인 아이디입니다." |
| 비밀번호 | password | 최소 8자, 영문+숫자 포함 | "비밀번호는 8자 이상이어야 합니다." |
| 비밀번호 확인 | password | 비밀번호와 일치 | "비밀번호가 일치하지 않습니다." |
| 이름(실명) | text | 한글 2~5자 | "올바른 이름을 입력해 주세요." |
| 닉네임 | text | 2~10자, 중복 불가 | "이미 사용 중인 닉네임입니다." |
| 학번 | text | 숫자 8자리, maxLength=8 | "학번은 8자리 숫자여야 합니다." |
| 소속 학과 | select | 충북대 학과 목록 선택 | "학과를 선택해주세요." |

#### 학번 유효성 검증 규칙

```
형식: YYYY0000 (앞 4자리: 입학연도, 뒤 4자리: 일련번호)
- 입학연도: 1990 ~ 현재연도 범위
- 숫자 외 문자 입력 불가 (input type="number", pattern="[0-9]{8}")
- maxLength 속성으로 8자리 초과 입력 차단
```

#### 인증 플로우

```
1. 사용자 폼 입력
2. 클라이언트 유효성 검사 (실시간)
3. 아이디/닉네임 중복 확인 버튼 → Supabase profiles 테이블 조회
4. [가입하기] 클릭
5. Supabase Auth → auth.users에 이메일(아이디@cbnu.match) + 비밀번호 등록
6. profiles 테이블에 부가 정보 INSERT (학과 포함)
7. 가입 완료 → 로그인 페이지로 리다이렉트
```

---

### 5.2 로그인 (/login)

#### 유저 스토리
> "등록한 아이디와 비밀번호로 빠르게 로그인하고 싶다."

#### 플로우

```
1. 아이디 + 비밀번호 입력
2. Supabase Auth signInWithPassword() 호출
3. 성공 → JWT 세션 저장 → /match 리다이렉트
4. 실패 → "아이디 또는 비밀번호가 올바르지 않습니다." 표시
```

#### 세션 관리

- Supabase 클라이언트가 localStorage에 세션 자동 저장
- 페이지 새로고침 시 세션 자동 복구
- 로그아웃 시 세션 삭제 + `/login` 리다이렉트
- "로그인 상태 유지" 체크박스: 체크 시 세션 만료 7일, 미체크 시 브라우저 종료 시 만료

#### 비밀번호 찾기

```
1. 로그인 페이지 하단 "비밀번호 찾기" 링크 클릭
2. 가입 시 사용한 아이디 입력
3. 시스템이 해당 아이디의 가상 이메일(아이디@cbnu.match)로 재설정 링크 발송
4. 링크 클릭 → 새 비밀번호 설정 페이지로 이동
5. 새 비밀번호 입력 (최소 8자, 영문+숫자) → 저장 → 로그인 페이지 리다이렉트
```

#### 회원탈퇴

```
경로: /profile > 계정 설정 > 회원탈퇴

절차:
  1. 탈퇴 의사 확인 다이얼로그 표시
  2. 확인 클릭
  3. 모든 게시글(matches, contest_matches) 비공개 처리
  4. 개인식별 정보(이름, 학번) 30일 후 자동 삭제
     (Supabase Edge Function scheduled trigger 처리)
  5. profiles.is_active = false 처리 → 목록 노출 차단
  6. 탈퇴 완료 → 세션 삭제 → /login 리다이렉트

재가입 정책:
  - 탈퇴 후 동일 아이디로 재가입 가능
  - 재가입 시 이전 데이터(채팅 이력, 신청 기록) 복구 불가
```

---

### 5.3 매치 목록 (/match)

#### 유저 스토리
> "원하는 종목과 수준의 매치를 빠르게 찾아 신청하고 싶다."

#### 화면 구성

```
┌───────────────────────────────────────────────────┐
│  [매치글 작성] 버튼                                  │
├───────────────────────────────────────────────────┤
│  [전체] [⚽축구] [🥅풋살] [🏀농구] [🎮e스포츠]  ← 종목 필터
│  [전체] [초급] [중급] [고수]                      ← 수준 필터
├───────────────────────────────────────────────────┤
│  매치 카드 목록 (최신순, status='모집중'만 표시)     │
│                                                   │
│  ┌─ MatchCard ────────────────────────────────┐  │
│  │ [⚽축구] [중급] [모집중]          2시간 전   │  │
│  │ ⚽ FC충북  5vs5  by 김민준         │  │
│  │ 📍 충북대 운동장                           │  │
│  │ 📅 6월 1일 (일) 오후 03:00                │  │
│  │ "같이 즐겁게 뛸 팀 구해요"                 │  │
│  │ ─────────────────────────────────────── │  │
│  │ [타인] [매치 신청] 버튼                    │  │
│  │ [본인] ✏️수정버튼 + [신청 현황] 카드들     │  │
│  └─────────────────────────────────────────┘  │
└───────────────────────────────────────────────────┘
```

#### 매치 목록 필터링 규칙

```
- status = '모집중' 인 매치만 표시 (매치확정 게시물은 목록 제외)
- 종목 필터: 전체 / 축구 / 풋살 / 농구 / e스포츠
- 수준 필터: 전체 / 초급 / 중급 / 고수
- 정렬: created_at 내림차순 (최신순)
```

#### 매치 신청 플로우

```
[매치 신청] 클릭
    │
    ├─ 비로그인? → "로그인이 필요합니다." toast
    ├─ 본인 게시글? → 신청 불가 (버튼 미표시)
    ├─ 이미 신청? → "신청 완료" 비활성 버튼 표시
    │
    └─ 정상 신청
        ↓
        POST /api/matches/[id]/apply
        → match_applications INSERT (status: 'pending')
        → notifications INSERT (매치글 작성자 수신)
        ↓
        Supabase Realtime → 작성자 브라우저 알림 Push
        알림: "[닉네임] 님이 매치를 신청했습니다. 실력: [수준]"
        ↓
        작성자 알림 UI 또는 '내 정보 > 받은 신청' 탭에서 처리
            ├─ 수락 → status='accepted', 매치 상태='매치확정', 채팅방 생성
            └─ 거절 → status='rejected', 신청자에게 거절 알림
```

#### 매치글 수정 (v2.1 신규)

```
접근 경로:
  - /match 목록 페이지: MatchCard 내 '내 게시글' 영역 우상단 ✏️ 버튼
  - /profile '내 매치글' 탭: Edit2 아이콘 버튼
  → 두 경로 모두 /match/[id]/edit 페이지로 이동

수정 페이지 (/match/[id]/edit):
  - 접근 시 기존 매치 데이터 자동 로드 (Supabase 조회)
  - 서버에서 author_id = 현재 유저 ID 검증 (불일치 시 /match 리다이렉트)
  - 수정 가능 필드: 팀명 / 종목 / 매치 인원 / 장소 / 경기 날짜·시간 / 소개글 / 원하는 수준
  - 저장 → PUT /api/matches/[id] → 성공 시 /match 리다이렉트 + toast
  - 수정 버튼 표시 조건: status='모집중' 인 경우에만 (매치확정 시 숨김)

실시간 반영:
  - /match 페이지는 matches 테이블 event:* Realtime 구독 중
  - 수정 완료(UPDATE 이벤트) 감지 → fetchData() 자동 호출
  - 접속 중인 모든 사용자 화면에 즉시 반영
```

#### 신청 취소 후 재신청

```
- 신청자가 '내 정보 > 지원한 신청' 탭에서 대기중 신청 취소
- DELETE /api/applications/[id]/withdraw → match_applications 레코드 삭제
- 매치 목록 Realtime이 DELETE 이벤트 감지 → appliedIds 즉시 갱신
- 해당 매치 카드: "신청 완료" 비활성 버튼 → "매치 신청" 활성 버튼으로 즉시 복원
- MatchCard의 applied 상태가 alreadyApplied prop 변화를 useEffect로 동기화
```

#### 매치 자동 만료 (Cron)

```
- match_datetime(경기 날짜·시간)이 현재 시각보다 과거인 매치는 목록에서 즉시 제외
  (쿼리 레벨에서 match_datetime > now() 또는 is null 필터 적용)
- Vercel Cron Job (매일 00:00 KST):
  DELETE FROM matches WHERE match_datetime < NOW()
- 경로: GET /api/cron/cleanup-matches (schedule: "0 15 * * *")
- CRON_SECRET 헤더로 무단 호출 방지
```

---

### 5.4 매치글 작성 (/match/write)

#### 유저 스토리
> "스포츠 매치 또는 공모전 팀원 모집 게시글을 한 곳에서 작성하고 싶다."

#### 모드 선택

```
/match/write 페이지 상단 탭으로 두 가지 모드 전환:
  [스포츠 매치] 탭  ← 기본 선택
  [공모전 팀원] 탭
```

#### 스포츠 매치 폼 필드

| 필드 | UI 컴포넌트 | 필수 여부 | 제약 |
|------|-------------|-----------|------|
| 팀명 | text input | ✅ | 2~20자 |
| 종목 | card select (4개) | ✅ | 축구 / 풋살 / 농구 / e스포츠 |
| 매치 인원 | button group | ✅ | 1vs1 / 3vs3 / 5vs5 / 11vs11 (종목별 연동) |
| 경기 장소 | text input | ✅ | 최대 50자 |
| 경기 날짜 | date picker | ✅ | 오늘 이후만 선택 가능 |
| 경기 시간 | time picker | ✅ | HH:MM 형식 |
| 소개글 | textarea | ✅ | 10~500자 |
| 원하는 수준 | button group | ✅ | 초급 / 중급 / 고수 |

#### 인원 ↔ 종목 연관 규칙

| 종목 | 허용 인원 |
|------|-----------|
| ⚽ 축구 | 5vs5, 11vs11 |
| 🥅 풋살 | 3vs3, 5vs5 |
| 🏀 농구 | 3vs3, 5vs5 |
| 🎮 e스포츠 | 1vs1, 3vs3, 5vs5 |

> 종목 선택 시 해당 종목에서 불가능한 인원 옵션은 disabled 처리

#### 공모전 팀원 폼 필드

| 필드 | UI 컴포넌트 | 필수 여부 | 제약 |
|------|-------------|-----------|------|
| 공모전 이름 | text input | ✅ | 최대 100자 |
| 공모전 분야 | grid button select | ✅ | 8개 카테고리 중 1개 |
| 지역 | grid button select | ✅ | 충청북도 / 충청남도 / 세종특별자치시 / 대전광역시 |
| 공모전 마감일 | date picker | ✅ | 오늘 이후 |
| 모집 팀원 수 | button group (1~5) | ✅ | 본인 제외 인원 수 |
| 소개글 | textarea | ✅ | 10~500자 |

#### 게시 후 자동 처리 (공모전)

```
POST /api/contest-matches
  → contest_matches INSERT (status: '모집중', current_count: 0)
  → contest_chat_rooms INSERT (팀 그룹 채팅방 자동 생성)
  → contest_chat_members INSERT (작성자 자동 멤버 등록)
```

---

### 5.5 공모전 목록 (/contest)

#### 유저 스토리
> "충청권 공모전 정보를 한눈에 보고 즐겨찾기에 저장하고 싶다."

#### 즐겨찾기 기능

```
- 각 공모전 카드 우상단 ★ 버튼 클릭 → 즐겨찾기 토글
- localStorage에 공모전 ID 배열 저장 (브라우저 재방문 시 유지)
- 페이지 상단 "즐겨찾기" 섹션에 즐겨찾기한 카드 표시
- 즐겨찾기 없을 시: "즐겨찾기한 공모전이 없습니다" 안내
- DB 저장 없음 → 서버 부하 없이 개인화 기능 제공
```

#### 지역별 공모전 탭

```
지원 지역 (4개):
  - 🏔️ 충청북도   (메인 색상: #1D4ED8 / 배경: #DBEAFE)
  - 🌊 충청남도   (메인 색상: #0F766E / 배경: #CCFBF1)
  - 🏛️ 세종특별자치시 (메인 색상: #7C3AED / 배경: #EDE9FE)
  - ⚗️ 대전광역시  (메인 색상: #B45309 / 배경: #FEF3C7)

카테고리 필터:
  전체 / 글·문학 / 디자인·미술 / 사진·영상 / IT·과학
  / 창업·마케팅 / 환경·사회 / 공학·기술 / 예술·공연

정적 공모전 데이터: 4개 지역, 총 17개
```

#### 공모전 자동 만료

```
정적 데이터:
  - isExpiredContest(deadline): deadline + 1일 < now() 이면 만료
  - getContestsByRegion(): 만료 공모전 자동 필터링 후 반환

외부 수집 데이터 (DB):
  - GET /api/external-contests: deadline > yesterday 인 레코드만 반환
  - Cron /api/cron/sync-contests: 매일 실행 → 만료 레코드 자동 DELETE
```

---

### 5.6 공모전 팀원 모집 (/contest/matches)

#### 유저 스토리
> "공모전 팀원을 모집하거나 팀에 합류하고 싶다. 남은 자리가 실시간으로 보이면 좋겠다."

#### 팀원 신청 플로우

```
[팀원 신청] 클릭 (status='모집중', remaining > 0, 본인 게시글 아닌 경우)
    ↓
POST /api/contest-matches/[id]/apply
    → contest_applications INSERT (status: 'pending')
    → notifications INSERT (게시글 작성자 수신)
    ↓
작성자 ContestMatchCard 내 신청 현황 또는 '내 정보 > 내 공모전'에서 처리
```

#### 실시간 남은 자리 표시

```
- ContestMatchCard: 남은 자리 배지 실시간 업데이트
  - 초록 (remaining >= 3): 여유 있음
  - 주황 (remaining <= 2): 마감 임박
  - 빨강 (remaining <= 1): 마지막 자리

- Supabase Realtime: 각 contest_matches 레코드 개별 구독
  채널: contest-match-update:[matchId]
  이벤트: UPDATE (filter: id=eq.[matchId])
  → 수락 발생 즉시 current_count 업데이트 → 남은 자리 감소 표시

- 폴링 폴백: 10초 간격 (Realtime 불안정 환경 대비)
```

#### 자동 마감 처리

```
팀 정원 충족 시 (current_count >= team_size):
  1. contest_matches.status = '마감' 으로 업데이트
  2. 목록 쿼리(status='모집중') 필터로 즉시 목록에서 제거
  3. 나머지 pending 신청자 전원 자동 거절 + 알림 발송
  4. 카드 즉시 숨김 처리 + "모집 완료" toast 표시
  5. 신청 버튼: remaining <= 0 이면 자동 disabled
  
  주의: contest_matches DB 레코드는 삭제하지 않음
  → contest_chat_rooms가 contest_match_id를 참조하므로
    cascade 삭제 시 팀 채팅 이력 손실 위험
  → status='마감' 상태로 목록 필터에서만 제외
```

#### 신청 수락 플로우 (작성자)

```
[수락] 클릭 (ContestMatchCard 또는 내 정보 > 내 공모전)
    ↓
PATCH /api/contest-applications/[id]/accept
    ↓
  1. contest_applications.status = 'accepted'
  2. contest_matches.current_count += 1
  3. current_count >= team_size → status = '마감'
  4. contest_chat_rooms 조회 → 없으면 자동 생성
  5. contest_chat_members에 신청자 추가 (그룹 채팅 자동 입장)
  6. notifications INSERT → 신청자에게 수락 알림
  7. 팀 가득 참 → 나머지 pending 신청자 자동 거절 + 알림 일괄 발송
```

---

### 5.7 메시지 시스템 (/messages)

#### 5.7.1 1:1 매치 채팅

##### 유저 스토리
> "매치 수락 후 상대방과 경기 장소, 시간 등을 직접 채팅으로 조율하고 싶다."

##### 채팅방 생성 조건

```
match_applications.status = 'accepted' 로 업데이트되는 순간
→ message_rooms 테이블에 자동 row INSERT
→ 양 참여자 모두 /messages 에서 해당 채팅방 접근 가능
```

##### 채팅방 나가기

```
- 메시지 목록 또는 채팅방 내 헤더 [나가기] 버튼 클릭
- 확인 다이얼로그 → 수락 시 DELETE /api/messages/[roomId]
- message_rooms + messages CASCADE 삭제 (양쪽 채팅 이력 삭제)
```

#### 5.7.2 공모전 팀 그룹 채팅

##### 유저 스토리
> "공모전 팀원이 모이면 그룹 채팅으로 협업하고 싶다."

##### 탭 구성

```
/messages
├── [매치 채팅] 탭      ← 1:1 매치 채팅방 목록
└── [공모전 팀 채팅] 탭  ← 공모전 그룹 채팅방 목록
```

##### 그룹 채팅방 생성 조건

```
contest_matches 게시글 작성 완료 시
→ contest_chat_rooms 자동 생성 (POST /api/contest-matches)
→ 작성자가 contest_chat_members에 자동 등록

신청자 수락 시 (accept API)
→ 수락된 신청자 contest_chat_members에 자동 추가
→ 신청자에게 "팀 채팅방에서 대화하세요" 알림 발송
```

##### 팀원 초대 기능 (팀장 전용)

```
그룹 채팅방 헤더 [팀원 초대] 버튼 (팀장만 표시)
    ↓
GET /api/contest-rooms/[id]/invite
    → 해당 공모전에 status='accepted'인 신청자 중 아직 채팅방 미참여자 반환
    ↓
초대 모달에서 팀원 선택 → [초대] 버튼 클릭
    ↓
POST /api/contest-rooms/[id]/invite
    → 보안 3중 검증:
        1. 요청자 = contest_match.author_id (팀장 여부)
        2. 초대 대상 = contest_applications.status='accepted' (수락된 신청자)
        3. 초대 대상이 이미 채팅방 멤버인 경우 → 409 Conflict 반환
    → 검증 통과 시 contest_chat_members INSERT
```

##### 채팅방 나가기 (그룹)

```
- 채팅방 내 헤더 [나가기] 버튼 또는 메시지 목록 [나가기] 버튼
- 확인 다이얼로그 → DELETE /api/contest-rooms/[id]/leave
- contest_chat_members에서 해당 유저만 제거 (멤버십만 삭제)
- 채팅방·메시지는 다른 팀원에게 그대로 유지
```

##### 실시간 채팅 구현

```
Supabase Realtime SUBSCRIBE
  채널: contest-chat:[roomId]
  이벤트: INSERT (contest_chat_messages)

신규 메시지 수신 시:
  → 메시지 목록 즉시 추가 + 자동 스크롤 다운
  → 발신자 닉네임 + 아바타 표시
  → 폴링 폴백: 3초 간격 (Realtime 불안정 환경 대비)
```

---

### 5.8 팀 후기 (/review)

#### 유저 스토리
> "매치가 끝난 후 상대팀의 매너를 별점으로 평가하고, 내가 받은 평가를 확인하고 싶다."

#### 평가 조건

```
평가 버튼 활성화 조건:
  1. match_applications.status = 'accepted' (매치 확정 상태)
  2. 해당 매치의 참여자 (작성자 또는 신청자)
  3. 해당 매치에 대해 아직 평가를 작성하지 않은 상태
     (reviews 테이블에 reviewer_id + match_id 조합 없음)
```

#### 평가 저장 로직

```
별점 선택 (1~5) + [평가 제출] 클릭
    ↓
POST /api/reviews
  reviews 테이블 INSERT
    ├─ reviewer_id: 현재 로그인 유저
    ├─ reviewee_id: 상대방
    ├─ match_id: 해당 매치
    └─ rating: 1~5
    ↓
이미 평가한 경우 → UNIQUE 제약으로 INSERT 차단
    ↓
상대방 프로필의 평균 별점 실시간 반영
```

---

### 5.9 알림 시스템 (/notifications)

#### 알림 유형 명세

| ID | 이벤트 | 수신자 | 메시지 |
|----|--------|--------|--------|
| N1 | 매치 신청 수신 | 매치글 작성자 | "[닉네임] 님이 매치를 신청했습니다. 실력: [수준]" |
| N2 | 매치 수락 | 신청자 | "매치가 수락되었습니다! [팀명]과의 매치가 확정됐어요." |
| N3 | 매치 거절 | 신청자 | "거절되었습니다." |
| N4 | 새 메시지 | 채팅 상대방 | "[닉네임]: [메시지 미리보기]" |
| N5 | 공모전 팀원 신청 수신 | 모집 게시글 작성자 | "[닉네임] 님이 공모전 팀원 신청했습니다." |
| N6 | 공모전 팀원 수락 | 신청자 | "[공모전명] 팀원 신청이 수락되었습니다! 팀 채팅방에서 대화하세요." |
| N7 | 공모전 팀원 거절 | 신청자 | "[공모전명] 팀원 신청이 거절되었습니다. (팀 정원 마감)" |
| N8 | 매치 취소 | 상대방 | "[닉네임] 님이 매치를 취소했습니다." |

#### 알림 처리 방식

```
Supabase Realtime 구독
  채널: notifications (filter: user_id=eq.[현재 유저 ID])
  이벤트: INSERT

수신 시:
  1. 헤더 알림 벨 아이콘에 배지 숫자 +1
  2. toast 메시지 우측 하단 팝업 (3초 자동 소멸)
  3. /notifications 페이지에 내역 누적
  4. 읽음 처리 시 배지 감소
```

---

### 5.10 내 정보 (/profile)

#### 유저 스토리
> "내 프로필을 확인하고 닉네임·실력 수준을 수정하고 싶다. 받은 신청과 지원한 신청을 한눈에 관리하고 싶다."

#### 탭 구성 (7개)

| 탭 | 내용 | 특이사항 |
|----|------|----------|
| 내 매치글 | 작성한 매치글 목록 | 수정(/match/[id]/edit) / 삭제 버튼 |
| 받은 신청 | 내 매치에 들어온 pending 신청 | 수락/거절 버튼, 10초 폴링 |
| 지원한 신청 | 내가 신청한 매치 목록 | pending 상태만 취소 버튼 표시 |
| 내 경기 | 확정된 매치 목록 | 매치 취소 버튼, 상대방 알림 |
| 내 공모전 | 참여 중인 공모전 목록 | D-Day 배지, 작성자/참여자 구분 |
| 캘린더 | 경기·공모전 일정 달력 | MatchCalendar 컴포넌트 |
| 매너 평가 | 받은 별점 이력 | 평균 별점, 매치별 평가 목록 |

#### 받은 신청 탭 상세

```
- 내 '모집중' 매치글에 들어온 pending 신청 목록 표시
- 신청 카드: 신청 매치명 + 신청자 닉네임 + 실력 수준
- [신청 수락] 버튼: PATCH /api/applications/[id]/accept
    → 매치 상태 '매치확정' + 채팅방 생성 + 알림 발송
- [신청 거절] 버튼: PATCH /api/applications/[id]/reject
    → 신청자에게 거절 알림
- 10초 폴링으로 신규 신청 자동 반영
- 탭 배지: 신청 건수 실시간 표시
```

#### 지원한 신청 탭 상세

```
- 내가 신청한 매치 목록 표시 (rejected 제외)
- 상태 배지: 검토 중(pending, 노랑) / 수락됨(accepted, 초록)
- pending 상태에만 [신청 취소] 버튼 표시
    → DELETE /api/applications/[id]/withdraw
    → match_applications 레코드 삭제
    → 매치 '모집중' 상태 유지 (자동 복원)
    → 매치 목록에서 "신청 완료" → "매치 신청" 즉시 복원
- accepted 상태: "🎉 수락되었습니다! 메시지에서 채팅방을 확인하세요" 표시
```

#### 프로필 카드 구성

```
┌──────────────────────────────────────┐
│  👤  [닉네임] ✏️편집                   │
│      [아이디]                          │
│                                      │
│  이름: [실명]      학번: 202*****       │
│  소속학과: 컴퓨터공학과                  │
│                                      │
│  실력 수준: [초급] [중급] [고수] 즉시저장 │
│  공모전 출전 횟수: [0~10+회] 즉시저장    │
└──────────────────────────────────────┘
```

---

### 5.11 자동화 시스템 (Cron Jobs)

#### 운영 자동화 명세

| Cron 경로 | 스케줄 (KST) | 동작 |
|-----------|-------------|------|
| `/api/cron/sync-contests` | 매일 00:00 | 외부 공모전 자동 수집(올콘·링커리어) + 만료 레코드 DELETE |
| `/api/cron/cleanup-matches` | 매일 00:00 | match_datetime 지난 매치 게시물 자동 DELETE |

#### vercel.json 설정

```json
{
  "crons": [
    { "path": "/api/cron/sync-contests",   "schedule": "0 15 * * *" },
    { "path": "/api/cron/cleanup-matches", "schedule": "0 15 * * *" }
  ]
}
```

> `"0 15 * * *"` = UTC 15:00 = KST 00:00

#### Cron 보안

```
- CRON_SECRET 환경변수를 헤더로 검증
- Authorization: Bearer ${CRON_SECRET} 불일치 시 401 반환
- 무단 외부 호출 차단
```

---

### 5.12 스포츠 시설 예약 (/sports) ← v2.2 신규

#### 유저 스토리
> "충북대 스포츠 시설의 예약 가능 시간을 확인하고, 같이 운동할 파트너를 찾고 싶다."

#### 화면 구성

```
┌───────────────────────────────────────────────────┐
│  시설 탭: [종합운동장] [풋살A] [풋살B] [농구A] [농구B]   │
│           [테니스A] [테니스B] [테니스C] [테니스D] [테니스E] │
├───────────────────────────────────────────────────┤
│  날짜 선택 (이전/다음 화살표)                         │
├───────────────────────────────────────────────────┤
│  {시설명} 예약 신청                                  │
│  ┌─ 09:00~10:00 ─────────────────────────────┐   │
│  │  🟢 예약 가능  [예약 가능 →] (클릭 시 공식 사이트)│   │
│  └──────────────────────────────────────────┘   │
│  ┌─ 10:00~11:00 ─────────────────────────────┐   │
│  │  🔴 예약 마감  (클릭 불가)                   │   │
│  └──────────────────────────────────────────┘   │
└───────────────────────────────────────────────────┘
```

#### 파트너 찾기 화면

```
- 선택한 시설·날짜·시간 요약 표시
- 스포츠 개인 프로필(sports_profiles)이 공개된 유저 카드 목록
- 유저 카드: 닉네임 / 나이 / 성별 / 관심 종목 / 운동 경력 / 선출 여부 / 자기소개
- [매칭 신청] 버튼 → 신청 메시지 입력(200자 이내) → 개인 매칭 요청 생성
```

#### 시설 목록

| 시설 ID | 시설명 |
|---------|--------|
| `futsal_a` | 풋살장 A |
| `futsal_b` | 풋살장 B |
| `basketball_a` | 농구장 A |
| `basketball_b` | 농구장 B |
| `tennis_a` ~ `tennis_e` | 테니스장 A~E |
| `small_field` | 소운동장 |
| `main_field` | 종합운동장 |

#### 예약 현황 자동 수집 (크롤링)

```
대상: 충북대학교 학생생활관/진흥원 시설 예약 시스템 공개 페이지
수집 주기: 매 1시간 (GitHub Actions cron)
수집 필드: 시설명, 예약 날짜, 시작/종료 시간, 예약 상태
처리: 기존 레코드와 비교 → 변경 시 UPDATE, 신규 시 INSERT
실패 시: 마지막 수집 데이터 유지 + "현재 정보를 불러올 수 없습니다" 안내 표시
```

---

### 5.13 개인 프로필 시스템 (/profile) ← v2.2 신규

#### 유저 스토리
> "공모전 또는 스포츠 매칭을 위한 상세 프로필을 등록하고, 다른 사람의 프로필을 보고 직접 매칭을 신청하고 싶다."

#### 공모전 개인 프로필 모달

```
입력 항목:
  - 학과 (텍스트 입력)
  - 성별 (male / female / other)
  - 나이 (숫자, 18~40)
  - 공모전 참여 횟수 (숫자)
  - 자격증 (태그 입력, 최대 10개)
  - 관심 분야 (다중 선택 — 마케팅·아이디어 / 영상·UCC·사진 / 디자인 / 문학·글 /
               IT·소프트웨어 / 예체능·음악·미술 / 학술·창업·논술)
  - 자기소개 (300자 이내)
  - 프로필 공개 여부 토글 (기본: 공개)

저장: PUT /api/profile/contest → contest_profiles UPSERT
```

#### 스포츠 개인 프로필 모달

```
입력 항목:
  - 성별 (male / female / other)
  - 나이 (숫자, 18~40)
  - 관심 종목 (다중 선택 — 풋살 / 농구 / 테니스 / 기타)
  - 운동 경력 (년 단위 숫자)
  - 선출 여부 토글 (기본: 비선출)
  - 자기소개 (300자 이내)
  - 프로필 공개 여부 토글 (기본: 공개)

저장: PUT /api/profile/sports → sports_profiles UPSERT
```

#### 개인 간 매칭 신청 플로우

```
[매칭 신청] 클릭 (상대방 프로필 카드)
    │
    ├─ 본인? → 신청 불가
    ├─ 이미 대기중 신청 존재? → "이미 신청한 상대입니다." toast
    │
    └─ 신청 메시지 입력(200자 이내) → 확인 클릭
        ↓
        POST /api/profile-matches
        → profile_matches INSERT (status: 'pending')
        → notifications INSERT (수신자 알림)
        ↓
        수신자 /profile > 받은 신청 탭에서 처리
            ├─ 수락 → status='accepted', 양측 이메일 공개 알림
            └─ 거절 → status='rejected', 신청자 알림
```

#### 아바타 이미지 업로드

```
/profile > 프로필 카드 내 아바타 영역 클릭
→ 파일 선택 (JPG/PNG, 최대 2MB)
→ POST /api/profile/avatar → Supabase Storage 업로드
→ profiles.avatar_url 업데이트
→ 헤더·프로필 카드 즉시 반영
```

---

### 5.14 신고 시스템 ← v2.2 신규

#### 유저 스토리
> "불쾌하거나 허위 정보를 가진 유저를 신고해 신뢰 있는 커뮤니티를 유지하고 싶다."

#### 신고 접수 플로우

```
유저 카드 내 [신고] 버튼 클릭
    ↓
신고 사유 선택 (단일 선택):
  - 불쾌한 언행
  - 허위 정보
  - 스팸
  - 기타

상세 내용 입력 (선택, 최대 500자)
    ↓
POST /api/reports
→ reports INSERT (status: 'pending')
→ "신고가 접수되었습니다." toast
```

#### 자동 제재 정책

```
신고 누적 3회 이상:
  1. profiles.is_active = false (자동 비공개)
  2. 모든 게시글 목록 노출 차단
  3. 관리자 알림 발송

관리자 검토 후:
  - 1차 위반: 경고 + 프로필 수정 요청
  - 2차 위반: 30일 계정 정지
  - 3차 위반: 영구 퇴출
```

---

### 5.15 Claude AI 기능 ← v2.2 신규

#### 기능 목록

| 기능 | 호출 시점 | 처리 방식 |
|------|-----------|-----------|
| 공모전 요약 | 공모전 상세 페이지 최초 로드 | 크롤링한 공모전 본문을 2~3줄로 요약 |
| 매칭 추천 이유 | 프로필 매칭 신청 시 | 두 유저 프로필 비교 → "이 사람과 잘 맞는 이유" 한 줄 생성 |
| 프로필 작성 도우미 | 개인 프로필 자기소개 작성 시 | 입력한 정보 기반 자기소개 초안 생성 |

#### 구현 원칙

```
- 모든 Claude API 호출은 서버 사이드 전용 (ANTHROPIC_API_KEY 클라이언트 노출 금지)
- API Route: POST /api/ai/summarize, POST /api/ai/match-reason, POST /api/ai/profile-draft
- Claude API 오류 발생 시: AI 기능만 비활성화, 나머지 서비스 정상 운영
- 호출 빈도 최소화: 공모전 요약은 최초 1회만 생성 후 DB 캐시 (external_contests.summary 컬럼)
- 모델: claude-sonnet-4-6 (최신 Sonnet 모델 사용)
```

---

### 5.16 관리자 대시보드 (/admin) ← v2.2 신규

#### 접근 조건

```
profiles.role = 'admin' 인 사용자만 접근 가능
미인증 또는 일반 사용자 접근 시 /match 리다이렉트
```

#### 주요 기능

| 메뉴 | 내용 |
|------|------|
| 신고 관리 | pending 신고 목록, 신고자·피신고자 정보, 처리(경고/정지/퇴출/기각) |
| 회원 관리 | 전체 회원 목록, is_active 토글, role 변경 |
| 공모전 데이터 | 크롤링된 공모전 목록, 수동 is_active 처리 |
| 크롤링 현황 | 마지막 크롤링 시각, 실패 로그 확인 |

---

### 5.17 크롤링 시스템 확장 ← v2.2 신규

#### 공모전 크롤링 대상 확장

```
기존 (v2.1): 올콘, 링커리어
추가 (v2.2): 공모전닷컴(contestkorea.com), 위비티(wevity.com)

수집 필드: 제목, 주최기관, 분야, 접수 시작일, 마감일, 시상내역, 지원 대상, URL, 썸네일

분야 매핑 규칙:
  marketing  ← 마케팅, 아이디어, 광고, 홍보
  video      ← 영상, UCC, 사진, 영화
  design     ← 디자인, UI/UX, 캐릭터
  literature ← 문학, 글쓰기, 시, 소설, 수필
  it         ← IT, 소프트웨어, 개발, 해커톤, 앱
  arts       ← 예체능, 음악, 미술, 공연
  academic   ← 학술, 창업, 논술, 스타트업
```

#### GitHub Actions Workflow (공모전 크롤링)

```yaml
name: Contest Crawl
on:
  schedule:
    - cron: '0 17 * * *'  # UTC 17:00 = KST 02:00
  workflow_dispatch:

jobs:
  crawl:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - run: pip install -r crawlers/requirements.txt
      - run: python crawlers/contest_crawler.py
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
```

#### GitHub Actions Workflow (시설 예약 현황)

```yaml
name: Sports Reservation Crawl
on:
  schedule:
    - cron: '0 * * * *'  # 매 1시간마다

jobs:
  crawl:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - run: pip install -r crawlers/requirements.txt
      - run: python crawlers/reservation_crawler.py
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
```

> **주의**: 크롤링 가능 여부는 로그인 불필요한 공개 페이지 기준 사전 확인 필요.  
> 사이트 구조 변경 시 크롤러 수동 업데이트 필요. 실패 시 기존 DB 데이터 유지.

---

## 6. 데이터베이스 설계

### 6.1 ERD (Entity Relationship Diagram)

```
auth.users (Supabase 내장)
    │ 1
    ▼ N
profiles
    ├─ id            UUID  PK (FK → auth.users.id)
    ├─ username      TEXT  UNIQUE
    ├─ nickname      TEXT  UNIQUE
    ├─ full_name     TEXT
    ├─ student_id    CHAR(8)
    ├─ skill_level   ENUM  초급/중급/고수
    ├─ department    TEXT
    ├─ contest_count INTEGER  DEFAULT 0
    ├─ avatar_url    TEXT  (Supabase Storage URL)
    ├─ role          TEXT  DEFAULT 'user'  CHECK(user/admin)
    ├─ is_active     BOOLEAN  DEFAULT true
    ├─ created_at    TIMESTAMPTZ
    └─ updated_at    TIMESTAMPTZ

profiles ──1──< matches
    ├─ id             UUID  PK
    ├─ author_id      UUID  FK → profiles.id
    ├─ team_name      TEXT
    ├─ sport          ENUM  축구/풋살/농구/e스포츠
    ├─ match_size     ENUM  1vs1/3vs3/5vs5/11vs11
    ├─ location       TEXT
    ├─ description    TEXT
    ├─ required_level ENUM  초급/중급/고수
    ├─ status         ENUM  모집중/매치확정/취소됨
    ├─ match_datetime TIMESTAMPTZ  (경기 일정, nullable)
    ├─ created_at     TIMESTAMPTZ
    └─ updated_at     TIMESTAMPTZ

matches ──1──< match_applications
    ├─ id           UUID  PK
    ├─ match_id     UUID  FK → matches.id
    ├─ applicant_id UUID  FK → profiles.id
    ├─ status       ENUM  pending/accepted/rejected
    ├─ created_at   TIMESTAMPTZ
    └─ updated_at   TIMESTAMPTZ
    UNIQUE(match_id, applicant_id)

match_applications ──1──1 message_rooms
    ├─ id              UUID  PK
    ├─ application_id  UUID  FK → match_applications.id
    ├─ participant_1   UUID  FK → profiles.id
    ├─ participant_2   UUID  FK → profiles.id
    └─ created_at      TIMESTAMPTZ

message_rooms ──1──< messages
    ├─ id         UUID  PK
    ├─ room_id    UUID  FK → message_rooms.id
    ├─ sender_id  UUID  FK → profiles.id
    ├─ content    TEXT
    ├─ is_read    BOOLEAN  DEFAULT false
    └─ created_at TIMESTAMPTZ

matches ──1──< reviews
    ├─ id          UUID  PK
    ├─ match_id    UUID  FK → matches.id
    ├─ reviewer_id UUID  FK → profiles.id
    ├─ reviewee_id UUID  FK → profiles.id
    ├─ rating      SMALLINT  CHECK(1~5)
    └─ created_at  TIMESTAMPTZ
    UNIQUE(match_id, reviewer_id)

profiles ──1──< notifications
    ├─ id         UUID  PK
    ├─ user_id    UUID  FK → profiles.id
    ├─ type       ENUM  match_apply/match_accept/match_reject/match_cancel/
    │                   new_message/contest_apply/contest_accept/contest_reject
    ├─ message    TEXT
    ├─ related_id UUID
    ├─ is_read    BOOLEAN  DEFAULT false
    └─ created_at TIMESTAMPTZ

── 공모전 관련 테이블 ─────────────────────────────────────

profiles ──1──< contest_matches
    ├─ id               UUID  PK
    ├─ author_id        UUID  FK → profiles.id
    ├─ contest_name     TEXT
    ├─ contest_category TEXT
    ├─ region           TEXT
    ├─ deadline         DATE
    ├─ team_size        INTEGER  CHECK(1~5)
    ├─ current_count    INTEGER  DEFAULT 0
    ├─ description      TEXT
    ├─ status           ENUM  모집중/마감
    ├─ created_at       TIMESTAMPTZ
    └─ updated_at       TIMESTAMPTZ

contest_matches ──1──< contest_applications
    ├─ id                UUID  PK
    ├─ contest_match_id  UUID  FK → contest_matches.id
    ├─ applicant_id      UUID  FK → profiles.id
    ├─ status            ENUM  pending/accepted/rejected
    ├─ created_at        TIMESTAMPTZ
    └─ updated_at        TIMESTAMPTZ
    UNIQUE(contest_match_id, applicant_id)

contest_matches ──1──1 contest_chat_rooms
    ├─ id                UUID  PK
    ├─ contest_match_id  UUID  FK → contest_matches.id  UNIQUE
    ├─ name              TEXT
    └─ created_at        TIMESTAMPTZ

contest_chat_rooms ──1──< contest_chat_members
    ├─ id        UUID  PK
    ├─ room_id   UUID  FK → contest_chat_rooms.id
    ├─ user_id   UUID  FK → profiles.id
    └─ joined_at TIMESTAMPTZ
    UNIQUE(room_id, user_id)

contest_chat_rooms ──1──< contest_chat_messages
    ├─ id         UUID  PK
    ├─ room_id    UUID  FK → contest_chat_rooms.id
    ├─ sender_id  UUID  FK → profiles.id
    ├─ content    TEXT
    └─ created_at TIMESTAMPTZ

── 외부 공모전 (자동 수집) ──────────────────────────────────

external_contests
    ├─ id          UUID  PK
    ├─ title       TEXT
    ├─ url         TEXT  UNIQUE
    ├─ category    TEXT
    ├─ organizer   TEXT
    ├─ deadline    DATE
    ├─ source      TEXT  ('all-con' | 'linkareer' | 'contestkorea' | 'wevity')
    ├─ description TEXT
    ├─ summary     TEXT  (Claude AI 요약, 최초 1회 캐시)
    ├─ prize       TEXT
    ├─ target      TEXT
    ├─ thumbnail_url TEXT
    └─ created_at  TIMESTAMPTZ

── 개인 프로필 (v2.2 신규) ──────────────────────────────

profiles ──1──1 contest_profiles
    ├─ id              UUID  PK
    ├─ user_id         UUID  FK → profiles.id  UNIQUE
    ├─ department      TEXT
    ├─ gender          TEXT  CHECK(male/female/other)
    ├─ age             INTEGER  CHECK(18~40)
    ├─ contest_count   INTEGER  DEFAULT 0
    ├─ certificates    TEXT[]
    ├─ fields          TEXT[]
    ├─ intro           TEXT  (300자 이내)
    ├─ is_visible      BOOLEAN  DEFAULT true
    ├─ created_at      TIMESTAMPTZ
    └─ updated_at      TIMESTAMPTZ

profiles ──1──1 sports_profiles
    ├─ id              UUID  PK
    ├─ user_id         UUID  FK → profiles.id  UNIQUE
    ├─ gender          TEXT  CHECK(male/female/other)
    ├─ age             INTEGER  CHECK(18~40)
    ├─ sports          TEXT[]
    ├─ career_years    INTEGER  DEFAULT 0
    ├─ is_pro          BOOLEAN  DEFAULT false
    ├─ intro           TEXT  (300자 이내)
    ├─ is_visible      BOOLEAN  DEFAULT true
    ├─ created_at      TIMESTAMPTZ
    └─ updated_at      TIMESTAMPTZ

sports_reservations (시설 예약 현황 - 크롤링 데이터)
    ├─ id               UUID  PK
    ├─ facility         TEXT  CHECK(futsal_a/futsal_b/basketball_a/basketball_b/
    │                              tennis_a/tennis_b/tennis_c/tennis_d/tennis_e/
    │                              small_field/main_field)
    ├─ reservation_date DATE
    ├─ start_time       TIME
    ├─ end_time         TIME
    ├─ status           TEXT  CHECK(available/reserved/closed)
    ├─ last_crawled_at  TIMESTAMPTZ
    UNIQUE(facility, reservation_date, start_time)

profiles ──1──< profile_matches (개인 간 매칭 요청)
    ├─ id            UUID  PK
    ├─ type          TEXT  CHECK(contest/sports)
    ├─ requester_id  UUID  FK → profiles.id
    ├─ receiver_id   UUID  FK → profiles.id
    ├─ message       TEXT  (200자 이내)
    ├─ status        TEXT  CHECK(pending/accepted/rejected/cancelled)
    ├─ created_at    TIMESTAMPTZ
    └─ updated_at    TIMESTAMPTZ
    UNIQUE(requester_id, receiver_id, type)

profiles ──1──< reports (신고)
    ├─ id           UUID  PK
    ├─ reporter_id  UUID  FK → profiles.id
    ├─ reported_id  UUID  FK → profiles.id
    ├─ reason       TEXT  CHECK('불쾌한 언행'/'허위 정보'/'스팸'/'기타')
    ├─ detail       TEXT
    ├─ status       TEXT  CHECK(pending/resolved/dismissed)
    └─ created_at   TIMESTAMPTZ
```

### 6.2 Row Level Security (RLS) 정책

| 테이블 | SELECT | INSERT | UPDATE | DELETE |
|--------|--------|--------|--------|--------|
| `profiles` | 전체 허용 | 본인만 | 본인만 | 불가 |
| `matches` | 전체 허용 | 로그인 유저 | 본인(author_id) | 본인(author_id) |
| `match_applications` | 관련 당사자 | 로그인 유저 | 관련 당사자 | 신청자(본인) |
| `message_rooms` | 참여자만 | 시스템(accept API) | 불가 | 참여자 |
| `messages` | 참여자만 | 참여자 | 불가 | 불가 |
| `reviews` | 전체 허용 | 매치 참여자 | 불가 | 불가 |
| `notifications` | 본인만 | 시스템 | 본인만 | 불가 |
| `contest_matches` | 전체 허용 | 로그인 유저 | 본인(author_id) | 본인(author_id) |
| `contest_applications` | 관련 당사자 | 로그인 유저 | 관련 당사자 | 신청자(본인) |
| `contest_chat_rooms` | 멤버만 | 시스템 | 불가 | 불가 |
| `contest_chat_members` | 멤버만 | 시스템(3중 검증) | 불가 | 본인 |
| `contest_chat_messages` | 멤버만 | 멤버 | 불가 | 불가 |
| `external_contests` | 전체 허용 | admin만 | admin만 | admin만 |
| `contest_profiles` | is_visible=true 전체 / 본인 전체 | 본인만 | 본인만 | 본인만 |
| `sports_profiles` | is_visible=true 전체 / 본인 전체 | 본인만 | 본인만 | 본인만 |
| `sports_reservations` | 전체 허용 | admin만(크롤러) | admin만(크롤러) | admin만(크롤러) |
| `profile_matches` | 당사자(requester/receiver)만 | 로그인 유저 | 당사자 | 신청자(본인) |
| `reports` | 신고자 본인 / admin | 로그인 유저 | admin만 | 불가 |

> RLS를 우회해야 하는 서버 작업(수락 처리, 알림 삽입 등)은 supabaseAdmin (SERVICE_ROLE_KEY) 클라이언트 사용

---

## 7. API 설계

> Next.js API Routes (`/app/api/`) 기반 서버리스 함수  
> 모든 인증 필요 API는 Supabase Auth 세션 검증 수행

### 7.1 인증 API

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/api/auth/signup` | 회원가입 |
| POST | `/api/auth/login` | 로그인 |
| POST | `/api/auth/logout` | 로그아웃 |
| GET | `/api/auth/check-username` | 아이디 중복 확인 |
| GET | `/api/auth/check-nickname` | 닉네임 중복 확인 |

### 7.2 매치 API

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/matches` | 매치 목록 조회 (status='모집중', 만료 필터) |
| POST | `/api/matches` | 매치글 작성 |
| PUT | `/api/matches/[id]` | 매치글 수정 (author_id 서버 검증) |
| DELETE | `/api/matches/[id]` | 매치글 삭제 (author_id 서버 검증) |
| PATCH | `/api/matches/[id]/cancel` | 확정 매치 취소 + 상대방 알림 |

### 7.3 매치 신청 API

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/api/matches/[id]/apply` | 매치 신청 (중복 신청 방지) |
| PATCH | `/api/applications/[id]/accept` | 매치 수락 → 매치확정 + 채팅방 생성 + 알림 |
| PATCH | `/api/applications/[id]/reject` | 매치 거절 + 신청자 알림 |
| DELETE | `/api/applications/[id]/withdraw` | 대기중 신청 취소 (신청자 본인만) |

### 7.4 후기 API

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/reviews` | 내가 받은 후기 목록 |
| POST | `/api/reviews` | 후기 작성 (UNIQUE 제약으로 중복 방지) |

### 7.5 1:1 매치 메시지 API

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/messages` | 내 채팅방 목록 조회 |
| GET | `/api/messages/[roomId]` | 특정 채팅방 메시지 조회 |
| POST | `/api/messages/[roomId]` | 메시지 전송 |
| DELETE | `/api/messages/[roomId]` | 채팅방 나가기 (message_rooms + messages CASCADE 삭제) |

### 7.6 알림 API

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/notifications` | 알림 목록 조회 |
| PATCH | `/api/notifications/[id]/read` | 알림 읽음 처리 |
| PATCH | `/api/notifications/read-all` | 전체 읽음 처리 |

### 7.7 공모전 팀원 모집 API

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/contest-matches` | 팀원 모집 목록 (status='모집중'만) |
| POST | `/api/contest-matches` | 팀원 모집 게시글 작성 + 채팅방 자동 생성 |
| POST | `/api/contest-matches/[id]/apply` | 팀원 신청 (중복 방지) |
| PATCH | `/api/contest-applications/[id]/accept` | 신청 수락 + 채팅방 자동 입장 + 자동 마감 처리 |
| PATCH | `/api/contest-applications/[id]/reject` | 신청 거절 + 알림 |

### 7.8 공모전 그룹 채팅 API

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/contest-rooms` | 참여 중인 그룹 채팅방 목록 |
| GET | `/api/contest-rooms/[id]/messages` | 그룹 채팅방 메시지 조회 |
| POST | `/api/contest-rooms/[id]/messages` | 메시지 전송 (멤버 검증) |
| DELETE | `/api/contest-rooms/[id]/leave` | 채팅방 나가기 (멤버십만 제거) |
| GET | `/api/contest-rooms/[id]/invite` | 초대 가능 멤버 목록 (수락된 신청자 중 미참여자) |
| POST | `/api/contest-rooms/[id]/invite` | 팀원 초대 (3중 보안 검증) |

### 7.9 외부 공모전 API

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/external-contests` | 자동 수집 외부 공모전 목록 (deadline > yesterday) |

### 7.10 개인 프로필 API (v2.2 신규)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/profile/contest` | 내 공모전 개인 프로필 조회 |
| PUT | `/api/profile/contest` | 공모전 개인 프로필 저장 (UPSERT) |
| GET | `/api/profile/sports` | 내 스포츠 개인 프로필 조회 |
| PUT | `/api/profile/sports` | 스포츠 개인 프로필 저장 (UPSERT) |
| POST | `/api/profile/avatar` | 아바타 이미지 업로드 (Supabase Storage) |
| GET | `/api/users/[id]/contest-profile` | 타 유저 공모전 프로필 조회 (is_visible=true만) |
| GET | `/api/users/[id]/sports-profile` | 타 유저 스포츠 프로필 조회 (is_visible=true만) |

### 7.11 스포츠 시설 예약 API (v2.2 신규)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/sports/reservations` | 시설 예약 현황 조회 (날짜·시설 필터) |
| GET | `/api/sports/partners` | 해당 시설·시간대 매칭 가능 파트너 목록 |

### 7.12 개인 매칭 API (v2.2 신규)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/profile-matches` | 내 개인 매칭 목록 (보낸/받은) |
| POST | `/api/profile-matches` | 개인 매칭 신청 (중복 방지) |
| PATCH | `/api/profile-matches/[id]/accept` | 매칭 수락 + 알림 |
| PATCH | `/api/profile-matches/[id]/reject` | 매칭 거절 + 알림 |
| DELETE | `/api/profile-matches/[id]` | 매칭 신청 취소 |

### 7.13 신고 API (v2.2 신규)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/api/reports` | 신고 접수 |
| GET | `/api/admin/reports` | 신고 목록 (관리자 전용) |
| PATCH | `/api/admin/reports/[id]` | 신고 처리 (관리자 전용) |

### 7.14 Claude AI API (v2.2 신규)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/api/ai/summarize` | 공모전 요약 생성 (DB 캐시 우선) |
| POST | `/api/ai/match-reason` | 매칭 추천 이유 생성 |
| POST | `/api/ai/profile-draft` | 자기소개 초안 생성 |

### 7.15 자동화 Cron API

| 메서드 | 경로 | 스케줄 | 설명 |
|--------|------|--------|------|
| GET | `/api/cron/sync-contests` | 매일 00:00 KST | 외부 공모전 자동 수집 + 만료 레코드 삭제 |
| GET | `/api/cron/cleanup-matches` | 매일 00:00 KST | 경기 날짜 지난 매치 자동 삭제 |

---

## 8. UI/UX 가이드라인

### 8.1 컬러 팔레트

| 용도 | 색상 | HEX |
|------|------|-----|
| Primary (메인) | 충북대 청색 계열 | `#1E3A5F` |
| Accent (강조) | 활동적인 주황색 | `#FF6B35` |
| Success (수락) | 초록색 | `#22C55E` |
| Danger (거절·삭제) | 빨간색 | `#EF4444` |
| Background | 연한 회색 | `#F8FAFC` |
| Card | 흰색 | `#FFFFFF` |
| Contest (공모전) | 노란색 | `#EAB308` |

### 8.2 종목별 색상 배지

| 종목 | 이모티콘 | 배지 색상 |
|------|----------|-----------|
| 축구 | ⚽ | `#16A34A` (초록) |
| 풋살 | 🥅 | `#2563EB` (파랑) |
| 농구 | 🏀 | `#EA580C` (주황) |
| e스포츠 | 🎮 | `#7C3AED` (보라) |

### 8.3 수준별 배지

| 수준 | 색상 |
|------|------|
| 초급 | `#86EFAC` (연초록) |
| 중급 | `#FCD34D` (노랑) |
| 고수 | `#F87171` (빨강) |

### 8.4 공모전 지역별 색상

| 지역 | 이모지 | 메인 색상 | 배경 색상 |
|------|--------|-----------|-----------|
| 충청북도 | 🏔️ | `#1D4ED8` | `#DBEAFE` |
| 충청남도 | 🌊 | `#0F766E` | `#CCFBF1` |
| 세종특별자치시 | 🏛️ | `#7C3AED` | `#EDE9FE` |
| 대전광역시 | ⚗️ | `#B45309` | `#FEF3C7` |

### 8.5 남은 자리 표시 색상 (ContestMatchCard)

| 남은 자리 | 색상 |
|-----------|------|
| 3명 이상 | 초록 `green-100/700` |
| 2명 이하 | 주황 `orange-100/600` |
| 1명 이하 | 빨강 `red-100/600` |

### 8.6 핵심 컴포넌트 목록

| 컴포넌트 | 역할 |
|----------|------|
| `MatchCard` | 매치 목록 카드 — 신청 버튼, 수정 버튼(본인), 신청 현황(본인) |
| `PendingApplications` | 매치 신청 현황 — 넓은 카드, 수락/거절 버튼 |
| `ContestMatchCard` | 공모전 팀원 모집 카드 — 실시간 남은 자리, 신청 현황 |
| `FilterBar` | 종목/수준 필터 버튼 그룹 |
| `NotificationBell` | 헤더 알림 아이콘 + 배지 카운트 |
| `NotificationDropdown` | 알림 목록 드롭다운 |
| `StarRating` | 별점 입력/표시 컴포넌트 (1~5) |
| `ChatBubble` | 채팅 메시지 말풍선 |
| `ProfileCard` | 내 정보 카드 (닉네임 편집, 실력 즉시저장) |
| `MatchCalendar` | 경기·공모전 일정 달력 |
| `InviteModal` | 팀원 초대 모달 (공모전 그룹 채팅방용) |
| `EmptyState` | 빈 목록 안내 컴포넌트 |
| `PageSpinner` | 페이지 로딩 스피너 |
| `Toast` | 실시간 알림 팝업 (react-hot-toast) |

---

## 9. 비기능 요구사항

### 9.1 성능

| 항목 | 목표 |
|------|------|
| 페이지 첫 로드 (LCP) | 2.5초 이내 |
| 실시간 알림 지연 | 2초 이내 |
| 채팅 메시지 전달 | 1초 이내 |
| API 응답 시간 | 500ms 이내 |
| 실시간 구독 폴링 폴백 | 3초 (채팅) / 10초 (신청 목록) |

### 9.2 보안

- Supabase RLS로 인증된 사용자만 데이터 접근 (서버 사이드 검증 병행)
- JWT 토큰 만료 시 자동 갱신 (Supabase Auth 내장)
- 학번 데이터는 마스킹 후 표시 (`202*****`)
- 비밀번호는 Supabase Auth에서 bcrypt 해시 처리
- 매치글 수정/삭제: API에서 author_id = 현재 유저 ID 검증
- 공모전 팀원 초대: 3중 검증 (팀장 여부 + 수락 상태 + 미참여 여부)
- Cron Job: `CRON_SECRET` 환경변수로 무단 호출 방지

### 9.3 접근성 및 호환성

| 항목 | 지원 범위 |
|------|-----------|
| 브라우저 | Chrome 90+, Firefox 88+, Safari 14+, Edge 90+ |
| 기기 | PC, 태블릿, 모바일 (반응형 Tailwind) |
| 최소 해상도 | 375px (모바일 기준) |

### 9.4 확장성

- Supabase 무료 플랜 기준 설계, 트래픽 증가 시 Pro 플랜 전환
- Next.js App Router 구조로 기능 단위 분리 및 확장 용이
- Vercel Cron Jobs로 자동화 운영 비용 최소화
- localStorage 기반 즐겨찾기로 DB 부하 없이 개인화 기능 제공

---

## 10. 개발 로드맵

### Phase 1 — 핵심 기능 (MVP)
```
Week 1-2:
  ✅ 프로젝트 세팅 (Next.js 14 + Supabase + Vercel)
  ✅ DB 스키마 및 RLS 설정
  ✅ 회원가입 (학과 선택 포함) / 로그인

Week 3-4:
  ✅ 매치글 작성 (경기 날짜·시간 포함)
  ✅ 매치 목록 (종목·수준 필터)
  ✅ 매치 신청 + 알림 시스템 (Supabase Realtime)
```

### Phase 2 — 커뮤니케이션
```
Week 5-6:
  ✅ 매치 수락/거절 처리
  ✅ 1:1 매치 채팅 (Realtime + 폴링 폴백)
  ✅ 내 정보 페이지 + 프로필 수정
  ✅ 매치 취소 + 상대방 알림
```

### Phase 3 — 평가 및 완성도
```
Week 7-8:
  ✅ 팀 후기 / 별점 평가
  ✅ 알림 센터 페이지
  ✅ 전체 UI 다듬기
  ✅ Vercel 배포 + 도메인 연결
```

### Phase 4 — 공모전 기능
```
Week 9-10:
  ✅ 공모전 목록 (충북·충남 지역)
  ✅ 공모전 팀원 모집 게시글 작성·신청
  ✅ 공모전 그룹 채팅 (자동 생성·나가기)
  ✅ 지역 확장: 세종특별자치시·대전광역시 추가
  ✅ 실제 공모전 데이터 17개 입력 (4개 지역)
```

### Phase 5 — 자동화 및 UX 개선
```
Week 11-12:
  ✅ 공모전 자동 만료 삭제 (마감일 +1일 기준)
  ✅ 매치 경기 날짜 기반 자동 삭제 Cron
  ✅ 공모전 즐겨찾기 (localStorage)
  ✅ 팀원 초대 기능 (보안 3중 검증)
  ✅ 내 정보 > 받은 신청·지원한 신청 탭 추가
  ✅ 실시간 남은 자리 표시 + 자동 마감
  ✅ 신청 취소 후 재신청 즉시 복원
  ✅ 매치 신청 카드 UI 개선 (PendingApplications 컴포넌트)
  ✅ 외부 공모전 자동 수집 Cron (올콘·링커리어)
```

### Phase 6 — 수정 기능 및 UX 고도화 (v2.1)
```
  ✅ 매치글 수정 전용 페이지 /match/[id]/edit 추가
  ✅ MatchCard '내 게시글' 영역에 수정 버튼(✏️) 추가
  ✅ 수정 완료 시 Realtime(event:UPDATE)으로 모든 사용자 화면 즉시 반영
  ✅ 내 정보 > 내 매치글 탭에서도 수정 페이지로 이동
```

### Phase 7 — 개인 프로필 & 시설 예약 (v2.2)
```
  ✅ 개인 공모전/스포츠 프로필 모달 (contest_profiles, sports_profiles)
  ✅ 스포츠 시설 예약 현황 페이지 (/sports) + 타임라인 UI
  ✅ 파트너 찾기 화면 (스포츠 개인 프로필 기반)
  ✅ 개인 간 매칭 신청·수락·거절 (profile_matches)
  ✅ 아바타 이미지 업로드 (Supabase Storage)
  ✅ 시설 예약 현황 크롤러 (GitHub Actions, 1시간 주기)
  ✅ 공모전 크롤러 확장 (contestkorea, wevity 추가)
```

### Phase 8 — AI & 신고 & 관리자 (v2.2)
```
  ✅ Claude AI 공모전 요약 (DB 캐시)
  ✅ Claude AI 매칭 추천 이유 생성
  ✅ Claude AI 프로필 작성 도우미
  ✅ 신고 시스템 (신고 접수, 3회 자동 비공개)
  ✅ 관리자 대시보드 (/admin) — 신고 처리, 회원 관리
  □ 비밀번호 찾기 (이메일 재설정 링크)
  □ 회원탈퇴 (30일 데이터 보존 후 자동 삭제)
```

---

## 11. 리스크 및 제약사항

| 리스크 | 영향도 | 대응 방안 |
|--------|--------|-----------|
| 학번 검증 불완전 | 중 | 8자리 형식 + 입학연도 범위 검사로 최소 필터링 |
| Supabase Realtime 연결 불안정 | 중 | 재연결 로직 구현, Polling 폴백 (3~10초) |
| 동시 다중 매치 신청 충돌 | 중 | DB UNIQUE 제약 + RLS로 방지 |
| Supabase 무료 플랜 한계 | 낮 | 초기 소규모 서비스에 충분, 초과 시 유료 전환 |
| 모바일 실시간 채팅 배터리 소모 | 낮 | 탭 비활성 시 구독 일시 해제 검토 |
| 외부 공모전 사이트 구조 변경 | 중 | 스크래핑 로직 정기 점검, 실패 시 빈 배열 반환으로 graceful 처리 |
| 팀원 초대 권한 우회 | 높 | 3중 검증 (팀장 여부 + 수락 상태 + 미참여 여부) |
| localStorage 즐겨찾기 데이터 소실 | 낮 | 브라우저 캐시 삭제 시 리셋 허용 (서버 저장 불필요) |
| Serverless timeout (매칭 로직) | 낮 | Vercel 함수 max 10초 이내 처리, 복잡 로직은 분리 |
| 매치글 수정 중 상태 변경 충돌 | 낮 | 수정 API에서 현재 status 재확인 후 처리 |
| 시설 예약 사이트 구조 변경 | 중 | 크롤러 정기 점검, 실패 시 마지막 수집 데이터 유지 |
| Claude API 비용 초과 | 중 | 공모전 요약은 최초 1회만 생성 후 DB 캐시, 호출 횟수 모니터링 |
| 신고 어뷰징 (허위 신고) | 중 | 관리자 최종 검토 필수, 자동 처리는 비공개까지만 |
| 아바타 이미지 용량 초과 | 낮 | 클라이언트 2MB 제한 + 서버 재검증 |
| 개인정보 (성별·나이) 노출 | 중 | is_visible=false 설정 시 다른 유저에게 완전 비노출 |

---

## 부록

### A. 환경 변수 목록

```env
# Supabase 연결
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Vercel Cron 인증
CRON_SECRET=

# Anthropic Claude API (서버 사이드 전용 — 클라이언트 노출 금지)
ANTHROPIC_API_KEY=

# Next.js (필요 시)
NEXTAUTH_URL=
NEXTAUTH_SECRET=
```

### B. 폴더 구조

```
cbnumatch/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (main)/
│   │   ├── match/
│   │   │   ├── page.tsx                    ← 매치 목록
│   │   │   ├── write/page.tsx              ← 매치글 작성 (스포츠/공모전 탭)
│   │   │   └── [id]/edit/page.tsx          ← 매치글 수정 (v2.1 신규)
│   │   ├── contest/
│   │   │   ├── page.tsx                    ← 공모전 목록 (즐겨찾기 + 지역별)
│   │   │   └── matches/page.tsx            ← 공모전 팀원 모집 목록
│   │   ├── sports/
│   │   │   ├── page.tsx                    ← 시설 예약 현황 + 파트너 찾기 (v2.2)
│   │   │   └── partners/page.tsx           ← 파트너 목록 (슬롯 선택 후)
│   │   ├── admin/
│   │   │   └── page.tsx                    ← 관리자 대시보드 (v2.2)
│   │   ├── review/page.tsx                 ← 팀 후기
│   │   ├── messages/
│   │   │   ├── page.tsx                    ← 메시지 허브 (탭)
│   │   │   ├── [roomId]/page.tsx           ← 1:1 매치 채팅
│   │   │   └── contest/[roomId]/page.tsx   ← 공모전 그룹 채팅
│   │   ├── profile/page.tsx                ← 내 정보 (7탭)
│   │   └── notifications/page.tsx          ← 알림 센터
│   └── api/
│       ├── auth/
│       │   ├── signup/route.ts
│       │   ├── login/route.ts
│       │   ├── logout/route.ts
│       │   ├── check-username/route.ts
│       │   └── check-nickname/route.ts
│       ├── matches/
│       │   ├── route.ts                    ← GET (목록) / POST (작성)
│       │   └── [id]/
│       │       ├── route.ts                ← PUT (수정) / DELETE (삭제)
│       │       ├── apply/route.ts          ← POST (신청)
│       │       └── cancel/route.ts         ← PATCH (확정 매치 취소)
│       ├── applications/
│       │   └── [id]/
│       │       ├── accept/route.ts         ← PATCH (수락)
│       │       ├── reject/route.ts         ← PATCH (거절)
│       │       └── withdraw/route.ts       ← DELETE (취소)
│       ├── contest-matches/
│       │   ├── route.ts                    ← GET / POST
│       │   └── [id]/apply/route.ts         ← POST (신청)
│       ├── contest-applications/
│       │   └── [id]/
│       │       ├── accept/route.ts         ← PATCH (수락 + 자동 마감)
│       │       └── reject/route.ts         ← PATCH (거절)
│       ├── contest-rooms/
│       │   ├── route.ts                    ← GET (내 그룹 채팅방 목록)
│       │   └── [id]/
│       │       ├── messages/route.ts       ← GET / POST
│       │       ├── leave/route.ts          ← DELETE (나가기)
│       │       └── invite/route.ts         ← GET (초대 목록) / POST (초대)
│       ├── external-contests/route.ts      ← GET
│       ├── sports/
│       │   ├── reservations/route.ts       ← GET (시설 예약 현황)
│       │   └── partners/route.ts           ← GET (파트너 목록)
│       ├── profile/
│       │   ├── contest/route.ts            ← GET / PUT
│       │   ├── sports/route.ts             ← GET / PUT
│       │   └── avatar/route.ts             ← POST (Supabase Storage)
│       ├── profile-matches/
│       │   ├── route.ts                    ← GET / POST
│       │   └── [id]/
│       │       ├── accept/route.ts         ← PATCH
│       │       ├── reject/route.ts         ← PATCH
│       │       └── route.ts               ← DELETE
│       ├── reports/route.ts                ← POST
│       ├── admin/
│       │   └── reports/
│       │       ├── route.ts                ← GET (관리자 전용)
│       │       └── [id]/route.ts           ← PATCH (처리)
│       ├── ai/
│       │   ├── summarize/route.ts          ← POST (공모전 요약)
│       │   ├── match-reason/route.ts       ← POST (매칭 추천 이유)
│       │   └── profile-draft/route.ts      ← POST (자기소개 초안)
│       ├── reviews/route.ts                ← GET / POST
│       ├── messages/
│       │   ├── route.ts                    ← GET (목록)
│       │   └── [roomId]/route.ts           ← GET / POST / DELETE
│       ├── notifications/
│       │   ├── route.ts                    ← GET
│       │   ├── [id]/read/route.ts          ← PATCH
│       │   └── read-all/route.ts           ← PATCH
│       └── cron/
│           ├── sync-contests/route.ts      ← 외부 공모전 수집
│           └── cleanup-matches/route.ts    ← 만료 매치 삭제
├── components/
│   ├── ui/
│   │   ├── Badge.tsx                       ← SportBadge / LevelBadge / StatusBadge
│   │   ├── Calendar.tsx                    ← MatchCalendar
│   │   ├── EmptyState.tsx
│   │   └── Spinner.tsx
│   ├── match/
│   │   ├── MatchCard.tsx                   ← 수정 버튼 포함 (v2.1)
│   │   ├── PendingApplications.tsx
│   │   └── FilterBar.tsx
│   ├── contest/
│   │   └── ContestMatchCard.tsx            ← 실시간 남은 자리
│   ├── chat/
│   ├── review/
│   │   └── StarRating.tsx
│   ├── notifications/
│   │   ├── NotificationBell.tsx
│   │   └── NotificationDropdown.tsx
│   └── layout/
│       ├── Header.tsx
│       └── BottomNav.tsx
├── crawlers/                               ← Python 크롤러 (GitHub Actions)
│   ├── contest_crawler.py                  ← 공모전 크롤러 (contestkorea, wevity 등)
│   ├── reservation_crawler.py              ← 시설 예약 현황 크롤러
│   └── requirements.txt
├── .github/
│   └── workflows/
│       ├── contest-crawl.yml               ← 공모전 크롤링 (매일 KST 02:00)
│       └── reservation-crawl.yml           ← 예약 현황 크롤링 (매 1시간)
├── data/
│   └── contests.ts                         ← 정적 공모전 데이터 (4개 지역, 17개)
├── lib/
│   ├── supabase/
│   │   ├── client.ts                       ← 브라우저용 Supabase 클라이언트
│   │   ├── server.ts                       ← 서버 컴포넌트용
│   │   └── admin.ts                        ← SERVICE_ROLE_KEY (RLS 우회)
│   └── utils.ts                            ← formatDate, maskStudentId 등
├── types/
│   └── database.ts                         ← Match, Profile, Contest 등 타입 정의
├── vercel.json                             ← Cron Jobs 설정
└── public/
```

### C. 공모전 정적 데이터 현황

| 지역 | 게시물 수 | 주요 공모전 |
|------|-----------|-------------|
| 충청북도 | 3개 | 미디어아트 판타지아, 유니버시아드 디자인, 충청U대회 숏폼 |
| 충청남도 | 4개 | 충남관광 사진영상, 유니버시아드 디자인, 충남 방문의 해 그림, 충청U대회 숏폼 |
| 세종특별자치시 | 3개 | 지자체 캐릭터 페스티벌, 유니버시아드 디자인, 충청U대회 숏폼 |
| 대전광역시 | 7개 | 공공디자인 공모전, 대전부르스 창작가요제, 유니버시아드 디자인, 대청호오백리길 사진, 대전관광사진, 넥스트코드 작가 공모, 충청U대회 숏폼 |
| **합계** | **17개** | — |

### D. Supabase Realtime 구독 현황

| 페이지 / 컴포넌트 | 채널명 | 이벤트 | 목적 |
|------------------|--------|--------|------|
| `/match` 페이지 | `matches-list` | `*` (INSERT/UPDATE/DELETE) | 매치 목록 갱신 (수정 포함) |
| `/match` 페이지 | `match-applications-list` | `DELETE` | 신청 취소 → 재신청 버튼 복원 |
| `ContestMatchCard` | `contest-match-update:[id]` | `UPDATE` | 실시간 남은 자리 갱신 |
| `ContestMatchCard` | `contest-apps:[id]` | `INSERT` | 신청 현황 갱신 (작성자용) |
| 그룹 채팅방 | `contest-chat:[roomId]` | `INSERT` | 신규 메시지 수신 |
| 알림 시스템 | `notifications` (필터) | `INSERT` | 실시간 알림 수신 |

---

*버전: v2.3 | 최초 작성: 2026-05-26 | 최종 수정: 2026-05-29*
