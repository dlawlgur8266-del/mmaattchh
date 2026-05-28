-- 테니스 종목 추가: matches 테이블의 sport CHECK 제약 조건 업데이트
ALTER TABLE matches
  DROP CONSTRAINT IF EXISTS matches_sport_check;

ALTER TABLE matches
  ADD CONSTRAINT matches_sport_check
  CHECK (sport IN ('축구', '풋살', '농구', 'e스포츠', '테니스'));
