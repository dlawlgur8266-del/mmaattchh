"""
충북대 매칭 플랫폼 - 스포츠 시설 예약 크롤러
대상: 충북대학교 체육진흥원 시설 예약 시스템
실행: GitHub Actions - 매 1시간마다

※ 충북대 체육진흥원 예약 사이트 URL/셀렉터 구조가 변경될 경우
  아래 CONSTANTS 섹션의 값만 수정하면 됩니다.
"""

import os
import re
import time
import logging
from datetime import datetime, date, timedelta
from typing import Optional

import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv

load_dotenv('.env.local')

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s'
)
logger = logging.getLogger(__name__)

# ── 환경변수 ─────────────────────────────────────────────────────────────────
SUPABASE_URL = os.environ.get('NEXT_PUBLIC_SUPABASE_URL', '')
SUPABASE_KEY = os.environ.get('SUPABASE_SERVICE_KEY', '')
SPORT_USERNAME = os.environ.get('sport_username', '')
SPORT_PASSWORD = os.environ.get('sport_PASSWORD', '')

# ── CONSTANTS (사이트 구조 변경 시 이 섹션만 수정) ─────────────────────────
BASE_URL        = 'https://sports.chungbuk.ac.kr'
LOGIN_URL       = f'{BASE_URL}/member/login.do'
SCHEDULE_URL    = f'{BASE_URL}/reservation/schedule.do'
CRAWL_DAYS      = 7   # 오늘부터 N일치 수집

# DB facility_id → 사이트 시설 코드 매핑
# 실제 사이트의 시설 파라미터 값으로 맞춰주세요
FACILITY_CODES: dict[str, str] = {
    'main_field':   'MAIN_FIELD',
    'futsal_a':     'FUTSAL_A',
    'futsal_b':     'FUTSAL_B',
    'basketball_a': 'BASKET_A',
    'basketball_b': 'BASKET_B',
    'tennis_a':     'TENNIS_A',
    'tennis_b':     'TENNIS_B',
    'tennis_c':     'TENNIS_C',
    'tennis_d':     'TENNIS_D',
    'tennis_e':     'TENNIS_E',
}

# 운영 시간대 (시설별 기본 타임슬롯 — 스크래핑 실패 시 fallback으로 사용)
DEFAULT_HOURS = list(range(9, 22))   # 09:00 ~ 21:00 (1시간 단위)

# HTML 셀렉터 (사이트 구조에 따라 조정)
SLOT_ROW_SEL   = 'table.schedule tbody tr'
TIME_CELL_IDX  = 0   # 시간 열 인덱스
STATUS_CELL_IDX = 2  # 상태 열 인덱스
RESERVED_TEXTS = ['예약완료', '예약중', '사용중', '마감']
CLOSED_TEXTS   = ['운영종료', '휴무', '점검', '사용불가']


# ── Supabase 헬퍼 ─────────────────────────────────────────────────────────────
def _headers() -> dict:
    return {
        'apikey': SUPABASE_KEY,
        'Authorization': f'Bearer {SUPABASE_KEY}',
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates',
    }


def upsert_slots(rows: list[dict]) -> None:
    if not rows:
        return
    url = f'{SUPABASE_URL}/rest/v1/sports_reservations?on_conflict=facility,reservation_date,start_time'
    resp = requests.post(url, json=rows, headers=_headers(), timeout=15)
    if not resp.ok:
        logger.error(f'Supabase upsert 실패: {resp.status_code} {resp.text[:200]}')
    resp.raise_for_status()


# ── 로그인 ────────────────────────────────────────────────────────────────────
def login(session: requests.Session) -> bool:
    """체육진흥원 사이트에 로그인하고 세션 쿠키를 취득합니다."""
    if not SPORT_USERNAME or not SPORT_PASSWORD:
        logger.warning('체육진흥원 로그인 정보가 없습니다. (sport_username / sport_PASSWORD 환경변수 확인)')
        return False

    try:
        # 메인 페이지 접속 (CSRF 토큰·쿠키 초기화)
        session.get(BASE_URL, timeout=10)

        payload = {
            'userId':   SPORT_USERNAME,
            'userPwd':  SPORT_PASSWORD,
            'loginType': 'student',
        }
        resp = session.post(LOGIN_URL, data=payload, timeout=15, allow_redirects=True)

        # 로그인 성공 판별: 응답 URL이 메인페이지거나 특정 성공 키워드 확인
        if '로그아웃' in resp.text or 'logout' in resp.text.lower():
            logger.info(f'로그인 성공 (학번: {SPORT_USERNAME})')
            return True

        logger.warning('로그인 응답에서 성공 키워드를 찾지 못했습니다. 비인증 접근으로 계속 진행합니다.')
        return False

    except Exception as e:
        logger.error(f'로그인 오류: {e}')
        return False


