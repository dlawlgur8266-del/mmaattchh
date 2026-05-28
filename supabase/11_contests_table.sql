-- ================================================
-- contests 테이블 생성 (Python 크롤러용 공모전)
-- Supabase SQL Editor → 새 쿼리 → 붙여넣기 → RUN
-- ================================================

CREATE TABLE IF NOT EXISTS contests (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title            TEXT NOT NULL,
  organizer        TEXT,
  field            TEXT NOT NULL CHECK (field IN (
                     'marketing','video','design','literature',
                     'it','arts','academic'
                   )),
  region           TEXT NOT NULL CHECK (region IN (
                     '충청북도','충청남도','세종특별자치시','대전광역시'
                   )),
  start_date       DATE,
  end_date         DATE NOT NULL,
  max_participants INTEGER,
  url              TEXT UNIQUE NOT NULL,
  thumbnail_url    TEXT,
  is_active        BOOLEAN NOT NULL DEFAULT true,
  source           TEXT NOT NULL CHECK (source IN ('contestkorea','wevity','linkareer')),
  summary          TEXT,
  last_crawled_at  TIMESTAMPTZ DEFAULT now(),
  created_at       TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_contests_region    ON contests(region);
CREATE INDEX IF NOT EXISTS idx_contests_field     ON contests(field);
CREATE INDEX IF NOT EXISTS idx_contests_is_active ON contests(is_active);
CREATE INDEX IF NOT EXISTS idx_contests_end_date  ON contests(end_date);

-- RLS (전체 읽기 허용, 쓰기는 service_role 전용)
ALTER TABLE contests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "contests_select" ON contests;
CREATE POLICY "contests_select" ON contests FOR SELECT USING (true);
