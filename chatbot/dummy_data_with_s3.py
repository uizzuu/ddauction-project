"""
S3 이미지 업로드 + 더미데이터 생성 스크립트

사용법:
1. pip install mysql-connector-python boto3 requests Pillow python-dotenv
2. .env 파일 생성 후 환경변수 설정 (또는 시스템 환경변수 사용)
3. python dummy_data_with_s3.py
"""

import mysql.connector
import boto3
import requests
import random
import string
import io
import hashlib
import os
from datetime import datetime, timedelta
from typing import List, Dict
from PIL import Image as PILImage
import uuid
import logging

# .env 파일 로드 (있으면)
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # python-dotenv 없으면 시스템 환경변수 사용



# ============================================
# 🔧 로깅 설정
# ============================================
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)

# ============================================
# 🔧 설정 (환경변수에서 로드)
# ============================================
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': int(os.getenv('DB_PORT', '3306')),
    'user': os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASSWORD', '1111'),
    'database': os.getenv('DB_NAME', 'ddauction_db')
}

S3_CONFIG = {
    'bucket': os.getenv('S3_BUCKET', ''),
    'region': os.getenv('S3_REGION', 'ap-northeast-2'),
    'access_key': os.getenv('AWS_ACCESS_KEY_ID', ''),
    'secret_key': os.getenv('AWS_SECRET_ACCESS_KEY', ''),
    'folder': os.getenv('S3_FOLDER', 'products')
}

# 생성할 데이터 수
NUM_USERS = 20
NUM_PRODUCTS_PER_TYPE = 50  # 경매/스토어/중고 각각 50개
NUM_BIDS_PER_AUCTION = 5

# ============================================
# 🔧 환경변수 및 설정 로그
# ============================================
logging.info("===== 환경변수 및 설정 확인 =====")
logging.info(f"DB_HOST={DB_CONFIG['host']}")
logging.info(f"DB_PORT={DB_CONFIG['port']}")
logging.info(f"DB_USER={DB_CONFIG['user']}")
logging.info(f"DB_NAME={DB_CONFIG['database']}")
logging.info(f"S3_BUCKET={S3_CONFIG['bucket']}")
logging.info(f"S3_REGION={S3_CONFIG['region']}")
logging.info(f"S3_FOLDER={S3_CONFIG['folder']}")
logging.info("=================================")

# ============================================
# 📸 카테고리별 이미지 URL (Unsplash)
# ============================================
CATEGORY_IMAGES = {
    'ELECTRONICS': [
        'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500',
        'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=500',
        'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500',
        'https://images.unsplash.com/photo-1585298723682-7115561c51b7?w=500',
        'https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=500',
        'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500',
        'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=500',
    ],
    'CLOTHING': [
        'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500',
        'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500',
        'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=500',
        'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=500',
        'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?w=500',
        'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=500',
    ],
    'ACCESSORIES': [
        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500',
        'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500',
        'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=500',
        'https://images.unsplash.com/photo-1590548784585-643d2b9f2925?w=500',
        'https://images.unsplash.com/photo-1608042314453-ae338d80c427?w=500',
    ],
    'FURNITURE_INTERIOR': [
        'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500',
        'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=500',
        'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500',
        'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=500',
        'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=500',
    ],
    'SPORTS': [
        'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=500',
        'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500',
        'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500',
        'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=500',
    ],
    'BEAUTY': [
        'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500',
        'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=500',
        'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=500',
        'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=500',
        'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=500',
    ],
    'BOOKS': [
        'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500',
        'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=500',
        'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=500',
        'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=500',
    ],
    'APPLIANCES': [
        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500',
        'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=500',
        'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=500',
    ],
    'KIDS': [
        'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=500',
        'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=500',
        'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=500',
    ],
}

DEFAULT_IMAGES = [
    'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=500',
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
    'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500',
    'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500',
    'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=500',
]

