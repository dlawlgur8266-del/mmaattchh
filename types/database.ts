export type SkillLevel = '초급' | '중급' | '고수'
export type Sport = '축구' | '풋살' | '농구' | 'e스포츠'
export type MatchSize = '1vs1' | '3vs3' | '5vs5' | '11vs11'
export type MatchStatus = '모집중' | '매치확정' | '취소됨'
export type ApplicationStatus = 'pending' | 'accepted' | 'rejected'
export type NotificationType =
  | 'match_apply'
  | 'match_accept'
  | 'match_reject'
  | 'new_message'
  | 'match_cancel'
  | 'contest_apply'
  | 'contest_accept'
  | 'contest_reject'
  | 'contest_message'

export type ContestMatchStatus = '모집중' | '마감'

export interface Profile {
  id: string
  username: string
  nickname: string
  full_name: string
  student_id: string
  skill_level: SkillLevel          // 스포츠 실력 (초급/중급/고수)
  contest_count?: number           // 공모전 출전 횟수 (0~10)
  created_at: string
  updated_at: string
}

export interface Match {
  id: string
  author_id: string
  team_name: string
  sport: Sport
  match_size: MatchSize
  location: string
  description: string
  required_level: SkillLevel
  status: MatchStatus
  match_datetime?: string | null
  created_at: string
  updated_at: string
  // Joined fields
  author?: Profile
}

export interface MatchApplication {
  id: string
  match_id: string
  applicant_id: string
  status: ApplicationStatus
  created_at: string
  updated_at: string
  // Joined fields
  applicant?: Profile
  match?: Match
}

export interface MessageRoom {
  id: string
  application_id: string
  participant_1: string
  participant_2: string
  created_at: string
  // Joined fields
  participant_1_profile?: Profile
  participant_2_profile?: Profile
  match_application?: MatchApplication
  last_message?: Message
  unread_count?: number
}

export interface Message {
  id: string
  room_id: string
  sender_id: string
  content: string
  is_read: boolean
  created_at: string
  // Joined fields
  sender?: Profile
}

export interface Review {
  id: string
  match_id: string
  reviewer_id: string
  reviewee_id: string
  rating: number
  created_at: string
  // Joined fields
  reviewer?: Profile
  reviewee?: Profile
  match?: Match
}

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  message: string
  related_id: string | null
  is_read: boolean
  created_at: string
}

// 내 경기 (확정된 매치) 정보
export interface MyMatch {
  matchId: string
  applicationId: string
  teamName: string
  opponentNickname: string
  sport: Sport
  matchSize: MatchSize
  location: string
  matchDatetime: string | null
  status: MatchStatus
  isAuthor: boolean
}

// ─── 공모전 관련 타입 ───────────────────────────────────────────────────────

export interface ContestMatch {
  id: string
  author_id: string
  contest_name: string
  contest_category: string
  region: string
  deadline: string          // YYYY-MM-DD
  team_size: number         // 모집 인원 (1~5)
  current_count: number     // 현재 수락된 인원
  description: string
  status: ContestMatchStatus
  created_at: string
  updated_at: string
  // Joined fields
  author?: Profile
}

export interface ContestApplication {
  id: string
  contest_match_id: string
  applicant_id: string
  status: ApplicationStatus
  created_at: string
  updated_at: string
  // Joined fields
  applicant?: Profile
  contest_match?: ContestMatch
}

export interface ContestChatRoom {
  id: string
  contest_match_id: string
  name: string | null
  created_at: string
  // Joined fields
  contest_match?: ContestMatch
  members?: Profile[]
}

export interface ContestChatMessage {
  id: string
  room_id: string
  sender_id: string
  content: string
  created_at: string
  // Joined fields
  sender?: Profile
}

// ─── Sport metadata ────────────────────────────────────────────────────────

export const SPORT_META: Record<Sport, { emoji: string; color: string; bgColor: string }> = {
  '축구': { emoji: '⚽', color: '#16A34A', bgColor: '#DCFCE7' },
  '풋살': { emoji: '🥅', color: '#2563EB', bgColor: '#DBEAFE' },
  '농구': { emoji: '🏀', color: '#EA580C', bgColor: '#FFEDD5' },
  'e스포츠': { emoji: '🎮', color: '#7C3AED', bgColor: '#EDE9FE' },
}

export const LEVEL_META: Record<SkillLevel, { color: string; bgColor: string }> = {
  '초급': { color: '#15803D', bgColor: '#BBF7D0' },
  '중급': { color: '#A16207', bgColor: '#FEF08A' },
  '고수': { color: '#B91C1C', bgColor: '#FECACA' },
}

export const SPORT_ALLOWED_SIZES: Record<Sport, MatchSize[]> = {
  '축구': ['5vs5', '11vs11'],
  '풋살': ['3vs3', '5vs5'],
  '농구': ['3vs3', '5vs5'],
  'e스포츠': ['1vs1', '3vs3', '5vs5'],
}
