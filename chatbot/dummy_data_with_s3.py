"""
DDauction 더미데이터 생성 스크립트 - 최종 완성 버전

✅ BCrypt 해시 사용 (Spring Security 호환)
✅ 카테고리별 이미지 20개 이상
✅ USER 권한 + 사업자번호 구조
✅ 관리자 계정(user_id=1) 보존
✅ 테스트 계정 3개 + 일반 유저 17명 (총 20명)
✅ 상품 150개 (경매 입찰중/완료/낙찰, 스토어 판매중/완료, 중고)
✅ 풍부한 데이터 (댓글, 채팅, 커뮤니티 등)
✅ address 테이블 에러 수정
✅ 단색 배경 이미지 추가 (흰색/검정/회색/파스텔)

사용법:
1. pip install mysql-connector-python boto3 requests Pillow python-dotenv bcrypt
2. python dummy_data_final.py
"""

import mysql.connector
import boto3
import requests
import random
import io
import os
import bcrypt
from datetime import datetime, timedelta
from typing import List, Dict
from PIL import Image as PILImage
import uuid
import logging

# .env 파일 로드
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# ============================================
# 🔧 로깅 설정
# ============================================
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)

# ============================================
# 🔧 설정
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
NUM_REGULAR_USERS = 17

# 상품 개수 설정
NUM_AUCTION_BIDDING = 30   # 경매 입찰중
NUM_AUCTION_CLOSED = 20    # 경매 입찰완료
NUM_AUCTION_SOLD = 20      # 경매 낙찰완료
NUM_STORE_ACTIVE = 40      # 스토어 판매중
NUM_STORE_SOLD = 20        # 스토어 판매완료
NUM_USED = 50              # 중고

# QNA/커뮤니티 개수
NUM_QNA = 150              # QNA 문의
NUM_COMMUNITY = 50         # 자유게시판
NUM_NOTICE = 30            # 공지
NUM_FAQ = 40               # FAQ
NUM_COMMENT_MIN = 20       # 댓글 최소
NUM_COMMENT_MAX = 30       # 댓글 최대
NUM_PUBLIC_CHAT = 200 # 공개채팅
NUM_SEARCH_KEYWORDS = 30 # 인기 검색어

logging.info("===== 환경변수 및 설정 확인 =====")
logging.info(f"DB_HOST={DB_CONFIG['host']}")
logging.info(f"DB_PORT={DB_CONFIG['port']}")
logging.info(f"DB_USER={DB_CONFIG['user']}")
logging.info(f"DB_NAME={DB_CONFIG['database']}")
logging.info("=================================")

# ============================================
# 📸 이미지 URL (단색 배경 추가)
# ============================================

# 단색 배경 이미지 (누끼 따기 좋은 이미지) - 각 색별 15개
SOLID_BG_IMAGES = {
    'WHITE': [  # 흰배경 15개
        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500',
        'https://images.unsplash.com/photo-1585298723682-7115561c51b7?w=500',
        'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500',
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
        'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=500',
        'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500',
        'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500',
        'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=500',
        'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500',
        'https://images.unsplash.com/photo-1540574163026-643ea20ade25?w=500',
        'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=500',
        'https://images.unsplash.com/photo-1567016432779-094069958ea5?w=500',
        'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=500',
        'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=500',
        'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=500',
    ],
    'BLACK': [  # 검정배경 15개
        'https://images.unsplash.com/photo-1609081219090-a6d81d3085bf?w=500',
        'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500',
        'https://images.unsplash.com/photo-1614624532983-4ce03382d63d?w=500',
        'https://images.unsplash.com/photo-1557683316-973673baf926?w=500',
        'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=500',
        'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500',
        'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=500',
        'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=500',
        'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=500',
        'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=500',
        'https://images.unsplash.com/photo-1529403895294-a8f6c42f8939?w=500',
        'https://images.unsplash.com/photo-1593642532973-d31b6557fa68?w=500',
        'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=500',
        'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=500',
        'https://images.unsplash.com/photo-1519505907962-0a6cb0167c73?w=500',
    ],
    'GRAY': [  # 회색배경 15개
        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500',
        'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=500',
        'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=500',
        'https://images.unsplash.com/photo-1598560917505-59a3ad559071?w=500',
        'https://images.unsplash.com/photo-1588099768531-a72d4a198538?w=500',
        'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=500',
        'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=500',
        'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=500',
        'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=500',
        'https://images.unsplash.com/photo-1610694974244-e6d3ff38e9d0?w=500',
        'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=500',
        'https://images.unsplash.com/photo-1628863353691-0071c8c1874c?w=500',
        'https://images.unsplash.com/photo-1588099768523-f4e6a5679d88?w=500',
        'https://images.unsplash.com/photo-1590548784585-643d2b9f2925?w=500',
        'https://images.unsplash.com/photo-1608042314453-ae338d80c427?w=500',
    ],
    'PASTEL': [  # 파스텔배경 15개
        'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500',
        'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=500',
        'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=500',
        'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=500',
        'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=500',
        'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=500',
        'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=500',
        'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=500',
        'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=500',
        'https://images.unsplash.com/photo-1590736969955-71cc94901144?w=500',
        'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=500',
        'https://images.unsplash.com/photo-1631214524020-7e18db7f7c3c?w=500',
        'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=500',
        'https://images.unsplash.com/photo-1596704017254-9b121068ec31?w=500',
        'https://images.unsplash.com/photo-1563263713-a557e95ce4f8?w=500',
    ]
}

CATEGORY_IMAGES = {
    'ELECTRONICS': [
        'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500',
        'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=500',
        'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500',
        'https://images.unsplash.com/photo-1585298723682-7115561c51b7?w=500',
        'https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=500',
        'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500',
        'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=500',
        'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=500',
        'https://images.unsplash.com/photo-1518770660439-4636190af475?w=500',
        'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500',
        'https://images.unsplash.com/photo-1484788984921-03950022c9ef?w=500',
        'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=500',
        'https://images.unsplash.com/photo-1563206767-5b18f218e8de?w=500',
        'https://images.unsplash.com/photo-1616763355548-1b606f439f86?w=500',
        'https://images.unsplash.com/photo-1625948515291-69613efd103f?w=500',
        'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=500',
        'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=500',
        'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=500',
        'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=500',
        'https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?w=500',
    ],
    'CLOTHING': [
        'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500',
        'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500',
        'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=500',
        'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=500',
        'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?w=500',
        'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=500',
        'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=500',
        'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=500',
        'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=500',
        'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=500',
        'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=500',
        'https://images.unsplash.com/photo-1516762689617-e1cffcef479d?w=500',
        'https://images.unsplash.com/photo-1602293589930-45aad59ba3ab?w=500',
        'https://images.unsplash.com/photo-1523359346063-d879354c0ea5?w=500',
        'https://images.unsplash.com/photo-1544441893-675973e31985?w=500',
        'https://images.unsplash.com/photo-1624206112918-f140f087f9b5?w=500',
        'https://images.unsplash.com/photo-1562157873-818bc0726f68?w=500',
        'https://images.unsplash.com/photo-1591369822096-ffd140ec948f?w=500',
        'https://images.unsplash.com/photo-1621072156002-e2fccdc0b176?w=500',
        'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500',
    ],
    'ACCESSORIES': [
        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500',
        'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500',
        'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=500',
        'https://images.unsplash.com/photo-1590548784585-643d2b9f2925?w=500',
        'https://images.unsplash.com/photo-1608042314453-ae338d80c427?w=500',
        'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=500',
        'https://images.unsplash.com/photo-1624019862853-10eae47c6ff6?w=500',
        'https://images.unsplash.com/photo-1607522370275-f14206abe5d3?w=500',
        'https://images.unsplash.com/photo-1583292650898-7d22cd27ca6f?w=500',
        'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=500',
        'https://images.unsplash.com/photo-1598560917505-59a3ad559071?w=500',
        'https://images.unsplash.com/photo-1588099768531-a72d4a198538?w=500',
        'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=500',
        'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=500',
        'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=500',
        'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=500',
        'https://images.unsplash.com/photo-1610694974244-e6d3ff38e9d0?w=500',
        'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=500',
        'https://images.unsplash.com/photo-1628863353691-0071c8c1874c?w=500',
        'https://images.unsplash.com/photo-1588099768523-f4e6a5679d88?w=500',
    ],
    'FURNITURE_INTERIOR': [
        'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500',
        'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=500',
        'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500',
        'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=500',
        'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=500',
        'https://images.unsplash.com/photo-1567016432779-094069958ea5?w=500',
        'https://images.unsplash.com/photo-1540574163026-643ea20ade25?w=500',
        'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=500',
        'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=500',
        'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=500',
        'https://images.unsplash.com/photo-1619015455853-cf26e9a50dc5?w=500',
        'https://images.unsplash.com/photo-1598300056393-4aac492f4344?w=500',
        'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=500',
        'https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?w=500',
        'https://images.unsplash.com/photo-1556912167-f556f1f39faa?w=500',
        'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=500',
        'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=500',
        'https://images.unsplash.com/photo-1615873968403-89e068629265?w=500',
        'https://images.unsplash.com/photo-1612372606404-0ab33e7187ee?w=500',
        'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=500',
    ],
    'SPORTS': [
        'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=500',
        'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500',
        'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500',
        'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=500',
        'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=500',
        'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=500',
        'https://images.unsplash.com/photo-1593642532973-d31b6557fa68?w=500',
        'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=500',
        'https://images.unsplash.com/photo-1529403895294-a8f6c42f8939?w=500',
        'https://images.unsplash.com/photo-1557683316-973673baf926?w=500',
        'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=500',
        'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=500',
        'https://images.unsplash.com/photo-1519505907962-0a6cb0167c73?w=500',
        'https://images.unsplash.com/photo-1592656094267-764a45160876?w=500',
        'https://images.unsplash.com/photo-1523861751938-121b5323b48b?w=500',
        'https://images.unsplash.com/photo-1608889335941-32ac5f2041b9?w=500',
        'https://images.unsplash.com/photo-1593642532400-2682810df593?w=500',
        'https://images.unsplash.com/photo-1591291621164-2c6367723315?w=500',
        'https://images.unsplash.com/photo-1587280501635-68a0e82cd5fc?w=500',
        'https://images.unsplash.com/photo-1592364395653-83e648b20cc2?w=500',
    ],
    'BEAUTY': [
        'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500',
        'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=500',
        'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=500',
        'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=500',
        'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=500',
        'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=500',
        'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=500',
        'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=500',
        'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=500',
        'https://images.unsplash.com/photo-1590736969955-71cc94901144?w=500',
        'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=500',
        'https://images.unsplash.com/photo-1631214524020-7e18db7f7c3c?w=500',
        'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=500',
        'https://images.unsplash.com/photo-1596704017254-9b121068ec31?w=500',
        'https://images.unsplash.com/photo-1563263713-a557e95ce4f8?w=500',
        'https://images.unsplash.com/photo-1603569283847-aa295f0d016a?w=500',
        'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=500',
        'https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?w=500',
        'https://images.unsplash.com/photo-1587622795235-8f00148f453e?w=500',
        'https://images.unsplash.com/photo-1609188076864-c35269136352?w=500',
    ],
    'BOOKS': [
        'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500',
        'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=500',
        'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=500',
        'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=500',
        'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=500',
        'https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=500',
        'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=500',
        'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=500',
        'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=500',
        'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=500',
        'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=500',
        'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=500',
        'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=500',
        'https://images.unsplash.com/photo-1592496431122-2349e0fbc666?w=500',
        'https://images.unsplash.com/photo-1518373714866-3f1478910cc0?w=500',
        'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=500',
        'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=500',
        'https://images.unsplash.com/photo-1491841573634-28140fc7ced7?w=500',
        'https://images.unsplash.com/photo-1550399105-c4db5fb85c18?w=500',
        'https://images.unsplash.com/photo-1580537659466-0a9bfa916a54?w=500',
    ],
    'APPLIANCES': [
        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500',
        'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=500',
        'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=500',
        'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=500',
        'https://images.unsplash.com/photo-1581539250439-c96689b516dd?w=500',
        'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=500',
        'https://images.unsplash.com/photo-1588854337221-4cf9fa96e7f6?w=500',
        'https://images.unsplash.com/photo-1585659722983-3a675dabf23d?w=500',
        'https://images.unsplash.com/photo-1603712725038-839f904df954?w=500',
        'https://images.unsplash.com/photo-1595428773960-9527ba60c58c?w=500',
        'https://images.unsplash.com/photo-1571175351758-add119ae8f25?w=500',
        'https://images.unsplash.com/photo-1585755100950-1ee45176de08?w=500',
        'https://images.unsplash.com/photo-1600560365116-e6a71ee07f6c?w=500',
        'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=500',
        'https://images.unsplash.com/photo-1626806819282-2c1dc01a5e0c?w=500',
        'https://images.unsplash.com/photo-1626806819283-962654e6e4a3?w=500',
        'https://images.unsplash.com/photo-1624823183493-ed5832f48f18?w=500',
        'https://images.unsplash.com/photo-1572635148873-2f0c01f72e6e?w=500',
        'https://images.unsplash.com/photo-1574269910015-e01d78cfc8c7?w=500',
        'https://images.unsplash.com/photo-1556911259-4dfbfc0b73a6?w=500',
    ],
    'KIDS': [
        'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=500',
        'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=500',
        'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=500',
        'https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=500',
        'https://images.unsplash.com/photo-1599238118412-732da54c09c0?w=500',
        'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=500',
        'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=500',
        'https://images.unsplash.com/photo-1517457210348-65f2a5e83b9e?w=500',
        'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=500',
        'https://images.unsplash.com/photo-1596298209830-c6e5d52c92c1?w=500',
        'https://images.unsplash.com/photo-1602573990555-0b0f417f1924?w=500',
        'https://images.unsplash.com/photo-1588366236748-04be10b4c5cc?w=500',
        'https://images.unsplash.com/photo-1580130732478-3e3e8e00f5e4?w=500',
        'https://images.unsplash.com/photo-1592906209472-a36b1f3782ef?w=500',
        'https://images.unsplash.com/photo-1569262380418-aa0f0ae427b2?w=500',
        'https://images.unsplash.com/photo-1588366232945-a5e579d99c14?w=500',
        'https://images.unsplash.com/photo-1616694547036-4b51a02d1f28?w=500',
        'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=500',
        'https://images.unsplash.com/photo-1515488764276-beab7607c1e6?w=500',
        'https://images.unsplash.com/photo-1519340241574-2cec6aef0c01?w=500',
    ],
}

