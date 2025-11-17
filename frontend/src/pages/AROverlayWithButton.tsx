import React, { useState, useEffect, useRef } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";

interface AROverlayProps {
  productId: number;
}

const API_BASE_URL = "http://localhost:8080";

const AROverlayWithButton: React.FC<AROverlayProps> = ({ productId }) => {
  const [mode, setMode] = useState<"initial" | "showQR" | "scanning">("initial");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);

  // QR 코드 URL 생성
  useEffect(() => {
    setQrCodeUrl(`${API_BASE_URL}/api/qrcode/${productId}`);
  }, [productId]);

  // QR 스캔 모드
  useEffect(() => {
    if (mode !== "scanning") return;

    const codeReader = new BrowserMultiFormatReader();
    codeReaderRef.current = codeReader;
    let active = true;

    const startScanner = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputDevices = devices.filter((d) => d.kind === "videoinput");

        if (!active || videoInputDevices.length === 0) {
          setError("카메라를 찾을 수 없습니다.");
          return;
        }

        const firstDeviceId = videoInputDevices[0].deviceId;
        if (!videoRef.current) return;

        codeReader.decodeFromVideoDevice(
          firstDeviceId,
          videoRef.current,
          (result, err) => {
            if (result) {
              handleScan(result.getText());
            }
            if (err && err.name !== "NotFoundException") {
              console.error("QR 스캔 에러:", err);
            }
          }
        );
      } catch (err) {
        console.error("카메라 장치 가져오기 실패", err);
        setError("카메라 접근 권한이 필요합니다.");
      }
    };

    startScanner();

return () => {
      active = false;
      if (codeReaderRef.current) {
        try {
          // TypeScript 타입 에러 우회
          (codeReaderRef.current as any).reset?.();
        } catch (e) {
          console.warn("Scanner reset failed", e);
        }
      }
    };
  }, [mode]);

  const handleScan = async (qrData: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/products/${qrData}`);
      if (!res.ok) throw new Error("상품 조회 실패");
      
      const data = await res.json();
      
      if (data.images && data.images.length > 0) {
        setImageUrl(data.images[0].imagePath);
        setError(null);
      } else if (data.imageUrl) {
        setImageUrl(data.imageUrl);
        setError(null);
      } else {
        setError("상품 이미지가 없습니다.");
      }
    } catch (err) {
      console.error("상품 조회 실패", err);
      setError("QR 코드 인식에 실패했습니다.");
    }
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", backgroundColor: "#000" }}>
      {/* 에러 메시지 */}
      {error && (
        <div style={{
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
        }}>
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
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          gap: "20px",
        }}>
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
            onClick={() => setMode("scanning")}
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
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          gap: "20px",
        }}>
          <div style={{
            backgroundColor: "#fff",
            padding: "20px",
            borderRadius: "12px",
          }}>
            <img 
              src={qrCodeUrl} 
              alt="QR Code" 
              style={{ width: "300px", height: "300px" }}
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
          <div style={{
            position: "absolute",
            top: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            color: "#fff",
            backgroundColor: "rgba(0,0,0,0.6)",
            padding: "10px 20px",
            borderRadius: "8px",
            fontSize: "0.9rem",
          }}>
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
          }}
        />
      )}
    </div>
  );
};

export default AROverlayWithButton;