# ============================================
# 📝 상품 카테고리 및 배송 타입
# ============================================
PRODUCT_CATEGORIES = [
    'ACCESSORIES', 'APPLIANCES', 'BEAUTY', 'BOOKS', 'CLOTHING',
    'ELECTRONICS', 'ENTERTAINMENT', 'ETC', 'FOODS', 'FURNITURE_INTERIOR',
    'KIDS', 'KITCHENWARE', 'PET', 'PLANTS', 'SPORTS', 'STATIONERY', 'TICKETS'
]

DELIVERY_TYPES = ['CU', 'GS', 'MAIL', 'MEETUP', 'PARCEL', 'PICKUP', 'QUICK', 'REGISTERED', 'SEMIREGISTERED']

# ============================================
# 🏷️ 경매 상품 50개
# ============================================
AUCTION_TITLES = [
    "[경매] 애플 맥북 프로 14인치 M3 Pro 새상품",
    "[경매] 소니 PS5 디스크 에디션 + 듀얼센스",
    "[경매] 다이슨 에어랩 컴플리트 미개봉",
    "[경매] 애플워치 울트라2 티타늄 49mm",
    "[경매] LG 스탠바이미 27인치",
    "[경매] 발뮤다 토스터 그린 리미티드",
    "[경매] 삼성 갤럭시 Z플립5 512GB",
    "[경매] 나이키 에어조던1 레트로 하이 시카고",
    "[경매] 레고 스타워즈 밀레니엄 팔콘 UCS",
    "[경매] 캐논 EOS R5 바디 + RF 24-70mm",
    "[경매] 보스 QuietComfort Ultra 헤드폰",
    "[경매] 닌텐도 스위치 OLED 젤다 에디션",
    "[경매] 에르메스 트위리 스카프 새상품",
    "[경매] 샤넬 클래식 미디엄 플랩백",
    "[경매] 롤렉스 서브마리너 데이트",
    "[경매] 아이패드 프로 12.9인치 M2 256GB",
    "[경매] 소니 WH-1000XM5 블랙 미개봉",
    "[경매] 삼성 비스포크 냉장고 4도어",
    "[경매] LG 코드제로 A9S 올인원타워",
    "[경매] 구찌 GG 마몽 숄더백 블랙",
    "[경매] 루이비통 스피디 반둘리에 30",
    "[경매] 발렌시아가 트랙 스니커즈 270",
    "[경매] 프라다 리에디션 2005 나일론",
    "[경매] 디올 새들백 오블리크 자카드",
    "[경매] 버버리 빈티지 체크 버킷햇",
    "[경매] 몽클레어 마야 숏다운 블랙 2",
    "[경매] 캐나다구스 랭포드 파카 블랙",
    "[경매] 스톤아일랜드 고스트 오버셔츠",
    "[경매] 아미 하트 로고 니트 크림",
    "[경매] 메종키츠네 폭스헤드 스웻셔츠",
    "[경매] 아크네 스튜디오 머플러 그레이",
    "[경매] 로에베 퍼즐백 스몰 탄",
    "[경매] 보테가베네타 카세트백 블랙",
    "[경매] 셀린느 트리오페 블랙 미니",
    "[경매] 생로랑 루루 숄더백 블랙",
    "[경매] 발렌티노 록스터드 클러치",
    "[경매] 지방시 안티고나 미니 블랙",
    "[경매] 톰브라운 삼선 카디건 그레이",
    "[경매] 릭오웬스 지오바스켓 블랙 43",
    "[경매] 메종마르지엘라 타비 부츠 39",
    "[경매] 골든구스 슈퍼스타 화이트 40",
    "[경매] 피어오브갓 에센셜 후디 크림",
    "[경매] 오프화이트 다이아그 후디 블랙",
    "[경매] 팜엔젤스 트랙자켓 네이비",
    "[경매] 아더에러 빈티지 데님자켓",
    "[경매] 앰부쉬 나이키 덩크 하이 블랙",
    "[경매] 뉴발란스 993 그레이 270",
    "[경매] 아식스 젤카야노14 실버 280",
    "[경매] 살로몬 XT-6 블랙 265",
    "[경매] 호카 본디8 블랙화이트 275",
]