DEFAULT_IMAGES = [
    'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=500',
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
]

# ============================================
# 📝 데이터 상수
# ============================================

COMMON_DELIVERY_COMBOS = [['PARCEL', 'MEETUP'], ['GS', 'CU'], ['PARCEL'], ['MEETUP'], ['QUICK']]

PRODUCT_CATEGORIES = [
    'ELECTRONICS', 'APPLIANCES', 'FURNITURE_INTERIOR', 'KITCHENWARE', 'FOODS',
    'KIDS', 'BOOKS', 'STATIONERY', 'CLOTHING', 'ACCESSORIES', 'BEAUTY',
    'SPORTS', 'ENTERTAINMENT', 'TICKETS', 'PET', 'PLANTS', 'ETC'
]

TEST_USERS = [
    {'name': 'Test Seller', 'nick': '판매테스트', 'email': 'seller@test.com',
     'password': 'Test1234!', 'role': 'USER', 'business_number': None},
    {'name': 'Test Business', 'nick': '사업자테스트', 'email': 'business@test.com',
     'password': 'Test1234!', 'role': 'USER', 'business_number': '1234567890'},
    {'name': 'Test Buyer', 'nick': '구매테스트', 'email': 'buyer@test.com',
     'password': 'Test1234!', 'role': 'USER', 'business_number': None}
]

AUCTION_TITLES = [
    "[경매] 애플 맥북 프로 14인치 M3 Pro", "[경매] 소니 PS5", "[경매] 다이슨 에어랩",
    "[경매] 애플워치 울트라2", "[경매] LG 스탠바이미", "[경매] 발뮤다 토스터",
    "[경매] 갤럭시 Z플립5", "[경매] 나이키 조던1", "[경매] 레고 밀레니엄",
    "[경매] 캐논 EOS R5", "[경매] 보스 헤드폰", "[경매] 닌텐도 스위치",
    "[경매] 에르메스 스카프", "[경매] 샤넬 플랩백", "[경매] 롤렉스 서브마리너",
    "[경매] 아이패드 프로", "[경매] 소니 WH-1000XM5", "[경매] 삼성 냉장고",
    "[경매] LG 코드제로", "[경매] 구찌 숄더백", "[경매] 루이비통 스피디",
    "[경매] 발렌시아가 트랙", "[경매] 프라다 리에디션", "[경매] 디올 새들백",
    "[경매] 버버리 버킷햇", "[경매] 몽클레어 마야", "[경매] 캐나다구스 파카",
    "[경매] 스톤아일랜드", "[경매] 아미 니트", "[경매] 메종키츠네",
    "[경매] 아크네 머플러", "[경매] 로에베 퍼즐백", "[경매] 보테가베네타",
    "[경매] 셀린느 트리오페", "[경매] 생로랑 루루백", "[경매] 발렌티노 클러치",
    "[경매] 지방시 안티고나", "[경매] 톰브라운 카디건", "[경매] 릭오웬스 지오바스켓",
    "[경매] 마르지엘라 타비", "[경매] 골든구스", "[경매] 피어오브갓",
    "[경매] 오프화이트", "[경매] 팜엔젤스", "[경매] 아더에러",
    "[경매] 앰부쉬 덩크", "[경매] 뉴발란스 993", "[경매] 아식스 젤카야노",
    "[경매] 살로몬 XT-6", "[경매] 호카 본디8"
]

STORE_TITLES = [f"[스토어] 상품{i}" for i in range(1, 51)]
USED_TITLES = [f"[중고] 상품{i}" for i in range(1, 51)]

PRODUCT_CONTENTS = [
    "상태 최상급입니다. 박스 포함.", "직거래 우선, 택배 가능.", "사용감 거의 없어요.",
    "선물 받았는데 안 써서 팔아요", "이사 가서 급매합니다", "네고 가능합니다",
    "정품 인증 가능해요", "박스 풀구성입니다", "깨끗하게 관리했어요", "하자 없습니다",
    "미개봉 새상품입니다", "일주일 사용했어요", "급처합니다", "하자 하나도 없어요",
    "정가보다 훨씬 저렴합니다", "빠른 배송 가능합니다", "포장도 꼼꼼히 해드려요",
    "실물 더 이뻐요", "쿨거래 우대합니다", "교환 불가 신중구매 부탁드려요"
]

ADDRESSES = [
    "서울특별시 강남구", "서울특별시 마포구", "경기도 성남시",
    "서울특별시 서초구", "서울특별시 송파구", "경기도 수원시",
    "서울특별시 영등포구", "서울특별시 강서구", "경기도 고양시",
    "서울특별시 관악구", "서울특별시 동작구", "경기도 용인시",
    "서울특별시 성북구", "서울특별시 광진구", "경기도 부천시",
    "서울특별시 중구", "서울특별시 종로구", "경기도 안양시",
    "서울특별시 용산구", "서울특별시 성동구", "경기도 남양주시"
]

# 풍부한 데이터를 위한 추가 컨텐츠
QNA_QUESTIONS = [
    "배송은 얼마나 걸리나요?", "직거래 가능한가요?", "네고 가능할까요?",
    "상태가 어떤가요?", "언제 구매하셨나요?", "하자 있나요?",
    "색상 다른 거 있나요?", "사이즈 맞을까요?", "교환 가능한가요?",
    "영수증 있나요?", "정품 맞나요?", "포장 상태는요?",
    "무게가 어떻게 되나요?", "배터리 상태는요?", "보증기간 남았나요?",
    "실사용 기간이 얼마나 되나요?", "구성품은 다 있나요?", "반품 가능한가요?",
    "급하게 필요한데 빠른 배송 되나요?", "다른 색상도 있나요?", "수량이 많은가요?"
]

