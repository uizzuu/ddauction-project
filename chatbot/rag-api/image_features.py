import os
import io
import base64
import requests
from typing import List, Dict, Optional
from PIL import Image, ImageStat, ImageFilter
import numpy as np
from collections import Counter
from dotenv import load_dotenv

load_dotenv()


class LightweightImageAnalyzer:
    """
    메모리를 적게 쓰는 이미지 분석 기능
    - 색상 기반 유사 상품 추천
    - 이미지 품질 체크
    - 자동 이미지 최적화
    """

    def __init__(self, spring_api_base: str):
        self.spring_api_base = spring_api_base

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

    def _fetch_all_products(self) -> List[Dict]:
        """전체 상품 목록 가져오기"""
        data = self._safe_request(f"{self.spring_api_base}/api/products")
        return data or []

    def _decode_base64_image(self, base64_str: str) -> Optional[Image.Image]:
        """Base64 문자열을 PIL Image로 변환"""
        try:
            if "," in base64_str:
                base64_str = base64_str.split(",")[1]

            image_bytes = base64.b64decode(base64_str)
            image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            return image
        except Exception as e:
            print(f"❌ 이미지 디코딩 실패: {e}")
            return None

    def _load_image_from_url(self, image_url: str) -> Optional[Image.Image]:
        """URL에서 이미지 로드"""
        try:
            response = requests.get(image_url, timeout=5)
            if response.ok:
                image = Image.open(io.BytesIO(response.content)).convert("RGB")
                return image
            return None
        except Exception as e:
            print(f"⚠️ 이미지 로드 실패 ({image_url}): {e}")
            return None

    # ==================== 🎨 색상 기반 유사도 ====================

    def extract_dominant_colors(self, image: Image.Image, n_colors: int = 5) -> List[tuple]:
        """이미지의 주요 색상 추출"""
        # 이미지 크기 줄이기 (속도 향상)
        img_small = image.resize((150, 150))
        pixels = list(img_small.getdata())

        # 색상 빈도 계산
        color_counts = Counter(pixels)
        dominant = color_counts.most_common(n_colors)

        return [color for color, count in dominant]

    def calculate_color_similarity(self, colors1: List[tuple], colors2: List[tuple]) -> float:
        """두 색상 팔레트 간 유사도 계산 (0~1)"""
        if not colors1 or not colors2:
            return 0.0

        total_distance = 0
        for c1 in colors1[:3]:  # 상위 3개 색상만 비교
            min_distance = min(
                np.sqrt(sum((a - b) ** 2 for a, b in zip(c1, c2)))
                for c2 in colors2[:3]
            )
            total_distance += min_distance

        # 정규화 (0~1 범위)
        max_distance = 441.67 * 3  # RGB 최대 거리 * 3
        similarity = 1 - (total_distance / max_distance)
        return max(0.0, min(1.0, similarity))

    def recommend_by_color(
            self,
            image_base64: str,
            limit: int = 10,
            category_filter: Optional[str] = None,
            min_similarity: float = 0.5
    ) -> List[Dict]:
        """색상 기반 유사 상품 추천"""
        print(f"🎨 색상 기반 추천 시작 (limit={limit}, category={category_filter})")

        # 업로드된 이미지 처리
        query_image = self._decode_base64_image(image_base64)
        if query_image is None:
            raise ValueError("이미지 디코딩 실패")

        # 쿼리 이미지의 주요 색상 추출
        query_colors = self.extract_dominant_colors(query_image)
        print(f"🎨 추출된 주요 색상: {query_colors[:3]}")

        # 전체 상품과 비교
        all_products = self._fetch_all_products()
        print(f"📦 전체 상품 수: {len(all_products)}")

        scored_products = []

        for product in all_products:
            # 상태 확인
            status = product.get("productStatus", "")
            if status not in ["ACTIVE", "PAUSED"]:
                continue

            # 카테고리 필터 (빈 문자열도 필터링 안 함)
            product_category = product.get("productCategoryType")
            if category_filter and category_filter.strip():  # 🔥 빈 문자열 체크 추가
                if product_category != category_filter:
                    continue

            # 상품 이미지 분석
            images = product.get("images", [])
            if not images:
                continue

            # 첫 번째 이미지 URL 가져오기
            image_path = images[0].get("imagePath") if isinstance(images[0], dict) else None
            if not image_path:
                continue

            product_image = self._load_image_from_url(image_path)
            if product_image is None:
                continue

            product_colors = self.extract_dominant_colors(product_image)
            similarity = self.calculate_color_similarity(query_colors, product_colors)

            if similarity >= min_similarity:
                scored_products.append({
                    **product,
                    "similarity_score": round(similarity, 4),
                    "match_type": "color"
                })

        # 유사도 순 정렬
        scored_products.sort(key=lambda x: x["similarity_score"], reverse=True)
        result = scored_products[:limit]

        print(f"✅ 색상 기반 추천 완료: {len(result)}개 상품")
        return result

    # ==================== 📊 이미지 품질 체크 ====================

    def check_image_quality(self, image_base64: str) -> Dict:
        """이미지 품질 분석"""
        image = self._decode_base64_image(image_base64)
        if image is None:
            return {"error": "이미지 로드 실패"}

        width, height = image.size
        file_size = len(base64.b64decode(image_base64.split(",")[1])) / 1024  # KB

        # 밝기 분석
        stat = ImageStat.Stat(image)
        brightness = sum(stat.mean) / 3

        # 선명도 분석 (Laplacian variance)
        gray = image.convert('L')
        edges = gray.filter(ImageFilter.FIND_EDGES)
        sharpness = ImageStat.Stat(edges).var[0]

        # 품질 점수 계산
        quality_score = 0
        issues = []

        # 해상도 체크
        if width < 500 or height < 500:
            issues.append("해상도가 낮습니다 (최소 500x500 권장)")
        else:
            quality_score += 30

        # 파일 크기 체크
        if file_size > 5000:
            issues.append("파일 크기가 큽니다 (5MB 이하 권장)")
        else:
            quality_score += 20

        # 밝기 체크
        if brightness < 50:
            issues.append("이미지가 너무 어둡습니다")
        elif brightness > 200:
            issues.append("이미지가 너무 밝습니다")
        else:
            quality_score += 25

        # 선명도 체크
        if sharpness < 100:
            issues.append("이미지가 흐릿합니다")
        else:
            quality_score += 25

        return {
            "quality_score": quality_score,
            "width": width,
            "height": height,
            "file_size_kb": round(file_size, 2),
            "brightness": round(brightness, 2),
            "sharpness": round(sharpness, 2),
            "issues": issues,
            "recommendation": "좋은 품질입니다" if quality_score >= 70 else "개선이 필요합니다"
        }

    # ==================== 🔧 이미지 자동 최적화 ====================

    def optimize_image(
            self,
            image_base64: str,
            max_width: int = 1000,
            quality: int = 85
    ) -> str:
        """이미지 자동 최적화 (용량 줄이기)"""
        image = self._decode_base64_image(image_base64)
        if image is None:
            raise ValueError("이미지 로드 실패")

        # 크기 조정
        width, height = image.size
        if width > max_width:
            ratio = max_width / width
            new_height = int(height * ratio)
            image = image.resize((max_width, new_height), Image.Resampling.LANCZOS)

        # JPEG로 변환 및 압축
        buffer = io.BytesIO()
        image.save(buffer, format="JPEG", quality=quality, optimize=True)
        buffer.seek(0)

        # Base64 인코딩
        optimized_base64 = base64.b64encode(buffer.read()).decode('utf-8')
        return f"data:image/jpeg;base64,{optimized_base64}"

    # ==================== 🏷️ 이미지 메타데이터 추출 ====================

    def extract_metadata(self, image_base64: str) -> Dict:
        """이미지 메타데이터 추출"""
        image = self._decode_base64_image(image_base64)
        if image is None:
            return {"error": "이미지 로드 실패"}

        dominant_colors = self.extract_dominant_colors(image, n_colors=3)

        # 색상을 RGB에서 hex로 변환
        hex_colors = [
            '#{:02x}{:02x}{:02x}'.format(r, g, b)
            for r, g, b in dominant_colors
        ]

        # 색상 이름 추정 (간단한 휴리스틱)
        color_names = []
        for r, g, b in dominant_colors:
            if r > 200 and g < 100 and b < 100:
                color_names.append("빨강")
            elif r < 100 and g > 200 and b < 100:
                color_names.append("초록")
            elif r < 100 and g < 100 and b > 200:
                color_names.append("파랑")
            elif r > 200 and g > 200 and b < 100:
                color_names.append("노랑")
            elif r > 150 and g > 150 and b > 150:
                color_names.append("흰색/밝음")
            elif r < 100 and g < 100 and b < 100:
                color_names.append("검정/어두움")
            else:
                color_names.append("기타")

        return {
            "width": image.size[0],
            "height": image.size[1],
            "format": image.format or "JPEG",
            "mode": image.mode,
            "dominant_colors": hex_colors,
            "color_names": color_names[:3]
        }


# 싱글톤 인스턴스
SPRING_API_BASE = os.getenv("SPRING_API_BASE", "http://backend:8080")
image_analyzer = LightweightImageAnalyzer(SPRING_API_BASE)