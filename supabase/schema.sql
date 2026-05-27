-- ================================================
-- 충북match Supabase 데이터베이스 스키마 (전체)
-- Supabase SQL Editor에서 이 파일 하나만 실행하세요
-- 재실행해도 에러 없이 동작합니다
-- ================================================

-- ── 유틸: updated_at 자동 갱신 함수 ─────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- ── 1. profiles ──────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  nickname TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  student_id CHAR(10) NOT NULL,
  skill_level TEXT CHECK (skill_level IN ('초급','중급','고수')) DEFAULT '초급' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 공모전 출전 횟수 컬럼 (기존 테이블에 없으면 추가)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS contest_count INTEGER DEFAULT 0;
-- 소속 학과 컬럼
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS department TEXT;
-- 학번 중복 가입 방지 (유니크 인덱스)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_student_id_key ON profiles(student_id);

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── 2. matches ───────────────────────────────────
CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  team_name TEXT NOT NULL,
  sport TEXT CHECK (sport IN ('축구','풋살','농구','e스포츠')) NOT NULL,
  match_size TEXT CHECK (match_size IN ('1vs1','3vs3','5vs5','11vs11')) NOT NULL,
  location TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL,
  required_level TEXT CHECK (required_level IN ('초급','중급','고수')) NOT NULL,
  status TEXT CHECK (status IN ('모집중','매치확정','취소됨')) DEFAULT '모집중' NOT NULL,
  match_datetime TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE matches ADD COLUMN IF NOT EXISTS location TEXT NOT NULL DEFAULT '';
ALTER TABLE matches ADD COLUMN IF NOT EXISTS match_datetime TIMESTAMPTZ;

DROP TRIGGER IF EXISTS update_matches_updated_at ON matches;
CREATE TRIGGER update_matches_updated_at
  BEFORE UPDATE ON matches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── 3. match_applications ────────────────────────
CREATE TABLE IF NOT EXISTS match_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('pending','accepted','rejected')) DEFAULT 'pending' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(match_id, applicant_id)
);

DROP TRIGGER IF EXISTS update_match_applications_updated_at ON match_applications;
CREATE TRIGGER update_match_applications_updated_at
  BEFORE UPDATE ON match_applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── 4. message_rooms ─────────────────────────────
CREATE TABLE IF NOT EXISTS message_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES match_applications(id) ON DELETE CASCADE,
  participant_1 UUID NOT NULL REFERENCES profiles(id),
  participant_2 UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ── 5. messages ──────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES message_rooms(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id),
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ── 6. reviews ───────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES profiles(id),
  reviewee_id UUID NOT NULL REFERENCES profiles(id),
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(match_id, reviewer_id)
);

-- ── 7. notifications ─────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  related_id UUID,
  is_read BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- notifications type 제약 (DROP 후 재생성으로 안전하게 확장)
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check CHECK (
  type IN (
    'match_apply','match_accept','match_reject',
    'new_message','match_cancel',
    'contest_apply','contest_accept','contest_reject','contest_message'
  )
);

-- ── 8. contest_matches ───────────────────────────
CREATE TABLE IF NOT EXISTS contest_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  contest_name TEXT NOT NULL,
  contest_category TEXT NOT NULL,
  region TEXT NOT NULL,
  deadline DATE NOT NULL,
  team_size INTEGER NOT NULL,
  current_count INTEGER NOT NULL DEFAULT 0,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT '모집중',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT contest_matches_team_size_check CHECK (team_size BETWEEN 1 AND 5),
  CONSTRAINT contest_matches_status_check CHECK (status IN ('모집중', '마감'))
);

DROP TRIGGER IF EXISTS trg_contest_matches_updated_at ON contest_matches;
CREATE TRIGGER trg_contest_matches_updated_at
  BEFORE UPDATE ON contest_matches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── 9. contest_applications ──────────────────────
CREATE TABLE IF NOT EXISTS contest_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_match_id UUID NOT NULL REFERENCES contest_matches(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(contest_match_id, applicant_id),
  CONSTRAINT contest_app_status_check CHECK (status IN ('pending', 'accepted', 'rejected'))
);

DROP TRIGGER IF EXISTS trg_contest_app_updated_at ON contest_applications;
CREATE TRIGGER trg_contest_app_updated_at
  BEFORE UPDATE ON contest_applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── 10. contest_chat_rooms ───────────────────────
CREATE TABLE IF NOT EXISTS contest_chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_match_id UUID NOT NULL REFERENCES contest_matches(id) ON DELETE CASCADE,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ── 11. contest_chat_members ─────────────────────
CREATE TABLE IF NOT EXISTS contest_chat_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES contest_chat_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  joined_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(room_id, user_id)
);