QNA_ANSWERS = [
    "2-3일 걸립니다!", "네, 가능합니다.", "네고는 어렵습니다.",
    "상태 아주 좋습니다", "작년에 구매했어요", "하자 없습니다",
    "이 색상만 있어요", "사이즈표 참고해주세요", "교환 안 됩니다",
    "네, 있습니다", "정품 인증 가능해요", "새 상품처럼 포장되어 있어요",
    "약 500g입니다", "배터리 85% 상태예요", "네, 6개월 남았습니다",
    "3개월 정도 사용했어요", "네, 전부 있습니다", "단순변심은 불가능해요",
    "당일배송 가능합니다", "죄송하지만 품절이에요", "재고 여유있습니다"
]

COMMUNITY_TITLES = {
    'COMMUNITY': [  # 자유게시판 50개
        "요즘 가장 핫한 경매는?", "중고거래 사기 조심하세요", "경매 팁 공유합니다",
        "이번 주 베스트 상품", "가격 네고 노하우", "직거래 장소 추천",
        "안전한 거래 방법", "포장 잘하는 팁", "배송비 아끼는 법", "후기 남기는 문화",
        "경매 입찰 전략 공유", "중고거래 꿀팁", "좋은 판매자 추천", "알뜰쇼핑 노하우",
        "환불 받은 경험담", "가성비 좋은 상품", "배송 빠른 셀러", "품질 좋은 중고",
        "경매 낙찰 후기", "직거래 주의사항", "반품 성공 사례", "좋은 리뷰 쓰는 법",
        "할인 쿠폰 정보", "시즌 세일 정보", "신상품 출시 소식", "인기 브랜드 추천",
        "가구 배송 팁", "전자제품 관리법", "의류 보관 방법", "신발 세탁 노하우",
        "화장품 성분 분석", "도서 추천", "키즈 용품 후기", "반려동물 용품",
        "운동 기구 추천", "캠핑 용품 리뷰", "주방 가전 비교", "청소 용품 추천",
        "수납 정리 팁", "인테리어 소품", "DIY 프로젝트", "생활 가전 꿀템",
        "계절별 아이템", "선물 추천", "이사 준비 체크리스트", "새학기 준비물",
        "명절 선물 추천", "여행 준비물", "사무용품 추천", "재택 근무 템"
    ],
    'NOTICE': [  # 공지 30개
        "[공지] 서비스 점검 안내", "[공지] 이용약관 개정", "[공지] 이벤트 당첨자 발표",
        "[공지] 새로운 기능 추가", "[공지] 시스템 업데이트", "[공지] 휴일 배송 안내",
        "[공지] 고객센터 운영시간 변경", "[공지] 보안 강화 안내", "[공지] 결제 시스템 점검",
        "[공지] 모바일 앱 업데이트", "[공지] 개인정보처리방침 변경", "[공지] 회원 혜택 안내",
        "[공지] 연말연시 휴무 안내", "[공지] 정기 점검 일정", "[공지] 신규 카테고리 오픈",
        "[공지] 택배사 변경 안내", "[공지] 쿠폰 사용 방법", "[공지] 포인트 적립 혜택",
        "[공지] 신규 결제 수단 추가", "[공지] 모니터링 정책 안내", "[공지] 배송 지연 안내",
        "[공지] 서버 이전 안내", "[공지] 회원등급 제도 변경", "[공지] 적립금 소멸 안내",
        "[공지] 신규 파트너십 체결", "[공지] 사이트 리뉴얼", "[공지] 반품 정책 변경",
        "[공지] 고객 감사 이벤트", "[공지] 추석 연휴 배송", "[공지] 설날 휴무 안내"
    ],
    'FAQ': [  # FAQ 40개
        "경매 입찰은 어떻게?", "배송비는 누가 내나요?", "환불 정책이 궁금해요",
        "회원 가입은 어떻게?", "비밀번호 찾기", "결제 수단은 뭐가 있나요?",
        "포인트 적립 방법", "쿠폰 사용법", "신고는 어떻게?", "탈퇴 절차가 궁금해요",
        "상품 등록은 어떻게?", "사진 업로드 방법", "카테고리 선택 기준", "가격 설정 팁",
        "배송 방법 선택", "반품/교환 절차", "중고거래 주의사항", "안전결제란?",
        "사기 신고 방법", "판매 수수료는?", "입찰 취소 가능한가요?", "낙찰 후 절차",
        "직거래 안전 수칙", "택배 분실 시", "상품 하자 발견 시", "리뷰 작성 방법",
        "북마크 기능", "알림 설정", "채팅 사용법", "프로필 수정",
        "사업자 등록", "판매 제한 품목", "금지 품목", "저작권 침해",
        "개인정보 보호", "계정 정지 사유", "이의 신청", "포인트 환급",
        "배송 추적", "운송장 등록", "구매 확정", "세금계산서 발급"
    ]
}

COMMENT_CONTENTS = [
    "좋은 정보 감사합니다!", "도움됐습니다", "저도 같은 생각이에요",
    "정말 유용하네요", "공감합니다", "추천드려요", "좋은 팁이네요",
    "저도 해봐야겠어요", "감사해요", "잘 봤습니다", "유익한 글이네요",
    "완전 동의합니다", "저도 궁금했어요", "답변 감사드려요", "정말 그렇네요",
    "좋은 하루 되세요", "많이 배웠습니다", "꿀팁이네요", "대박이에요", "최고입니다"
]

PUBLIC_CHAT_MESSAGES = [
    "오늘 신규 상품 많네요!", "경매 재밌어요", "좋은 물건 많아요",
    "다들 쇼핑 많이 하시네요", "배송 빠른 편인가요?", "첫 거래인데 긴장돼요",
    "좋은 하루 되세요!", "오늘 할인 많네요", "추천 상품 있나요?", "재밌는 이벤트 많아요",
    "여기 진짜 좋네요", "경매 처음 해봐요", "중고거래 꿀팁 없나요?", "누가 좋은 셀러 추천해주세요",
    "오늘도 쇼핑하러 왔어요", "좋은 상품 많이 올려주세요", "배송비 무료 상품 찾아요",
    "직거래 선호하시는 분?", "안전거래 꿀팁 있나요?", "포장 잘하는 셀러 추천"
]

PRIVATE_CHAT_BUYER = [
    "아직 판매 중이신가요?", "가격 네고 가능한가요?", "언제 거래 가능하세요?",
    "직거래 장소 어디가 좋을까요?", "상태 확인 가능한가요?", "사진 더 보여주실 수 있나요?",
    "배송비 포함 가격인가요?", "하자는 없나요?", "구매 확정하고 싶어요",
    "빠른 배송 가능한가요?", "다른 색상도 있나요?", "수량 남아있나요?"
]

PRIVATE_CHAT_SELLER = [
    "네, 판매 중입니다!", "네고는 어렵습니다.", "오늘 저녁 가능해요",
    "역 앞이 좋을 것 같아요", "네, 확인 가능합니다", "사진 더 보내드릴게요",
    "배송비 별도입니다", "하자 전혀 없어요", "구매 감사합니다",
    "네, 당일배송 가능해요", "이 색상만 있어요", "재고 충분합니다"
]

POPULAR_KEYWORDS = [
    "맥북", "아이폰", "에어팟", "갤럭시", "다이슨", "PS5",
    "닌텐도", "애플워치", "노트북", "청소기", "냉장고", "세탁기",
    "의자", "책상", "모니터", "키보드", "마우스", "헤드폰",
    "스피커", "캠핑", "자전거", "운동화", "가방", "지갑",
    "화장품", "향수", "시계", "선글라스", "카메라", "드론"
]

# ============================================
# 🔧 S3 업로더
# ============================================

class S3Uploader:
    def __init__(self):
        self.bucket = S3_CONFIG['bucket']
        self.s3_client = None if not self.bucket else boto3.client(
            's3', region_name=S3_CONFIG['region'],
            aws_access_key_id=S3_CONFIG['access_key'],
            aws_secret_access_key=S3_CONFIG['secret_key']
        )
        self.folder = S3_CONFIG['folder']
        self.fallback_url = self.init_fallback_image()

    def init_fallback_image(self) -> str:
        """기본 이미지 하나를 미리 업로드해두고 실패 시 사용"""
        if not self.s3_client:
            return DEFAULT_IMAGES[0]
        try:
            # DEFAULT_IMAGES 첫 번째 것을 사용
            image_url = DEFAULT_IMAGES[0]
            response = requests.get(image_url, timeout=5)
            response.raise_for_status()
            img = PILImage.open(io.BytesIO(response.content)).convert('RGB')
            img.thumbnail((500, 500), PILImage.Resampling.LANCZOS)
            buffer = io.BytesIO()
            img.save(buffer, format='JPEG', quality=85)
            buffer.seek(0)
            
            s3_key = f"{self.folder}/default/fallback.jpg"
            self.s3_client.upload_fileobj(buffer, self.bucket, s3_key,
                                          ExtraArgs={'ContentType': 'image/jpeg'})
            url = f"https://{self.bucket}.s3.{S3_CONFIG['region']}.amazonaws.com/{s3_key}"
            logging.info(f"✅ Fallback 이미지 준비 완료: {url}")
            return url
        except Exception as e:
            logging.warning(f"⚠️ Fallback 이미지 준비 실패: {e}")
            return DEFAULT_IMAGES[0]

    def upload_image(self, image_url: str, product_id: int) -> str:
        if not self.s3_client:
            return image_url
        try:
            response = requests.get(image_url, timeout=3)
            response.raise_for_status()
            img = PILImage.open(io.BytesIO(response.content)).convert('RGB')
            img.thumbnail((500, 500), PILImage.Resampling.LANCZOS)
            buffer = io.BytesIO()
            img.save(buffer, format='JPEG', quality=85)
            buffer.seek(0)
            s3_key = f"{self.folder}/{product_id}/{uuid.uuid4().hex[:8]}.jpg"
            self.s3_client.upload_fileobj(buffer, self.bucket, s3_key,
                                          ExtraArgs={'ContentType': 'image/jpeg'})
            return f"https://{self.bucket}.s3.{S3_CONFIG['region']}.amazonaws.com/{s3_key}"
        except Exception as e:
            logging.warning(f"S3 업로드 실패 (Fallback 사용): {e}")
            return self.fallback_url