# ============================================
# 🏪 스토어 상품 50개
# ============================================
STORE_TITLES = [
    "[스토어] 프리미엄 캐시미어 니트 - 5컬러",
    "[스토어] 천연 소가죽 크로스백 - 블랙/브라운",
    "[스토어] 오가닉 코튼 베이직 티셔츠 3팩",
    "[스토어] 스테인리스 텀블러 500ml 보온보냉",
    "[스토어] 대나무 무선 충전 스탠드",
    "[스토어] 프렌치 리넨 베딩 세트 퀸사이즈",
    "[스토어] 핸드메이드 가죽 지갑 카드홀더",
    "[스토어] 아로마 디퓨저 + 오일 3종 세트",
    "[스토어] 월넛 원목 노트북 스탠드",
    "[스토어] 실크 잠옷 세트 여성용",
    "[스토어] 빈티지 브라스 테이블 램프",
    "[스토어] 에코백 대용량 캔버스 3컬러",
    "[스토어] 청키 골드 체인 목걸이",
    "[스토어] 리사이클 페트 후리스 집업",
    "[스토어] 세라믹 디너웨어 4인 세트",
    "[스토어] 메리노울 머플러 - 6컬러",
    "[스토어] 비건 레더 토트백 라지",
    "[스토어] 오가닉 바디로션 500ml",
    "[스토어] 자연유래 캔들 3종 세트",
    "[스토어] 리넨 에이프런 주방용",
    "[스토어] 스테인리스 커틀러리 4인 세트",
    "[스토어] 핸드메이드 도자기 머그컵",
    "[스토어] 대나무 칫솔 4개입 세트",
    "[스토어] 천연 비누 기프트박스 6종",
    "[스토어] 코튼 러그 150x200 아이보리",
    "[스토어] 린넨 커튼 2장 세트 화이트",
    "[스토어] 울 블랭킷 소파용 그레이",
    "[스토어] 라탄 바구니 수납함 3종",
    "[스토어] 원목 행거 코트걸이",
    "[스토어] 스테인리스 빨래건조대",
    "[스토어] 다용도 수납박스 5개 세트",
    "[스토어] 실리콘 주방매트 3컬러",
    "[스토어] 유리 밀폐용기 6종 세트",
    "[스토어] 스텐 프라이팬 28cm 인덕션",
    "[스토어] 캐스트아이언 냄비 20cm",
    "[스토어] 도마 원목 아카시아",
    "[스토어] 커피 핸드드립 세트 풀패키지",
    "[스토어] 티포트 세라믹 600ml",
    "[스토어] 와인글라스 2개 세트",
    "[스토어] 맥주잔 500ml 4개입",
    "[스토어] 실리콘 아이스트레이 2종",
    "[스토어] 스테인리스 보온도시락",
    "[스토어] 에코 장바구니 접이식",
    "[스토어] 다회용 빨대 스텐 4종",
    "[스토어] 천연 수세미 3개입",
    "[스토어] 주방세제 친환경 1L",
    "[스토어] 섬유유연제 무향 2L",
    "[스토어] 세탁세제 드럼용 3L",
    "[스토어] 욕실매트 규조토 라지",
    "[스토어] 샤워커튼 방수 180x200",
]

