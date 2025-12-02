/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef, useCallback } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { fetchQrCodeImage, fetchProductByQr, removeProductBackground } from "../common/api";
import * as TYPE from "../common/types";

const AROverlayWithButton: React.FC<TYPE.AROverlayProps> = ({ productId }) => {
  const [mode, setMode] = useState<"initial" | "showQR" | "scanning">("initial");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);

  // QR 코드 URL 생성
  useEffect(() => {
    fetchQrCodeImage(productId)
      .then(setQrCodeUrl)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "QR 코드 로드 실패"));
  }, [productId]);

  // handleScan
  const handleScan = useCallback(async (qrData: string) => {
    try {
      const data = await fetchProductByQr(qrData);

      if (data.images && data.images.length > 0) {
        setImageUrl(data.images[0].imagePath);
        setError(null);
      } else if (data.imageUrl) {
        setImageUrl(data.imageUrl);
        setError(null);
      } else {
        setError("상품 이미지가 없습니다.");
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "알 수 없는 오류");
    }
  }, []);

  // QR 스캔 모드
  useEffect(() => {
    console.log("🟡 useEffect 실행, mode:", mode);

    if (mode !== "scanning") {
      console.log("⚪ mode가 scanning이 아님, 종료");
      return;
    }

    console.log("🟢 QR 스캔 모드 진입!");

    const codeReader = new BrowserMultiFormatReader();
    codeReaderRef.current = codeReader;
    let active = true;

    const startScanner = async () => {
      console.log("📷 카메라 스캔 시작...");

      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        console.log("📹 감지된 장치:", devices.length);

        const videoInputDevices = devices.filter(
          (d) => d.kind === "videoinput"
        );
        console.log("📹 카메라 장치:", videoInputDevices.length);

        if (!active || videoInputDevices.length === 0) {
          setError("카메라를 찾을 수 없습니다.");
          return;
        }

        const firstDeviceId = videoInputDevices[0].deviceId;
        console.log("📹 사용할 카메라:", firstDeviceId);

        if (!videoRef.current) {
          console.error("❌ video element가 없음");
          return;
        }

        console.log("📷 QR 디코딩 시작...");

        codeReader.decodeFromVideoDevice(
          firstDeviceId,
          videoRef.current,
          (result, scanError) => {
            if (result) {
              console.log("🎯 QR 스캔 성공!");
              handleScan(result.getText());
            }
            if (scanError && scanError.name !== "NotFoundException") {
              console.error("QR 스캔 에러:", scanError);
            }
          }
        );
      } catch (cameraError) {
        console.error("❌ 카메라 장치 가져오기 실패:", cameraError);
        setError("카메라 접근 권한이 필요합니다.");
      }
    };

    startScanner();

    return () => {
      console.log("🔴 useEffect cleanup");
      active = false;
      if (codeReaderRef.current) {
        try {
          (codeReaderRef.current as any).reset?.();
        } catch (cleanupError) {
          console.warn("Scanner reset failed", cleanupError);
        }
      }
    };
  }, [mode, handleScan]);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        backgroundColor: "#000",
      }}
    >
      {/* 에러 메시지 */}
      {error && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            color: "#fff",
            textAlign: "center",
            zIndex: 10,
            padding: "20px",
            backgroundColor: "rgba(0,0,0,0.7)",
            borderRadius: "8px",
          }}
        >
          {error}
          <br />
          <button
            onClick={() => {
              setError(null);
              setMode("initial");
            }}
            style={{
              marginTop: "10px",
              padding: "8px 16px",
              backgroundColor: "#ff6600",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            처음으로
          </button>
        </div>
      )}

      {/* 초기 화면 - QR 스캔 버튼 */}
      {mode === "initial" && !error && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            gap: "20px",
          }}
        >
          <button
            onClick={() => setMode("showQR")}
            style={{
              padding: "1rem 2rem",
              fontSize: "1.2rem",
              backgroundColor: "#ff6600",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            📱 QR 코드 보기
          </button>
          <button
            onClick={() => {
              console.log('🔵 "QR 코드 스캔하기" 버튼 클릭!');
              setMode("scanning");
            }}
            style={{
              padding: "1rem 2rem",
              fontSize: "1.2rem",
              backgroundColor: "#4CAF50",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            📷 QR 코드 스캔하기
          </button>
        </div>
      )}

      {/* QR 코드 표시 화면 */}
      {mode === "showQR" && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            gap: "20px",
          }}
        >
          <div
            style={{
              backgroundColor: "#fff",
              padding: "20px",
              borderRadius: "12px",
            }}
          >
            <img
              src={qrCodeUrl}
              alt="QR Code"
              style={{ width: "300px", height: "300px" }}
              onError={() => {
                console.error("QR 이미지 로드 실패:", qrCodeUrl);
                setError(
                  "QR 코드를 불러올 수 없습니다. 백엔드 서버를 확인하세요."
                );
              }}
              onLoad={() => {
                console.log("QR 이미지 로드 성공:", qrCodeUrl);
              }}
            />
          </div>
          <p style={{ color: "#fff", textAlign: "center" }}>
            다른 기기로 이 QR 코드를 스캔하세요
          </p>
          <button
            onClick={() => setMode("initial")}
            style={{
              padding: "10px 20px",
              backgroundColor: "#666",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            ← 뒤로가기
          </button>
        </div>
      )}

      {/* 카메라 스캔 화면 */}
      {mode === "scanning" && !error && (
        <>
          <video
            ref={videoRef}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            autoPlay
            muted
            playsInline
          />
          <div
            style={{
              position: "absolute",
              top: "20px",
              left: "50%",
              transform: "translateX(-50%)",
              color: "#fff",
              backgroundColor: "rgba(0,0,0,0.6)",
              padding: "10px 20px",
              borderRadius: "8px",
              fontSize: "0.9rem",
            }}
          >
            QR 코드를 화면에 맞춰주세요
          </div>
          <button
            onClick={() => {
              setMode("initial");
              setImageUrl(null);
            }}
            style={{
              position: "absolute",
              bottom: "30px",
              left: "50%",
              transform: "translateX(-50%)",
              padding: "10px 20px",
              backgroundColor: "#666",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            ← 뒤로가기
          </button>
        </>
      )}

      {/* AR 오버레이 이미지 (스캔 성공 시) */}
      {imageUrl && mode === "scanning" && (
        <>
          <div
            style={{
              position: "absolute",
              top: "10px",
              left: "10px",
              backgroundColor: "rgba(0,255,0,0.7)",
              color: "#000",
              padding: "8px 12px",
              borderRadius: "6px",
              fontSize: "0.8rem",
              fontWeight: "bold",
              zIndex: 10,
            }}
          >
            ✅ AR 활성화
          </div>
          <img
            src={imageUrl}
            alt="상품 AR"
            style={{
              position: "absolute",
              top: "40%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "50%",
              maxWidth: "300px",
              pointerEvents: "none",
              opacity: 0.85,
              filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.3))",
              zIndex: 5,
              border: "3px solid #00ff00",
            }}
            onLoad={() => console.log("✅ AR 이미지 렌더링 성공")}
            onError={() => {
              console.error("❌ AR 이미지 로드 실패:", imageUrl);
              setError("이미지를 불러올 수 없습니다.");
            }}
          />
          {/* ✅ 배경제거 버튼 */}
    <button
      onClick={async () => {
        try {
          const bgRemovedUrl = await removeProductBackground(productId);
          setImageUrl(bgRemovedUrl); // AR 이미지 교체
        } catch (err) {
          setError(err instanceof Error ? err.message : "배경 제거 실패");
        }
      }}
      style={{
        position: "absolute",
        bottom: "80px",
        left: "50%",
        transform: "translateX(-50%)",
        padding: "10px 20px",
        backgroundColor: "#ff6600",
        color: "#fff",
        border: "none",
        borderRadius: "8px",
        cursor: "pointer",
        zIndex: 10,
      }}
    >
      ✂️ 배경제거
    </button>
        </>
      )}
    </div>
  );
};

export default AROverlayWithButton;
