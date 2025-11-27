import os
from dotenv import load_dotenv
from typing import TypedDict, List, Union
from pinecone import Pinecone
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_pinecone import Pinecone as LangchainPinecone
from langgraph.graph import StateGraph, END
from langchain_core.messages import HumanMessage
from langchain_core.pydantic_v1 import BaseModel, Field

# --- 환경 설정 로드 ---
# .env 파일에서 환경 변수를 로드합니다.
load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_ENVIRONMENT = os.getenv("PINECONE_ENVIRONMENT")
INDEX_NAME = os.getenv("INDEX_NAME", "ddauction-db")


# =========================
# 1. RAG 상태 정의 및 데이터 모델
# =========================

class Document(BaseModel):
    """검색 시스템에서 검색된 문서를 표현하는 모델 (FastAPI와 공유)함"""
    source: str = Field(description="문서의 출처 파일 이름 (예: policy.md)")
    content: str = Field(description="문서 청크 내용")


class GraphState(TypedDict):
    """LangGraph의 상태를 정의하는 딕셔너리"""
    query: str  # 사용자 질문
    documents: List[Document]  # 검색된 문서 목록
    generation: str  # LLM의 최종 생성 답변
    error: Union[str, None]  # 오류 메시지


# =========================
# 2. LLM 및 Pinecone 초기화
# =========================

llm = ChatOpenAI(
    model="gpt-4o-mini",
    temperature=0.3
)

# Pinecone 클라이언트 및 임베딩 초기화
retriever = None  # 전역 변수 초기화
try:
    if not all([OPENAI_API_KEY, PINECONE_API_KEY, PINECONE_ENVIRONMENT]):
        raise ValueError("필수 환경 변수가 설정되지 않았습니다.")

    pc = Pinecone(api_key=PINECONE_API_KEY, environment=PINECONE_ENVIRONMENT)
    embeddings = OpenAIEmbeddings(model="text-embedding-3-small", openai_api_key=OPENAI_API_KEY)

    # LangChain Pinecone RAG 툴 초기화
    # 인덱스가 존재하지 않으면 오류가 발생하므로, 'process_embeddings.py'를 먼저 실행해야 합니다.
    vectorstore = LangchainPinecone.from_existing_index(
        index_name=INDEX_NAME,
        embedding=embeddings
    )
    # 검색된 문서 개수를 3개로 설정
    retriever = vectorstore.as_retriever(search_kwargs={"k": 3})

    print(f"✅ LangGraph용 RAG Retriever 초기화 완료: {INDEX_NAME}")

except Exception as e:
    # 초기화 실패 시 retriever는 None으로 유지되어 retrieve_node에서 오류를 반환합니다.
    print(f"❌ RAG 시스템 초기화 오류: {e}. 'process_embeddings.py'를 먼저 실행하고 인덱스를 생성해야 합니다.")


# =========================
# 3. Graph 노드 정의
# =========================

def retrieve_node(state: GraphState):
    """Pinecone에서 질문과 관련된 문서를 검색합니다."""
    # retriever가 초기화되지 않았으면 오류 반환
    if retriever is None:
        return {"error": "RAG Retriever가 초기화되지 않았습니다. DB 연결 및 인덱스 존재 여부를 확인하세요."}

    print(f"--- 🔍 문서 검색 시작 (Query: {state['query'][:30]}...) ---")

    try:
        # LangChain Retriever를 사용하여 문서 검색
        retrieved_docs = retriever.invoke(state["query"])

        documents = []
        for doc in retrieved_docs:
            # LangGraph 상태에 맞게 Document 모델로 변환
            documents.append(Document(
                source=doc.metadata.get('source', 'N/A'),
                content=doc.page_content
            ))

        print(f"--- ✅ {len(documents)}개의 문서 검색 완료 ---")
        return {"documents": documents, "generation": ""}

    except Exception as e:
        print(f"--- ❌ 검색 중 오류 발생: {e} ---")
        return {"documents": [], "error": str(e)}


def generate_node(state: GraphState):
    """검색된 문서를 바탕으로 LLM이 답변을 생성합니다."""

    documents = state["documents"]
    query = state["query"]

    if not documents:
        # 검색 결과가 없으면 일반 답변을 반환
        return {"generation": "죄송합니다. 제공된 출결 규정 문서에서 관련 정보를 찾을 수 없습니다."}

    print("--- 🧠 LLM 답변 생성 시작 ---")

    # RAG 프롬프트 구축
    context = "\n---\n".join([f"출처: {d.source}\n내용: {d.content}" for d in documents])

    system_prompt = (
        "당신은 친절하고 전문적인 '출결 규정 안내 챗봇'입니다. "
        "사용자가 제시한 질문에 대해 오직 **아래에 제공된 자료(Context)**만을 참고하여 정확하고 자세하게 답변해야 합니다. "
        "만약 자료에 답변이 없다면, '규정 자료에 해당 내용이 명시되어 있지 않아 답변드릴 수 없습니다.'라고 알려주세요. "
        "답변할 때 출처 문서의 제목(예: 'policy.md')을 언급하지 마세요."
    )

    prompt_template = f"{system_prompt}\n\n[자료]\n{context}\n\n[사용자 질문]\n{query}"

    try:
        response = llm.invoke([HumanMessage(content=prompt_template)])
        print("--- ✅ 답변 생성 완료 ---")
        return {"generation": response.content}

    except Exception as e:
        print(f"--- ❌ LLM 생성 오류: {e} ---")
        return {"generation": "죄송합니다. LLM 답변 생성 중 오류가 발생했습니다."}


# =========================
# 4. Graph 정의 및 컴파일
# =========================
#
# GraphState를 사용하여 새로운 Graph 생성
workflow = StateGraph(GraphState)

# 노드 추가
workflow.add_node("retrieve", retrieve_node)
workflow.add_node("generate", generate_node)

# 그래프 시작점 설정
workflow.set_entry_point("retrieve")

# 흐름 정의: 검색 노드 -> 생성 노드 -> 종료
workflow.add_edge("retrieve", "generate")
workflow.add_edge("generate", END)

# Graph 컴파일 (실제로 실행 가능한 객체)
rag_app = workflow.compile()


# =========================
# 5. LangGraph API 호출 함수
# =========================
def run_langgraph_rag(query: str):
    """컴파일된 LangGraph RAG 에이전트를 실행하고 결과를 반환합니다."""
    initial_state = {"query": query, "documents": [], "generation": "", "error": None}

    # LangGraph 실행
    final_state = rag_app.invoke(initial_state)

    # 결과 반환
    if final_state.get("error"):
        # 오류가 있을 경우 응답은 오류 메시지, 문서는 빈 목록
        return {"response": final_state["error"], "documents": []}

    return {
        "response": final_state["generation"],
        "documents": final_state["documents"]
    }

# 이 파일의 'rag_app' 인스턴스는 FastAPI 파일에서 임포트하여 사용합니다.