# ============================================
# 🔧 유틸리티 함수
# ============================================

def hash_password(password: str) -> str:
    """진짜 BCrypt 해싱"""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')


def generate_random_email(index: int) -> str:
    domains = ['gmail.com', 'naver.com', 'kakao.com', 'daum.net']
    return f"user{index}@{domains[index % len(domains)]}"


def random_datetime(start_days_ago: int = 30, end_days_ago: int = 0) -> datetime:
    start = datetime.now() - timedelta(days=start_days_ago)
    end = datetime.now() - timedelta(days=end_days_ago)
    delta = end - start
    return start + timedelta(seconds=random.randint(0, int(delta.total_seconds())))


def past_datetime(min_days: int = 1, max_days: int = 7) -> datetime:
    """과거 시간 생성"""
    return datetime.now() - timedelta(days=random.randint(min_days, max_days), hours=random.randint(0, 23))


def future_datetime(min_days: int = 1, max_days: int = 7) -> datetime:
    return datetime.now() + timedelta(days=random.randint(min_days, max_days))


def round_to_thousand(price: int) -> int:
    return round(price / 1000) * 1000


def get_random_image(category: str) -> str:
    images = CATEGORY_IMAGES.get(category, DEFAULT_IMAGES)
    return random.choice(images)


def get_solid_bg_image() -> str:
    """단색 배경 이미지 랜덤 선택"""
    all_solid_images = []
    for color_images in SOLID_BG_IMAGES.values():
        all_solid_images.extend(color_images)
    return random.choice(all_solid_images)


# ============================================
# 🗃️ 데이터 생성 함수
# ============================================

def create_users(cursor) -> Dict[str, List[int]]:
    user_ids = {'test': [], 'regular': []}

    # 1. 관리자 계정 정보 (Java Spring Boot의 정보로 대체)
    # 이 정보는 TEST_USERS 리스트의 첫 번째 항목을 대체합니다.
    ADMIN_USER_DATA = {
        'name': "관리자",
        'nick': "admin",
        'email': "admin@example.com",
        'password': "Admin1234!",  # hash_password로 해싱될 예정
        'phone': "01000000000",
        'role': 'ADMIN',
        'birthday': "1990-01-01",
        'business_number': None,
    }

    # 기존 TEST_USERS 리스트에서 첫 번째 항목을 삭제하거나,
    # 코드를 명시적으로 분리하여 관리자 계정을 먼저 생성합니다.

    # ----------------------------------------------------
    # 1. 관리자(Admin) 계정 생성 (TEST_USERS 1번 항목 대체)
    # ----------------------------------------------------
    logging.info(f"관리자 계정 admin@example.com 생성 중...")

    admin_created = random_datetime(90, 30)

    # DB에 삽입
    cursor.execute("""
                   INSERT INTO users (user_name, nick_name, email, password, phone, birthday,
                                      business_number, role, verified, created_at, updated_at)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                   """, (
        ADMIN_USER_DATA['name'], ADMIN_USER_DATA['nick'], ADMIN_USER_DATA['email'],
        hash_password(ADMIN_USER_DATA['password']),
        ADMIN_USER_DATA['phone'],
        ADMIN_USER_DATA['birthday'],
        ADMIN_USER_DATA['business_number'], ADMIN_USER_DATA['role'],
        True, admin_created, admin_created
    ))
    user_ids['test'].append(cursor.lastrowid)
    logging.info(f"✅ 관리자 계정 admin@example.com 생성 완료")

    # TEST_USERS의 나머지 항목 (만약 TEST_USERS가 ADMIN_USER_DATA를 포함하고 있었다면 수정이 필요할 수 있습니다.
    # 여기서는 ADMIN_USER_DATA를 TEST_USERS의 첫 항목으로 간주하고, 나머지 TEST_USERS는 두 번째 항목부터 처리한다고 가정합니다.)

    remaining_test_users = TEST_USERS[1:] if len(TEST_USERS) > 0 else []

    if remaining_test_users:
        logging.info(f"추가 테스트 유저 {len(remaining_test_users)}명 생성 중...")
        for user_data in remaining_test_users:
            created = random_datetime(90, 30)
            cursor.execute("""
                           INSERT INTO users (user_name, nick_name, email, password, phone, birthday,
                                              business_number, role, verified, created_at, updated_at)
                           VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                           """, (
                user_data['name'], user_data['nick'], user_data['email'],
                hash_password(user_data['password']),
                f"010{random.randint(10000000, 99999999)}",
                f"{random.randint(1985, 2000)}-{random.randint(1, 12):02d}-01",
                user_data['business_number'], user_data['role'], True, created, created
            ))
            user_ids['test'].append(cursor.lastrowid)
            logging.info(f"✅ {user_data['nick']} ({user_data['email']})")

    # ----------------------------------------------------
    # 2. 일반 유저 생성
    # ----------------------------------------------------
    logging.info(f"일반 유저 {NUM_REGULAR_USERS}명 생성 중...")
    for i in range(NUM_REGULAR_USERS):
        email = generate_random_email(i + 100)
        role = 'USER'
        business_number = None
        if random.random() < 0.5:
            business_number = ''.join([str(random.randint(0, 9)) for _ in range(10)])

        created = random_datetime(90, 1)
        cursor.execute("""
                       INSERT INTO users (user_name, nick_name, email, password, phone, birthday,
                                          business_number, role, verified, created_at, updated_at)
                       VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                       """, (
            f"유저{i + 1}", f"닉네임{i + 1}", email, hash_password("Test1234!"),
            f"010{random.randint(10000000, 99999999)}",
            f"{random.randint(1985, 2005)}-{random.randint(1, 12):02d}-01",
            business_number, role, True, created, created
        ))
        user_ids['regular'].append(cursor.lastrowid)

        if (i + 1) % 5 == 0:
            logging.info(f"진행: {i + 1}/{NUM_REGULAR_USERS}")

    logging.info(f"✅ 총 {len(user_ids['test']) + len(user_ids['regular'])}명 생성 완료")
    return user_ids

def add_product_images(cursor, product_id: int, category: str, product_type: str, s3_uploader):
    """이미지 2-5개 생성 (20% 확률로 단색 배경)"""
    num_images = random.randint(2, 5)
    for img_idx in range(num_images):
        # 20% 확률로 단색 배경 (첫 번째 이미지만)
        if img_idx == 0 and random.random() < 0.2:
            source_url = get_solid_bg_image()
        else:
            source_url = get_random_image(category)

        final_url = s3_uploader.upload_image(source_url, product_id) if s3_uploader else source_url
        cursor.execute("""
                       INSERT INTO image (ref_id, image_path, image_type, product_type, created_at)
                       VALUES (%s, %s, %s, %s, %s)
                       """, (product_id, final_url, 'PRODUCT', product_type, datetime.now()))


