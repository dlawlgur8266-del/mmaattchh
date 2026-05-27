-- ================================================
-- notifications 테이블 Realtime 활성화
-- Supabase SQL Editor에서 실행하세요
-- ================================================

-- notifications 테이블에 Realtime 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- (선택) match_applications 테이블도 Realtime 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE match_applications;
