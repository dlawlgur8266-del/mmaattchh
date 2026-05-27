-- ================================================
-- [1/4] 테이블 생성 & 트리거
-- Supabase SQL Editor → 새 쿼리 → 붙여넣기 → RUN
-- ================================================

-- updated_at 자동 갱신 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- profiles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  nickname TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  student_id CHAR(10) NOT NULL,
  skill_level TEXT NOT NULL DEFAULT '초급',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT profiles_skill_level_check CHECK (skill_level IN ('초급','중급','고수'))
);

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- matches
CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  team_name TEXT NOT NULL,
  sport TEXT NOT NULL,
  match_size TEXT NOT NULL,
  description TEXT NOT NULL,
  required_level TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT '모집중',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT matches_sport_check CHECK (sport IN ('축구','풋살','농구','e스포츠')),
  CONSTRAINT matches_size_check CHECK (match_size IN ('1vs1','3vs3','5vs5','11vs11')),
  CONSTRAINT matches_level_check CHECK (required_level IN ('초급','중급','고수')),
  CONSTRAINT matches_status_check CHECK (status IN ('모집중','매치확정'))
);

DROP TRIGGER IF EXISTS trg_matches_updated_at ON matches;
CREATE TRIGGER trg_matches_updated_at
  BEFORE UPDATE ON matches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- match_applications
CREATE TABLE IF NOT EXISTS match_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(match_id, applicant_id),
  CONSTRAINT applications_status_check CHECK (status IN ('pending','accepted','rejected'))
);

DROP TRIGGER IF EXISTS trg_applications_updated_at ON match_applications;
CREATE TRIGGER trg_applications_updated_at
  BEFORE UPDATE ON match_applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