# ============================================
# 🛒 중고 상품 50개
# ============================================
USED_TITLES = [
    "[중고] 아이폰 14 Pro 256GB 스페이스블랙 S급",
    "[중고] 다이슨 V15 무선청소기 1년 사용",
    "[중고] 이케아 말름 6단 서랍장 화이트",
    "[중고] 삼성 더프레임 55인치 2023년형",
    "[중고] 허먼밀러 에어론 풀옵션 의자",
    "[중고] 브롬톤 M6L 폴딩 자전거 레드",
    "[중고] 발렌시아가 트리플S 스니커즈 260",
    "[중고] 무인양품 침대 프레임 + 매트리스 퀸",
    "[중고] 소니 WF-1000XM5 이어폰 미개봉급",
    "[중고] 스타벅스 서머 텀블러 컬렉션 5종",
    "[중고] 캠핑용 코베아 빅돔4 텐트",
    "[중고] 보스 사운드바 900 + 서브우퍼",
    "[중고] 마샬 액톤3 블루투스 스피커",
    "[중고] 루이비통 네버풀 MM 다미에",
    "[중고] 닥터마틴 1460 8홀 부츠 265",
    "[중고] 갤럭시북3 프로 14인치 i7",
    "[중고] LG 그램 17인치 2023 i5",
    "[중고] 아이맥 24인치 M1 블루 8GB",
    "[중고] 맥미니 M2 Pro 16GB 512GB",
    "[중고] 애플 스튜디오 디스플레이 27인치",
    "[중고] 벤큐 모니터 32인치 4K",
    "[중고] 삼성 오디세이 G9 49인치 커브드",
    "[중고] 로지텍 MX Master 3S 블랙",
    "[중고] 애플 매직키보드 터치ID 한글",
    "[중고] 레오폴드 FC750R 저소음적축",
    "[중고] 소니 A7M4 바디 셔터 1만컷",
    "[중고] 후지필름 X-T5 + 18-55mm",
    "[중고] 고프로 히어로12 블랙 풀박스",
    "[중고] DJI 미니3 프로 플라이모어 콤보",
    "[중고] 인스타360 X3 + 악세서리 키트",
    "[중고] 오큘러스 퀘스트3 128GB",
    "[중고] 스팀덱 512GB OLED",
    "[중고] 닌텐도 스위치 라이트 그레이",
    "[중고] 플레이스테이션 VR2 + 호라이즌",
    "[중고] 엑스박스 시리즈 X + 패드 2개",
    "[중고] 시놀로지 DS220+ NAS 베이",
    "[중고] 애플TV 4K 3세대 128GB",
    "[중고] 크롬캐스트 구글TV 4K",
    "[중고] 샤오미 로봇청소기 S10+",
    "[중고] 삼성 비스포크 제트 청소기",
    "[중고] 에어프라이어 필립스 XXL",
    "[중고] 발뮤다 더 레인지 화이트",
    "[중고] 드롱기 커피머신 EC9155",
    "[중고] 브레빌 바리스타 프로 실버",
    "[중고] 테팔 냄비세트 10종",
    "[중고] 르크루제 시그니처 24cm 체리",
    "[중고] 스타우브 꼬꼬떼 오벌 27cm",
    "[중고] 쿠쿠 압력밥솥 10인용 IH",
    "[중고] 위닉스 제습기 16L 2023년식",
    "[중고] 다이슨 퓨어쿨 공기청정기 TP07",
]

# ============================================
# 📝 기타 더미 데이터
# ============================================
PRODUCT_CONTENTS = [
    "상태 최상급입니다. 박스/구성품 모두 포함되어 있습니다.",
    "직거래 우선이며, 택배 시 착불입니다.",
    "사용감 거의 없는 제품입니다. 네고 가능해요.",
    "선물 받았는데 취향에 안 맞아서 판매합니다.",
    "이사 가게 되어 정리합니다. 직접 보시고 구매하셔도 됩니다.",
    "정품 인증 가능합니다. 영수증 있어요.",
    "교환/환불 불가합니다. 신중히 구매해주세요.",
    "문의사항 있으시면 댓글 남겨주세요!",
    "거의 새것이에요. 한두번 사용했습니다.",
    "풀박스 상태입니다. 보증기간 남아있어요.",
    "깨끗하게 사용했습니다. 하자 없어요.",
    "급처합니다. 오늘 거래 가능하시면 네고해드려요.",
]

ADDRESSES = [
    "서울특별시 강남구 역삼동",
    "서울특별시 마포구 합정동",
    "서울특별시 서초구 반포동",
    "서울특별시 송파구 잠실동",
    "서울특별시 영등포구 여의도동",
    "서울특별시 성동구 성수동",
    "서울특별시 용산구 이태원동",
    "서울특별시 종로구 삼청동",
    "경기도 성남시 분당구 정자동",
    "경기도 수원시 영통구 광교동",
    "경기도 고양시 일산동구",
    "경기도 용인시 수지구",
    "부산광역시 해운대구 우동",
    "대구광역시 수성구 범어동",
    "인천광역시 연수구 송도동",
]

