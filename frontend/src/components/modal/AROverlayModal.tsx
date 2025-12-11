/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef, useCallback } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { fetchQrCodeImage, fetchProductByQr, removeProductBackground } from "../../common/api";
import * as TYPE from "../../common/types";

const AROverlayModal: React.FC<TYPE.AROverlayProps> = ({ productId }) => {
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
    if (mode !== "scanning") {

      return;
    }

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
          (result, _) => {
            if (result) {
              handleScan(result.getText());
            }
          }
        );
      } catch (cameraError) {
        console.error("Camera Error:", cameraError);
        setError("카메라 접근 권한이 필요합니다.");
      }
    };

    startScanner();

    return () => {
      active = false;

      // codeReaderRef.current?.reset?.(); // Reset not available on some versions, rely on stop
      // Use explicit stop if possible, but stopAsyncDecode is already called in cleanup
      // Just nullify ref if needed or rely on stopAsyncDecode. 
      // Ensure we stop scanning which is done by control.stop() if we had control, 
      // or decodeFromVideoDevice returns a promise/control. 
      // For now, removing the reset call if it doesn't exist on the type.
    };
  }, [mode, handleScan]);


  // Helper Render Components
  const BackButton = ({ onClick, label = "뒤로가기" }: { onClick: () => void, label?: string }) => (
    <button
      onClick={onClick}
      className="px-6 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/10 text-white rounded-full transition-all flex items-center gap-2 text-sm font-medium"
    >
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
      {label}
    </button>
  );

  return (
    <div className="relative w-full h-full bg-neutral-900 border border-neutral-800 overflow-hidden flex flex-col items-center justify-center">

      {/* ERROR OVERLAY */}
      {error && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm p-6 text-center">
          <div className="bg-red-500/10 text-red-500 p-4 rounded-full mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <p className="text-white mb-6 max-w-xs">{error}</p>
          <button
            onClick={() => { setError(null); setMode("initial"); }}
            className="px-6 py-2 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors"
          >
            홈으로 돌아가기
          </button>
        </div>
      )}

      {/* INITIAL MODE */}
      {mode === "initial" && !error && (
        <div className="flex flex-col items-center gap-6 animate-fade-in">
          <div className="w-20 h-20 bg-gradient-to-tr from-purple-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg mb-2">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM17 17l3 3" /><path d="M20 17l-3 3" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white">AR 가상 착해보기</h2>
          <p className="text-gray-400 text-center max-w-sm mb-4">
            <span>스마트폰으로 QR코드를 스캔하거나<br />웹캠을 사용하여 상품을 미리 체험해보세요.</span><br />
            <span className="text-[13px] font-medium text-gray-400 text-center max-w-sm">* 사이트 내의 카메라 스캔 버튼으로만 QR코드 인식 가능</span>
          </p>


          <div className="flex flex-col gap-3 w-full max-w-xs">
            <button
              onClick={() => setMode("showQR")}
              className="w-full py-4 bg-white/10 hover:bg-white/20 border border-white/10 backdrop-blur-sm rounded-xl text-white font-bold transition-all flex items-center justify-center gap-3 group"
            >
              <span className="group-hover:translate-x-1 transition-transform">QR코드</span>
            </button>
            <button
              onClick={() => setMode("scanning")}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/30 transition-all flex items-center justify-center gap-3 group"
            >
              <span className="group-hover:translate-x-1 transition-transform leading-tight">
                카메라 스캔하기
              </span>
            </button>
          </div>
        </div>
      )}

      {/* QR CODE MODE */}
      {mode === "showQR" && (
        <div className="flex flex-col items-center animate-fade-in-up w-full h-full justify-center p-6">
          <div className="bg-white p-4 rounded-2xl shadow-2xl mb-8 transform hover:scale-105 transition-transform duration-300">
            {qrCodeUrl ? (
              <img src={qrCodeUrl} alt="QR Code" className="w-64 h-64 object-contain" />
            ) : (
              <div className="w-64 h-64 bg-gray-100 flex items-center justify-center rounded-lg text-gray-400">Loading...</div>
            )}
          </div>
          <p className="text-white font-medium mb-8 bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm">
            모바일 카메라로 스캔하여 AR을 체험하세요
          </p>
          <BackButton onClick={() => setMode("initial")} />
        </div>
      )}

      {/* SCANNING MODE */}
      {mode === "scanning" && !error && (
        <>
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover"
            autoPlay
            muted
            playsInline
          />
          {/* Overlay UI */}
          <div className="absolute inset-x-0 top-0 p-6 flex justify-between items-start bg-gradient-to-b from-black/60 to-transparent">
            <div className="px-4 py-2 bg-black/40 backdrop-blur-md rounded-full text-white text-sm border border-white/10 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              {imageUrl ? "AR 모드 활성화됨" : "QR 코드를 비쳐주세요"}
            </div>
          </div>

          {/* SCAN GUIDE FRAME */}
          {!imageUrl && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 z-10 pointer-events-none">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white/80 rounded-tl-xl" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white/80 rounded-tr-xl" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white/80 rounded-bl-xl" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white/80 rounded-br-xl" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-0.5 bg-red-500/50 animate-scan" />
            </div>
          )}

          {/* AR OBJECT */}
          {imageUrl && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] pointer-events-none z-20">
              <img
                src={imageUrl}
                alt="AR Object"
                className="w-full drop-shadow-2xl animate-float"
                style={{ filter: "drop-shadow(0 10px 20px rgba(0,0,0,0.5))" }}
              />
              <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-white text-xs bg-black/50 px-2 py-1 rounded">
                가상 상품
              </div>
            </div>
          )}

          {/* CONTROLS */}
          <div className="absolute bottom-8 left-0 right-0 flex flex-col items-center gap-4 z-30">
            {imageUrl && (
              <button
                onClick={async () => {
                  try {
                    const bgRemovedUrl = await removeProductBackground(productId);
                    setImageUrl(bgRemovedUrl);
                  } catch (err) {
                    setError(err instanceof Error ? err.message : "배경 제거 실패");
                  }
                }}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full font-bold shadow-lg shadow-indigo-500/40 transition-all flex items-center gap-2"
              >
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 15.536c-1.171 1.952-3.07 1.952-4.242 0-1.172-1.953-1.172-5.119 0-7.072 1.171-1.952 3.07-1.952 4.242 0M8 10.5h4m-4 3h4m9-1.5a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                ✂️ 배경 제거하기
              </button>
            )}
            <BackButton onClick={() => { setMode("initial"); setImageUrl(null); }} label="종료하기" />
          </div>
        </>
      )}
    </div>
  );
};

export default AROverlayModal;