def create_products_with_s3(cursor, user_ids: Dict[str, List[int]], s3_uploader) -> Dict[str, List[int]]:
    """상품 생성: 경매 60개 (30/20/20), 스토어 60개 (40/20), 중고 50개"""
    product_ids = {
        'AUCTION_BIDDING': [],   # 입찰중
        'AUCTION_CLOSED': [],    # 입찰완료
        'AUCTION_SOLD': [],      # 낙찰완료
        'STORE_ACTIVE': [],      # 판매중
        'STORE_SOLD': [],        # 판매완료
        'USED': []               # 중고
    }

    all_sellers = user_ids['test'][:2] + user_ids['regular']
    business_seller = user_ids['test'][1]

    # === 경매 상품 60개 ===
    logging.info(f"경매 상품 60개 생성 중...")

    # 입찰중 30개
    for i in range(NUM_AUCTION_BIDDING):
        category = random.choice(PRODUCT_CATEGORIES)
        title = AUCTION_TITLES[i % len(AUCTION_TITLES)]
        starting_price = round_to_thousand(random.randint(10, 500) * 1000)
        auction_end = future_datetime(1, 7)
        created = random_datetime(30, 1)

        cursor.execute("""
                       INSERT INTO product (title, content, starting_price, auction_end_time, view_count, tag,
                                            delivery_available, product_type, product_status, product_category_type,
                                            delivery_included, delivery_price, seller_id, created_at, updated_at)
                       VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                       """, (
                           title, random.choice(PRODUCT_CONTENTS), starting_price, auction_end,
                           random.randint(10, 500), f"auction,{category.lower()},{uuid.uuid4().hex[:8]}",
                           ','.join(random.choice(COMMON_DELIVERY_COMBOS)),
                           'AUCTION', 'ACTIVE', category,
                           random.choice([True, False]),
                           random.choice([0, 2500, 3000]),
                           random.choice(all_sellers), created, created
                       ))

        product_id = cursor.lastrowid
        product_ids['AUCTION_BIDDING'].append(product_id)
        add_product_images(cursor, product_id, category, 'AUCTION', s3_uploader)

    # 입찰완료 20개
    for i in range(NUM_AUCTION_CLOSED):
        category = random.choice(PRODUCT_CATEGORIES)
        title = AUCTION_TITLES[(NUM_AUCTION_BIDDING + i) % len(AUCTION_TITLES)]
        starting_price = round_to_thousand(random.randint(10, 500) * 1000)
        auction_end = past_datetime(1, 7)  # 과거
        created = random_datetime(60, 8)

        cursor.execute("""
                       INSERT INTO product (title, content, starting_price, auction_end_time, view_count, tag,
                                            delivery_available, product_type, product_status, product_category_type,
                                            delivery_included, delivery_price, seller_id, created_at, updated_at)
                       VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                       """, (
                           title, random.choice(PRODUCT_CONTENTS), starting_price, auction_end,
                           random.randint(100, 800), f"auction,closed,{category.lower()},{uuid.uuid4().hex[:8]}",
                           ','.join(random.choice(COMMON_DELIVERY_COMBOS)),
                           'AUCTION', 'CLOSED', category,
                           random.choice([True, False]),
                           random.choice([0, 2500, 3000]),
                           random.choice(all_sellers), created, created
                       ))

        product_id = cursor.lastrowid
        product_ids['AUCTION_CLOSED'].append(product_id)
        add_product_images(cursor, product_id, category, 'AUCTION', s3_uploader)

    # 낙찰완료 20개
    for i in range(NUM_AUCTION_SOLD):
        category = random.choice(PRODUCT_CATEGORIES)
        title = AUCTION_TITLES[(NUM_AUCTION_BIDDING + NUM_AUCTION_CLOSED + i) % len(AUCTION_TITLES)]
        starting_price = round_to_thousand(random.randint(10, 500) * 1000)
        auction_end = past_datetime(8, 14)  # 더 오래 전
        created = random_datetime(90, 15)

        cursor.execute("""
                       INSERT INTO product (title, content, starting_price, auction_end_time, view_count, tag,
                                            delivery_available, product_type, product_status, product_category_type,
                                            delivery_included, delivery_price, seller_id, created_at, updated_at)
                       VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                       """, (
                           title, random.choice(PRODUCT_CONTENTS), starting_price, auction_end,
                           random.randint(200, 1000), f"auction,sold,{category.lower()},{uuid.uuid4().hex[:8]}",
                           ','.join(random.choice(COMMON_DELIVERY_COMBOS)),
                           'AUCTION', 'SOLD', category,
                           random.choice([True, False]),
                           random.choice([0, 2500, 3000]),
                           random.choice(all_sellers), created, created
                       ))

        product_id = cursor.lastrowid
        product_ids['AUCTION_SOLD'].append(product_id)
        add_product_images(cursor, product_id, category, 'AUCTION', s3_uploader)

    logging.info(f"✅ 경매: 입찰중 {NUM_AUCTION_BIDDING}, 입찰완료 {NUM_AUCTION_CLOSED}, 낙찰완료 {NUM_AUCTION_SOLD}")

    # === 스토어 상품 60개 ===
    logging.info(f"스토어 상품 60개 생성 중...")

    # 판매중 40개
    for i in range(NUM_STORE_ACTIVE):
        category = random.choice(PRODUCT_CATEGORIES)
        title = STORE_TITLES[i % len(STORE_TITLES)]
        original_price = random.randint(20, 300) * 1000
        discount_rate = random.choice([0, 10, 15, 20, 30, 50])
        sale_price = round_to_thousand(int(original_price * (1 - discount_rate / 100)))
        created = random_datetime(30, 1)

        cursor.execute("""
                       INSERT INTO product (title, content, original_price, sale_price, discount_rate,
                                            view_count, tag, delivery_available, product_type, product_status,
                                            product_category_type, delivery_included, delivery_price,
                                            seller_id, created_at, updated_at)
                       VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                       """, (
                           title, random.choice(PRODUCT_CONTENTS), original_price, sale_price, discount_rate,
                           random.randint(20, 600), f"store,{category.lower()},{uuid.uuid4().hex[:8]}",
                           ','.join(random.choice(COMMON_DELIVERY_COMBOS)),
                           'STORE', 'ACTIVE', category,
                           discount_rate >= 20,
                           0 if discount_rate >= 20 else random.choice([2500, 3000]),
                           business_seller, created, created
                       ))

        product_id = cursor.lastrowid
        product_ids['STORE_ACTIVE'].append(product_id)
        add_product_images(cursor, product_id, category, 'STORE', s3_uploader)

    # 판매완료 20개
    for i in range(NUM_STORE_SOLD):
        category = random.choice(PRODUCT_CATEGORIES)
        title = STORE_TITLES[(NUM_STORE_ACTIVE + i) % len(STORE_TITLES)]
        original_price = random.randint(20, 300) * 1000
        discount_rate = random.choice([0, 10, 15, 20, 30, 50])
        sale_price = round_to_thousand(int(original_price * (1 - discount_rate / 100)))
        created = random_datetime(60, 8)

        cursor.execute("""
                       INSERT INTO product (title, content, original_price, sale_price, discount_rate,
                                            view_count, tag, delivery_available, product_type, product_status,
                                            product_category_type, delivery_included, delivery_price,
                                            seller_id, created_at, updated_at)
                       VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                       """, (
                           title, random.choice(PRODUCT_CONTENTS), original_price, sale_price, discount_rate,
                           random.randint(50, 800), f"store,sold,{category.lower()},{uuid.uuid4().hex[:8]}",
                           ','.join(random.choice(COMMON_DELIVERY_COMBOS)),
                           'STORE', 'SOLD', category,
                           discount_rate >= 20,
                           0 if discount_rate >= 20 else random.choice([2500, 3000]),
                           business_seller, created, created
                       ))

        product_id = cursor.lastrowid
        product_ids['STORE_SOLD'].append(product_id)
        add_product_images(cursor, product_id, category, 'STORE', s3_uploader)

    logging.info(f"✅ 스토어: 판매중 {NUM_STORE_ACTIVE}, 판매완료 {NUM_STORE_SOLD}")

    # === 중고 상품 50개 ===
    logging.info(f"중고 상품 {NUM_USED}개 생성 중...")
    for i in range(NUM_USED):
        category = random.choice(PRODUCT_CATEGORIES)
        title = USED_TITLES[i % len(USED_TITLES)]
        original_price = random.randint(5, 200) * 1000
        created = random_datetime(30, 1)

        cursor.execute("""
                       INSERT INTO product (title, content, original_price, view_count, tag, address,
                                            delivery_available, product_type, product_status, product_category_type,
                                            delivery_included, delivery_price, seller_id, created_at, updated_at)
                       VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                       """, (
                           title, random.choice(PRODUCT_CONTENTS), original_price,
                           random.randint(10, 300), f"used,{category.lower()},{uuid.uuid4().hex[:8]}",
                           random.choice(ADDRESSES),
                           ','.join(random.choice(COMMON_DELIVERY_COMBOS)),
                           'USED', 'ACTIVE', category,
                           random.choice([True, False]),
                           random.choice([0, 2500, 3000]),
                           random.choice(all_sellers), created, created
                       ))

        product_id = cursor.lastrowid
        product_ids['USED'].append(product_id)
        add_product_images(cursor, product_id, category, 'USED', s3_uploader)

        if (i + 1) % 10 == 0:
            logging.info(f"중고 진행: {i + 1}/{NUM_USED}")

    total = sum(len(v) for v in product_ids.values())
    logging.info(f"✅ 총 {total}개 상품 생성 완료 (경매 60 + 스토어 60 + 중고 50)")
    return product_ids


def create_bids(cursor, product_ids: Dict[str, List[int]], user_ids: Dict[str, List[int]]):
    """입찰 데이터 생성 (천원 단위, 상태별 차등)"""
    all_users = user_ids['test'] + user_ids['regular']

    # 입찰중 (5-15개)
    for product_id in product_ids['AUCTION_BIDDING']:
        cursor.execute("SELECT starting_price, seller_id FROM product WHERE product_id = %s", (product_id,))
        result = cursor.fetchone()
        if not result:
            continue

        current_price, seller_id = result
        num_bids = random.randint(5, 15)
        bidders = random.sample([u for u in all_users if u != seller_id], min(num_bids, len(all_users) - 1))

        for i, user_id in enumerate(bidders):
            current_price = round_to_thousand(current_price + random.randint(1, 10) * 1000)
            cursor.execute("""
                           INSERT INTO bid (bid_price, is_winning, created_at, product_id, user_id)
                           VALUES (%s, %s, %s, %s, %s)
                           """, (current_price, i == len(bidders) - 1, random_datetime(7, 0), product_id, user_id))

    # 입찰완료 (10-20개)
    for product_id in product_ids['AUCTION_CLOSED']:
        cursor.execute("SELECT starting_price, seller_id FROM product WHERE product_id = %s", (product_id,))
        result = cursor.fetchone()
        if not result:
            continue

        current_price, seller_id = result
        num_bids = random.randint(10, 20)
        bidders = random.sample([u for u in all_users if u != seller_id], min(num_bids, len(all_users) - 1))

        for i, user_id in enumerate(bidders):
            current_price = round_to_thousand(current_price + random.randint(1, 10) * 1000)
            cursor.execute("""
                           INSERT INTO bid (bid_price, is_winning, created_at, product_id, user_id)
                           VALUES (%s, %s, %s, %s, %s)
                           """, (current_price, i == len(bidders) - 1, random_datetime(14, 8), product_id, user_id))

    # 낙찰완료 (15-25개)
    for product_id in product_ids['AUCTION_SOLD']:
        cursor.execute("SELECT starting_price, seller_id FROM product WHERE product_id = %s", (product_id,))
        result = cursor.fetchone()
        if not result:
            continue

        current_price, seller_id = result
        num_bids = random.randint(15, 25)
        bidders = random.sample([u for u in all_users if u != seller_id], min(num_bids, len(all_users) - 1))

        for i, user_id in enumerate(bidders):
            current_price = round_to_thousand(current_price + random.randint(1, 10) * 1000)
            cursor.execute("""
                           INSERT INTO bid (bid_price, is_winning, created_at, product_id, user_id)
                           VALUES (%s, %s, %s, %s, %s)
                           """, (current_price, i == len(bidders) - 1, random_datetime(30, 15), product_id, user_id))

    logging.info(f"✅ 입찰 데이터 생성 완료")


