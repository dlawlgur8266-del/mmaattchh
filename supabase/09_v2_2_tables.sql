-- ================================================
-- [v2.2] 개인 프로필, 시설 예약, 신고, 공모전 크롤러 테이블
-- Supabase SQL Editor → 새 쿼리 → 붙여넣기 → RUN
-- ================================================

-- profiles 컬럼 추가 (기존 테이블 확장)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS avatar_url    TEXT,
  ADD COLUMN IF NOT EXISTS role          TEXT NOT NULL DEFAULT 'user'
    CHECK (role IN ('user', 'admin')),
  ADD COLUMN IF NOT EXISTS is_active     BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS department    TEXT;

-- ── Python 크롤러용 공모전 테이블 ─────────────────────────────
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
  last_crawled_at  TIMESTAMPTZ DEFAULT now(),
  created_at       TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_contests_region        ON contests(region);
CREATE INDEX IF NOT EXISTS idx_contests_field         ON contests(field);
CREATE INDEX IF NOT EXISTS idx_contests_is_active     ON contests(is_active);
CREATE INDEX IF NOT EXISTS idx_contests_end_date      ON contests(end_date);

-- ── 개인 공모전 프로필 ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contest_profiles (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  department     TEXT,
  gender         TEXT CHECK (gender IN ('male','female','other')),
  age            INTEGER CHECK (age BETWEEN 18 AND 40),
  contest_count  INTEGER NOT NULL DEFAULT 0,
  certificates   TEXT[] NOT NULL DEFAULT '{}',
  fields         TEXT[] NOT NULL DEFAULT '{}',
  intro          TEXT CHECK (char_length(intro) <= 300),
  is_visible     BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at     TIMESTAMPTZ DEFAULT now() NOT NULL
);

DROP TRIGGER IF EXISTS trg_contest_profiles_updated_at ON contest_profiles;
CREATE TRIGGER trg_contest_profiles_updated_at
  BEFORE UPDATE ON contest_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── 개인 스포츠 프로필 ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS sports_profiles (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  gender       TEXT CHECK (gender IN ('male','female','other')),
  age          INTEGER CHECK (age BETWEEN 18 AND 40),
  sports       TEXT[] NOT NULL DEFAULT '{}',
  career_years INTEGER NOT NULL DEFAULT 0,
  is_pro       BOOLEAN NOT NULL DEFAULT false,
  intro        TEXT CHECK (char_length(intro) <= 300),
  is_visible   BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at   TIMESTAMPTZ DEFAULT now() NOT NULL
);

DROP TRIGGER IF EXISTS trg_sports_profiles_updated_at ON sports_profiles;
CREATE TRIGGER trg_sports_profiles_updated_at
  BEFORE UPDATE ON sports_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── 스포츠 시설 예약 현황 (크롤링 데이터) ───────────────────────
CREATE TABLE IF NOT EXISTS sports_reservations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility         TEXT NOT NULL CHECK (facility IN (
                     'futsal_a','futsal_b',
                     'basketball_a','basketball_b',
                     'tennis_a','tennis_b','tennis_c','tennis_d','tennis_e',
                     'small_field','main_field'
                   )),
  reservation_date DATE NOT NULL,
  start_time       TIME NOT NULL,
  end_time         TIME NOT NULL,
  status           TEXT NOT NULL DEFAULT 'available'
                   CHECK (status IN ('available','reserved','closed')),
  last_crawled_at  TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (facility, reservation_date, start_time)
);

CREATE INDEX IF NOT EXISTS idx_reservations_facility ON sports_reservations(facility);
CREATE INDEX IF NOT EXISTS idx_reservations_date     ON sports_reservations(reservation_date);

-- ── 개인 간 매칭 요청 ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profile_matches (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type         TEXT NOT NULL CHECK (type IN ('contest','sports')),
  requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message      TEXT CHECK (char_length(message) <= 200),
  status       TEXT NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending','accepted','rejected','cancelled')),
  created_at   TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at   TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (requester_id, receiver_id, type)
);