USER_NAMES = [
    "김민준", "이서연", "박도윤", "최서윤", "정예준",
    "강지우", "조수아", "윤서현", "장하준", "임지민",
    "한소율", "오지호", "신유진", "권도현", "황채원",
    "서준혁", "문지원", "배수빈", "남시우", "홍다인"
]

NICK_NAMES = [
    "민준이네", "서연마켓", "도윤샵", "서윤스토어", "예준딜",
    "지우중고", "수아경매", "서현셀러", "하준거래", "지민마트",
    "소율상점", "지호세일", "유진플리", "도현마켓", "채원숍",
    "준혁딜러", "지원스토어", "수빈마켓", "시우플리", "다인샵"
]

# ============================================
# 🔧 S3 헬퍼 함수
# ============================================
class S3Uploader:
    def __init__(self):
        self.s3_client = boto3.client(
            's3',
            region_name=S3_CONFIG['region'],
            aws_access_key_id=S3_CONFIG['access_key'],
            aws_secret_access_key=S3_CONFIG['secret_key']
        )
        self.bucket = S3_CONFIG['bucket']
        self.folder = S3_CONFIG['folder']

    def download_and_upload(self, image_url: str, product_id: int) -> str:
        """이미지 다운로드 후 S3 업로드, URL 반환"""
        try:
            # 이미지 다운로드
            response = requests.get(image_url, timeout=10)
            response.raise_for_status()

            # 이미지 처리 (리사이즈)
            img = PILImage.open(io.BytesIO(response.content))
            img = img.convert('RGB')
            img.thumbnail((800, 800), PILImage.Resampling.LANCZOS)

            # 메모리에 저장
            buffer = io.BytesIO()
            img.save(buffer, format='JPEG', quality=85)
            buffer.seek(0)

            # S3 키 생성
            unique_id = str(uuid.uuid4())[:8]
            s3_key = f"{self.folder}/{product_id}/{unique_id}.jpg"

            # S3 업로드
            self.s3_client.upload_fileobj(
                buffer,
                self.bucket,
                s3_key,
                ExtraArgs={
                    'ContentType': 'image/jpeg'
                }
            )

            # 퍼블릭 URL 반환
            s3_url = f"https://{self.bucket}.s3.{S3_CONFIG['region']}.amazonaws.com/{s3_key}"
            return s3_url

        except Exception as e:
            print(f"⚠️ S3 업로드 실패: {e}")
            return image_url  # 실패 시 원본 URL 반환

# ============================================
# 🔧 유틸리티 함수
# ============================================
def generate_random_phone() -> str:
    return f"010{random.randint(10000000, 99999999)}"

def generate_random_email(name: str) -> str:
    domains = ['gmail.com', 'naver.com', 'kakao.com']
    return f"{name}{random.randint(1, 999)}@{random.choice(domains)}"

def hash_password(password: str) -> str:
    return f"$2a$10${hashlib.sha256(password.encode()).hexdigest()[:53]}"

def get_random_image(category: str) -> str:
    images = CATEGORY_IMAGES.get(category, DEFAULT_IMAGES)
    return random.choice(images)

def random_datetime(start_days_ago: int = 30, end_days_ago: int = 0) -> datetime:
    start = datetime.now() - timedelta(days=start_days_ago)
    end = datetime.now() - timedelta(days=end_days_ago)
    delta = end - start
    random_seconds = random.randint(0, int(delta.total_seconds()))
    return start + timedelta(seconds=random_seconds)

def future_datetime(min_days: int = 1, max_days: int = 7) -> datetime:
    return datetime.now() + timedelta(days=random.randint(min_days, max_days), hours=random.randint(0, 23))

