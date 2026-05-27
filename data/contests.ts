// 충청북도·충청남도 공모전 데이터
// 출처: all-con.co.kr, linkareer.com (충청 지역 공모전)
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

export type ContestRegion = '충청북도' | '충청남도'

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
  {
    id: 'cb-001',
    name: '2026 청주시 청소년 창업 아이디어 공모전',
    category: '창업/마케팅',
    region: '충청북도',
    organizer: '청주시청 경제정책과',
    deadline: '2026-06-03',
    maxTeamSize: 3,
    description: '청주시 청소년(만 15~24세)을 대상으로 참신한 창업 아이디어를 모집합니다. 최우수상 300만 원 수여.',
    url: 'https://www.all-con.co.kr/list/contest/1',
    source: 'all-con',
  },
  {
    id: 'cn-001',
    name: '2026 천안시 청소년 창업 아이디어 공모전',
    category: '창업/마케팅',
    region: '충청남도',
    organizer: '천안시청 일자리경제과',
    deadline: '2026-06-05',
    maxTeamSize: 3,
    description: '천안시 거주 청소년 대상 창업 아이디어 공모. 1인~3인 팀 참가 가능.',
    url: 'https://linkareer.com/list/contest',
    source: 'linkareer',
  },
  {
    id: 'cb-002',
    name: '충청북도 환경 사진 공모전',
    category: '사진/영상',
    region: '충청북도',
    organizer: '충청북도 환경정책과',
    deadline: '2026-06-10',
    maxTeamSize: 1,
    description: '충청북도의 아름다운 자연환경을 담은 사진 공모전. 개인 부문 최우수상 100만 원.',
    url: 'https://www.all-con.co.kr/list/contest/1',
    source: 'all-con',
  },
  {
    id: 'cn-002',
    name: '충남 환경 포스터 공모전',
    category: '디자인/미술',
    region: '충청남도',
    organizer: '충청남도 기후환경정책과',
    deadline: '2026-06-12',
    maxTeamSize: 2,
    description: '탄소중립 실현을 주제로 한 포스터 디자인 공모전. 대상 200만 원.',
    url: 'https://linkareer.com/list/contest',
    source: 'linkareer',
  },
  {
    id: 'cb-003',
    name: '충북 공과대학 창의설계 경진대회',
    category: '공학/기술',
    region: '충청북도',
    organizer: '충북대학교 공과대학',
    deadline: '2026-06-15',
    maxTeamSize: 4,
    description: '공학계열 학생 대상 창의적 설계 아이디어 경진대회. 팀당 최대 4인.',
    url: 'https://www.all-con.co.kr/list/contest/1',
    source: 'all-con',
  },
  {
    id: 'cn-003',
    name: '아산시 문학 공모전',
    category: '글/문학',
    region: '충청남도',
    organizer: '아산시 문화예술과',
    deadline: '2026-06-18',
    maxTeamSize: 1,
    description: '아산 지역 문화를 소재로 한 시·소설·수필 공모전. 당선작 작품집 수록.',
    url: 'https://linkareer.com/list/contest',
    source: 'linkareer',
  },
  {
    id: 'cb-004',
    name: '2026 충주시 문화예술 창작 공모전',
    category: '예술/공연',
    region: '충청북도',
    organizer: '충주시 문화체육과',
    deadline: '2026-06-20',
    maxTeamSize: 5,
    description: '음악·무용·연극 등 공연예술 분야 창작 작품 공모. 팀 단위 참가 가능.',
    url: 'https://www.all-con.co.kr/list/contest/1',
    source: 'all-con',
  },
  {
    id: 'cn-004',
    name: '공주시 역사문화 사진 공모전',
    category: '사진/영상',
    region: '충청남도',
    organizer: '공주시 관광과',
    deadline: '2026-06-25',
    maxTeamSize: 1,
    description: '백제 역사 유적지와 공주의 역사문화를 담은 사진 공모전.',
    url: 'https://linkareer.com/list/contest',
    source: 'linkareer',
  },
  {
    id: 'cb-005',
    name: '충북 디지털 콘텐츠 공모전',
    category: '사진/영상',
    region: '충청북도',
    organizer: '충청북도 디지털경제과',
    deadline: '2026-06-30',
    maxTeamSize: 3,
    description: '숏폼 영상·웹콘텐츠 부문 공모전. 대상 500만 원, 팀 단위 참가 가능.',
    url: 'https://www.all-con.co.kr/list/contest/1',
    source: 'all-con',
  },
  {
    id: 'cn-005',
    name: '충남 소프트웨어 개발 공모전',
    category: 'IT/과학',
    region: '충청남도',
    organizer: '충남정보문화산업진흥원',
    deadline: '2026-07-03',
    maxTeamSize: 4,
    description: '충남 지역 문제 해결을 위한 SW 개발 공모전. 대상 1,000만 원.',
    url: 'https://linkareer.com/list/contest',
    source: 'linkareer',
  },
  {
    id: 'cb-006',
    name: '제천시 문학 창작 공모전',
    category: '글/문학',
    region: '충청북도',
    organizer: '제천시 문화관광과',
    deadline: '2026-07-05',
    maxTeamSize: 1,
    description: '제천 한방바이오 엑스포 기념 문학 공모전. 시·수필·소설 부문.',
    url: 'https://www.all-con.co.kr/list/contest/1',
    source: 'all-con',
  },
  {
    id: 'cb-007',
    name: '충청북도 IT 소프트웨어 경진대회',
    category: 'IT/과학',
    region: '충청북도',
    organizer: '충북테크노파크',
    deadline: '2026-07-10',
    maxTeamSize: 4,
    description: 'AI·빅데이터·앱 개발 부문 경진대회. 우수팀에 기술 멘토링 지원.',
    url: 'https://www.all-con.co.kr/list/contest/1',
    source: 'all-con',
  },
  {
    id: 'cn-006',
    name: '홍성군 친환경 아이디어 공모전',
    category: '환경/사회',
    region: '충청남도',
    organizer: '홍성군 환경위생과',
    deadline: '2026-07-15',
    maxTeamSize: 3,
    description: '탄소중립 실천 아이디어 공모. 지역 초·중·고·대학생 모두 참가 가능.',
    url: 'https://linkareer.com/list/contest',
    source: 'linkareer',
  },
  {
    id: 'cb-008',
    name: '충북 그래픽 디자인 공모전',
    category: '디자인/미술',
    region: '충청북도',
    organizer: '충청북도 문화산업과',
    deadline: '2026-07-20',
    maxTeamSize: 2,
    description: '충북 관광 브랜드 홍보를 위한 그래픽 디자인 공모. 대상 300만 원.',
    url: 'https://www.all-con.co.kr/list/contest/1',
    source: 'all-con',
  },
  {
    id: 'cn-007',
    name: '천안시 문화예술 영상 공모전',
    category: '사진/영상',
    region: '충청남도',
    organizer: '천안시 문화체육과',
    deadline: '2026-07-22',
    maxTeamSize: 3,
    description: '천안의 역사·문화를 주제로 한 단편영상 공모전. 팀 단위 참가 가능.',
    url: 'https://linkareer.com/list/contest',
    source: 'linkareer',
  },
  {
    id: 'cn-008',
    name: '충남창조경제혁신센터 창업 경진대회',
    category: '창업/마케팅',
    region: '충청남도',
    organizer: '충남창조경제혁신센터',
    deadline: '2026-07-30',
    maxTeamSize: 5,
    description: '초기 스타트업 팀 대상 창업 경진대회. 우수팀 투자 연계 및 입주 공간 지원.',
    url: 'https://linkareer.com/list/contest',
    source: 'linkareer',
  },
  {
    id: 'cb-009',
    name: '청주시 사회혁신 공모전',
    category: '환경/사회',
    region: '충청북도',
    organizer: '청주시 사회혁신담당관',
    deadline: '2026-08-01',
    maxTeamSize: 4,
    description: '청주시 지역 문제 해결을 위한 사회혁신 아이디어 공모전. 최대 4인 팀 참가.',
    url: 'https://www.all-con.co.kr/list/contest/1',
    source: 'all-con',
  },
  {
    id: 'cn-009',
    name: '보령시 공학설계 아이디어 공모전',
    category: '공학/기술',
    region: '충청남도',
    organizer: '보령시 일자리경제과',
    deadline: '2026-08-10',
    maxTeamSize: 3,
    description: '보령 해양 환경 관련 공학 설계 아이디어 공모전. 대상 200만 원.',
    url: 'https://linkareer.com/list/contest',
    source: 'linkareer',
  },
  {
    id: 'cb-010',
    name: '충북테크노파크 스타트업 피칭 공모전',
    category: '창업/마케팅',
    region: '충청북도',
    organizer: '충북테크노파크',
    deadline: '2026-08-15',
    maxTeamSize: 5,
    description: '충북 지역 유망 스타트업 발굴 피칭 대회. 우수팀 1억 원 규모 투자 지원.',
    url: 'https://www.all-con.co.kr/list/contest/1',
    source: 'all-con',
  },
  {
    id: 'cn-010',
    name: '충남 K-뷰티 디자인 공모전',
    category: '디자인/미술',
    region: '충청남도',
    organizer: '충청남도 화장품뷰티산업과',
    deadline: '2026-08-20',
    maxTeamSize: 2,
    description: 'K-뷰티 제품 패키지 및 브랜드 디자인 공모전. 대상 500만 원.',
    url: 'https://linkareer.com/list/contest',
    source: 'linkareer',
  },
]

// 마감일 기준 오름차순 정렬 (이미 정렬되어 있지만 함수도 제공)
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