def create_qna(cursor, product_ids: Dict[str, List[int]], user_ids: Dict[str, List[int]]):
    """QNA 150개 생성 (답글 70%, 비밀글 30%)"""
    all_users = user_ids['test'] + user_ids['regular']
    all_products = []
    for pids in product_ids.values():
        all_products.extend(pids)

    for _ in range(NUM_QNA):
        product_id = random.choice(all_products)
        cursor.execute("SELECT product_type, seller_id FROM product WHERE product_id = %s", (product_id,))
        result = cursor.fetchone()
        if not result:
            continue

        product_type, seller_id = result
        asker_id = random.choice([u for u in all_users if u != seller_id])
        is_secret = random.random() < 0.3  # 30% 비밀글
        created = random_datetime(14, 1)

        cursor.execute("""
                       INSERT INTO product_qna (title, content, ref_id, product_type, user_id,
                                                is_secret, is_secret_comment, created_at, updated_at)
                       VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                       """, (random.choice(QNA_QUESTIONS), random.choice(PRODUCT_CONTENTS),
                             product_id, product_type, asker_id, is_secret, is_secret, created, created))

        qna_id = cursor.lastrowid

        # 70% 확률로 답변
        if random.random() < 0.7:
            answer_created = created + timedelta(hours=random.randint(1, 48))
            cursor.execute("""
                           INSERT INTO qna_review (content, user_id, product_qna_id, created_at, updated_at)
                           VALUES (%s, %s, %s, %s, %s)
                           """, (random.choice(QNA_ANSWERS), seller_id, qna_id, answer_created, answer_created))

    logging.info(f"✅ QNA {NUM_QNA}개 생성 완료 (답글 70%, 비밀글 30%)")


def create_article(cursor, user_ids: Dict[str, List[int]]):
    """커뮤니티 게시글 생성: 자유 50, 공지 30, FAQ 40"""
    all_users = user_ids['test'] + user_ids['regular']
    for article_type, titles in COMMUNITY_TITLES.items():
        for title in titles:
            cursor.execute("""
                           INSERT INTO article (title, content, article_type, user_id, is_secret, created_at,
                                                updated_at)
                           VALUES (%s, %s, %s, %s, %s, %s, %s)
                           """, (title, random.choice(PRODUCT_CONTENTS), article_type,
                                 random.choice(all_users), article_type == 'FAQ',
                                 random_datetime(30, 1), random_datetime(30, 1)))
    logging.info(f"✅ 커뮤니티 생성 완료 (자유 {NUM_COMMUNITY} + 공지 {NUM_NOTICE} + FAQ {NUM_FAQ})")


def create_comment(cursor):
    """댓글 20-30개 생성"""
    cursor.execute("SELECT article_id, user_id FROM article")
    articles = cursor.fetchall()
    cursor.execute("SELECT user_id FROM users")
    all_user_ids = [row[0] for row in cursor.fetchall()]

    for article_id, article_author_id in articles:
        for _ in range(random.randint(NUM_COMMENT_MIN, NUM_COMMENT_MAX)):
            cursor.execute("""
                           INSERT INTO comment (content, article_id, user_id, created_at, updated_at)
                           VALUES (%s, %s, %s, %s, %s)
                           """, (random.choice(COMMENT_CONTENTS), article_id,
                                 random.choice([u for u in all_user_ids if u != article_author_id]),
                                 random_datetime(14, 1), random_datetime(14, 1)))
    logging.info(f"✅ 댓글 데이터 생성 완료")


def create_public_chat(cursor, user_ids: Dict[str, List[int]]):
    """공개채팅 200개 생성"""
    all_users = user_ids['test'] + user_ids['regular']
    for _ in range(NUM_PUBLIC_CHAT):
        cursor.execute("""
                       INSERT INTO public_chat (content, user_id, is_deleted, created_at)
                       VALUES (%s, %s, %s, %s)
                       """, (random.choice(PUBLIC_CHAT_MESSAGES), random.choice(all_users),
                             False, random_datetime(7, 0)))
    logging.info(f"✅ 공개채팅 {NUM_PUBLIC_CHAT}개 생성 완료")


def create_chat_rooms(cursor, product_ids: Dict[str, List[int]], user_ids: Dict[str, List[int]]):
    """일대일채팅 50개 생성 (중고 상품 기반)"""
    all_users = user_ids['test'] + user_ids['regular']
    used_products = product_ids['USED']

    chat_room_count = 0
    private_chat_count = 0
    target_count = 50  # 목표: 정확히 50개

    # 최대 시도 횟수 (무한루프 방지)
    max_attempts = 200
    attempts = 0

    while chat_room_count < target_count and attempts < max_attempts:
        attempts += 1

        # 무작위로 중고 상품 선택
        product_id = random.choice(used_products)

        cursor.execute("SELECT seller_id FROM product WHERE product_id = %s", (product_id,))
        result = cursor.fetchone()
        if not result:
            continue

        seller_id = result[0]

        # 구매자 선택 (판매자 제외)
        available_buyers = [u for u in all_users if u != seller_id]
        if not available_buyers:
            continue

        buyer_id = random.choice(available_buyers)

        try:
            # ChatRoom 생성
            room_created_at = random_datetime(14, 1)
            cursor.execute("""
                           INSERT INTO chat_room (seller_id, sender_id, product_id, created_at)
                           VALUES (%s, %s, %s, %s)
                           """, (seller_id, buyer_id, product_id, room_created_at))

            chat_room_id = cursor.lastrowid
            chat_room_count += 1

            # PrivateChat 메시지 3-8개 생성
            num_messages = random.randint(3, 8)

            for msg_idx in range(num_messages):
                # 메시지 시간: 채팅방 생성 이후
                msg_created_at = room_created_at + timedelta(
                    hours=random.randint(0, 72),
                    minutes=random.randint(0, 59)
                )

                # 홀수 메시지: 구매자, 짝수 메시지: 판매자 (70% 확률)
                if msg_idx % 2 == 0:
                    # 구매자 메시지
                    sender_id = buyer_id
                    content = random.choice(PRIVATE_CHAT_BUYER)
                else:
                    # 판매자 응답 (70% 확률)
                    if random.random() < 0.7:
                        sender_id = seller_id
                        content = random.choice(PRIVATE_CHAT_SELLER)
                    else:
                        continue  # 응답 없음 (30%)

                # is_deleted는 모두 false (기본값)
                is_deleted = False

                try:
                    cursor.execute("""
                                   INSERT INTO private_chat (content, user_id, chat_room_id, is_deleted, created_at)
                                   VALUES (%s, %s, %s, %s, %s)
                                   """, (content, sender_id, chat_room_id, is_deleted, msg_created_at))

                    private_chat_count += 1

                except Exception as e:
                    logging.warning(f"PrivateChat 생성 실패 (chat_room_id={chat_room_id}): {e}")
                    continue

            # 진행상황 로그
            if chat_room_count % 10 == 0:
                logging.info(f"   ChatRoom 진행: {chat_room_count}/{target_count}")

        except mysql.connector.IntegrityError as e:
            # UNIQUE 제약조건 위반 (seller_id, sender_id, product_id 중복)
            logging.debug(f"UNIQUE 제약조건 위반 - 다음 시도")
            continue
        except Exception as e:
            logging.warning(f"ChatRoom 생성 실패: {e}")
            continue

    # 최종 결과 로그
    if chat_room_count < target_count:
        logging.warning(f"⚠️ 목표 {target_count}개 중 {chat_room_count}개만 생성됨 (시도: {attempts}회)")
    else:
        logging.info(f"✅ 일대일채팅 생성 완료")

    logging.info(f"   - ChatRoom: {chat_room_count}개")
    logging.info(f"   - PrivateChat: {private_chat_count}개")
    if chat_room_count > 0:
        logging.info(f"   - 평균 메시지: {private_chat_count / chat_room_count:.1f}개/채팅방")


def create_search_log(cursor):
    """인기 검색어 30개, 각 100-250회"""
    for keyword in POPULAR_KEYWORDS:
        for _ in range(random.randint(100, 250)):
            cursor.execute("INSERT INTO search_log (keyword, searched_at) VALUES (%s, %s)",
                           (keyword, random_datetime(30, 0)))
    logging.info(f"✅ 인기 검색어 {NUM_SEARCH_KEYWORDS}개 생성 완료 (각 100-250회)")


def create_bookmarks(cursor, product_ids: Dict[str, List[int]], user_ids: Dict[str, List[int]]):
    """북마크 (유저당 10-30개)"""
    all_users = user_ids['test'] + user_ids['regular']
    all_products = []
    for pids in product_ids.values():
        all_products.extend(pids)

    for user_id in all_users:
        for pid in random.sample(all_products, min(random.randint(10, 30), len(all_products))):
            try:
                cursor.execute("""
                               INSERT INTO bookmark (user_id, product_id, created_at, updated_at)
                               VALUES (%s, %s, %s, %s)
                               """, (user_id, pid, random_datetime(7, 0), random_datetime(7, 0)))
            except:
                pass
    logging.info(f"✅ 북마크 데이터 생성 완료")


def create_reviews(cursor, product_ids: Dict[str, List[int]]):
    """리뷰 (상품 80%)"""
    contents = ["정말 좋아요!", "배송 빨라요", "상태 좋아요", "만족합니다", "추천해요"]
    all_products = []
    for pids in product_ids.values():
        all_products.extend(pids)

    for pid in random.sample(all_products, int(len(all_products) * 0.8)):
        cursor.execute("SELECT product_type FROM product WHERE product_id = %s", (pid,))
        result = cursor.fetchone()
        cursor.execute("""
                       INSERT INTO review (ref_id, content, rating, product_type, created_at, updated_at)
                       VALUES (%s, %s, %s, %s, %s, %s)
                       """, (pid, random.choice(contents), random.randint(3, 5),
                             result[0] if result else 'USED', random_datetime(14, 0), random_datetime(14, 0)))
    logging.info(f"✅ 리뷰 데이터 생성 완료")