# ============================================
# 🗃️ 데이터 생성 함수
# ============================================
def create_users(cursor) -> List[int]:
    user_ids = []

    for i in range(NUM_USERS):
        name = USER_NAMES[i % len(USER_NAMES)]
        nick = f"{NICK_NAMES[i % len(NICK_NAMES)]}{i+1}"
        created = random_datetime(60, 30)

        cursor.execute("""
            INSERT INTO users (user_name, nick_name, email, password, phone, birthday, role, verified, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            name, nick, generate_random_email(name), hash_password("password123"),
            generate_random_phone(),
            f"{random.randint(1985, 2000)}-{random.randint(1,12):02d}-{random.randint(1,28):02d}",
            random.choice(['USER', 'SELLER']), True, created, created
        ))
        user_ids.append(cursor.lastrowid)
        print(f"✅ User {i+1}/{NUM_USERS}: {nick}")

    return user_ids

def create_products_with_s3(cursor, user_ids: List[int], s3_uploader: S3Uploader) -> Dict[str, List[int]]:
    """상품 + S3 이미지 생성"""
    product_ids = {'AUCTION': [], 'STORE': [], 'USED': []}

    product_configs = [
        ('AUCTION', AUCTION_TITLES, NUM_PRODUCTS_PER_TYPE),
        ('STORE', STORE_TITLES, NUM_PRODUCTS_PER_TYPE),
        ('USED', USED_TITLES, NUM_PRODUCTS_PER_TYPE),
    ]

    for product_type, titles, count in product_configs:
        for i in range(count):
            category = random.choice(PRODUCT_CATEGORIES)
            created = random_datetime(14, 1)

            # 가격 설정
            if product_type == 'AUCTION':
                starting_price = random.randint(10, 500) * 1000
                original_price, sale_price, discount_rate = None, None, None
                auction_end = future_datetime(1, 7)
            elif product_type == 'STORE':
                starting_price = None
                original_price = random.randint(20, 300) * 1000
                discount_rate = random.choice([0, 10, 15, 20, 30, 50])
                sale_price = int(original_price * (1 - discount_rate / 100))
                auction_end = None
            else:  # USED
                starting_price = None
                original_price = random.randint(5, 200) * 1000
                sale_price, discount_rate = None, None
                auction_end = None

            # 상품 삽입
            cursor.execute("""
                INSERT INTO product (
                    title, content, starting_price, original_price, sale_price, discount_rate,
                    auction_end_time, view_count, tag, address, delivery_available,
                    product_type, product_status, product_category_type,
                    delivery_included, delivery_price, seller_id, created_at, updated_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                titles[i % len(titles)],
                random.choice(PRODUCT_CONTENTS),
                starting_price, original_price, sale_price, discount_rate,
                auction_end,
                random.randint(10, 500),
                f"{product_type.lower()},{category.lower()},{uuid.uuid4().hex[:6]}",
                random.choice(ADDRESSES) if product_type != 'STORE' else None,
                ','.join(random.sample(DELIVERY_TYPES, random.randint(2, 4))),
                product_type, 'ACTIVE', category,
                product_type == 'STORE' and (discount_rate or 0) >= 20,
                random.choice([0, 2500, 3000]) if product_type != 'STORE' or (discount_rate or 0) < 20 else 0,
                random.choice(user_ids),
                created, created
            ))

            product_id = cursor.lastrowid
            product_ids[product_type].append(product_id)

            # 이미지 생성 (1~3개)
            num_images = random.randint(1, 3)
            for _ in range(num_images):
                source_url = get_random_image(category)

                # S3 업로드
                if s3_uploader:
                    final_url = s3_uploader.download_and_upload(source_url, product_id)
                else:
                    final_url = source_url

                cursor.execute("""
                    INSERT INTO image (ref_id, image_path, image_type, product_type, created_at)
                    VALUES (%s, %s, %s, %s, %s)
                """, (product_id, final_url, 'PRODUCT', product_type, datetime.now()))

            print(f"✅ {product_type} {i+1}/{count}: {titles[i % len(titles)][:30]}...")

    return product_ids

