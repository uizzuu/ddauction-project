from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List

from langgraph_api import run_langgraph_rag, Document  # ← 방금 작성한 LangGraph 파일 임포트

app = FastAPI(
    title="DDAuction RAG API",
    description="출결 규정 / 정책 문서 기반 RAG API",
    version="1.0.0"
)

# ================================
# CORS 설정
# ================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # 필요시 프론트엔드 도메인으로 좁혀도 OK
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ================================
# Request/Response Schema
# ================================
class RAGRequest(BaseModel):
    query: str


class RAGResponse(BaseModel):
    response: str
    documents: List[Document]


# ================================
# RAG API Endpoint
# ================================
@app.post("/rag/query", response_model=RAGResponse)
async def rag_query(request: RAGRequest):
    """
    LangGraph 기반 RAG 실행 API
    """
    try:
        result = run_langgraph_rag(request.query)

        return RAGResponse(
            response=result["response"],
            documents=result["documents"]
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ================================
# Health Check (테스트용)
# ================================
@app.get("/health")
async def health_check():
    return {"status": "ok"}
