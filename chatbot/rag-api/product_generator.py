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
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", "당신은 10년 경력의 이커머스 전문 카피라이터입니다. 고객의 구매 욕구를 자극하는 매력적이고 세련된 상품 설명을 작성합니다."),
            ("human", """
            다음 상품 정보를 바탕으로 상세 페이지에 들어갈 상품 설명을 작성해주세요.

            [상품 정보]
            1. 상품명: {product_name}
            2. 주요 특징/키워드: {keywords}
            3. 타겟 고객: {target_audience}
            4. 원하는 분위기(톤앤매너): {tone}

            [작성 가이드]
            - 헤드라인: 눈길을 사로잡는 한 문장 카피
            - 도입부: 고객의 공감을 이끌어내는 감성적인 서두 (2~3문장)
            - 핵심 포인트: 주요 특징을 3~4개의 불렛 포인트로 정리 (이모지 활용)
            - 마무리: 구매를 유도하는 마무리 멘트

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