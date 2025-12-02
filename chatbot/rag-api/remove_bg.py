import os
import requests
from openai import OpenAI
from fastapi import HTTPException

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise ValueError("OPENAI_API_KEY가 설정되어 있지 않습니다.")

client = OpenAI(api_key=OPENAI_API_KEY)

def remove_background_from_qr(product_id: int):
    # 1️⃣ QR 이미지 가져오기 (기존 스프링 API 활용)
    try:
        qr_image_resp = requests.get(f"http://localhost:8080/api/qrcode/{product_id}")
        if qr_image_resp.status_code != 200:
            raise HTTPException(status_code=404, detail="상품 이미지를 찾을 수 없습니다.")
        image_bytes = qr_image_resp.content
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"이미지 조회 실패: {e}")

    # 2️⃣ OpenAI 이미지 편집 (배경 제거)
    try:
        response = client.images.edit(
            model="gpt-image-1",
            image=image_bytes,
            prompt="Remove the background and keep the product only",
            size="1024x1024"
        )
        image_base64 = response.data[0].b64_json
        return image_base64
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OpenAI 이미지 편집 실패: {e}")
