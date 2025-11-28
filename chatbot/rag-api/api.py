import os
import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware

# LangGraph RAG 엔진 가져오기
from langgraph_app import run_langgraph_rag

load_dotenv()

app = FastAPI()

ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:8080" 
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    query: str

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

@app.get("/status")
def get_status():
    return {"status": "Ready (LangGraph RAG)"}

