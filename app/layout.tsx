import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: '충북대 Match — 충북대학교 스포츠 매칭 플랫폼',
  description: '충북대학교(CBNU) 학생들을 위한 스포츠 팀 매칭 플랫폼. 축구, 풋살, 농구, e스포츠 팀을 찾아 실시간으로 매치를 신청하세요.',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