def create_payments(cursor, product_ids: Dict[str, List[int]], user_ids: Dict[str, List[int]]):
    """결제 데이터 생성 (낙찰완료 100%, 스토어판매완료 100%, 중고 30%)"""
    all_users = user_ids['test'] + user_ids['regular']
    payment_count = 0

    # PaymentMethodType ENUM 값들
    payment_methods = ['CARD', 'TRANSFER', 'KAKAOPAY', 'NAVERPAY', 'TOSSPAY', 'PAYCO']

    # CourierType ENUM 값들 (nullable이므로 70% 확률로 추가)
    courier_types = ['CJ', 'LOTTE', 'HANJIN', 'POST', 'CU', 'GS']

    # 1. 경매 낙찰완료 상품 -> 결제 100% (PaymentStatus: PAID or CONFIRMED)
    logging.info("경매 낙찰완료 결제 생성 중...")
    for product_id in product_ids['AUCTION_SOLD']:
        cursor.execute("""
                       SELECT b.user_id, b.bid_price, p.seller_id
                       FROM bid b
                                JOIN product p ON b.product_id = p.product_id
                       WHERE b.product_id = %s
                         AND b.is_winning = TRUE LIMIT 1
                       """, (product_id,))

        result = cursor.fetchone()
        if not result:
            continue

        buyer_id, final_price, seller_id = result
        payment_method = random.choice(payment_methods)

        # 80% CONFIRMED, 20% PAID
        payment_status = 'CONFIRMED' if random.random() < 0.8 else 'PAID'

        # 70% 확률로 택배사 + 운송장
        courier_name = random.choice(courier_types) if random.random() < 0.7 else None
        tracking_number = f"{random.randint(100000000000, 999999999999)}" if courier_name else None

        created = random_datetime(30, 8)

        try:
            cursor.execute("""
                           INSERT INTO payment (user_id, product_id, total_price, payment_method_type,
                                                payment_status, product_type, courier_name, tracking_number,
                                                created_at, updated_at)
                           VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                           """, (buyer_id, product_id, final_price, payment_method,
                                 payment_status, 'AUCTION', courier_name, tracking_number, created, created))
            payment_count += 1
        except Exception as e:
            logging.warning(f"경매 결제 생성 실패 (product_id={product_id}): {e}")

    # 2. 스토어 판매완료 상품 -> 결제 100%
    logging.info("스토어 판매완료 결제 생성 중...")
    for product_id in product_ids['STORE_SOLD']:
        cursor.execute("""
                       SELECT sale_price, seller_id
                       FROM product
                       WHERE product_id = %s
                       """, (product_id,))

        result = cursor.fetchone()
        if not result:
            continue

        sale_price, seller_id = result
        buyer_id = random.choice([u for u in all_users if u != seller_id])
        payment_method = random.choice(payment_methods)

        # 70% CONFIRMED, 30% PAID
        payment_status = 'CONFIRMED' if random.random() < 0.7 else 'PAID'

        # 80% 확률로 택배사 + 운송장
        courier_name = random.choice(courier_types) if random.random() < 0.8 else None
        tracking_number = f"{random.randint(100000000000, 999999999999)}" if courier_name else None

        created = random_datetime(60, 8)

        try:
            cursor.execute("""
                           INSERT INTO payment (user_id, product_id, total_price, payment_method_type,
                                                payment_status, product_type, courier_name, tracking_number,
                                                created_at, updated_at)
                           VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                           """, (buyer_id, product_id, sale_price, payment_method,
                                 payment_status, 'STORE', courier_name, tracking_number, created, created))
            payment_count += 1
        except Exception as e:
            logging.warning(f"스토어 결제 생성 실패 (product_id={product_id}): {e}")

    # 3. 중고 상품 -> 결제 30% (나머지는 직거래)
    logging.info("중고 상품 결제 생성 중...")
    used_with_payment = random.sample(product_ids['USED'],
                                      min(int(len(product_ids['USED']) * 0.3), len(product_ids['USED'])))

    for product_id in used_with_payment:
        cursor.execute("""
                       SELECT original_price, seller_id
                       FROM product
                       WHERE product_id = %s
                       """, (product_id,))

        result = cursor.fetchone()
        if not result:
            continue

        price, seller_id = result
        buyer_id = random.choice([u for u in all_users if u != seller_id])
        payment_method = random.choice(payment_methods)

        # 60% CONFIRMED, 30% PAID, 10% PENDING
        rand = random.random()
        if rand < 0.6:
            payment_status = 'CONFIRMED'
        elif rand < 0.9:
            payment_status = 'PAID'
        else:
            payment_status = 'PENDING'

        # 중고는 택배 비율 낮음 (30%)
        courier_name = random.choice(courier_types) if random.random() < 0.3 else None
        tracking_number = f"{random.randint(100000000000, 999999999999)}" if courier_name else None

        created = random_datetime(30, 1)

        try:
            cursor.execute("""
                           INSERT INTO payment (user_id, product_id, total_price, payment_method_type,
                                                payment_status, product_type, courier_name, tracking_number,
                                                created_at, updated_at)
                           VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                           """, (buyer_id, product_id, price, payment_method,
                                 payment_status, 'USED', courier_name, tracking_number, created, created))
            payment_count += 1
        except Exception as e:
            logging.warning(f"중고 결제 생성 실패 (product_id={product_id}): {e}")

    logging.info(f"✅ 결제 {payment_count}개 생성 완료")
    logging.info(f"   - 경매 낙찰완료: {len(product_ids['AUCTION_SOLD'])}개")
    logging.info(f"   - 스토어 판매완료: {len(product_ids['STORE_SOLD'])}개")
    logging.info(f"   - 중고 상품: {len(used_with_payment)}개")


def create_notifications(cursor, user_ids: Dict[str, List[int]]):
    """알림 50개 생성

    Notification 테이블 구조:
    - notificationId (PK, Long, AUTO_INCREMENT)
    - content (String, NOT NULL)
    - isRead (boolean, NOT NULL) - false=안읽음, true=읽음
    - createdAt (LocalDateTime, NOT NULL)
    - notificationStatus (ENUM, NOT NULL) - NEW_COMMENT, BID_WIN, SYSTEM, NOTICE, MESSAGE, FOLLOW, WARN
    - user_id (FK to Users, NOT NULL)
    """
    all_users = user_ids['test'] + user_ids['regular']

    # NotificationStatus ENUM 값들 (정확히)
    notification_statuses = ['NEW_COMMENT', 'BID_WIN', 'SYSTEM', 'NOTICE', 'MESSAGE', 'FOLLOW', 'WARN']

    # 알림 타입별 내용
    notification_contents = {
        'NEW_COMMENT': [
            "게시글에 새로운 댓글이 작성되었습니다.",
            "회원님의 댓글에 답글이 달렸습니다.",
            "관심 상품에 새로운 문의가 등록되었습니다.",
            "상품 문의에 답변이 등록되었습니다.",
            "커뮤니티 게시글에 댓글이 달렸습니다."
        ],
        'BID_WIN': [
            "축하합니다! 경매에서 낙찰되었습니다.",
            "입찰하신 상품의 낙찰자로 선정되셨습니다.",
            "경매가 종료되었습니다. 낙찰을 축하드립니다!",
            "회원님이 최고가 입찰자입니다.",
            "경매 낙찰 완료 - 결제를 진행해주세요."
        ],
        'SYSTEM': [
            "시스템 점검이 예정되어 있습니다.",
            "서비스 업데이트가 완료되었습니다.",
            "임시 점검이 진행될 예정입니다.",
            "시스템 정기 점검 안내",
            "서비스 개선 작업이 완료되었습니다."
        ],
        'NOTICE': [
            "새로운 공지사항이 등록되었습니다.",
            "중요 공지사항을 확인해주세요.",
            "이벤트 당첨자 발표 공지가 올라왔습니다.",
            "서비스 이용약관이 개정되었습니다.",
            "신규 기능 추가 안내"
        ],
        'MESSAGE': [
            "새로운 메시지가 도착했습니다.",
            "판매자가 답변을 보냈습니다.",
            "구매자로부터 문의가 왔습니다.",
            "채팅방에 새 메시지가 있습니다.",
            "거래 관련 메시지가 도착했습니다."
        ],
        'FOLLOW': [
            "새로운 팔로워가 생겼습니다.",
            "회원님을 팔로우하기 시작했습니다.",
            "관심 판매자가 새로운 상품을 등록했습니다.",
            "팔로우하는 판매자의 신규 상품",
            "관심 셀러의 할인 이벤트 시작"
        ],
        'WARN': [
            "계정 활동에 대한 경고입니다.",
            "이용 약관 위반으로 경고 조치되었습니다.",
            "부적절한 행위가 감지되었습니다.",
            "신고 접수로 인한 경고",
            "계정 제재 안내 - 관리자 확인 필요"
        ]
    }

    notification_count = 0

    logging.info("알림 50개 생성 중...")
    for i in range(50):
        user_id = random.choice(all_users)
        notification_status = random.choice(notification_statuses)
        content = random.choice(notification_contents[notification_status])

        # 60% 읽음(true), 40% 안읽음(false)
        is_read = random.random() < 0.6

        created = random_datetime(30, 0)

        try:
            cursor.execute("""
                           INSERT INTO notification (content, is_read, notification_status, user_id, created_at)
                           VALUES (%s, %s, %s, %s, %s)
                           """, (content, is_read, notification_status, user_id, created))
            notification_count += 1

            if (i + 1) % 10 == 0:
                logging.info(f"   진행: {i + 1}/50")

        except Exception as e:
            logging.warning(f"알림 생성 실패 (user_id={user_id}): {e}")

    logging.info(f"✅ 알림 {notification_count}개 생성 완료")


