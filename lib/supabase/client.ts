import { createBrowserClient } from '@supabase/ssr'

/**
 * 브라우저용 Supabase 클라이언트 싱글턴
 *
 * createClient()를 컴포넌트/훅 내부에서 여러 번 호출해도 항상 동일한 인스턴스를 반환합니다.
 * 이를 통해 useEffect 의존성 배열에 supabase가 포함되어 있어도
 * 렌더마다 Realtime 채널이 재생성되는 문제를 방지합니다.
 */
let browserClient: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  // SSR(서버) 환경에서는 싱글턴 없이 매번 새 인스턴스 (각 요청이 독립적이어야 함)
  if (typeof window === 'undefined') {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }

  // 브라우저: 최초 1회만 생성, 이후 동일 인스턴스 반환
  if (!browserClient) {
    browserClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return browserClient
}
