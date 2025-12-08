# import os
# import io
# import base64
# import requests
# from typing import List, Dict, Optional
# from PIL import Image
# import torch
# import numpy as np
# from transformers import CLIPProcessor, CLIPModel
# from sklearn.metrics.pairwise import cosine_similarity
# from dotenv import load_dotenv
#
# load_dotenv()
#
#
# class ImageRecommendationEngine:
#     """
#     이미지 기반 상품 추천 엔진
#     - CLIP 모델을 사용한 이미지 유사도 계산
#     - 업로드된 이미지와 유사한 상품 추천
#     """
#
#     def __init__(self, spring_api_base: str):
#         self.spring_api_base = spring_api_base
#
#         # CLIP 모델 로드 (한 번만 초기화)
#         print("🔄 CLIP 모델 로딩 중...")
#         self.model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
#         self.processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
#         self.device = "cuda" if torch.cuda.is_available() else "cpu"
#         self.model.to(self.device)
#         print(f"✅ CLIP 모델 로드 완료 (device: {self.device})")
#
#     def _safe_request(self, url: str, timeout: int = 5) -> Optional[Dict]:
#         """안전한 HTTP 요청"""
#         try:
#             response = requests.get(url, timeout=timeout)
#             if response.ok:
#                 return response.json()
#             return None
#         except Exception as e:
#             print(f"⚠️ 요청 실패 ({url}): {e}")
#             return None
#
#     def _fetch_all_products(self) -> List[Dict]:
#         """전체 상품 목록 가져오기"""
#         data = self._safe_request(f"{self.spring_api_base}/api/products")
#         return data or []
#
#     def _decode_base64_image(self, base64_str: str) -> Optional[Image.Image]:
#         """Base64 문자열을 PIL Image로 변환"""
#         try:
#             # data:image/jpeg;base64, 접두사 제거
#             if "," in base64_str:
#                 base64_str = base64_str.split(",")[1]
#
#             image_bytes = base64.b64decode(base64_str)
#             image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
#             return image
#         except Exception as e:
#             print(f"❌ 이미지 디코딩 실패: {e}")
#             return None
#
#     def _load_image_from_url(self, image_url: str) -> Optional[Image.Image]:
#         """URL에서 이미지 로드"""
#         try:
#             response = requests.get(image_url, timeout=5)
#             if response.ok:
#                 image = Image.open(io.BytesIO(response.content)).convert("RGB")
#                 return image
#             return None
#         except Exception as e:
#             print(f"⚠️ 이미지 로드 실패 ({image_url}): {e}")
#             return None
#
#     def _extract_image_features(self, image: Image.Image) -> np.ndarray:
#         """이미지에서 특징 벡터 추출"""
#         try:
#             inputs = self.processor(images=image, return_tensors="pt")
#             inputs = {k: v.to(self.device) for k, v in inputs.items()}
#
#             with torch.no_grad():
#                 image_features = self.model.get_image_features(**inputs)
#
#             # 정규화
#             image_features = image_features / image_features.norm(dim=-1, keepdim=True)
#             return image_features.cpu().numpy()
#         except Exception as e:
#             print(f"❌ 특징 추출 실패: {e}")
#             return None
#
#     def _calculate_similarity(
#             self,
#             query_features: np.ndarray,
#             target_features: np.ndarray
#     ) -> float:
#         """코사인 유사도 계산"""
#         try:
#             similarity = cosine_similarity(query_features, target_features)[0][0]
#             return float(similarity)
#         except Exception as e:
#             print(f"❌ 유사도 계산 실패: {e}")
#             return 0.0
#
#     def recommend_by_image(
#             self,
#             image_base64: str,
#             limit: int = 10,
#             category_filter: Optional[str] = None,
#             min_similarity: float = 0.3
#     ) -> List[Dict]:
#         """
#         이미지 기반 상품 추천
#
#         Args:
#             image_base64: Base64 인코딩된 이미지
#             limit: 반환할 상품 수
#             category_filter: 카테고리 필터 (선택)
#             min_similarity: 최소 유사도 임계값
#
#         Returns:
#             유사도 높은 상품 리스트
#         """
#         print(f"🖼️ 이미지 기반 추천 시작 (limit={limit})")
#
#         # 1. 업로드된 이미지 처리
#         query_image = self._decode_base64_image(image_base64)
#         if query_image is None:
#             raise ValueError("이미지 디코딩 실패")
#
#         # 2. 쿼리 이미지 특징 추출
#         query_features = self._extract_image_features(query_image)
#         if query_features is None:
#             raise ValueError("이미지 특징 추출 실패")
#
#         # 3. 전체 상품 가져오기
#         all_products = self._fetch_all_products()
#         print(f"📦 상품 {len(all_products)}개 로드됨")
#
#         # 4. 각 상품의 이미지와 유사도 계산
#         scored_products = []
#         for product in all_products:
#             product_id = product.get("productId")
#
#             # 상태 확인
#             status = product.get("productStatus", "")
#             if status not in ["ACTIVE", "PAUSED"]:
#                 continue
#
#             # 카테고리 필터
#             if category_filter:
#                 if product.get("productCategoryType") != category_filter:
#                     continue
#
#             # 상품 이미지 URL 가져오기
#             image_urls = product.get("imageUrls", [])
#             if not image_urls:
#                 continue
#
#             # 첫 번째 이미지로 유사도 계산
#             product_image = self._load_image_from_url(image_urls[0])
#             if product_image is None:
#                 continue
#
#             product_features = self._extract_image_features(product_image)
#             if product_features is None:
#                 continue
#
#             similarity = self._calculate_similarity(query_features, product_features)
#
#             # 최소 유사도 임계값 적용
#             if similarity < min_similarity:
#                 continue
#
#             scored_products.append({
#                 **product,
#                 "similarity_score": round(similarity, 4),
#                 "match_type": "visual"
#             })
#
#         # 5. 유사도 기준 정렬
#         scored_products.sort(key=lambda x: x["similarity_score"], reverse=True)
#         result = scored_products[:limit]
#
#         print(f"✅ 이미지 기반 추천 완료: {len(result)}개 상품")
#         return result
#
#     def recommend_by_product_image(
#             self,
#             product_id: int,
#             limit: int = 6,
#             exclude_same_product: bool = True
#     ) -> List[Dict]:
#         """
#         특정 상품의 이미지와 유사한 상품 추천
#
#         Args:
#             product_id: 기준 상품 ID
#             limit: 반환할 상품 수
#             exclude_same_product: 같은 상품 제외 여부
#
#         Returns:
#             시각적으로 유사한 상품 리스트
#         """
#         print(f"🔍 상품 이미지 기반 유사 상품 검색: product_id={product_id}")
#
#         # 1. 대상 상품 정보 가져오기
#         target = self._safe_request(
#             f"{self.spring_api_base}/api/products/{product_id}"
#         )
#         if not target:
#             raise ValueError(f"상품을 찾을 수 없습니다: {product_id}")
#
#         image_urls = target.get("imageUrls", [])
#         if not image_urls:
#             raise ValueError("상품 이미지가 없습니다")
#
#         # 2. 대상 상품 이미지 특징 추출
#         target_image = self._load_image_from_url(image_urls[0])
#         if target_image is None:
#             raise ValueError("상품 이미지 로드 실패")
#
#         target_features = self._extract_image_features(target_image)
#         if target_features is None:
#             raise ValueError("이미지 특징 추출 실패")
#
#         # 3. 전체 상품과 비교
#         all_products = self._fetch_all_products()
#         scored_products = []
#
#         for product in all_products:
#             pid = product.get("productId")
#
#             # 같은 상품 제외
#             if exclude_same_product and pid == product_id:
#                 continue
#
#             # 상태 확인
#             status = product.get("productStatus", "")
#             if status not in ["ACTIVE", "PAUSED"]:
#                 continue
#
#             # 이미지 유사도 계산
#             prod_image_urls = product.get("imageUrls", [])
#             if not prod_image_urls:
#                 continue
#
#             prod_image = self._load_image_from_url(prod_image_urls[0])
#             if prod_image is None:
#                 continue
#
#             prod_features = self._extract_image_features(prod_image)
#             if prod_features is None:
#                 continue
#
#             similarity = self._calculate_similarity(target_features, prod_features)
#
#             scored_products.append({
#                 **product,
#                 "similarity_score": round(similarity, 4),
#                 "match_type": "visual"
#             })
#
#         # 4. 정렬 및 반환
#         scored_products.sort(key=lambda x: x["similarity_score"], reverse=True)
#         result = scored_products[:limit]
#
#         print(f"✅ 시각적 유사 상품: {len(result)}개 발견")
#         return result
#
#
# # 싱글톤 인스턴스
# SPRING_API_BASE = os.getenv("SPRING_API_BASE", "http://localhost:8080")
# image_recommendation_engine = ImageRecommendationEngine(SPRING_API_BASE)