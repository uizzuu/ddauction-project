import os
import uvicorn
from fastapi import FastAPI, HTTPException, File, UploadFile
from pydantic import BaseModel
from typing import List, Optional
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
import base64

# 기존 imports
from langgraph_app import run_langgraph_rag
from product_generator import generator_service
from remove_bg import remove_background_from_qr

# 🆕 색상 기반 이미지 분석 import
from image_features import image_analyzer

load_dotenv()
app = FastAPI()

ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:8080,http://localhost:8000,http://localhost:3000,http://localhost:5173"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

print(f"DEBUG: FINAL ALLOWED_ORIGINS USED BY CORS: {ALLOWED_ORIGINS}")
# ============ 기존 모델 ============

class ChatRequest(BaseModel):
    query: str


class ProductRequest(BaseModel):
    product_name: str
    keywords: List[str]
    target_audience: str = "일반 고객"
    tone: Optional[str] = "전문적인, 신뢰감 있는"


class ProductImageRequest(BaseModel):
    product_id: int


class RecommendationRequest(BaseModel):
    user_id: int
    limit: Optional[int] = 10
    exclude_viewed: Optional[bool] = True


class SimilarProductRequest(BaseModel):
    product_id: int
    limit: Optional[int] = 6


# 🆕 이미지 분석 모델
class ImageRequest(BaseModel):
    image_base64: str


class ColorSearchRequest(BaseModel):
    image_base64: str
    limit: Optional[int] = 10
    category_filter: Optional[str] = None
    min_similarity: Optional[float] = 0.5


# ============ 기존 엔드포인트 ============

@app.get("/status")
def get_status():
    return {"status": "Ready (RAG + Generator + Color-Based Recommendations)"}


@app.get("/health")
def health():
    return {"status": "All systems operational"}


@app.post("/ai/chat/query")
async def chat_endpoint(request: ChatRequest):
    try:
        result = run_langgraph_rag(request.query)
        documents = [
            {
                "filename": doc.source,
                "content_snippet": doc.content[:200] + "..."
            }
            for doc in result["documents"]
        ]
        return {
            "response": result["response"],
            "sources": documents
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"RAG 처리 오류: {e}")


@app.post("/generate-description")
async def generate_product_description(request: ProductRequest):
    if not request.product_name:
        raise HTTPException(status_code=400, detail="상품명은 필수입니다.")

    print(f"📝 상품 설명 생성: {request.product_name}")
    description = generator_service.generate(
        product_name=request.product_name,
        keywords=request.keywords,
        target_audience=request.target_audience,
        tone=request.tone
    )
    return {"description": description}

@app.post("/ai/remove-bg")
async def remove_background(request: ProductImageRequest):
    try:
        image_base64 = remove_background_from_qr(request.product_id)
        return {"image_base64": image_base64, "message": "배경 제거 완료"}
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return {"error": str(e)}


# ============ 🆕 색상 기반 이미지 추천 엔드포인트 ============

@app.post("/ai/recommendations/color")
async def recommend_by_color(request: ColorSearchRequest):
    """
    색상 기반 유사 상품 추천

    - **image_base64**: Base64 인코딩된 이미지
    - **limit**: 반환할 상품 수 (기본: 10)
    - **category_filter**: 카테고리 필터 (선택)
    - **min_similarity**: 최소 유사도 임계값 (0.0~1.0)
    """
    try:
        recommendations = image_analyzer.recommend_by_color(
            image_base64=request.image_base64,
            limit=request.limit,
            category_filter=request.category_filter,
            min_similarity=request.min_similarity
        )

        return {
            "success": True,
            "recommendations": recommendations,
            "count": len(recommendations),
            "search_type": "color_based"
        }
    except Exception as e:
        print(f"❌ 색상 기반 추천 실패: {e}")
        raise HTTPException(status_code=500, detail=f"색상 기반 추천 실패: {str(e)}")


@app.post("/ai/recommendations/color/upload")
async def recommend_by_color_upload(
        file: UploadFile = File(...),
        limit: int = 10,
        category_filter: Optional[str] = None,
        min_similarity: float = 0.5
):
    """
    이미지 파일 업로드로 색상 기반 추천

    - **file**: 이미지 파일 (jpg, png, etc.)
    - **limit**: 반환할 상품 수
    - **category_filter**: 카테고리 필터 (선택)
    - **min_similarity**: 최소 유사도 임계값
    """
    try:
        # 파일을 base64로 변환
        contents = await file.read()
        image_base64 = base64.b64encode(contents).decode('utf-8')

        # 추천 실행
        recommendations = image_analyzer.recommend_by_color(
            image_base64=image_base64,
            limit=limit,
            category_filter=category_filter,
            min_similarity=min_similarity
        )

        return {
            "success": True,
            "filename": file.filename,
            "recommendations": recommendations,
            "count": len(recommendations),
            "search_type": "color_upload"
        }
    except Exception as e:
        print(f"❌ 색상 기반 업로드 추천 실패: {e}")
        raise HTTPException(status_code=500, detail=f"색상 기반 업로드 추천 실패: {str(e)}")


@app.post("/ai/image/quality-check")
async def check_image_quality(request: ImageRequest):
    """
    이미지 품질 분석

    - **image_base64**: Base64 인코딩된 이미지
    """
    try:
        analysis = image_analyzer.check_image_quality(request.image_base64)
        return {
            "success": True,
            "analysis": analysis
        }
    except Exception as e:
        print(f"❌ 이미지 품질 체크 실패: {e}")
        raise HTTPException(status_code=500, detail=f"이미지 품질 체크 실패: {str(e)}")


@app.post("/ai/image/optimize")
async def optimize_image(request: ImageRequest):
    """
    이미지 자동 최적화

    - **image_base64**: Base64 인코딩된 이미지
    """
    try:
        optimized = image_analyzer.optimize_image(request.image_base64)
        return {
            "success": True,
            "optimized_image": optimized
        }
    except Exception as e:
        print(f"❌ 이미지 최적화 실패: {e}")
        raise HTTPException(status_code=500, detail=f"이미지 최적화 실패: {str(e)}")


@app.post("/ai/image/metadata")
async def extract_image_metadata(request: ImageRequest):
    """
    이미지 메타데이터 추출

    - **image_base64**: Base64 인코딩된 이미지
    """
    try:
        metadata = image_analyzer.extract_metadata(request.image_base64)
        return {
            "success": True,
            "metadata": metadata
        }
    except Exception as e:
        print(f"❌ 메타데이터 추출 실패: {e}")
        raise HTTPException(status_code=500, detail=f"메타데이터 추출 실패: {str(e)}")


if __name__ == "__main__":
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)