def create_reports(cursor, user_ids: Dict[str, List[int]], product_ids: Dict[str, List[int]]):
    """신고 50개 생성

    Report 테이블 구조:
    - reportId (PK, Long, AUTO_INCREMENT)
    - refId (Long, NOT NULL) - 신고 대상 ID
    - reason (String, NOT NULL) - 신고 사유
    - status (boolean, NOT NULL) - false=대기중, true=처리완료
    - createdAt (LocalDateTime, NOT NULL)
    - updatedAt (LocalDateTime, nullable) - 처리완료 시 업데이트
    - reportType (ENUM, NOT NULL) - PRODUCT, ARTICLE, PUBLIC_CHAT, COMMENT
    - user_id (FK to Users) - 신고자
    """
    all_users = user_ids['test'] + user_ids['regular']
    all_products = []
    for pids in product_ids.values():
        all_products.extend(pids)

    # ReportType ENUM 값들 (정확히)
    report_types = ['PRODUCT', 'ARTICLE', 'PUBLIC_CHAT', 'COMMENT']

    # 신고 사유 리스트 (현실적인 내용)
    report_reasons = [
        "사기 의심 상품입니다",
        "부적절한 내용이 포함되어 있습니다",
        "욕설 및 비방이 있습니다",
        "스팸성 게시물입니다",
        "불법 상품을 판매하고 있습니다",
        "개인정보 노출 위험이 있습니다",
        "저작권 침해 의심",
        "허위 정보가 포함되어 있습니다",
        "음란물이 포함되어 있습니다",
        "가격 담합 의심",
        "중복 게시물입니다",
        "상품 상태 허위 기재",
        "배송 사기 의심",
        "비매너 거래 행위",
        "도배 및 광고성 게시물",
        "타인 사칭",
        "거래 중 폭언",
        "환불 거부",
        "상습적 거래 취소",
        "기타 부적절한 행위"
    ]

    report_count = 0

    logging.info("신고 50개 생성 중...")
    for i in range(50):
        report_type = random.choice(report_types)
        reporter_id = random.choice(all_users)
        reason = random.choice(report_reasons)

        # 신고 대상 ref_id 결정 (실제 존재하는 ID 범위 내에서)
        if report_type == 'PRODUCT':
            # 상품 150개 생성됨
            ref_id = random.choice(all_products)
        elif report_type == 'ARTICLE':
            # article은 총 120개 생성됨 (COMMUNITY 50 + NOTICE 30 + FAQ 40)
            ref_id = random.randint(1, 120)
        elif report_type == 'PUBLIC_CHAT':
            # public_chat은 200개 생성됨
            ref_id = random.randint(1, 200)
        else:  # COMMENT
            # comment는 게시글당 20-30개이므로 약 2400-3600개
            ref_id = random.randint(1, 3000)

        # 70% 처리완료(true), 30% 대기중(false)
        status = random.random() < 0.7

        created = random_datetime(30, 0)
        # status가 true면 처리시간 추가, false면 createdAt과 동일
        updated = created + timedelta(hours=random.randint(1, 72)) if status else created

        try:
            cursor.execute("""
                           INSERT INTO report (ref_id, reason, status, report_type, user_id, created_at, updated_at)
                           VALUES (%s, %s, %s, %s, %s, %s, %s)
                           """, (ref_id, reason, status, report_type, reporter_id, created, updated))
            report_count += 1

            if (i + 1) % 10 == 0:
                logging.info(f"   진행: {i + 1}/50")

        except Exception as e:
            logging.warning(f"신고 생성 실패 (report_type={report_type}, ref_id={ref_id}): {e}")

    logging.info(f"✅ 신고 {report_count}개 생성 완료")
    logging.info(f"   - 처리완료: 약 {int(report_count * 0.7)}개")
    logging.info(f"   - 대기중: 약 {int(report_count * 0.3)}개")


# ============================================
# 🚀 메인 함수
# ============================================

def main():
    print("=" * 80)
    print("🚀 DDauction 더미데이터 생성 시작 (최종 완성 버전)")
    print("=" * 80)

    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()
        logging.info("✅ DB 연결 성공")

        try:
            s3_uploader = S3Uploader()
            logging.info("✅ S3 연결 성공" if s3_uploader.s3_client else "⚠️ S3 설정 없음 (원본 URL 사용)")
        except Exception as e:
            logging.warning(f"⚠️ S3 연결 실패: {e}")
            s3_uploader = None

        print("\n🧹 Step 0: 기존 데이터 초기화 (관리자 계정 제외)")
        cursor.execute("SET SQL_SAFE_UPDATES = 0")
        cursor.execute("SET FOREIGN_KEY_CHECKS = 0")

        # 모든 테이블 데이터 삭제 (의존성 순서대로)
        tables_to_clear = [
            'payment', 'notification', 'report', 'point', 'product_view_log', 'product_banners',
            'review', 'bookmark', 'bid', 'qna_review', 'product_qna',
            'private_chat', 'chat_room', 'public_chat', 'image', 'product',
            'comment', 'article', 'search_log', 'email_verification', 'phone_verification'
        ]

        for table in tables_to_clear:
            try:
                cursor.execute(f"DELETE FROM {table}")
                logging.info(f"   - {table} 테이블 비움")
            except mysql.connector.Error as e:
                logging.warning(f"   ⚠️ {table} 테이블 삭제 실패: {e}")

        # address 테이블 처리 (user_id 컬럼 존재 여부 확인)
        try:
            cursor.execute("DELETE FROM address WHERE user_id != 1")
            logging.info("   - address 테이블 정리 완료 (관리자 주소 보존)")
        except mysql.connector.Error as e:
            if e.errno == 1054:  # Unknown column 'user_id'
                try:
                    cursor.execute("DELETE FROM address")
                    logging.info("   - address 테이블 전체 삭제 (user_id 컬럼 없음)")
                except:
                    logging.warning("   ⚠️ address 테이블 처리 실패")
            else:
                logging.warning(f"   ⚠️ address 테이블 처리 실패: {e}")

        cursor.execute("DELETE FROM users WHERE user_id != 1")  # 관리자만 보존
        logging.info("   - 관리자 계정(user_id=1) 보존 완료")

        # AUTO_INCREMENT 리셋
        cursor.execute("ALTER TABLE users AUTO_INCREMENT = 1")
        cursor.execute("ALTER TABLE product AUTO_INCREMENT = 1")
        logging.info("   - AUTO_INCREMENT 리셋 완료")

        cursor.execute("SET FOREIGN_KEY_CHECKS = 1")
        cursor.execute("SET SQL_SAFE_UPDATES = 1")
        conn.commit()

        # 관리자 계정 확인
        cursor.execute("SELECT user_id, email, role FROM users WHERE user_id = 1")
        admin = cursor.fetchone()
        if admin:
            logging.info(f"   - 관리자 계정 확인: user_id={admin[0]}, email={admin[1]}, role={admin[2]}")
        else:
            logging.warning("   ⚠️ 관리자 계정(user_id=1)이 존재하지 않습니다!")

        print("\n📌 Step 1: 유저 생성")
        user_ids = create_users(cursor)
        conn.commit()

        print("\n📌 Step 2: 상품 + 이미지 생성")
        product_ids = create_products_with_s3(cursor, user_ids, s3_uploader)
        conn.commit()

        print("\n📌 Step 3: 입찰 생성")
        create_bids(cursor, product_ids, user_ids)
        conn.commit()

        print("\n📌 Step 4: QNA 생성")
        create_qna(cursor, product_ids, user_ids)
        conn.commit()

        print("\n📌 Step 5: 커뮤니티 생성")
        create_article(cursor, user_ids)
        conn.commit()

        print("\n📌 Step 6: 댓글 생성")
        create_comment(cursor)
        conn.commit()

        print("\n📌 Step 7: 공개채팅 생성")
        create_public_chat(cursor, user_ids)
        conn.commit()

        print("\n📌 Step 8: 일대일채팅 생성")
        create_chat_rooms(cursor, product_ids, user_ids)
        conn.commit()

        print("\n📌 Step 9: 인기 검색어 생성")
        create_search_log(cursor)
        conn.commit()

        print("\n📌 Step 10: 북마크 생성")
        create_bookmarks(cursor, product_ids, user_ids)
        conn.commit()

        print("\n📌 Step 11: 리뷰 생성")
        create_reviews(cursor, product_ids)
        conn.commit()

        print("\n📌 Step 12: 결제 데이터 생성")
        create_payments(cursor, product_ids, user_ids)
        conn.commit()

        print("\n📌 Step 13: 알림 데이터 생성")
        create_notifications(cursor, user_ids)
        conn.commit()

        print("\n📌 Step 14: 신고 데이터 생성")
        create_reports(cursor, user_ids, product_ids)
        conn.commit()


        print("\n" + "=" * 80)
        print("🎉 더미데이터 생성 완료!")
        print("=" * 80)
        print(f"\n📊 생성된 데이터:")
        print(f"   유저: {len(user_ids['test']) + len(user_ids['regular'])}명 (테스트 3 + 일반 17)")
        print(f"\n   경매 상품: 60개")
        print(f"     - 입찰중: {len(product_ids['AUCTION_BIDDING'])}개")
        print(f"     - 입찰완료: {len(product_ids['AUCTION_CLOSED'])}개")
        print(f"     - 낙찰완료: {len(product_ids['AUCTION_SOLD'])}개")
        print(f"\n   스토어 상품: 60개")
        print(f"     - 판매중: {len(product_ids['STORE_ACTIVE'])}개")
        print(f"     - 판매완료: {len(product_ids['STORE_SOLD'])}개")
        print(f"\n   중고 상품: {len(product_ids['USED'])}개")
        print(f"\n   기타:")
        print(f"     - 이미지: 상품당 2-5개 (20% 단색배경, 각 색별 15개)")
        print(f"     - 입찰: 입찰중 5-15개, 완료 10-20개, 낙찰 15-25개")
        print(f"     - QNA: {NUM_QNA}개 (답글 70%, 비밀글 30%)")
        print(f"     - 커뮤니티: 자유 {NUM_COMMUNITY} + 공지 {NUM_NOTICE} + FAQ {NUM_FAQ} = {NUM_COMMUNITY+NUM_NOTICE+NUM_FAQ}개")
        print(f"     - 댓글: 게시글당 {NUM_COMMENT_MIN}-{NUM_COMMENT_MAX}개")
        print(f"     - 공개채팅: {NUM_PUBLIC_CHAT}개")
        print(f"     - 일대일채팅: 중고 100%")
        print(f"     - 검색어: {NUM_SEARCH_KEYWORDS}개, 각 100-250회")
        print(f"     - 북마크: 유저당 10-30개")
        print(f"     - 리뷰: 상품 80%")
        print(f"     - 결제: 약 55개 (경매 20 + 스토어 20 + 중고 15)")
        print(f"     - 알림: 50개 (읽음 60%, 안읽음 40%)")
        print(f"     - 신고: 50개 (처리완료 70%, 대기중 30%)")
        print(f"\n✅ 테스트 계정:")
        print(f"   - seller@test.com / Test1234!")
        print(f"   - business@test.com / Test1234!")
        print(f"   - buyer@test.com / Test1234!")
        print("=" * 80)

    except mysql.connector.Error as err:
        logging.error(f"❌ DB 에러: {err}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()


if __name__ == "__main__":
    main()