-- ── 12. contest_chat_messages ────────────────────
CREATE TABLE IF NOT EXISTS contest_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES contest_chat_rooms(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ── 13. external_contests (외부 공모전 자동 동기화) ──────
CREATE TABLE IF NOT EXISTS external_contests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  category TEXT,
  organizer TEXT,
  deadline DATE,
  source TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(url)
);

DROP TRIGGER IF EXISTS trg_external_contests_updated_at ON external_contests;
CREATE TRIGGER trg_external_contests_updated_at
  BEFORE UPDATE ON external_contests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- external_contests RLS (누구나 조회 가능, INSERT/UPDATE는 service_role만)
ALTER TABLE external_contests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ext_contests_select" ON external_contests;
CREATE POLICY "ext_contests_select" ON external_contests FOR SELECT TO authenticated USING (true);

-- ── 인덱스 ─────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_matches_sport ON matches(sport);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_author ON matches(author_id);
CREATE INDEX IF NOT EXISTS idx_applications_match ON match_applications(match_id);
CREATE INDEX IF NOT EXISTS idx_applications_applicant ON match_applications(applicant_id);
CREATE INDEX IF NOT EXISTS idx_messages_room ON messages(room_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_contest_matches_author ON contest_matches(author_id);
CREATE INDEX IF NOT EXISTS idx_contest_matches_status ON contest_matches(status);
CREATE INDEX IF NOT EXISTS idx_contest_matches_region ON contest_matches(region);
CREATE INDEX IF NOT EXISTS idx_contest_apps_match ON contest_applications(contest_match_id);
CREATE INDEX IF NOT EXISTS idx_contest_apps_applicant ON contest_applications(applicant_id);
CREATE INDEX IF NOT EXISTS idx_contest_chat_msgs_room ON contest_chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_contest_chat_members_room ON contest_chat_members(room_id);

-- ── Row Level Security (RLS) ─────────────────────

-- profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_select" ON profiles;
DROP POLICY IF EXISTS "profiles_insert" ON profiles;
DROP POLICY IF EXISTS "profiles_update" ON profiles;
CREATE POLICY "profiles_select" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- matches
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "matches_select" ON matches;
DROP POLICY IF EXISTS "matches_insert" ON matches;
DROP POLICY IF EXISTS "matches_update" ON matches;
DROP POLICY IF EXISTS "matches_delete" ON matches;
CREATE POLICY "matches_select" ON matches FOR SELECT TO authenticated USING (true);
CREATE POLICY "matches_insert" ON matches FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "matches_update" ON matches FOR UPDATE TO authenticated USING (auth.uid() = author_id);
CREATE POLICY "matches_delete" ON matches FOR DELETE TO authenticated USING (auth.uid() = author_id);

-- match_applications
ALTER TABLE match_applications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "applications_select" ON match_applications;
DROP POLICY IF EXISTS "applications_insert" ON match_applications;
DROP POLICY IF EXISTS "applications_update" ON match_applications;
CREATE POLICY "applications_select" ON match_applications FOR SELECT TO authenticated
  USING (
    applicant_id = auth.uid() OR
    match_id IN (SELECT id FROM matches WHERE author_id = auth.uid())
  );
CREATE POLICY "applications_insert" ON match_applications FOR INSERT TO authenticated
  WITH CHECK (applicant_id = auth.uid());
CREATE POLICY "applications_update" ON match_applications FOR UPDATE TO authenticated
  USING (match_id IN (SELECT id FROM matches WHERE author_id = auth.uid()));

-- message_rooms
ALTER TABLE message_rooms ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "rooms_select" ON message_rooms;
DROP POLICY IF EXISTS "rooms_insert" ON message_rooms;
CREATE POLICY "rooms_select" ON message_rooms FOR SELECT TO authenticated
  USING (participant_1 = auth.uid() OR participant_2 = auth.uid());
CREATE POLICY "rooms_insert" ON message_rooms FOR INSERT TO authenticated WITH CHECK (true);

-- messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "messages_select" ON messages;
DROP POLICY IF EXISTS "messages_insert" ON messages;
DROP POLICY IF EXISTS "messages_update" ON messages;
CREATE POLICY "messages_select" ON messages FOR SELECT TO authenticated
  USING (room_id IN (SELECT id FROM message_rooms WHERE participant_1 = auth.uid() OR participant_2 = auth.uid()));
CREATE POLICY "messages_insert" ON messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND
    room_id IN (SELECT id FROM message_rooms WHERE participant_1 = auth.uid() OR participant_2 = auth.uid())
  );
CREATE POLICY "messages_update" ON messages FOR UPDATE TO authenticated
  USING (room_id IN (SELECT id FROM message_rooms WHERE participant_1 = auth.uid() OR participant_2 = auth.uid()));