# ── 파싱 ─────────────────────────────────────────────────────────────────────
def _normalize_time(raw: str) -> Optional[str]:
    """'09:00', '9시', '09:00~10:00' 등 다양한 형식 → 'HH:MM' 반환"""
    raw = raw.strip()
    m = re.search(r'(\d{1,2}):(\d{2})', raw)
    if m:
        return f'{int(m.group(1)):02d}:{m.group(2)}'
    m = re.search(r'(\d{1,2})시', raw)
    if m:
        return f'{int(m.group(1)):02d}:00'
    return None


def _status_from_text(text: str) -> str:
    text = text.strip()
    if any(k in text for k in RESERVED_TEXTS):
        return 'reserved'
    if any(k in text for k in CLOSED_TEXTS):
        return 'closed'
    return 'available'


def parse_slots(html: str, facility_id: str, target_date: str) -> list[dict]:
    """HTML 응답에서 타임슬롯 목록을 추출합니다."""
    soup = BeautifulSoup(html, 'lxml')
    rows = soup.select(SLOT_ROW_SEL)
    slots = []

    for row in rows:
        cells = row.find_all(['td', 'th'])
        if len(cells) <= max(TIME_CELL_IDX, STATUS_CELL_IDX):
            continue

        time_text = cells[TIME_CELL_IDX].get_text(strip=True)
        status_text = cells[STATUS_CELL_IDX].get_text(strip=True)

        # "09:00~10:00" 형식 처리
        if '~' in time_text:
            parts = time_text.split('~')
            start = _normalize_time(parts[0])
            end   = _normalize_time(parts[1])
        else:
            start = _normalize_time(time_text)
            if start:
                h = int(start.split(':')[0]) + 1
                end = f'{h:02d}:00'
            else:
                end = None

        if not start or not end:
            continue

        slots.append({
            'facility':         facility_id,
            'reservation_date': target_date,
            'start_time':       start,
            'end_time':         end,
            'status':           _status_from_text(status_text),
            'last_crawled_at':  datetime.utcnow().isoformat(),
        })

    return slots


def make_fallback_slots(facility_id: str, target_date: str) -> list[dict]:
    """스크래핑 실패 시 기본 운영 시간대를 'available'로 생성합니다."""
    now_iso = datetime.utcnow().isoformat()
    slots = []
    for h in DEFAULT_HOURS:
        slots.append({
            'facility':         facility_id,
            'reservation_date': target_date,
            'start_time':       f'{h:02d}:00',
            'end_time':         f'{h+1:02d}:00',
            'status':           'available',
            'last_crawled_at':  now_iso,
        })
    return slots


# ── 크롤러 메인 ───────────────────────────────────────────────────────────────
def crawl_facility(session: requests.Session, facility_id: str, facility_code: str, target_date: str) -> int:
    """시설 하나 + 날짜 하나의 예약 현황을 수집합니다."""
    date_compact = target_date.replace('-', '')   # '20260528'
    try:
        params = {
            'facilityId': facility_code,
            'searchDate': date_compact,
        }
        resp = session.get(SCHEDULE_URL, params=params, timeout=15)
        resp.raise_for_status()

        slots = parse_slots(resp.text, facility_id, target_date)

        if not slots:
            logger.warning(f'{facility_id} {target_date}: 파싱 결과 없음 → fallback 슬롯 사용')
            slots = make_fallback_slots(facility_id, target_date)

        upsert_slots(slots)
        logger.info(f'{facility_id} {target_date}: {len(slots)}개 슬롯 저장')
        return len(slots)

    except requests.HTTPError as e:
        logger.error(f'{facility_id} {target_date}: HTTP 오류 {e}')
    except Exception as e:
        logger.error(f'{facility_id} {target_date}: 오류 {e}')
    return 0


def run():
    session = requests.Session()
    session.headers.update({
        'User-Agent': (
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
            'AppleWebKit/537.36 (KHTML, like Gecko) '
            'Chrome/120.0.0.0 Safari/537.36'
        ),
        'Accept-Language': 'ko-KR,ko;q=0.9',
        'Referer': BASE_URL,
    })

    login(session)   # 실패해도 비인증으로 계속 시도

    today = date.today()
    dates = [(today + timedelta(days=i)).isoformat() for i in range(CRAWL_DAYS)]

    total = 0
    for facility_id, facility_code in FACILITY_CODES.items():
        for target_date in dates:
            total += crawl_facility(session, facility_id, facility_code, target_date)
            time.sleep(0.3)   # 과부하 방지
        time.sleep(1)

    logger.info(f'전체 {total}개 슬롯 처리 완료')


if __name__ == '__main__':
    logger.info('===== 시설 예약 크롤러 시작 =====')
    start = datetime.now()
    run()
    elapsed = (datetime.now() - start).seconds
    logger.info(f'===== 크롤링 완료 ({elapsed}초) =====')
