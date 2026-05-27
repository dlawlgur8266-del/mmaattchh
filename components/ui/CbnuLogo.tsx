/**
 * 충북대학교 마크 스타일 로고 SVG 컴포넌트
 * 충북대학교(CBNU) 대표 색상 #1E3A5F(남색)와 녹색 월계수 사용
 */

interface CbnuMarkProps {
  size?: number
  className?: string
}

/** 상단 헤더/랜딩에서 사용하는 엠블럼 + 텍스트 통합 로고 */
export function CbnuLogoFull({
  dark = false,
  size = 'md',
}: {
  dark?: boolean
  size?: 'sm' | 'md' | 'lg'
}) {
  const textSizes = { sm: 'text-lg', md: 'text-xl', lg: 'text-3xl' }
  const markSizes = { sm: 28, md: 34, lg: 44 }

  return (
    <span className={`inline-flex items-center gap-2 font-bold tracking-tight ${textSizes[size]}`}>
      <CbnuMark size={markSizes[size]} />
      <span className={dark ? 'text-white' : 'text-[#1E3A5F]'}>
        충북대<span className={dark ? 'text-[#FF6B35]' : 'text-accent'}>Match</span>
      </span>
    </span>
  )
}

/** 충북대학교 원형 엠블럼 마크 */
export function CbnuMark({ size = 36, className = '' }: CbnuMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 72 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="충북대학교 마크"
    >
      {/* 배경 원 */}
      <circle cx="36" cy="36" r="36" fill="#1E3A5F" />

      {/* 내부 장식 링 */}
      <circle cx="36" cy="36" r="31" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
      <circle cx="36" cy="36" r="28" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.75" />

      {/* ── 왼쪽 월계수 가지 ── */}
      <ellipse cx="13" cy="38" rx="4.5" ry="7" fill="#4CAF50" opacity="0.85" transform="rotate(-25 13 38)" />
      <ellipse cx="11" cy="30" rx="3.5" ry="6" fill="#4CAF50" opacity="0.75" transform="rotate(-15 11 30)" />
      <ellipse cx="13" cy="22" rx="3" ry="5.5" fill="#4CAF50" opacity="0.6" transform="rotate(-5 13 22)" />
      <ellipse cx="17" cy="16" rx="2.5" ry="5" fill="#4CAF50" opacity="0.5" transform="rotate(10 17 16)" />
      {/* 가지 줄기 왼쪽 */}
      <path d="M16 46 Q13 38 14 28 Q15 18 20 12" stroke="#388E3C" strokeWidth="1.5" fill="none" opacity="0.6" strokeLinecap="round" />

      {/* ── 오른쪽 월계수 가지 ── */}
      <ellipse cx="59" cy="38" rx="4.5" ry="7" fill="#4CAF50" opacity="0.85" transform="rotate(25 59 38)" />
      <ellipse cx="61" cy="30" rx="3.5" ry="6" fill="#4CAF50" opacity="0.75" transform="rotate(15 61 30)" />
      <ellipse cx="59" cy="22" rx="3" ry="5.5" fill="#4CAF50" opacity="0.6" transform="rotate(5 59 22)" />
      <ellipse cx="55" cy="16" rx="2.5" ry="5" fill="#4CAF50" opacity="0.5" transform="rotate(-10 55 16)" />
      {/* 가지 줄기 오른쪽 */}
      <path d="M56 46 Q59 38 58 28 Q57 18 52 12" stroke="#388E3C" strokeWidth="1.5" fill="none" opacity="0.6" strokeLinecap="round" />

      {/* ── 상단 별/빛 장식 ── */}
      <polygon
        points="36,9 37.8,14.5 43.5,14.5 39,17.8 40.8,23.3 36,20 31.2,23.3 33,17.8 28.5,14.5 34.2,14.5"
        fill="#FFD54F"
        opacity="0.95"
      />

      {/* ── 중앙 텍스트: 충북대 ── */}
      <text
        x="36"
        y="40"
        textAnchor="middle"
        fill="white"
        fontSize="13"
        fontWeight="bold"
        fontFamily="'Apple SD Gothic Neo','Malgun Gothic','Noto Sans KR',sans-serif"
        letterSpacing="0.5"
      >
        충북대
      </text>

      {/* ── 하단 가로선 ── */}
      <line x1="22" y1="46" x2="50" y2="46" stroke="rgba(255,255,255,0.35)" strokeWidth="1" />

      {/* ── 하단 텍스트: CBNU ── */}
      <text
        x="36"
        y="55"
        textAnchor="middle"
        fill="rgba(255,255,255,0.7)"
        fontSize="7"
        fontFamily="'Arial','Helvetica',sans-serif"
        letterSpacing="2.5"
        fontWeight="600"
      >
        CBNU
      </text>
    </svg>
  )
}

/** 랜딩/로그인 페이지용 흰색 버전 로고 */
export function CbnuMarkWhite({ size = 36, className = '' }: CbnuMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 72 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="충북대학교 마크"
    >
      {/* 배경 원 (반투명 흰색) */}
      <circle cx="36" cy="36" r="36" fill="rgba(255,255,255,0.15)" />
      <circle cx="36" cy="36" r="31" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />

      {/* 왼쪽 월계수 */}
      <ellipse cx="13" cy="38" rx="4.5" ry="7" fill="rgba(255,255,255,0.55)" transform="rotate(-25 13 38)" />
      <ellipse cx="11" cy="30" rx="3.5" ry="6" fill="rgba(255,255,255,0.45)" transform="rotate(-15 11 30)" />
      <ellipse cx="13" cy="22" rx="3" ry="5.5" fill="rgba(255,255,255,0.35)" transform="rotate(-5 13 22)" />
      <path d="M16 46 Q13 38 14 28 Q15 18 20 12" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" fill="none" strokeLinecap="round" />

      {/* 오른쪽 월계수 */}
      <ellipse cx="59" cy="38" rx="4.5" ry="7" fill="rgba(255,255,255,0.55)" transform="rotate(25 59 38)" />
      <ellipse cx="61" cy="30" rx="3.5" ry="6" fill="rgba(255,255,255,0.45)" transform="rotate(15 61 30)" />
      <ellipse cx="59" cy="22" rx="3" ry="5.5" fill="rgba(255,255,255,0.35)" transform="rotate(5 59 22)" />
      <path d="M56 46 Q59 38 58 28 Q57 18 52 12" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" fill="none" strokeLinecap="round" />

      {/* 상단 별 */}
      <polygon
        points="36,9 37.8,14.5 43.5,14.5 39,17.8 40.8,23.3 36,20 31.2,23.3 33,17.8 28.5,14.5 34.2,14.5"
        fill="#FFD54F"
        opacity="0.9"
      />

      {/* 중앙 텍스트 */}
      <text
        x="36"
        y="40"
        textAnchor="middle"
        fill="white"
        fontSize="13"
        fontWeight="bold"
        fontFamily="'Apple SD Gothic Neo','Malgun Gothic','Noto Sans KR',sans-serif"
        letterSpacing="0.5"
      >
        충북대
      </text>

      {/* 하단 선 + CBNU */}
      <line x1="22" y1="46" x2="50" y2="46" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
      <text
        x="36"
        y="55"
        textAnchor="middle"
        fill="rgba(255,255,255,0.75)"
        fontSize="7"
        fontFamily="'Arial','Helvetica',sans-serif"
        letterSpacing="2.5"
        fontWeight="600"
      >
        CBNU
      </text>
    </svg>
  )
}
