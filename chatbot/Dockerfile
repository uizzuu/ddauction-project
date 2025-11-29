# 1. Python 공식 이미지 사용 (slim 버전은 가볍고 좋습니다)
FROM python:3.10-slim

# [추가됨] 파이썬 로그가 버퍼링 없이 즉시 출력되도록 설정 (디버깅에 필수)
ENV PYTHONUNBUFFERED=1

# 2. 시스템 패키지 업데이트 및 필요한 라이브러리 설치
# build-essential: 일부 파이썬 패키지(numpy 등) 컴파일에 필요
# curl: docker-compose의 healthcheck에 필요
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 3. 작업 디렉터리 생성
WORKDIR /app

# 4. requirements.txt 복사 & 설치
# (소스코드보다 먼저 복사해야 라이브러리 설치 캐시를 활용할 수 있음)
COPY requirements.txt /app/

# [수정됨] --no-cache-dir 옵션은 유지하되, 설치 후 불필요한 파일 제거로 용량 최적화
RUN pip install --no-cache-dir -r requirements.txt

# 5. 전체 소스 복사
COPY . /app

# 6. FastAPI 실행 (uvicorn)
CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "8000"]