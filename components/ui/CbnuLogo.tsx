import Image from 'next/image'

interface Props {
  size?: number
  className?: string
}

/** 충북대학교 공식 마크 */
export function CbnuMark({ size = 36, className = '' }: Props) {
  return (
    <Image
      src="/cbnu-logo.webp"
      alt="충북대학교"
      width={size}
      height={size}
      className={className}
      style={{ objectFit: 'contain' }}
      priority
    />
  )
}

/** 흰색 배경에서도 보이도록 밝기 높인 버전 (랜딩/로그인용) */
export function CbnuMarkWhite({ size = 36, className = '' }: Props) {
  return (
    <Image
      src="/cbnu-logo.webp"
      alt="충북대학교"
      width={size}
      height={size}
      className={className}
      style={{ objectFit: 'contain', filter: 'brightness(0) invert(1)' }}
      priority
    />
  )
}
