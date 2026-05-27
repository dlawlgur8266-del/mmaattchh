// 충북대학교 전체 학과 목록 (단과대학별)
// 출처: https://www.cbnu.ac.kr/www/contents.do?key=391 (각 단과대학 페이지)

export interface CollegeDepartments {
  college: string
  departments: string[]
}

export const CBNU_DEPARTMENTS: CollegeDepartments[] = [
  {
    college: '인문대학',
    departments: [
      '국어국문학과', '중어중문학과', '영어영문학과',
      '독일언어문화학과', '프랑스언어문화학과', '러시아언어문화학과',
      '철학과', '사학과', '고고미술사학과', '글로벌K컬처학과',
      '인문학자율전공학부',
    ],
  },
  {
    college: '사회과학대학',
    departments: [
      '사회학과', '심리학과', '행정학과', '정치외교학과', '경제학과',
    ],
  },
  {
    college: '자연과학대학',
    departments: [
      '수학과', '정보통계학과', '물리학과', '화학과',
      '생물학과', '미생물학과', '생화학과', '천문우주학과', '지구환경과학과',
    ],
  },
  {
    college: '경영대학',
    departments: [
      '경영학부', '국제경영학과', '경영정보학과', '경영학자율전공학부',
    ],
  },
  {
    college: '공과대학',
    departments: [
      '토목공학부', '기계공학부', '화학공학과', '신소재공학과',
      '건축공학과', '안전공학과', '환경공학과', '공업화학과',
      '도시공학과', '건축학과', '테크노산업공학과',
    ],
  },
  {
    college: '전자정보대학',
    departments: [
      '전기공학부', '전자공학과', '정보통신공학부', '컴퓨터공학과',
      '소프트웨어학부', '지능로봇공학과', '반도체공학부',
    ],
  },
  {
    college: '농업생명환경대학',
    departments: [
      '산림학과', '지역건설공학과', '바이오시스템공학과', '목재종이과학과',
      '농업경제학과', '식물자원학과', '환경생명화학과', '축산학과',
      '식품생명공학과', '특용식물학과', '원예과학과', '식물의학과',
    ],
  },
  {
    college: '사범대학',
    departments: [
      '교육학과', '국어교육과', '영어교육과', '역사교육과', '지리교육과',
      '사회교육과', '윤리교육과', '물리교육과', '화학교육과',
      '생물교육과', '지구과학교육과', '수학교육과', '체육교육과',
    ],
  },
  {
    college: '생활과학대학',
    departments: [
      '식품영양학과', '아동복지학과', '의류학과', '주거환경학과', '소비자학과',
    ],
  },
  {
    college: '수의과대학',
    departments: ['수의학과'],
  },
  {
    college: '약학대학',
    departments: ['약학과'],
  },
  {
    college: '의과대학',
    departments: ['의학과'],
  },
  {
    college: '간호대학',
    departments: ['간호학과'],
  },
  {
    college: '창의융합대학',
    departments: ['자율전공학부', '바이오헬스학부'],
  },
  {
    college: '예술학과군',
    departments: ['미술학과', '디자인학과'],
  },
]

/** 모든 학과명 flat 배열 */
export const ALL_DEPARTMENTS = CBNU_DEPARTMENTS.flatMap((c) => c.departments)
