// 충청북도·충청남도·세종특별자치시·대전광역시 공모전 데이터
// 출처: all-con.co.kr, linkareer.com, wevity.com (실제 데이터 기준)
// 마감일 오름차순 정렬

export type ContestCategory =
  | '전체'
  | '글/문학'
  | '디자인/미술'
  | '사진/영상'
  | 'IT/과학'
  | '창업/마케팅'
  | '환경/사회'
  | '공학/기술'
  | '예술/공연'

export type ContestRegion = '충청북도' | '충청남도' | '세종특별자치시' | '대전광역시'

export interface Contest {
  id: string
  name: string
  category: ContestCategory
  region: ContestRegion
  organizer: string
  deadline: string // YYYY-MM-DD
  maxTeamSize: number
  description: string
  url: string
  source: 'all-con' | 'linkareer'
}

export const CONTEST_CATEGORIES: ContestCategory[] = [
  '전체',
  '글/문학',
  '디자인/미술',
  '사진/영상',
  'IT/과학',
  '창업/마케팅',
  '환경/사회',
  '공학/기술',
  '예술/공연',
]

export const CATEGORY_COLORS: Record<ContestCategory, { color: string; bg: string }> = {
  '전체':       { color: '#475569', bg: '#F1F5F9' },
  '글/문학':    { color: '#7C3AED', bg: '#EDE9FE' },
  '디자인/미술': { color: '#DB2777', bg: '#FCE7F3' },
  '사진/영상':  { color: '#0369A1', bg: '#E0F2FE' },
  'IT/과학':    { color: '#0D9488', bg: '#CCFBF1' },
  '창업/마케팅': { color: '#D97706', bg: '#FEF3C7' },
  '환경/사회':  { color: '#16A34A', bg: '#DCFCE7' },
  '공학/기술':  { color: '#EA580C', bg: '#FFEDD5' },
  '예술/공연':  { color: '#9333EA', bg: '#F3E8FF' },
}

