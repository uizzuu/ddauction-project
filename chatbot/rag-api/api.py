import os
import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware

# 1. 기존 LangGraph RAG 엔진 가져오기
from langgraph_app import run_langgraph_rag

# 2. [NEW] 새로 만든 상품 설명 생성 서비스 가져오기
from product_generator import generator_service

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

# --- 데이터 모델 정의 ---

# 기존 챗봇 요청 모델
class ChatRequest(BaseModel):
    query: str

# [NEW] 상품 설명 생성 요청 모델
class ProductRequest(BaseModel):
    product_name: str
    keywords: List[str]
    target_audience: str = "일반 고객"
    tone: Optional[str] = "전문적인, 신뢰감 있는"


# --- 엔드포인트 정의 ---

@app.get("/status")
def get_status():
    return {"status": "Ready (RAG + Product Generator)"}

# 1. 기존 챗봇 API
@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    try:
        result = run_langgraph_rag(request.query)

        # LangGraph 결과 구조: {"response": "...", "documents": [...]}
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
        raise HTTPException(
            status_code=500,
            detail=f"RAG 처리 오류: {e}"
        )

# 2. [NEW] 상품 설명 자동 생성 API
@app.post("/generate-description")
async def generate_product_description(request: ProductRequest):
    """
    상품명, 키워드 등을 입력받아 AI가 작성한 상품 설명을 반환합니다.
    """
    if not request.product_name:
        raise HTTPException(status_code=400, detail="상품명은 필수입니다.")

    print(f"📝 상품 설명 생성 요청: {request.product_name}")

    # 비즈니스 로직 호출 (product_generator.py)
    description = generator_service.generate(
        product_name=request.product_name,
        keywords=request.keywords,
        target_audience=request.target_audience,
        tone=request.tone
    )

    return {"description": description}

if __name__ == "__main__":
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)