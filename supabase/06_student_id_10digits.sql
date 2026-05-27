-- ================================================
-- 학번 컬럼 8자리 → 10자리 마이그레이션
-- Supabase SQL Editor에서 실행하세요
-- ================================================

ALTER TABLE profiles ALTER COLUMN student_id TYPE CHAR(10);
