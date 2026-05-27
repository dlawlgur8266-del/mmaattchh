-- ================================================
-- Realtime 활성화 + 신청 현황 기능 마이그레이션
-- Supabase SQL Editor에서 반드시 실행하세요
-- ================================================

-- 1. notifications 테이블 Realtime 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- 2. match_applications 테이블 Realtime 활성화 (신청 현황 실시간 반영)
ALTER PUBLICATION supabase_realtime ADD TABLE match_applications;

-- 3. match_applications Realtime RLS 정책 보강
--    (match 작성자가 자신의 매치에 대한 신청을 실시간으로 수신할 수 있도록)
DROP POLICY IF EXISTS "applications_select" ON match_applications;
CREATE POLICY "applications_select" ON match_applications FOR SELECT TO authenticated
  USING (
    applicant_id = auth.uid()
    OR match_id IN (SELECT id FROM matches WHERE author_id = auth.uid())
  );