export const CONTESTS: Contest[] = [
  // ─── 충청북도 ───────────────────────────────────────────────────────────
  // 출처: all-con.co.kr, contestkorea.com (실제 2026년 충청북도 공모전)
  {
    id: 'cb-001',
    name: '2026 충북도청 미디어아트 판타지아 공모전',
    category: '사진/영상',
    region: '충청북도',
    organizer: '충청북도 (정책기획관)',
    deadline: '2026-04-07',
    maxTeamSize: 5,
    description: '"빛으로 피는 꽃, 미래를 여는 봄" 주제 미디어아트 공모. 영상 2~3분. 이메일 접수. 총 상금 2,500만 원.',
    url: 'https://www.all-con.co.kr/view/contest/534162',
    source: 'all-con',
  },
  {
    id: 'cb-002',
    name: '2027 충청 유니버시아드대회 공식상품 디자인 공모전',
    category: '디자인/미술',
    region: '충청북도',
    organizer: '2027 충청권 하계세계대학경기대회 조직위원회',
    deadline: '2026-07-27',
    maxTeamSize: 5,
    description: '충청의 매력을 담은 2027 충청 유니버시아드 공식 굿즈 디자인 공모. 일반·전문가 부문. 총 상금 1,600만 원.',
    url: 'https://www.chungcheong2027.com/',
    source: 'all-con',
  },

  // ─── 충청남도 ───────────────────────────────────────────────────────────
  // 출처: linkareer.com, wevity.com, chungnam.go.kr (실제 2026년 충청남도 공모전)
  {
    id: 'cn-001',
    name: '2026년 충남관광 사진·영상 공모전',
    category: '사진/영상',
    region: '충청남도',
    organizer: '충청남도 / 마이블미디어',
    deadline: '2026-09-30',
    maxTeamSize: 3,
    description: '"나만 알고 싶은 충남" 주제로 충남의 관광지·축제·문화를 촬영한 사진·영상 공모. 영상 최우수 500만 원, 사진 최우수 200만 원.',
    url: 'https://linkareer.com/activity/236370',
    source: 'linkareer',
  },
  {
    id: 'cn-002',
    name: '2027 충청 유니버시아드대회 공식상품 디자인 공모전',
    category: '디자인/미술',
    region: '충청남도',
    organizer: '2027 충청권 하계세계대학경기대회 조직위원회',
    deadline: '2026-07-27',
    maxTeamSize: 5,
    description: '충청의 매력을 담은 2027 충청 유니버시아드 공식 굿즈 디자인 공모. 일반·전문가 부문. 총 상금 1,600만 원.',
    url: 'https://www.chungcheong2027.com/',
    source: 'all-con',
  },
  {
    id: 'cn-003',
    name: '2025~2026 충남 방문의 해 그림 공모전',
    category: '디자인/미술',
    region: '충청남도',
    organizer: '충청남도',
    deadline: '2026-08-31',
    maxTeamSize: 1,
    description: '충청남도 방문의 해를 기념한 그림 공모전. 충남의 자연·문화·관광을 주제로 한 그림 작품 모집.',
    url: 'https://www.chungnam.go.kr/contest.do',
    source: 'linkareer',
  },

  // ─── 세종특별자치시 ──────────────────────────────────────────────────────
  // 출처: contestkorea.com, chungcheong2027.com (실제 2026년 세종 공모전)
  {
    id: 'sj-001',
    name: '2027 충청 유니버시아드대회 공식상품 디자인 공모전',
    category: '디자인/미술',
    region: '세종특별자치시',
    organizer: '2027 충청권 하계세계대학경기대회 조직위원회',
    deadline: '2026-07-27',
    maxTeamSize: 5,
    description: '충청의 매력을 담은 2027 충청 유니버시아드 공식 굿즈 디자인 공모. 일반·전문가 부문. 총 상금 1,600만 원.',
    url: 'https://www.chungcheong2027.com/',
    source: 'all-con',
  },
  {
    id: 'sj-002',
    name: '2026 대한민국 지자체·공공 캐릭터 페스티벌 대상 공모전',
    category: '디자인/미술',
    region: '세종특별자치시',
    organizer: '한국문화콘텐츠라이센싱협회 / 대전관광공사',
    deadline: '2026-07-10',
    maxTeamSize: 3,
    description: '전국 지자체·공공기관 캐릭터 디자인 공모전. 세종·대전 지역 홍보 캐릭터 및 굿즈 디자인 공모.',
    url: 'https://www.all-con.co.kr/list/contest/1',
    source: 'all-con',
  },

  // ─── 대전광역시 ──────────────────────────────────────────────────────────
  // 출처: all-con.co.kr, daejeon.go.kr, 대전관광공사 (실제 2026년 대전 공모전)
  {
    id: 'dj-001',
    name: '제18회 대전광역시 공공디자인 공모전',
    category: '디자인/미술',
    region: '대전광역시',
    organizer: '대전광역시',
    deadline: '2026-06-22',
    maxTeamSize: 3,
    description: '"머무는 도시, 대전" 주제 공공디자인 공모. 공간·시설물·시각 디자인 부문. 대상 500만 원.',
    url: 'https://www.daejeon.go.kr/dsi/index.do',
    source: 'all-con',
  },
  {
    id: 'dj-002',
    name: '2026년 제4회 대전부르스 창작가요제',
    category: '예술/공연',
    region: '대전광역시',
    organizer: '대전음악창작소 (대전정보문화산업진흥원)',
    deadline: '2026-06-30',
    maxTeamSize: 5,
    description: '장르 불문 "대전광역시" 주제 창작 음악 공모. 1차 예선 → 2차 예선 → 본선. 총 상금 1,800만 원(대상 600만 원).',
    url: 'https://www.all-con.co.kr/view/contest/536769',
    source: 'all-con',
  },
  {
    id: 'dj-003',
    name: '2027 충청 유니버시아드대회 공식상품 디자인 공모전',
    category: '디자인/미술',
    region: '대전광역시',
    organizer: '2027 충청권 하계세계대학경기대회 조직위원회',
    deadline: '2026-07-27',
    maxTeamSize: 5,
    description: '충청의 매력을 담은 2027 충청 유니버시아드 공식 굿즈 디자인 공모. 일반·전문가 부문. 총 상금 1,600만 원.',
    url: 'https://www.chungcheong2027.com/',
    source: 'all-con',
  },
  {
    id: 'dj-004',
    name: '2026 대청호 오백리길(대전구간) 디지털 사진 공모전',
    category: '사진/영상',
    region: '대전광역시',
    organizer: '대전관광공사',
    deadline: '2026-09-30',
    maxTeamSize: 1,
    description: '대청호오백리길 대전구간(1~5, 21구간) 디지털 사진 공모. 연령 제한 없음. 총 상금 380만 원.',
    url: 'https://www.all-con.co.kr/list/contest/1',
    source: 'all-con',
  },
  {
    id: 'dj-005',
    name: '2026년 대전관광사진 전국공모전',
    category: '사진/영상',
    region: '대전광역시',
    organizer: '대전광역시 (한국사진작가협회 대전지회)',
    deadline: '2026-11-06',
    maxTeamSize: 1,
    description: '"그 시간, 그 계절의 대전" 주제 일반사진·드론사진 공모. 1인 부문별 5점 이내. 총 상금 1,730만 원(금상 200만 원).',
    url: 'https://www.all-con.co.kr/view/contest/537128',
    source: 'all-con',
  },
]

// 마감일 기준 오름차순 정렬
export function getSortedContests(contests: Contest[]): Contest[] {
  return [...contests].sort(
    (a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
  )
}

export function getContestsByRegion(region: ContestRegion): Contest[] {
  return getSortedContests(CONTESTS.filter((c) => c.region === region))
}

export function getContestsByCategory(region: ContestRegion, category: ContestCategory): Contest[] {
  const byRegion = getContestsByRegion(region)
  if (category === '전체') return byRegion
  return byRegion.filter((c) => c.category === category)
}

export function getDaysUntilDeadline(deadline: string): number {
  const now = new Date()
  const d = new Date(deadline)
  const diff = d.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}
