# 충북match — Product Requirements Document (PRD)

> **버전**: v2.0  
> **최초 작성일**: 2026-05-26  
> **최종 수정일**: 2026-05-28  
> **작성자**: 충북match 개발팀  
> **상태**: 업데이트 완료 (v1.0 → v2.0)

---

## 변경 이력

| 버전 | 날짜 | 주요 변경 내용 |
|------|------|----------------|
| v1.0 | 2026-05-26 | 초안 작성 (MVP 기능 정의) |
| v2.0 | 2026-05-28 | 공모전 기능 확장, 그룹 채팅, 신청 관리 UI, 자동화 기능 전면 추가 |

---

## 목차

1. [제품 개요](#1-제품-개요)
2. [목표 및 성공 지표](#2-목표-및-성공-지표)
3. [사용자 페르소나](#3-사용자-페르소나)
4. [정보 아키텍처](#4-정보-아키텍처)
5. [기능 요구사항 상세](#5-기능-요구사항-상세)
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

### 1.3 기술 스택 요약

| 구분 | 기술 | 선택 이유 |
|------|------|-----------|
| Frontend | Next.js 14 (App Router) | SSR/SSG 지원, Vercel 최적화 |
| Styling | Tailwind CSS | 빠른 UI 구현, 일관된 디자인 |
| Database | Supabase (PostgreSQL) | 무료 플랜, Row Level Security, Realtime 내장 |
| 인증 | Supabase Auth | 세션 관리, JWT 내장 |
| 실시간 | Supabase Realtime | WebSocket 기반 실시간 구독 |
| 배포 | Vercel | Next.js 공식 배포 플랫폼, Edge Network |
| Cron | Vercel Cron Jobs | 매일 자동 동기화·만료 처리 |

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

### 페르소나 A — 매치 주최자 (매치글 작성자)

> 충북대 체육학과 3학년 **김민준** (22세)
>
> - 주 2~3회 풋살을 즐기지만 상대팀 구하기가 어려움
> - 카카오톡 오픈채팅방으로 상대 찾는 번거로움을 느낌
> - **니즈**: 종목·수준에 맞는 상대를 빠르게 구하고 싶다

### 페르소나 B — 매치 신청자

> 충북대 컴퓨터공학과 2학년 **이서연** (20세)
>
> - e스포츠 동호회 활동 중, 다른 팀과 스크림(연습 경기)를 원함
> - 실력 수준이 맞는 상대를 찾고 싶음
> - **니즈**: 내 실력 수준에 맞는 상대 팀을 필터로 찾고 바로 신청하고 싶다

### 페르소나 C — 일반 사용자 (관전·평가 중심)

> 충북대 경영학과 1학년 **박지호** (19세)
>
> - 가끔 농구를 즐기며 매너 있는 상대를 원함
> - 상대팀의 매너 점수를 보고 신청 여부를 결정하고 싶음
> - **니즈**: 매너 평가 이력을 보고 신뢰할 수 있는 상대와 경기하고 싶다

### 페르소나 D — 공모전 팀 빌더 (신규)

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
│   ├── /                      ← 랜딩 페이지 (서비스 소개)
│   ├── /login                 ← 로그인
│   └── /signup                ← 회원가입
│
└── 인증 영역 (로그인 필수)
    ├── /match                 ← 매치 목록 (메인)
    ├── /match/write           ← 매치글 작성
    ├── /match/[id]            ← 매치 상세
    ├── /contest               ← 공모전 목록 (지역별 + 즐겨찾기)
    ├── /contest/matches       ← 공모전 팀원 모집 목록
    ├── /contest/write         ← 공모전 팀원 모집 작성
    ├── /review                ← 팀 후기 목록 / 작성
    ├── /messages              ← 메시지 허브 (1:1 매치 채팅 + 공모전 그룹 채팅)
    ├── /messages/[roomId]     ← 1:1 매치 채팅방
    ├── /messages/contest/[roomId] ← 공모전 팀 그룹 채팅방
    ├── /profile               ← 내 정보
    └── /notifications         ← 알림 센터
```

---

## 5. 기능 요구사항 상세

### 5.1 회원가입

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
| 학번 | text | 숫자 8자리 정확히, maxLength=8 | "학번은 8자리 숫자여야 합니다." |
| 소속 학과 | select | 충북대 학과 목록 선택 | "학과를 선택해주세요." |

#### 학번 유효성 검증 규칙

```
형식: YYYY0000 (앞 4자리: 입학연도, 뒤 4자리: 학번)
- 입학연도: 1990 ~ 현재연도 범위
- 숫자 외 문자 입력 불가 (input type="number" 또는 pattern="[0-9]{8}")
- maxLength 속성으로 8자리 초과 입력 차단
```

#### 인증 플로우

```
1. 사용자 폼 입력
2. 클라이언트 유효성 검사 (실시간)
3. 아이디/닉네임 중복 확인 버튼 → Supabase profiles 테이블 조회
4. [가입하기] 클릭
5. Supabase Auth → auth.users 에 이메일(아이디@cbnu.match) + 비밀번호 등록
6. profiles 테이블에 부가 정보 INSERT (학과 포함)
7. 가입 완료 → 로그인 페이지로 리다이렉트
```

---

### 5.2 로그인

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

---

### 5.3 매치 목록 (/match)

#### 유저 스토리
> "원하는 종목과 수준의 매치를 빠르게 찾아 신청하고 싶다."

#### 화면 구성

```
┌─────────────────────────────────────┐
│  [전체] [⚽축구] [🥅풋살] [🏀농구] [🎮e스포츠]  ← 종목 필터
│  [전체] [초급] [중급] [고수]                    ← 수준 필터
├─────────────────────────────────────┤
│  매치 카드 목록 (최신순)                         │
│  ┌────────────────────────────────┐  │
│  │ ⚽ 축구 | 5vs5 | 중급           │  │
│  │ 팀명: FC충북 | 모집 중 🟢       │  │
│  │ "같이 즐겁게 뛸 팀 구해요"      │  │
│  │              [매치 신청] 버튼   │  │
│  └────────────────────────────────┘  │
└─────────────────────────────────────┘
```

#### 매치 신청 상세 플로우

```
[매치 신청] 클릭
    │
    ├─ 본인 게시글인가? → "본인 게시글에는 신청할 수 없습니다." 표시
    │
    ├─ 이미 신청했는가? → "이미 신청한 매치입니다." 표시
    │
    └─ 정상 신청
        ↓
        match_applications 테이블 INSERT (status: 'pending')
        ↓
        notifications 테이블 INSERT (매치글 작성자 수신)
        ↓
        Supabase Realtime → 작성자 브라우저에 알림 Push
        ↓
        알림 내용: "[닉네임] 님이 매치를 신청했습니다. 실력: [수준]"
        ↓
        작성자 알림 UI 또는 '내 정보 > 받은 신청' 탭에서 [신청 수락] / [신청 거절] 선택
            ├─ 수락: status → 'accepted', 매치 상태 '매치 확정', 채팅방 생성
            └─ 거절: status → 'rejected', 신청자에게 "거절되었습니다." 알림 발송
                     매치글 상태는 '모집 중' 유지
```

#### 매치 자동 만료

```
- match_datetime(경기 날짜/시간)이 현재 시각보다 과거인 매치는 목록에서 즉시 제외
- Vercel Cron Job (매일 00:00 KST): match_datetime < NOW() 인 레코드 DB에서 자동 삭제
- 경로: /api/cron/cleanup-matches (schedule: "0 15 * * *")
```

#### 신청 취소 후 재신청

```
- 신청자가 '내 정보 > 지원한 신청' 탭에서 대기중 신청 취소
- match_applications 레코드 DELETE
- 매치 목록 실시간 구독이 DELETE 이벤트 감지 → appliedIds 즉시 갱신
- 해당 매치 카드의 "신청 완료" → "매치 신청" 버튼으로 즉시 복원
```

---

### 5.4 매치글 작성 (/match/write)

#### 유저 스토리
> "우리 팀 정보와 원하는 상대 조건을 작성하여 매치 상대를 모집하고 싶다."

#### 폼 필드 명세

| 필드 | UI 컴포넌트 | 필수 여부 | 제약 |
|------|-------------|-----------|------|
| 팀명 | text input | ✅ | 2~20자 |
| 종목 | radio / card select | ✅ | 4가지 중 1개 선택 |
| 매치 인원 | radio / button group | ✅ | 1vs1 / 3vs3 / 5vs5 / 11vs11 |
| 장소 | text input | ✅ | 최대 50자 |
| 경기 날짜·시간 | date + time input | ✅ | 현재 이후만 선택 가능 |
| 소개글 | textarea | ✅ | 10~500자 |
| 원하는 수준 | radio / button group | ✅ | 초급 / 중급 / 고수 |

#### 인원 ↔ 종목 연관 규칙

| 종목 | 허용 인원 |
|------|-----------|
| ⚽ 축구 | 5vs5, 11vs11 |
| 🥅 풋살 | 3vs3, 5vs5 |
| 🏀 농구 | 3vs3, 5vs5 |
| 🎮 e스포츠 | 1vs1, 3vs3, 5vs5 |

> 종목 선택 시 해당 종목에서 불가능한 인원 옵션은 비활성화(disabled) 처리

---

### 5.5 팀 후기 (/review)

#### 유저 스토리
> "매치가 끝난 후 상대팀의 매너를 별점으로 평가하고, 내가 받은 평가를 확인하고 싶다."

#### 평가 조건 체크

```
평가 버튼 활성화 조건:
  1. match_applications.status = 'accepted' (매치 확정 상태)
  2. 해당 매치의 참여자 (작성자 또는 신청자)
  3. 해당 매치에 대해 아직 평가를 작성하지 않은 상태
     (reviews 테이블에 reviewer_id + match_id 조합이 없음)
```

#### 평가 저장 로직

```
별점 선택 (1~5) + [평가 제출] 클릭
    ↓
reviews 테이블 INSERT
    ├─ reviewer_id: 현재 로그인 유저
    ├─ reviewee_id: 상대방
    ├─ match_id: 해당 매치
    └─ rating: 1~5
    ↓
이미 평가한 경우 → INSERT 차단 (UNIQUE 제약)
    ↓
상대방 프로필의 평균 점수 실시간 업데이트
```

---

### 5.6 메시지 시스템 (/messages) — v2.0 확장

#### 5.6.1 1:1 매치 채팅

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
- 메시지 목록 또는 채팅방 내 [나가기] 버튼 클릭
- 확인 다이얼로그 → 수락 시 message_rooms + messages CASCADE 삭제
- 양쪽 모두 채팅 이력 삭제
```

#### 5.6.2 공모전 그룹 채팅 (신규)

##### 유저 스토리
> "공모전 팀원이 모이면 그룹 채팅으로 협업하고 싶다."

##### 그룹 채팅방 생성 조건

```
contest_applications.status = 'accepted' 로 업데이트되는 순간
→ contest_chat_rooms 테이블에 자동 room INSERT (없는 경우)
→ contest_chat_members에 수락된 신청자 자동 추가
→ 팀장(게시글 작성자)도 최초 작성 시 멤버에 자동 포함
```

##### 탭 구성

```
/messages
├── [매치 채팅] 탭  ← 1:1 채팅방 목록
└── [공모전 팀 채팅] 탭  ← 그룹 채팅방 목록 (신규)
```

##### 팀원 초대하기 (신규)

```
그룹 채팅방 헤더의 [팀원 초대] 버튼 (팀장만 표시)
    ↓
GET /api/contest-rooms/[id]/invite
    → 해당 공모전에 신청하고 수락(status='accepted')된 사람 중
    → 아직 채팅방에 없는 멤버 목록 반환
    ↓
초대 모달에서 팀원 선택 → [초대] 클릭
    ↓
POST /api/contest-rooms/[id]/invite
    → 보안 검증:
        1. 요청자 = 팀장(contest_match.author_id) 여부 확인
        2. 초대 대상 = contest_applications.status='accepted' 여부 확인
        3. 이미 멤버인 경우 409 Conflict 반환
    → contest_chat_members INSERT
```

##### 채팅방 나가기 (그룹)

```
- 메시지 목록 [나가기] 버튼 또는 채팅방 내 헤더 [나가기] 버튼
- 확인 다이얼로그 → 수락 시 contest_chat_members에서 해당 유저만 제거
- 채팅방·메시지는 다른 팀원에게 유지됨
```

##### 실시간 채팅 구현

```
Supabase Realtime SUBSCRIBE
    채널: contest-chat:[roomId]
    이벤트: INSERT (contest_chat_messages)

신규 메시지 수신 시:
    → 채팅창 자동 스크롤 다운
    → 발신자 닉네임 + 아바타 표시
    → 폴링 폴백 3초 (Realtime 불안정 환경 대비)
```

---

### 5.7 내 정보 (/profile) — v2.0 확장

#### 유저 스토리
> "내 프로필을 확인하고 닉네임·실력 수준을 수정하고 싶다. 받은 신청과 지원한 신청을 한눈에 관리하고 싶다."

#### 탭 구성 (v2.0)

| 탭 | 내용 |
|----|------|
| 내 매치글 | 작성한 매치글 목록, 수정/삭제 |
| 받은 신청 *(신규)* | 내 매치에 들어온 신청 목록, 수락/거절, 실시간 갱신 |
| 지원한 신청 *(신규)* | 내가 신청한 매치 목록, 대기중 신청 취소 가능 |
| 내 경기 | 확정된 매치 목록, 매치 취소 가능 |
| 내 공모전 | 참여 중인 공모전 목록 |
| 캘린더 | 경기 일정 달력 |
| 매너 평가 | 받은 별점 이력 |

#### 받은 신청 탭 상세 (신규)

```
- 내 모집 중인 매치글에 들어온 pending 신청 목록 표시
- 각 신청 카드: 신청자 닉네임 + 실력 + 신청 매치명
- [신청 수락] 버튼: PATCH /api/applications/[id]/accept → 매치 확정 + 채팅방 생성
- [신청 거절] 버튼: PATCH /api/applications/[id]/reject
- 10초 폴링으로 신규 신청 자동 반영
- 수락 즉시 매치 목록에 반영 (매치확정 상태로 변경)
```

#### 지원한 신청 탭 상세 (신규)

```
- 내가 신청한 매치 목록 표시 (rejected 제외)
- 상태 표시: 검토 중(pending) / 수락됨(accepted)
- 대기중(pending) 신청에만 [신청 취소] 버튼 표시
- 취소 클릭 → DELETE /api/applications/[id]/withdraw
    → match_applications 레코드 삭제
    → 매치는 '모집중' 상태 유지 (자동 복원)
    → 매치 목록에서 해당 매치 "신청 완료" → "매치 신청" 버튼으로 즉시 복원
- 수락됨 신청: 채팅방 안내 메시지 표시
```

#### 프로필 카드

```
┌─────────────────────────────┐
│  👤 프로필                    │
│  닉네임: [수정 가능]           │
│  아이디: cbnu_user            │
│  학번:   202*****             │ ← 마스킹
│  소속학과: 컴퓨터공학과         │
│  실력:   [중급] 즉시 저장       │
│  공모전 출전 횟수: [3회]        │
├─────────────────────────────┤
│  [내 매치글] [받은 신청] [지원한 신청] [내 경기] [내 공모전] [캘린더] [매너 평가]
└─────────────────────────────┘
```

---

### 5.8 알림 시스템

#### 알림 유형 명세

| ID | 이벤트 | 수신자 | 메시지 | 액션 버튼 |
|----|--------|--------|--------|-----------|
| N1 | 매치 신청 수신 | 매치글 작성자 | "[닉네임] 님이 매치를 신청했습니다. 실력: [수준]" | [수락] [거절] |
| N2 | 매치 수락 | 신청자 | "매치가 수락되었습니다! [팀명]과의 매치가 확정됐어요." | [채팅 시작] |
| N3 | 매치 거절 | 신청자 | "거절되었습니다." | - |
| N4 | 새 메시지 | 채팅 상대방 | "[닉네임]: [메시지 미리보기]" | [채팅 열기] |
| N5 | 공모전 팀원 신청 수신 | 모집 게시글 작성자 | "[닉네임] 님이 공모전 팀원 신청했습니다." | - |
| N6 | 공모전 팀원 수락 | 신청자 | "[공모전명] 팀원 신청이 수락되었습니다!" | [채팅 시작] |
| N7 | 공모전 팀원 거절 | 신청자 | "[공모전명] 팀원 신청이 거절되었습니다." | - |
| N8 | 매치 취소 | 상대방 | "[닉네임] 님이 매치를 취소했습니다." | - |

#### 알림 처리 방식

```
Supabase Realtime 구독
  채널: notifications:user_id=eq.[현재 유저 ID]
  이벤트: INSERT

수신 시:
  1. 헤더 알림 벨 아이콘에 배지 숫자 +1
  2. 토스트(Toast) 메시지 우측 하단 팝업 (3초 자동 소멸)
  3. /notifications 페이지에 내역 누적
  4. 읽음 처리 시 배지 감소
```

---

### 5.9 공모전 (/contest) — v2.0 신규

#### 유저 스토리
> "충청권 공모전 정보를 한눈에 보고 즐겨찾기에 저장하고 싶다. 관심 공모전의 팀원을 모집하거나 팀에 합류하고 싶다."

#### 5.9.1 공모전 목록

##### 즐겨찾기 (신규)

```
- 화면 상단: 즐겨찾기 섹션 (기존 자동수집 섹션 대체)
- 지역별 공모전 카드 우상단 ★ 버튼 클릭 → 즐겨찾기 추가/해제 (토글)
- 즐겨찾기 데이터: localStorage에 공모전 ID 배열 저장 (브라우저 재방문 유지)
- 즐겨찾기 섹션: 즐겨찾기한 공모전 카드 표시, ★ 버튼으로 즉시 삭제
- 즐겨찾기 없을 시: 안내 메시지 표시
```

##### 지역별 공모전 (정적 데이터)

```
지원 지역 (v2.0 확장):
  - 충청북도 (🏔️)
  - 충청남도 (🌊)
  - 세종특별자치시 (🏛️) ← v2.0 신규
  - 대전광역시 (⚗️)     ← v2.0 신규

카테고리 필터:
  전체 / 글·문학 / 디자인·미술 / 사진·영상 / IT·과학 / 창업·마케팅 / 환경·사회 / 공학·기술 / 예술·공연
```

##### 공모전 자동 만료 (신규)

```
정적 데이터:
  - isExpiredContest(deadline): deadline + 1일 < now() 이면 만료 처리
  - getContestsByRegion(): 만료된 공모전 자동 필터링하여 반환

외부 수집 데이터 (DB):
  - GET /api/external-contests: deadline > yesterday 인 레코드만 반환
  - Cron /api/cron/sync-contests: 매일 실행 시 만료 레코드 자동 DELETE
```

#### 5.9.2 공모전 팀원 모집 (/contest/matches)

##### 유저 스토리
> "공모전 팀원을 모집하거나 팀에 합류하고 싶다."

##### 팀원 모집 게시글 작성

```
필드:
  - 공모전 이름 (텍스트, 최대 100자)
  - 공모전 분야 (카테고리 선택)
  - 지역 (충청북도 / 충청남도 / 세종특별자치시 / 대전광역시)
  - 공모전 마감일 (date picker, 오늘 이후)
  - 모집 팀원 수 (1~5명, 본인 제외)
  - 소개글 (최소 10자)

게시 후 자동 처리:
  → contest_matches INSERT (status: '모집중', current_count: 0)
  → contest_chat_rooms INSERT (팀 그룹 채팅방 자동 생성)
  → contest_chat_members INSERT (작성자 자동 추가)
```

##### 실시간 남은 자리 표시 (신규)

```
- 각 카드: 남은 자리 배지 실시간 업데이트
  - 초록: 여유 있음 / 주황: 2명 이하 / 빨강: 1명 이하
- Supabase Realtime: 각 contest_matches 레코드 UPDATE 개별 구독
- 수락 발생 즉시 모든 사용자 화면에서 남은 자리 감소 (예: 4명 → 3명 → 2명)
```

##### 자동 마감 처리 (신규)

```
팀 정원 충족 시 (current_count >= team_size):
  1. contest_matches.status = '마감' 으로 업데이트
  2. 목록 쿼리(status='모집중') 필터로 즉시 목록에서 제거
  3. 나머지 pending 신청자 전원 자동 거절 + 알림 발송
  4. 카드 자체에서 즉시 숨김 처리 + "모집 완료" 토스트 표시
  5. 신청 버튼: remaining <= 0 이면 자동 비활성화
```

##### 신청 수락 플로우

```
[신청 수락] 클릭 (작성자만)
    ↓
PATCH /api/contest-applications/[id]/accept
    ↓
  1. contest_applications.status = 'accepted'
  2. contest_matches.current_count += 1
  3. current_count >= team_size → status = '마감'
  4. contest_chat_members에 신청자 추가 (채팅방 자동 입장)
  5. 신청자에게 수락 알림 발송
  6. 팀 가득 참 → 나머지 신청자 자동 거절 + 알림
```

---

### 5.10 자동화 시스템 (Cron Jobs) — v2.0 신규

#### 운영 자동화 명세

| Cron 경로 | 스케줄 | 동작 |
|-----------|--------|------|
| `/api/cron/sync-contests` | 매일 00:00 KST | 올콘·링커리어에서 공모전 자동 수집 + 만료 레코드 삭제 |
| `/api/cron/cleanup-matches` | 매일 00:00 KST | match_datetime 지난 매치 게시물 자동 삭제 |

#### vercel.json 설정

```json
{
  "crons": [
    { "path": "/api/cron/sync-contests", "schedule": "0 15 * * *" },
    { "path": "/api/cron/cleanup-matches", "schedule": "0 15 * * *" }
  ]
}
```

---

## 6. 데이터베이스 설계

### 6.1 ERD (Entity Relationship Diagram)

```
auth.users (Supabase 내장)
    │ 1
    │
    ▼ N
profiles
    ├─ id (UUID, FK → auth.users.id)
    ├─ username (TEXT, UNIQUE)
    ├─ nickname (TEXT, UNIQUE)
    ├─ full_name (TEXT)
    ├─ student_id (CHAR(8))
    ├─ skill_level (ENUM: 초급/중급/고수)
    ├─ department (TEXT)              ← v2.0 추가
    ├─ contest_count (INTEGER)        ← v2.0 추가
    ├─ created_at (TIMESTAMPTZ)
    └─ updated_at (TIMESTAMPTZ)

profiles ──1──< matches
    ├─ id (UUID, PK)
    ├─ author_id (UUID, FK → profiles.id)
    ├─ team_name (TEXT)
    ├─ sport (ENUM: 축구/풋살/농구/e스포츠)
    ├─ match_size (ENUM: 1vs1/3vs3/5vs5/11vs11)
    ├─ location (TEXT)
    ├─ description (TEXT)
    ├─ required_level (ENUM: 초급/중급/고수)
    ├─ status (ENUM: 모집중/매치확정/취소됨)
    ├─ match_datetime (TIMESTAMPTZ)   ← v2.0 추가 (경기 일정)
    ├─ created_at (TIMESTAMPTZ)
    └─ updated_at (TIMESTAMPTZ)

matches ──1──< match_applications
    ├─ id (UUID, PK)
    ├─ match_id (UUID, FK → matches.id)
    ├─ applicant_id (UUID, FK → profiles.id)
    ├─ status (ENUM: pending/accepted/rejected)
    ├─ created_at (TIMESTAMPTZ)
    └─ updated_at (TIMESTAMPTZ)
    UNIQUE(match_id, applicant_id)

match_applications ──1──< message_rooms
    ├─ id (UUID, PK)
    ├─ application_id (UUID, FK → match_applications.id)
    ├─ participant_1 (UUID, FK → profiles.id)
    ├─ participant_2 (UUID, FK → profiles.id)
    └─ created_at (TIMESTAMPTZ)

message_rooms ──1──< messages
    ├─ id (UUID, PK)
    ├─ room_id (UUID, FK → message_rooms.id)
    ├─ sender_id (UUID, FK → profiles.id)
    ├─ content (TEXT)
    ├─ is_read (BOOLEAN, DEFAULT false)
    └─ created_at (TIMESTAMPTZ)

match_applications ──1──< reviews
    ├─ id (UUID, PK)
    ├─ match_id (UUID, FK → matches.id)
    ├─ reviewer_id (UUID, FK → profiles.id)
    ├─ reviewee_id (UUID, FK → profiles.id)
    ├─ rating (SMALLINT, CHECK 1~5)
    └─ created_at (TIMESTAMPTZ)
    UNIQUE(match_id, reviewer_id)

profiles ──1──< notifications
    ├─ id (UUID, PK)
    ├─ user_id (UUID, FK → profiles.id)
    ├─ type (ENUM: match_apply/match_accept/match_reject/match_cancel/
    │              new_message/contest_apply/contest_accept/contest_reject)
    ├─ message (TEXT)
    ├─ related_id (UUID)
    ├─ is_read (BOOLEAN, DEFAULT false)
    └─ created_at (TIMESTAMPTZ)

── 공모전 관련 테이블 (v2.0 신규) ──────────────────────────

profiles ──1──< contest_matches
    ├─ id (UUID, PK)
    ├─ author_id (UUID, FK → profiles.id)
    ├─ contest_name (TEXT)
    ├─ contest_category (TEXT)
    ├─ region (TEXT)
    ├─ deadline (DATE)
    ├─ team_size (INTEGER, CHECK 1~5)
    ├─ current_count (INTEGER, DEFAULT 0)
    ├─ description (TEXT)
    ├─ status (ENUM: 모집중/마감)
    ├─ created_at (TIMESTAMPTZ)
    └─ updated_at (TIMESTAMPTZ)

contest_matches ──1──< contest_applications
    ├─ id (UUID, PK)
    ├─ contest_match_id (UUID, FK → contest_matches.id)
    ├─ applicant_id (UUID, FK → profiles.id)
    ├─ status (ENUM: pending/accepted/rejected)
    ├─ created_at (TIMESTAMPTZ)
    └─ updated_at (TIMESTAMPTZ)
    UNIQUE(contest_match_id, applicant_id)

contest_matches ──1──< contest_chat_rooms
    ├─ id (UUID, PK)
    ├─ contest_match_id (UUID, FK → contest_matches.id)
    ├─ name (TEXT)
    └─ created_at (TIMESTAMPTZ)

contest_chat_rooms ──1──< contest_chat_members
    ├─ id (UUID, PK)
    ├─ room_id (UUID, FK → contest_chat_rooms.id)
    ├─ user_id (UUID, FK → profiles.id)
    └─ joined_at (TIMESTAMPTZ)
    UNIQUE(room_id, user_id)

contest_chat_rooms ──1──< contest_chat_messages
    ├─ id (UUID, PK)
    ├─ room_id (UUID, FK → contest_chat_rooms.id)
    ├─ sender_id (UUID, FK → profiles.id)
    ├─ content (TEXT)
    └─ created_at (TIMESTAMPTZ)

── 외부 공모전 (자동 수집) ──────────────────────────────────

external_contests
    ├─ id (UUID, PK)
    ├─ title (TEXT)
    ├─ url (TEXT, UNIQUE)
    ├─ category (TEXT)
    ├─ organizer (TEXT)
    ├─ deadline (DATE)
    ├─ source (TEXT)              ← 'all-con' | 'linkareer'
    ├─ description (TEXT)
    └─ created_at (TIMESTAMPTZ)
```

### 6.2 Row Level Security (RLS) 정책

| 테이블 | 정책 |
|--------|------|
| `profiles` | 본인만 UPDATE 가능, 전체 SELECT 허용 |
| `matches` | 로그인 유저만 INSERT, 본인만 UPDATE/DELETE |
| `match_applications` | 로그인 유저만 INSERT, 관련 당사자만 UPDATE |
| `reviews` | 매치 참여자만 INSERT, 수정/삭제 불가 |
| `messages` | 해당 채팅방 참여자만 SELECT/INSERT |
| `notifications` | 본인 알림만 SELECT/UPDATE |
| `contest_matches` | 로그인 유저만 INSERT, 본인만 UPDATE/DELETE |
| `contest_applications` | 로그인 유저만 INSERT, 관련 당사자만 UPDATE |
| `contest_chat_members` | 해당 채팅방 멤버만 SELECT, 팀장만 INSERT |
| `contest_chat_messages` | 해당 채팅방 멤버만 SELECT/INSERT |
| `external_contests` | 전체 SELECT (인증 불필요), admin만 INSERT/UPDATE/DELETE |

---

## 7. API 설계

> Next.js API Routes (`/app/api/`) 기반 서버리스 함수

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
| GET | `/api/matches` | 매치 목록 조회 (만료 필터 포함) |
| POST | `/api/matches` | 매치글 작성 |
| GET | `/api/matches/[id]` | 매치 상세 조회 |
| PUT | `/api/matches/[id]` | 매치글 수정 |
| DELETE | `/api/matches/[id]` | 매치글 삭제 |
| PATCH | `/api/matches/[id]/cancel` | 확정 매치 취소 |

### 7.3 매치 신청 API

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/api/matches/[id]/apply` | 매치 신청 |
| PATCH | `/api/applications/[id]/accept` | 매치 수락 |
| PATCH | `/api/applications/[id]/reject` | 매치 거절 |
| DELETE | `/api/applications/[id]/withdraw` | 대기중 신청 취소 (신청자) |

### 7.4 후기 API

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/reviews` | 내가 받은 후기 목록 |
| POST | `/api/reviews` | 후기 작성 |

### 7.5 메시지 API

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/messages` | 채팅방 목록 조회 |
| GET | `/api/messages/[roomId]` | 특정 채팅방 메시지 조회 |
| POST | `/api/messages/[roomId]` | 메시지 전송 |
| DELETE | `/api/messages/[roomId]` | 채팅방 나가기 (전체 삭제) |

### 7.6 알림 API

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/notifications` | 알림 목록 조회 |
| PATCH | `/api/notifications/[id]/read` | 알림 읽음 처리 |
| PATCH | `/api/notifications/read-all` | 전체 읽음 처리 |

### 7.7 공모전 API (v2.0 신규)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/contest-matches` | 공모전 팀원 모집 목록 (모집중만) |
| POST | `/api/contest-matches` | 공모전 팀원 모집 게시글 작성 |
| POST | `/api/contest-matches/[id]/apply` | 공모전 팀원 신청 |
| PATCH | `/api/contest-applications/[id]/accept` | 신청 수락 + 채팅방 자동 입장 + 자동 마감 처리 |
| PATCH | `/api/contest-applications/[id]/reject` | 신청 거절 |
| GET | `/api/contest-rooms` | 참여 중인 그룹 채팅방 목록 |
| GET | `/api/contest-rooms/[id]/messages` | 그룹 채팅방 메시지 조회 |
| POST | `/api/contest-rooms/[id]/messages` | 그룹 채팅방 메시지 전송 |
| DELETE | `/api/contest-rooms/[id]/leave` | 그룹 채팅방 나가기 (멤버만 제거) |
| GET | `/api/contest-rooms/[id]/invite` | 초대 가능한 멤버 목록 (수락된 신청자 중 미참여자) |
| POST | `/api/contest-rooms/[id]/invite` | 팀원 초대 (팀장 + 수락된 신청자만 가능) |
| GET | `/api/external-contests` | 자동 수집 외부 공모전 목록 (만료 필터 포함) |

### 7.8 자동화 Cron API (v2.0 신규)

| 메서드 | 경로 | 스케줄 | 설명 |
|--------|------|--------|------|
| GET | `/api/cron/sync-contests` | 0 15 * * * | 외부 공모전 자동 수집 + 만료 삭제 |
| GET | `/api/cron/cleanup-matches` | 0 15 * * * | 경기 날짜 지난 매치 자동 삭제 |

---

## 8. UI/UX 가이드라인

### 8.1 컬러 팔레트

| 용도 | 색상 | HEX |
|------|------|-----|
| Primary (메인) | 충북대 청색 계열 | `#1E3A5F` |
| Accent (강조) | 활동적인 주황색 | `#FF6B35` |
| Success (수락) | 초록색 | `#22C55E` |
| Danger (거절) | 빨간색 | `#EF4444` |
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

### 8.4 공모전 지역별 색상 (v2.0 신규)

| 지역 | 이모지 | 메인 색상 | 배경 색상 |
|------|--------|-----------|-----------|
| 충청북도 | 🏔️ | `#1D4ED8` | `#DBEAFE` |
| 충청남도 | 🌊 | `#0F766E` | `#CCFBF1` |
| 세종특별자치시 | 🏛️ | `#7C3AED` | `#EDE9FE` |
| 대전광역시 | ⚗️ | `#B45309` | `#FEF3C7` |

### 8.5 남은 자리 표시 색상 (v2.0 신규)

| 남은 자리 | 색상 |
|-----------|------|
| 3명 이상 | 초록 (green-100/700) |
| 2명 이하 | 주황 (orange-100/600) |
| 1명 이하 | 빨강 (red-100/600) |

### 8.6 핵심 컴포넌트 목록

- `MatchCard` — 매치 목록 카드 (종목 배지, 팀명, 수준, 신청 버튼, 신청 현황)
- `PendingApplications` — 매치 신청 현황 (닉네임·실력·수락·거절 넓은 카드)
- `ContestMatchCard` — 공모전 팀원 모집 카드 (실시간 남은 자리, 신청 현황)
- `NotificationBell` — 헤더 알림 아이콘 + 배지
- `NotificationDropdown` — 알림 목록 드롭다운 (수락/거절 버튼 포함)
- `StarRating` — 별점 입력/표시 컴포넌트
- `ChatBubble` — 채팅 메시지 말풍선
- `FilterBar` — 종목/수준 필터 버튼 그룹
- `ProfileCard` — 내 정보 카드
- `Toast` — 실시간 알림 팝업
- `MatchCalendar` — 경기 일정 달력 (공모전 이벤트 포함)
- `InviteModal` — 팀원 초대 모달 (공모전 그룹 채팅용)

---

## 9. 비기능 요구사항

### 9.1 성능

| 항목 | 목표 |
|------|------|
| 페이지 첫 로드 (LCP) | 2.5초 이내 |
| 실시간 알림 지연 | 2초 이내 |
| 채팅 메시지 전달 | 1초 이내 |
| API 응답 시간 | 500ms 이내 |
| 실시간 구독 폴링 폴백 | 3~10초 간격 |

### 9.2 보안

- Supabase RLS로 인증된 사용자만 데이터 접근
- JWT 토큰 만료 시 자동 갱신
- 학번 데이터는 마스킹 후 표시 (`202*****`)
- 비밀번호는 Supabase Auth에서 bcrypt 해시 처리
- 공모전 팀원 초대: 수락된 신청자(status='accepted')만 초대 가능 (3중 검증)
- Cron Job: `CRON_SECRET` 환경변수로 무단 호출 방지

### 9.3 접근성 및 호환성

| 항목 | 지원 범위 |
|------|-----------|
| 브라우저 | Chrome 90+, Firefox 88+, Safari 14+, Edge 90+ |
| 기기 | PC, 태블릿, 모바일 (반응형) |
| 최소 해상도 | 375px (모바일 기준) |

### 9.4 확장성

- Supabase 무료 플랜 기준 설계, 트래픽 증가 시 Pro 플랜으로 전환
- Next.js App Router 구조로 기능 단위 분리 및 확장 용이
- Vercel Cron Jobs로 자동화 운영 비용 최소화
- localStorage 기반 즐겨찾기로 DB 부하 없이 개인화 기능 제공

---

## 10. 개발 로드맵

### Phase 1 — 핵심 기능 (MVP)
```
Week 1-2:
  ✅ 프로젝트 세팅 (Next.js + Supabase + Vercel)
  ✅ DB 스키마 및 RLS 설정
  ✅ 회원가입 / 로그인 (학과 선택 포함)

Week 3-4:
  ✅ 매치글 작성 (경기 날짜·시간 포함)
  ✅ 매치 목록 + 필터
  ✅ 매치 신청 + 알림 시스템 (Realtime)
```

### Phase 2 — 커뮤니케이션
```
Week 5-6:
  ✅ 매치 수락/거절 처리
  ✅ 1:1 매치 채팅 (Realtime + 폴링 폴백)
  ✅ 내 정보 페이지 + 수정
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

### Phase 4 — 공모전 기능 (v2.0)
```
Week 9-10:
  ✅ 공모전 목록 (충북·충남 지역)
  ✅ 공모전 팀원 모집 게시글 작성·신청
  ✅ 공모전 그룹 채팅 (자동 생성·나가기)
  ✅ 지역 확장: 세종특별자치시·대전광역시 추가
  ✅ 실제 공모전 데이터 17개 입력 (4개 지역)
```

### Phase 5 — 자동화 및 UX 개선 (v2.0)
```
Week 11-12:
  ✅ 공모전 자동 만료 삭제 (마감일 +1일 기준)
  ✅ 매치 경기 날짜 기반 자동 삭제 Cron
  ✅ 공모전 즐겨찾기 (localStorage)
  ✅ 팀원 초대 기능 (보안 3중 검증)
  ✅ 내 정보 > 받은 신청·지원한 신청 탭 추가
  ✅ 실시간 남은 자리 표시 + 자동 마감
  ✅ 신청 취소 후 재신청 즉시 복원
  ✅ 매치 신청 카드 UI 개선 (넓은 카드)
  ✅ 외부 공모전 자동 수집 Cron (올콘·링커리어)
```

---

## 11. 리스크 및 제약사항

| 리스크 | 영향도 | 대응 방안 |
|--------|--------|-----------|
| 학번 검증 불완전 | 중 | 8자리 형식 + 입학연도 범위 검사로 최소 필터링 |
| Supabase Realtime 연결 불안정 | 중 | 재연결 로직 구현, Polling 폴백 (3~10초) |
| 동시 다중 매치 신청 충돌 | 중 | DB 트랜잭션 및 UNIQUE 제약으로 방지 |
| Supabase 무료 플랜 한계 | 낮 | 초기 소규모 서비스에 충분, 초과 시 유료 전환 |
| 모바일 실시간 채팅 배터리 소모 | 낮 | 탭 비활성 시 구독 일시 해제 |
| 외부 공모전 사이트 구조 변경 | 중 | 스크래핑 로직 정기 점검, 파싱 실패 시 빈 배열 반환으로 graceful 처리 |
| 팀원 초대 권한 우회 | 높 | 3중 검증 (팀장 여부 + 수락 상태 + 미참여 여부) |
| localStorage 즐겨찾기 데이터 소실 | 낮 | 브라우저 캐시 삭제 시 리셋 허용 (서버 저장 불필요) |

---

## 부록

### A. 환경 변수 목록

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Vercel Cron 인증
CRON_SECRET=

# Next.js
NEXTAUTH_URL=
NEXTAUTH_SECRET=
```

### B. 폴더 구조

```
cbnumatch/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── signup/
│   ├── (main)/
│   │   ├── match/
│   │   │   ├── page.tsx              ← 매치 목록
│   │   │   ├── write/page.tsx        ← 매치글 작성
│   │   │   └── [id]/page.tsx         ← 매치 상세
│   │   ├── contest/
│   │   │   ├── page.tsx              ← 공모전 목록 + 즐겨찾기
│   │   │   ├── matches/page.tsx      ← 공모전 팀원 모집 목록
│   │   │   └── write/page.tsx        ← 팀원 모집 작성
│   │   ├── review/page.tsx
│   │   ├── messages/
│   │   │   ├── page.tsx              ← 메시지 허브 (탭)
│   │   │   ├── [roomId]/page.tsx     ← 1:1 매치 채팅
│   │   │   └── contest/[roomId]/page.tsx ← 공모전 그룹 채팅
│   │   ├── profile/page.tsx
│   │   └── notifications/page.tsx
│   └── api/
│       ├── auth/
│       ├── matches/
│       │   └── [id]/
│       │       ├── apply/route.ts
│       │       ├── cancel/route.ts
│       │       └── route.ts
│       ├── applications/
│       │   └── [id]/
│       │       ├── accept/route.ts
│       │       ├── reject/route.ts
│       │       └── withdraw/route.ts  ← v2.0 신규
│       ├── contest-matches/
│       │   └── [id]/apply/route.ts
│       ├── contest-applications/
│       │   └── [id]/
│       │       ├── accept/route.ts
│       │       └── reject/route.ts
│       ├── contest-rooms/
│       │   └── [id]/
│       │       ├── messages/route.ts
│       │       ├── leave/route.ts
│       │       └── invite/route.ts    ← v2.0 신규
│       ├── external-contests/route.ts
│       ├── reviews/
│       ├── messages/
│       ├── notifications/
│       └── cron/
│           ├── sync-contests/route.ts ← v2.0 신규
│           └── cleanup-matches/route.ts ← v2.0 신규
├── components/
│   ├── ui/                           ← 공통 UI 컴포넌트
│   ├── match/                        ← 매치 관련 컴포넌트
│   │   ├── MatchCard.tsx
│   │   ├── PendingApplications.tsx   ← v2.0 UI 개선
│   │   └── FilterBar.tsx
│   ├── contest/
│   │   └── ContestMatchCard.tsx      ← v2.0 신규 (실시간 남은 자리)
│   ├── chat/                         ← 채팅 컴포넌트
│   ├── review/
│   └── layout/                       ← 레이아웃 컴포넌트
├── data/
│   └── contests.ts                   ← 정적 공모전 데이터 (4개 지역, 17개)
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── admin.ts
│   └── utils/
├── types/
│   └── database.ts
├── vercel.json                        ← Cron 설정
└── public/
```

### C. 공모전 정적 데이터 현황 (v2.0)

| 지역 | 게시물 수 | 주요 공모전 |
|------|-----------|-------------|
| 충청북도 | 3개 | 미디어아트 판타지아, 유니버시아드 디자인, 충청U대회 숏폼 |
| 충청남도 | 4개 | 충남관광 사진영상, 유니버시아드 디자인, 충남 방문의 해 그림, 충청U대회 숏폼 |
| 세종특별자치시 | 3개 | 지자체 캐릭터 페스티벌, 유니버시아드 디자인, 충청U대회 숏폼 |
| 대전광역시 | 7개 | 공공디자인 공모전, 대전부르스 창작가요제, 유니버시아드 디자인, 대청호오백리길 사진, 대전관광사진, 넥스트코드 작가 공모, 충청U대회 숏폼 |
| **합계** | **17개** | - |

---

*버전: v2.0 | 최초 작성: 2026-05-26 | 최종 수정: 2026-05-28*
