import os
import requests
from typing import List, Dict, Optional, Tuple
from datetime import datetime, timedelta
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import StandardScaler
from collections import defaultdict, Counter
import openai
from dotenv import load_dotenv

load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")


class RecommendationEngine:
    """
    하이브리드 추천 엔진
    - 콘텐츠 기반 필터링
    - 협업 필터링
    - 인기도 기반
    - 최신성 기반
    """

    def __init__(self, spring_api_base: str):
        self.spring_api_base = spring_api_base
        self.scaler = StandardScaler()

        # 가중치 설정 (조정 가능)
        self.weights = {
            "content_based": 0.4,
            "collaborative": 0.3,
            "popularity": 0.2,
            "recency": 0.1
        }

        # 활동 타입별 가중치
        self.activity_weights = {
            "PURCHASE": 5.0,
            "BID": 3.0,
            "BOOKMARK": 2.0,
            "VIEW": 1.0
        }

    def _safe_request(self, url: str, timeout: int = 5) -> Optional[Dict]:
        """안전한 HTTP 요청"""
        try:
            response = requests.get(url, timeout=timeout)
            if response.ok:
                return response.json()
            return None
        except Exception as e:
            print(f"⚠️ 요청 실패 ({url}): {e}")
            return None

    def _fetch_user_interactions(self, user_id: int) -> Dict[str, List[Dict]]:
        """사용자 활동 데이터 가져오기"""
        data = self._safe_request(
            f"{self.spring_api_base}/api/recommendations/user/{user_id}/interactions"
        )
        return data or {"views": [], "bids": [], "purchases": [], "bookmarks": []}

    def _fetch_all_products(self) -> List[Dict]:
        """전체 상품 목록 가져오기"""
        data = self._safe_request(f"{self.spring_api_base}/api/products")
        return data or []

    def _fetch_similar_users_products(self, user_id: int) -> List[Dict]:
        """유사 사용자가 선호하는 상품"""
        data = self._safe_request(
            f"{self.spring_api_base}/api/recommendations/similar-users/{user_id}/products"
        )
        return data or []

    def _calculate_user_preferences(self, interactions: Dict) -> Dict[str, float]:
        """사용자 선호도 벡터 계산"""
        preferences = defaultdict(float)

        for activity_type, weight in self.activity_weights.items():
            key = activity_type.lower() + "s"  # "purchases", "bids", etc.
            for item in interactions.get(key, []):
                # 카테고리 선호도
                category = item.get("category", "기타")
                preferences[f"cat_{category}"] += weight

                # 가격대 선호도
                price = item.get("price", 0)
                if price < 50000:
                    preferences["price_low"] += weight
                elif price < 200000:
                    preferences["price_mid"] += weight
                else:
                    preferences["price_high"] += weight

        # 정규화
        total = sum(preferences.values()) or 1.0
        return {k: v / total for k, v in preferences.items()}

    def _content_based_score(
            self,
            product: Dict,
            user_prefs: Dict[str, float]
    ) -> float:
        """콘텐츠 기반 추천 점수"""
        score = 0.0

        # 카테고리 매칭
        category = product.get("productCategoryType", "기타")
        score += user_prefs.get(f"cat_{category}", 0) * 3.0

        # 가격대 매칭
        price = product.get("currentPrice") or product.get("startingPrice", 0)
        if price < 50000:
            score += user_prefs.get("price_low", 0)
        elif price < 200000:
            score += user_prefs.get("price_mid", 0)
        else:
            score += user_prefs.get("price_high", 0)

        return score

    def _collaborative_score(
            self,
            product_id: int,
            similar_products: List[Dict]
    ) -> float:
        """협업 필터링 점수"""
        for item in similar_products:
            if item.get("productId") == product_id:
                return item.get("score", 0.0)
        return 0.0

    def _popularity_score(self, product: Dict) -> float:
        """인기도 점수 (로그 스케일)"""
        view_count = product.get("viewCount", 0)
        bid_count = product.get("bidCount", 0)
        bookmark_count = product.get("bookmarkCount", 0)

        # 로그 변환으로 극단값 완화
        score = (
                np.log1p(view_count) * 0.3 +
                np.log1p(bid_count) * 0.5 +
                np.log1p(bookmark_count) * 0.2
        )
        return score

    def _recency_score(self, product: Dict) -> float:
        """최신성 점수"""
        created_at = product.get("createdAt")
        if not created_at:
            return 0.0

        try:
            created_date = datetime.fromisoformat(
                created_at.replace('Z', '+00:00')
            )
            days_old = (datetime.now() - created_date).days

            # 최근 7일 이내: 1.0, 30일: 0.5, 그 이상: 점차 감소
            if days_old <= 7:
                return 1.0
            elif days_old <= 30:
                return 1.0 - (days_old - 7) / 46.0  # 30일까지 선형 감소
            else:
                return max(0.0, 0.5 - (days_old - 30) / 60.0)
        except:
            return 0.0

    def _is_product_available(self, product: Dict) -> bool:
        """상품 판매 가능 여부 확인"""
        status = product.get("productStatus", "")
        if status not in ["ACTIVE", "PAUSED"]:
            return False

        # 경매 종료 확인
        end_time_str = product.get("auctionEndTime")
        if end_time_str:
            try:
                end_time = datetime.fromisoformat(
                    end_time_str.replace('Z', '+00:00')
                )
                if datetime.now() >= end_time:
                    return False
            except:
                pass

        return True

    def get_recommendations(
            self,
            user_id: int,
            limit: int = 10,
            exclude_viewed: bool = True
    ) -> List[Dict]:
        """
        개인화 추천 생성

        Args:
            user_id: 사용자 ID
            limit: 반환할 상품 수
            exclude_viewed: 이미 본 상품 제외 여부

        Returns:
            추천 상품 리스트 (점수 포함)
        """
        print(f"🎯 추천 시작: user_id={user_id}, limit={limit}")

        # 1. 데이터 수집
        interactions = self._fetch_user_interactions(user_id)
        all_products = self._fetch_all_products()
        similar_products = self._fetch_similar_users_products(user_id)
        user_prefs = self._calculate_user_preferences(interactions)

        print(f"📊 데이터: 상품 {len(all_products)}개, 선호도 {len(user_prefs)}개")

        # 2. 이미 본 상품 ID 수집
        viewed_ids = set()
        if exclude_viewed:
            for view in interactions.get("views", []):
                viewed_ids.add(view.get("productId"))

        # 3. 각 상품 점수 계산
        scored_products = []
        for product in all_products:
            product_id = product.get("productId")

            # 제외 조건
            if product_id in viewed_ids:
                continue
            if not self._is_product_available(product):
                continue

            # 점수 계산
            content_score = self._content_based_score(product, user_prefs)
            collab_score = self._collaborative_score(product_id, similar_products)
            popularity = self._popularity_score(product)
            recency = self._recency_score(product)

            # 가중 평균
            final_score = (
                    content_score * self.weights["content_based"] +
                    collab_score * self.weights["collaborative"] +
                    popularity * self.weights["popularity"] +
                    recency * self.weights["recency"]
            )

            scored_products.append({
                **product,
                "recommendation_score": final_score,
                "score_breakdown": {
                    "content": round(content_score, 3),
                    "collaborative": round(collab_score, 3),
                    "popularity": round(popularity, 3),
                    "recency": round(recency, 3)
                }
            })

        # 4. 정렬 및 반환
        scored_products.sort(key=lambda x: x["recommendation_score"], reverse=True)
        result = scored_products[:limit]

        print(f"✅ 추천 완료: {len(result)}개 상품")
        return result

    def get_similar_products(
            self,
            product_id: int,
            limit: int = 6
    ) -> List[Dict]:
        """특정 상품과 유사한 상품 추천"""
        print(f"🔍 유사 상품 검색: product_id={product_id}")

        # 대상 상품 정보 가져오기
        target = self._safe_request(
            f"{self.spring_api_base}/api/products/{product_id}"
        )
        if not target:
            return []

        all_products = self._fetch_all_products()
        category = target.get("productCategoryType")
        target_price = target.get("currentPrice") or target.get("startingPrice", 0)

        # 같은 카테고리 상품 필터링
        similar = []
        for product in all_products:
            if product.get("productId") == product_id:
                continue
            if not self._is_product_available(product):
                continue
            if product.get("productCategoryType") != category:
                continue

            similar.append(product)

        # 가격 차이 기준 정렬
        similar.sort(
            key=lambda x: abs(
                (x.get("currentPrice") or x.get("startingPrice", 0)) - target_price
            )
        )

        print(f"✅ 유사 상품: {len(similar[:limit])}개 발견")
        return similar[:limit]


# 싱글톤 인스턴스
SPRING_API_BASE = os.getenv("SPRING_API_BASE", "http://localhost:8080")
recommendation_engine = RecommendationEngine(SPRING_API_BASE)