-- reviews
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "reviews_select" ON reviews;
DROP POLICY IF EXISTS "reviews_insert" ON reviews;
CREATE POLICY "reviews_select" ON reviews FOR SELECT TO authenticated USING (true);
CREATE POLICY "reviews_insert" ON reviews FOR INSERT TO authenticated WITH CHECK (reviewer_id = auth.uid());

-- notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "notifications_select" ON notifications;
DROP POLICY IF EXISTS "notifications_update" ON notifications;
DROP POLICY IF EXISTS "notifications_insert" ON notifications;
CREATE POLICY "notifications_select" ON notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "notifications_update" ON notifications FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "notifications_insert" ON notifications FOR INSERT TO authenticated WITH CHECK (true);

-- contest_matches
ALTER TABLE contest_matches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "contest_matches_select" ON contest_matches;
DROP POLICY IF EXISTS "contest_matches_insert" ON contest_matches;
DROP POLICY IF EXISTS "contest_matches_update" ON contest_matches;
DROP POLICY IF EXISTS "contest_matches_delete" ON contest_matches;
CREATE POLICY "contest_matches_select" ON contest_matches FOR SELECT TO authenticated USING (true);
CREATE POLICY "contest_matches_insert" ON contest_matches FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "contest_matches_update" ON contest_matches FOR UPDATE TO authenticated USING (auth.uid() = author_id);
CREATE POLICY "contest_matches_delete" ON contest_matches FOR DELETE TO authenticated USING (auth.uid() = author_id);

-- contest_applications
ALTER TABLE contest_applications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "contest_apps_select" ON contest_applications;
DROP POLICY IF EXISTS "contest_apps_insert" ON contest_applications;
DROP POLICY IF EXISTS "contest_apps_update" ON contest_applications;
CREATE POLICY "contest_apps_select" ON contest_applications FOR SELECT TO authenticated
  USING (
    applicant_id = auth.uid() OR
    contest_match_id IN (SELECT id FROM contest_matches WHERE author_id = auth.uid())
  );
CREATE POLICY "contest_apps_insert" ON contest_applications FOR INSERT TO authenticated
  WITH CHECK (applicant_id = auth.uid());
CREATE POLICY "contest_apps_update" ON contest_applications FOR UPDATE TO authenticated
  USING (contest_match_id IN (SELECT id FROM contest_matches WHERE author_id = auth.uid()));

-- contest_chat_rooms
ALTER TABLE contest_chat_rooms ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "contest_chat_rooms_select" ON contest_chat_rooms;
DROP POLICY IF EXISTS "contest_chat_rooms_insert" ON contest_chat_rooms;
CREATE POLICY "contest_chat_rooms_select" ON contest_chat_rooms FOR SELECT TO authenticated
  USING (id IN (SELECT room_id FROM contest_chat_members WHERE user_id = auth.uid()));
CREATE POLICY "contest_chat_rooms_insert" ON contest_chat_rooms FOR INSERT TO authenticated
  WITH CHECK (contest_match_id IN (SELECT id FROM contest_matches WHERE author_id = auth.uid()));

-- contest_chat_members
ALTER TABLE contest_chat_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "contest_chat_members_select" ON contest_chat_members;
DROP POLICY IF EXISTS "contest_chat_members_insert" ON contest_chat_members;
CREATE POLICY "contest_chat_members_select" ON contest_chat_members FOR SELECT TO authenticated
  USING (room_id IN (SELECT room_id FROM contest_chat_members WHERE user_id = auth.uid()));
CREATE POLICY "contest_chat_members_insert" ON contest_chat_members FOR INSERT TO authenticated WITH CHECK (true);

-- contest_chat_messages
ALTER TABLE contest_chat_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "contest_msgs_select" ON contest_chat_messages;
DROP POLICY IF EXISTS "contest_msgs_insert" ON contest_chat_messages;
CREATE POLICY "contest_msgs_select" ON contest_chat_messages FOR SELECT TO authenticated
  USING (room_id IN (SELECT room_id FROM contest_chat_members WHERE user_id = auth.uid()));
CREATE POLICY "contest_msgs_insert" ON contest_chat_messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND
    room_id IN (SELECT room_id FROM contest_chat_members WHERE user_id = auth.uid())
  );

-- ── Realtime 활성화 (이미 등록된 테이블은 건너뜀) ──
DO $$
DECLARE
  t TEXT;
  tables TEXT[] := ARRAY[
    'matches','match_applications','messages','notifications',
    'contest_matches','contest_applications',
    'contest_chat_messages','contest_chat_members'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', t);
    END IF;
  END LOOP;
END
$$;
