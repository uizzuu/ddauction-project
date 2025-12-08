import os
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from dotenv import load_dotenv

# 환경변수 로드
load_dotenv()


class ProductDescriptionGenerator:
    def __init__(self):
        # 상품 설명 생성은 창의성이 필요하므로 temperature를 약간 높게(0.7) 설정
        self.llm = ChatOpenAI(
            model="gpt-4o-mini",
            temperature=0.7
        )

        # 프롬프트 템플릿 정의
        # 역할 부여 -> 입력 데이터 명시 -> 출력 형식 지정
        # product_generator.py 수정
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", "당신은 10년 경력의 이커머스 전문 카피라이터입니다."),
            ("human", """
            다음 상품 정보를 바탕으로 상세 페이지에 들어갈 상품 설명을 작성해주세요.

            [상품 정보]
            1. 상품명: {product_name}
            2. 주요 특징/키워드: {keywords}
            3. 타겟 고객: {target_audience}
            4. 원하는 분위기(톤앤매너): {tone}

            ⚠️ 키워드가 비어있다면, 상품명을 분석해서 적절한 키워드를 자동으로 추론하세요.
            ⚠️ 타겟 고객이 "일반 고객"이라면, 상품명을 보고 가장 적합한 타겟을 추론하세요.

            [작성 가이드]
            - 눈길을 사로잡는 한 문장 카피 (친근하게, 구매 욕구 자극)
              예: "거의 새거에요. 이번 주만 특가로 판매합니다"
            - 제품 상태, 사용감, 장점 등 간단히 서술 (2~3문장)
              예: "사용감 거의 없고, 스크래치 전혀 없는 깨끗한 상태예요. 원하시면 사진 더 보내드려요!"
            - 가격, 할인, 구성품 등 강조
              예: "구성품 전부 포함"
            - 배송/거래 방식 안내
              예: "원하시는 방법에 최대한 맞춰드려요, 택배는 반택만 가능해요."
            - 마무리 멘트, 친근하게
              예: "관심 있으신 분은 연락 주세요"

            결과는 마크다운 형식이 아닌 일반 텍스트로 가독성 있게 작성해주세요.
            """)
        ])

        # 체인 생성 (Prompt -> LLM)
        self.chain = self.prompt | self.llm

    def generate(self, product_name: str, keywords: list, target_audience: str, tone: str = "친근한"):
        """
        상품 정보를 받아 설명을 생성하는 함수
        """
        try:
            # 키워드 리스트를 쉼표로 구분된 문자열로 변환
            keywords_str = ", ".join(keywords)

            response = self.chain.invoke({
                "product_name": product_name,
                "keywords": keywords_str,
                "target_audience": target_audience,
                "tone": tone
            })
            return response.content
        except Exception as e:
            print(f"❌ 상품 설명 생성 중 오류 발생: {e}")
            return "죄송합니다. 상품 설명을 생성하는 도중 오류가 발생했습니다."


# 외부(api.py)에서 바로 사용할 수 있도록 인스턴스 생성
generator_service = ProductDescriptionGenerator()