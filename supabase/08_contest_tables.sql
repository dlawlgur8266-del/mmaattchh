-- ================================================
-- [8] 공모전 관련 테이블 + 프로필 업데이트
-- ================================================

-- profiles 테이블에 공모전 출전 횟수 컬럼 추가
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS contest_count INTEGER DEFAULT 0;
ALTER TABLE profiles ADD CONSTRAINT IF NOT EXISTS profiles_contest_count_check
  CHECK (contest_count BETWEEN 0 AND 10);

-- contest_matches: 공모전 팀원 모집 게시글
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

-- contest_applications: 팀원 신청
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

-- contest_chat_rooms: 공모전 그룹 채팅방
CREATE TABLE IF NOT EXISTS contest_chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_match_id UUID NOT NULL REFERENCES contest_matches(id) ON DELETE CASCADE,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- contest_chat_members: 채팅방 멤버
CREATE TABLE IF NOT EXISTS contest_chat_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES contest_chat_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  joined_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(room_id, user_id)
);

-- contest_chat_messages: 그룹 채팅 메시지
CREATE TABLE IF NOT EXISTS contest_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES contest_chat_rooms(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_contest_matches_author ON contest_matches(author_id);
CREATE INDEX IF NOT EXISTS idx_contest_matches_status ON contest_matches(status);
CREATE INDEX IF NOT EXISTS idx_contest_matches_region ON contest_matches(region);
CREATE INDEX IF NOT EXISTS idx_contest_apps_match ON contest_applications(contest_match_id);
CREATE INDEX IF NOT EXISTS idx_contest_apps_applicant ON contest_applications(applicant_id);
CREATE INDEX IF NOT EXISTS idx_contest_chat_msgs_room ON contest_chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_contest_chat_members_room ON contest_chat_members(room_id);

-- RLS 활성화
ALTER TABLE contest_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE contest_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE contest_chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE contest_chat_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE contest_chat_messages ENABLE ROW LEVEL SECURITY;

-- contest_matches RLS
DROP POLICY IF EXISTS "contest_matches_select" ON contest_matches;
DROP POLICY IF EXISTS "contest_matches_insert" ON contest_matches;
DROP POLICY IF EXISTS "contest_matches_update" ON contest_matches;
DROP POLICY IF EXISTS "contest_matches_delete" ON contest_matches;

CREATE POLICY "contest_matches_select" ON contest_matches FOR SELECT TO authenticated USING (true);
CREATE POLICY "contest_matches_insert" ON contest_matches FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "contest_matches_update" ON contest_matches FOR UPDATE TO authenticated USING (auth.uid() = author_id);
CREATE POLICY "contest_matches_delete" ON contest_matches FOR DELETE TO authenticated USING (auth.uid() = author_id);

-- contest_applications RLS
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

-- contest_chat_rooms RLS
DROP POLICY IF EXISTS "contest_chat_rooms_select" ON contest_chat_rooms;
DROP POLICY IF EXISTS "contest_chat_rooms_insert" ON contest_chat_rooms;

CREATE POLICY "contest_chat_rooms_select" ON contest_chat_rooms FOR SELECT TO authenticated
  USING (id IN (SELECT room_id FROM contest_chat_members WHERE user_id = auth.uid()));

CREATE POLICY "contest_chat_rooms_insert" ON contest_chat_rooms FOR INSERT TO authenticated
  WITH CHECK (contest_match_id IN (SELECT id FROM contest_matches WHERE author_id = auth.uid()));

-- contest_chat_members RLS
DROP POLICY IF EXISTS "contest_chat_members_select" ON contest_chat_members;
DROP POLICY IF EXISTS "contest_chat_members_insert" ON contest_chat_members;

CREATE POLICY "contest_chat_members_select" ON contest_chat_members FOR SELECT TO authenticated
  USING (room_id IN (SELECT room_id FROM contest_chat_members WHERE user_id = auth.uid()));

CREATE POLICY "contest_chat_members_insert" ON contest_chat_members FOR INSERT TO authenticated WITH CHECK (true);

-- contest_chat_messages RLS
DROP POLICY IF EXISTS "contest_msgs_select" ON contest_chat_messages;
DROP POLICY IF EXISTS "contest_msgs_insert" ON contest_chat_messages;

CREATE POLICY "contest_msgs_select" ON contest_chat_messages FOR SELECT TO authenticated
  USING (room_id IN (SELECT room_id FROM contest_chat_members WHERE user_id = auth.uid()));

CREATE POLICY "contest_msgs_insert" ON contest_chat_messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND
    room_id IN (SELECT room_id FROM contest_chat_members WHERE user_id = auth.uid())
  );

-- notifications type 확장 (contest 관련 알림 추가)
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check CHECK (
  type IN ('match_apply','match_accept','match_reject','new_message','match_cancel',
           'contest_apply','contest_accept','contest_reject','contest_message')
);

-- Realtime 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE contest_matches;
ALTER PUBLICATION supabase_realtime ADD TABLE contest_applications;
ALTER PUBLICATION supabase_realtime ADD TABLE contest_chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE contest_chat_members;