DROP TRIGGER IF EXISTS trg_profile_matches_updated_at ON profile_matches;
CREATE TRIGGER trg_profile_matches_updated_at
  BEFORE UPDATE ON profile_matches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── 신고 ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reports (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reported_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason      TEXT NOT NULL CHECK (reason IN ('불쾌한 언행','허위 정보','스팸','기타')),
  detail      TEXT CHECK (char_length(detail) <= 500),
  status      TEXT NOT NULL DEFAULT 'pending'
              CHECK (status IN ('pending','resolved','dismissed')),
  created_at  TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ── RLS 정책 ────────────────────────────────────────────────

-- contests (공모전 - 크롤러 전용 쓰기)
ALTER TABLE contests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "contests_select" ON contests;
CREATE POLICY "contests_select" ON contests FOR SELECT USING (true);

-- contest_profiles
ALTER TABLE contest_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cp_select" ON contest_profiles;
CREATE POLICY "cp_select" ON contest_profiles FOR SELECT
  USING (is_visible = true OR user_id = auth.uid());
DROP POLICY IF EXISTS "cp_insert" ON contest_profiles;
CREATE POLICY "cp_insert" ON contest_profiles FOR INSERT
  WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "cp_update" ON contest_profiles;
CREATE POLICY "cp_update" ON contest_profiles FOR UPDATE
  USING (user_id = auth.uid());
DROP POLICY IF EXISTS "cp_delete" ON contest_profiles;
CREATE POLICY "cp_delete" ON contest_profiles FOR DELETE
  USING (user_id = auth.uid());

-- sports_profiles
ALTER TABLE sports_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sp_select" ON sports_profiles;
CREATE POLICY "sp_select" ON sports_profiles FOR SELECT
  USING (is_visible = true OR user_id = auth.uid());
DROP POLICY IF EXISTS "sp_insert" ON sports_profiles;
CREATE POLICY "sp_insert" ON sports_profiles FOR INSERT
  WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "sp_update" ON sports_profiles;
CREATE POLICY "sp_update" ON sports_profiles FOR UPDATE
  USING (user_id = auth.uid());
DROP POLICY IF EXISTS "sp_delete" ON sports_profiles;
CREATE POLICY "sp_delete" ON sports_profiles FOR DELETE
  USING (user_id = auth.uid());

-- sports_reservations (전체 읽기 허용, 쓰기는 service_role만)
ALTER TABLE sports_reservations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sr_select" ON sports_reservations;
CREATE POLICY "sr_select" ON sports_reservations FOR SELECT USING (true);

-- profile_matches
ALTER TABLE profile_matches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pm_select" ON profile_matches;
CREATE POLICY "pm_select" ON profile_matches FOR SELECT
  USING (requester_id = auth.uid() OR receiver_id = auth.uid());
DROP POLICY IF EXISTS "pm_insert" ON profile_matches;
CREATE POLICY "pm_insert" ON profile_matches FOR INSERT
  WITH CHECK (requester_id = auth.uid());
DROP POLICY IF EXISTS "pm_update" ON profile_matches;
CREATE POLICY "pm_update" ON profile_matches FOR UPDATE
  USING (requester_id = auth.uid() OR receiver_id = auth.uid());
DROP POLICY IF EXISTS "pm_delete" ON profile_matches;
CREATE POLICY "pm_delete" ON profile_matches FOR DELETE
  USING (requester_id = auth.uid());

-- reports
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "reports_select" ON reports;
CREATE POLICY "reports_select" ON reports FOR SELECT
  USING (reporter_id = auth.uid());
DROP POLICY IF EXISTS "reports_insert" ON reports;
CREATE POLICY "reports_insert" ON reports FOR INSERT
  WITH CHECK (reporter_id = auth.uid() AND reporter_id != reported_id);
