import os
import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel  # Pydantic v2 (최신 버전) 사용
from dotenv import load_dotenv
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_pinecone import Pinecone as LangchainPinecone
from langchain.chains import ConversationalRetrievalChain
from fastapi.middleware.cors import CORSMiddleware

# --- 환경 변수 로드 및 정리 ---
load_dotenv()
# .strip()을 사용하여 혹시 모를 공백 문제를 방지합니다.
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "").strip()
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY", "").strip()
PINECONE_ENVIRONMENT = os.getenv("PINECONE_ENVIRONMENT", "").strip()

# 사용자 요청에 따라 INDEX_NAME을 ddauction-db로 설정
INDEX_NAME = os.getenv("INDEX_NAME", "ddauction-db").strip()
NAMESPACE = os.getenv("NAMESPACE", "ddauction-policy").strip()

# =========================
# 1. FastAPI 및 RAG 초기화
# =========================

app = FastAPI()

# CORS 설정 추가
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 프로덕션에서는 구체적인 도메인으로 제한하세요 (예: ["http://localhost:3000"])
    allow_credentials=True,
    allow_methods=["*"],  # 모든 HTTP 메서드 허용
    allow_headers=["*"],  # 모든 헤더 허용
)

# RAG 체인 전역 변수
rag_chain = None
chat_history = []


# 초기화 함수
def initialize_rag_chain():
    """Pinecone과 OpenAI Embeddings를 사용하여 ConversationalRetrievalChain을 초기화합니다."""
    global rag_chain, chat_history

    if not all([OPENAI_API_KEY, PINECONE_API_KEY, PINECONE_ENVIRONMENT, INDEX_NAME]):
        raise ValueError("RAG 초기화에 필요한 환경 변수가 설정되지 않았습니다.")

    try:
        # OpenAI Embeddings 모델
        embeddings = OpenAIEmbeddings(
            model="text-embedding-3-small",
            openai_api_key=OPENAI_API_KEY
        )

        # Pinecone Vector Store 설정
        # Langchain Pinecone은 클라이언트 초기화 대신, 키와 인덱스 이름만 전달받아 내부적으로 처리
        vectorstore = LangchainPinecone.from_existing_index(
            index_name=INDEX_NAME,
            embedding=embeddings,
            namespace=NAMESPACE  # 네임스페이스 사용
        )

        # Retriever 설정
        retriever = vectorstore.as_retriever(search_kwargs={"k": 3})

        # Chat Model (LLM) 설정
        llm = ChatOpenAI(
            openai_api_key=OPENAI_API_KEY,
            model="gpt-3.5-turbo",
            temperature=0.0
        )

        # ConversationalRetrievalChain 초기화
        rag_chain = ConversationalRetrievalChain.from_llm(
            llm=llm,
            retriever=retriever,
            # chat_history는 메모리에 저장되므로, 초기화 시점에는 빈 리스트를 사용
            return_source_documents=True  # 검색된 소스 문서를 반환하도록 설정
        )
        print("✅ RAG Chain 초기화 완료.")

    except Exception as e:
        print(f"❌ RAG Chain 초기화 오류: {e}")
        # 초기화 실패 시 FastAPI 시작을 막지 않고, 런타임에 에러를 반환
        rag_chain = None


# FastAPI 시작 시 RAG Chain 초기화 시도
@app.on_event("startup")
async def startup_event():
    initialize_rag_chain()


# 요청 데이터 모델
class ChatRequest(BaseModel):
    query: str


# =========================
# 2. API 엔드포인트
# =========================

@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    global rag_chain, chat_history

    if rag_chain is None:
        raise HTTPException(
            status_code=503,
            detail="RAG Chain이 초기화되지 않았습니다. 환경 변수를 확인하거나 Pinecone 인덱스 업로드를 완료하세요."
        )

    try:
        # LangChain에 전달할 딕셔너리 구성
        result = rag_chain.invoke({
            "question": request.query,
            "chat_history": chat_history
        })

        # 결과에서 응답과 소스 문서 추출
        response = result["answer"]
        source_documents = result.get("source_documents", [])

        # 소스 문서에서 파일명과 내용 추출
        sources = [
            {
                "filename": doc.metadata.get("source"),
                "content_snippet": doc.page_content[:150] + "..."
            }
            for doc in source_documents
        ]

        # 채팅 기록 업데이트
        chat_history.append((request.query, response))

        return {
            "response": response,
            "sources": sources
        }

    except Exception as e:
        print(f"❌ 챗봇 처리 중 오류 발생: {e}")
        # OpenAI 키 문제나 Pinecone 연결 문제 등 런타임 오류 처리
        raise HTTPException(
            status_code=500,
            detail=f"챗봇 처리 중 오류 발생: {e}"
        )


# 상태 확인 엔드포인트
@app.get("/status")
def get_status():
    global rag_chain
    return {
        "status": "Ready" if rag_chain else "Initializing/Error",
        "index_name": INDEX_NAME,
        "namespace": NAMESPACE
    }