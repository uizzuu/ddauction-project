import os
from dotenv import load_dotenv
from pathlib import Path
import json
from pinecone import Pinecone
from langchain_openai import OpenAIEmbeddings
from langchain_text_splitters import MarkdownTextSplitter
from langchain_pinecone import Pinecone as LangchainPinecone

# --- 환경 설정 로드 ---
load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_ENVIRONMENT = os.getenv("PINECONE_ENVIRONMENT")
INDEX_NAME = os.getenv("INDEX_NAME", "ddauction-db")

# Markdown 파일이 저장된 디렉토리
MD_DIR = Path("./rag-api/docs")

if not all([OPENAI_API_KEY, PINECONE_API_KEY, PINECONE_ENVIRONMENT]):
    raise ValueError("⚠️ 환경 변수(OPENAI_API_KEY, PINECONE_API_KEY, PINECONE_ENVIRONMENT)를 모두 설정하세요.")

# =========================
# 1. Pinecone 및 Embeddings 초기화
# =========================
try:
    # Langchain에서 사용할 Embeddings 모델 (1536차원)
    embeddings = OpenAIEmbeddings(
        model="text-embedding-3-small",
        openai_api_key=OPENAI_API_KEY
    )

    # Pinecone 클라이언트 초기화
    pc = Pinecone(api_key=PINECONE_API_KEY, environment=PINECONE_ENVIRONMENT)

    print(f"✅ Pinecone 환경 및 OpenAI Embeddings 초기화 완료.")

except Exception as e:
    print(f"❌ 초기화 오류: {e}")
    exit()


# =========================
# 2. 문서 전처리 및 청크 분할
# =========================
def process_documents(doc_path: Path):
    """지정된 디렉토리에서 .md 파일을 읽고 청크로 분할합니다."""

    # MarkdownTextSplitter 초기화: 500자 단위로, 50자 중복을 허용
    splitter = MarkdownTextSplitter(chunk_size=500, chunk_overlap=50)

    documents = []

    for md_file in doc_path.glob("*.md"):
        print(f"🔍 문서 로드 및 분할 시작: {md_file.name}")

        # 파일 내용을 로드
        content = md_file.read_text(encoding="utf-8")

        # 문서를 청크로 분할
        chunks = splitter.split_text(content)

        # 청크마다 메타데이터 추가
        for i, chunk in enumerate(chunks):
            # Pinecone에 저장할 메타데이터 정의
            metadata = {
                "source": md_file.name,
                "document_id": md_file.stem,  # 파일명 (확장자 제외)
                "chunk_id": f"{md_file.stem}_{i}",
                "document": chunk  # 원본 텍스트 청크
            }
            documents.append((chunk, metadata))

    print(f"✅ 총 {len(documents)}개의 문서 청크 생성 완료.")
    return documents


# =========================
# 3. Pinecone에 업로드
# =========================
def ingest_to_pinecone(documents):
    """분할된 문서 청크를 Pinecone 인덱스에 업로드합니다."""

    if INDEX_NAME not in pc.list_indexes().names:
        print(f"🚨 인덱스 '{INDEX_NAME}'가 존재하지 않습니다. 새로 생성합니다.")
        # Pinecone Serverless 인덱스 생성 (최신 권장)
        pc.create_index(
            name=INDEX_NAME,
            dimension=1536,  # text-embedding-3-small의 차원
            metric="cosine"
        )
        print(f"✅ 인덱스 '{INDEX_NAME}' 생성 완료.")

    # Langchain의 Pinecone 유틸리티를 사용하여 업로드
    try:
        LangchainPinecone.from_texts(
            texts=[doc[0] for doc in documents],
            embedding=embeddings,
            index_name=INDEX_NAME,
            metadatas=[doc[1] for doc in documents]
        )
        print(f"🎉 {len(documents)}개의 청크가 Pinecone 인덱스 '{INDEX_NAME}'에 성공적으로 업로드되었습니다.")
    except Exception as e:
        print(f"❌ Pinecone 업로드 오류: {e}")


# =========================
# 메인 실행
# =========================
if __name__ == "__main__":
    if not MD_DIR.exists():
        print(f"❌ 문서 폴더를 찾을 수 없습니다: {MD_DIR}. 'pdf_converter.py'를 먼저 실행하고 문서를 넣어주세요.")
    else:
        # 1. 문서 처리
        processed_documents = process_documents(MD_DIR)

        if processed_documents:
            # 2. Pinecone에 업로드
            ingest_to_pinecone(processed_documents)
        else:
            print("❗ 업로드할 .md 파일이 없습니다. 문서를 확인하세요.")