def create_bids(cursor, auction_ids: List[int], user_ids: List[int]):
    for product_id in auction_ids:
        cursor.execute("SELECT starting_price FROM product WHERE product_id = %s", (product_id,))
        result = cursor.fetchone()
        if not result:
            continue

        current_price = result[0]
        bidders = random.sample(user_ids, min(NUM_BIDS_PER_AUCTION, len(user_ids)))

        for i, user_id in enumerate(bidders):
            current_price = int(current_price * (1 + random.uniform(0.1, 0.3)))
            cursor.execute("""
                INSERT INTO bid (bid_price, is_winning, created_at, product_id, user_id)
                VALUES (%s, %s, %s, %s, %s)
            """, (current_price, i == len(bidders) - 1, random_datetime(7, 0), product_id, user_id))

    print(f"✅ 입찰 데이터 생성완료")

def create_bookmarks(cursor, product_ids: Dict[str, List[int]], user_ids: List[int]):
    all_products = sum(product_ids.values(), [])
    for user_id in user_ids:
        for pid in random.sample(all_products, random.randint(3, min(8, len(all_products)))):
            created = random_datetime(7, 0)
            cursor.execute("INSERT INTO bookmark (user_id, product_id, created_at, updated_at) VALUES (%s, %s, %s, %s)",
                           (user_id, pid, created, created))
    print(f"✅ 북마크 데이터 생성완료")

def create_reviews(cursor, product_ids: Dict[str, List[int]]):
    contents = ["정말 좋아요!", "배송 빨라요", "상태 좋아요", "만족합니다", "추천해요", "포장 꼼꼼해요"]
    all_products = sum(product_ids.values(), [])

    for pid in random.sample(all_products, len(all_products) // 2):
        cursor.execute("SELECT product_type FROM product WHERE product_id = %s", (pid,))
        result = cursor.fetchone()
        created = random_datetime(14, 0)
        cursor.execute("""
            INSERT INTO review (ref_id, content, rating, product_type, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (pid, random.choice(contents), random.randint(3, 5), result[0] if result else 'USED', created, created))
    print(f"✅ 리뷰 데이터 생성완료")

# ============================================
# 🚀 메인
# ============================================
def main():
    print("=" * 50)
    print("🚀 더미데이터 + S3 이미지 생성 시작")
    print("=" * 50)

    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()
        print("✅ DB 연결 성공")

        # S3 업로더 초기화 (선택)
        try:
            s3_uploader = S3Uploader()
            print("✅ S3 연결 성공")
        except Exception as e:
            print(f"⚠️ S3 연결 실패, Unsplash URL 사용: {e}")
            s3_uploader = None

        # 1. 유저
        print("\n📌 Step 1: 유저 생성")
        user_ids = create_users(cursor)
        conn.commit()

        # 2. 상품 + 이미지
        print("\n📌 Step 2: 상품 + 이미지 생성")
        product_ids = create_products_with_s3(cursor, user_ids, s3_uploader)
        conn.commit()

        # 3. 입찰
        print("\n📌 Step 3: 입찰 생성")
        create_bids(cursor, product_ids['AUCTION'], user_ids)
        conn.commit()

        # 4. 북마크
        print("\n📌 Step 4: 북마크 생성")
        create_bookmarks(cursor, product_ids, user_ids)
        conn.commit()

        # 5. 리뷰
        print("\n📌 Step 5: 리뷰 생성")
        create_reviews(cursor, product_ids)
        conn.commit()

        print("\n" + "=" * 50)
        print("🎉 완료!")
        print(f"   유저: {len(user_ids)}명")
        print(f"   경매: {len(product_ids['AUCTION'])}개")
        print(f"   스토어: {len(product_ids['STORE'])}개")
        print(f"   중고: {len(product_ids['USED'])}개")
        print("=" * 50)

    except mysql.connector.Error as err:
        print(f"❌ DB 에러: {err}")
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'conn' in locals(): conn.close()

if __name__ == "__main__":
    main()