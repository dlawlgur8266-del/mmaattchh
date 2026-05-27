-- ============================================================
-- 마이그레이션: 매치 날짜/시간 + 취소 기능 추가
-- Supabase 대시보드 SQL 에디터에서 실행하세요
-- ============================================================

-- 1. matches 테이블에 match_datetime 컬럼 추가
ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS match_datetime TIMESTAMPTZ;

-- 2. matches 상태에 '취소됨' 추가
--    (CHECK 제약이 있는 경우 아래 주석 해제 후 실행)
-- ALTER TABLE matches DROP CONSTRAINT IF EXISTS matches_status_check;
-- ALTER TABLE matches ADD CONSTRAINT matches_status_check
--   CHECK (status IN ('모집중', '매치확정', '취소됨'));

-- 3. notifications 타입에 match_cancel 추가
--    (CHECK 제약이 있는 경우 아래 주석 해제 후 실행)
-- ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
-- ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
--   CHECK (type IN ('match_apply','match_accept','match_reject','new_message','match_cancel'));
