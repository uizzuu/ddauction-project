import { useState, useEffect } from "react";
import CheckboxStyle from "../../components/ui/CheckboxStyle";
import { useNavigate, useSearchParams } from "react-router-dom";
import { fetchProductById, getWinningInfo, preparePayment, completePayment, fetchUserAddress, fetchMe, updateUserAddress } from "../../common/api";
import { getCartItems, removeFromCart } from "../../common/util";
import type { CartItem } from "../../common/types";

// PortOne Global Type
declare global {
  interface Window {
    IMP?: {
      init: (impCode: string) => void;
      request_pay: (
        params: any,
        callback: (response: any) => void
      ) => void;
    };
    daum?: {
      Postcode: new (options: {
        oncomplete: (data: any) => void;
      }) => { open: () => void };
    };
  }
}

// Unified Payment Info Interface
interface PaymentInfo {
  productTitle: string;
  productImage: string | null;
  sellerName: string;
  price: number;
  shippingFee: number;
}

interface CartPaymentInfo {
  items: CartItem[];
  totalPrice: number;
  totalShipping: number;
}

export default function PaymentPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const productId = searchParams.get("productId");
  const cartMode = searchParams.get("cart") === "true";
  const selectedItemIds = searchParams.get("items")?.split(",").map(Number) || [];

  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [cartPaymentInfo, setCartPaymentInfo] = useState<CartPaymentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [address, setAddress] = useState("");
  const [postcode, setPostcode] = useState("");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [saveForNextTime, setSaveForNextTime] = useState(false);

  useEffect(() => {
    if (cartMode) {
      initCartPayment();
    } else if (productId) {
      initSinglePayment(Number(productId));
    } else {
      alert("잘못된 접근입니다.");
      navigate("/");
    }
  }, [cartMode, productId, navigate]);

  const initSinglePayment = async (id: number) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("로그인이 필요합니다.");
        navigate("/login");
        return;
      }

      const product = await fetchProductById(id);

      if (product.productType === 'USED') {
        alert("중고 거래 상품은 1:1 채팅을 통해 거래해주세요.");
        navigate(`/products/${id}`);
        return;
      }

      if (product.productType === 'STORE') {
        const originalPrice = Number(product.originalPrice || 0);
        const discountRate = Number(product.discountRate || 0);
        const salePrice = Math.round(originalPrice * (100 - discountRate) / 100);
        const shippingFee = product.deliveryIncluded ? 0 : Number(product.deliveryPrice || 0);

        setPaymentInfo({
          productTitle: product.title,
          productImage: (product.images && product.images.length > 0) ? product.images[0].imagePath : null,
          sellerName: product.sellerNickName || "판매자",
          price: salePrice,
          shippingFee: shippingFee
        });
      } else if (product.productType === 'AUCTION') {
        try {
          const winData = await getWinningInfo(id);
          setPaymentInfo({
            productTitle: winData.productTitle,
            productImage: winData.productImage,
            sellerName: winData.sellerName,
            price: winData.bidPrice,
            shippingFee: 0
          });
        } catch (e) {
          setErrorMsg("낙찰 정보를 찾을 수 없습니다. (낙찰자가 아니거나 종료되지 않음)");
        }
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("상품 정보를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const initCartPayment = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("로그인이 필요합니다.");
        navigate("/login");
        return;
      }

      const allCartItems = getCartItems();
      const selectedItems = allCartItems.filter(item =>
        selectedItemIds.includes(item.productId)
      );

      if (selectedItems.length === 0) {
        alert("선택된 상품이 없습니다.");
        navigate("/cart");
        return;
      }

      const hasUsedProduct = selectedItems.some(item => item.productType === 'USED');
      if (hasUsedProduct) {
        alert("중고 거래 상품은 결제할 수 없습니다.");
        navigate("/cart");
        return;
      }

      const totalPrice = selectedItems.reduce((sum, item) =>
        sum + (item.salePrice || 0) * item.quantity, 0
      );
      const totalShipping = selectedItems.reduce((sum, item) =>
        sum + item.shipping, 0
      );

      setCartPaymentInfo({
        items: selectedItems,
        totalPrice,
        totalShipping
      });
    } catch (err) {
      console.error(err);
      setErrorMsg("장바구니 정보를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // Load PortOne SDK & Daum Postcode SDK
  useEffect(() => {
    // PortOne SDK
    const portOneScript = document.createElement("script");
    portOneScript.src = "https://cdn.iamport.kr/v1/iamport.js";
    portOneScript.async = true;
    document.body.appendChild(portOneScript);

    // Daum Postcode SDK
    const daumScript = document.createElement("script");
    daumScript.src = "//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
    daumScript.async = true;
    document.body.appendChild(daumScript);

    return () => {
      document.body.removeChild(portOneScript);
      document.body.removeChild(daumScript);
    };
  }, []);

  // 우편번호 찾기 핸들러
  const handleSearchAddress = () => {
    if (!window.daum) {
      alert("주소 검색 모듈을 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    new window.daum.Postcode({
      oncomplete: function (data: any) {
        let fullAddress = data.address;
        let extraAddress = "";

        if (data.addressType === "R") {
          if (data.bname !== "") extraAddress += data.bname;
          if (data.buildingName !== "")
            extraAddress += extraAddress !== "" ? `, ${data.buildingName}` : data.buildingName;
          fullAddress += extraAddress !== "" ? ` (${extraAddress})` : "";
        }

        setPostcode(data.zonecode);
        setAddress(fullAddress);
      },
    }).open();
  };

  const handleLoadAddress = async () => {
    try {
      setIsLoadingAddress(true);

      const token = localStorage.getItem("token");
      console.log("🔑 Token exists:", !!token);

      if (!token) {
        alert("로그인이 필요합니다.");
        return;
      }

      const currentUser = await fetchMe(token);
      const userId = currentUser.userId;

      if (!userId) {
        alert("사용자 ID를 찾을 수 없습니다.");
        return;
      }

      console.log("📡 API 호출 시작:", userId);
      const userData = await fetchUserAddress(userId);
      console.log("✅ 받아온 userData:", userData);

      setName(userData.userName || "");
      setPhone(userData.phone || "");
      setPostcode(userData.zipCode || "");

      const fullAddress = [
        userData.address,
        userData.detailAddress
      ].filter(Boolean).join(" ");
      setAddress(fullAddress);

      if (!userData.address && !userData.zipCode) {
        alert("이름과 연락처를 불러왔습니다.\n주소 정보는 등록되어 있지 않습니다.");
      } else {
        alert("내 정보를 불러왔습니다.");
      }
    } catch (error) {
      alert("사용자 정보를 불러오는데 실패했습니다.");
    } finally {
      setIsLoadingAddress(false);
    }
  };

  const handleSaveAddress = async () => {
    if (!saveForNextTime) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const currentUser = await fetchMe(token);
      const userId = currentUser.userId;

      if (!userId) return;

      const addressParts = address.split(" ");
      const detailAddress = addressParts.length > 3 ? addressParts.slice(3).join(" ") : "";
      const baseAddress = addressParts.slice(0, 3).join(" ");

      await updateUserAddress(userId, {
        address: baseAddress,
        detailAddress: detailAddress,
        zipCode: postcode,
        phone: phone,
      });

    } catch (error) {
      console.error("주소 저장 실패:", error);
    }
  };

  const handlePayment = async () => {
    if (!address.trim() || !phone.trim() || !name.trim()) {
      alert("배송지 정보와 구매자 정보를 모두 입력해주세요.");
      return;
    }

    await handleSaveAddress();

    try {
      if (cartMode && cartPaymentInfo) {
        handleCartPayment();
        return;
      }

      if (!paymentInfo || !productId) return;

      const singleFinalAmount = paymentInfo.price + paymentInfo.shippingFee;
      const prepareData = await preparePayment(Number(productId));

      if (!window.IMP) {
        alert("결제 모듈 로딩 중입니다.");
        return;
      }

      window.IMP.init(prepareData.impCode);

      const payParams = {
        pg: "html5_inicis",
        pay_method: paymentMethod,
        merchant_uid: prepareData.merchantUid,
        name: prepareData.name,
        amount: singleFinalAmount,
        buyer_email: prepareData.buyerEmail,
        buyer_name: name,
        buyer_tel: phone,
        buyer_addr: address,
        buyer_postcode: postcode,
      };

      window.IMP.request_pay(payParams, async (response) => {
        if (response.success && response.imp_uid) {
          try {
            await completePayment({
              imp_uid: response.imp_uid,
              productId: Number(productId),
              merchant_uid: response.merchant_uid!,
            });
            alert("결제가 완료되었습니다!");
            navigate(`/products/${productId}`);
          } catch (e) {
            alert("결제 검증 실패: " + (e instanceof Error ? e.message : "알 수 없는 오류"));
          }
        } else {
          alert("결제 실패: " + (response.error_msg || "취소됨"));
        }
      });

    } catch (err) {
      console.error(err);
      alert("결제 준비 중 오류가 발생했습니다.");
    }
  };

  const handleCartPayment = async () => {
    if (!cartPaymentInfo) return;

    try {
      const firstProductId = cartPaymentInfo.items[0].productId;
      const totalAmount = cartPaymentInfo.totalPrice + cartPaymentInfo.totalShipping;

      const prepareData = await preparePayment(firstProductId);

      if (!window.IMP) {
        alert("결제 모듈 로딩 중입니다.");
        return;
      }

      window.IMP.init(prepareData.impCode);

      const payParams = {
        pg: "html5_inicis",
        pay_method: paymentMethod,
        merchant_uid: `CART_${Date.now()}`,
        name: `${cartPaymentInfo.items[0].title} 외 ${cartPaymentInfo.items.length - 1}건`,
        amount: totalAmount,
        buyer_email: prepareData.buyerEmail,
        buyer_name: name,
        buyer_tel: phone,
        buyer_addr: address,
        buyer_postcode: postcode,
      };

      window.IMP.request_pay(payParams, async (response) => {
        if (response.success && response.imp_uid) {
          try {
            const paymentPromises = cartPaymentInfo.items.map(item =>
              completePayment({
                imp_uid: response.imp_uid!,
                productId: item.productId,
                merchant_uid: response.merchant_uid!,
              })
            );

            await Promise.all(paymentPromises);

            alert(`${cartPaymentInfo.items.length}건의 결제가 완료되었습니다!`);

            cartPaymentInfo.items.forEach(item => {
              removeFromCart(item.productId);
            });

            navigate("/mypage");
          } catch (e) {
            console.error("결제 검증 실패:", e);
            alert("결제 검증 실패: " + (e instanceof Error ? e.message : "알 수 없는 오류"));
          }
        } else {
          alert("결제 실패: " + (response.error_msg || "취소됨"));
        }
      });

    } catch (err) {
      console.error(err);
      alert("결제 준비 중 오류가 발생했습니다.");
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">불러오는 중...</div>;
  if (errorMsg) return <div className="min-h-screen flex items-center justify-center text-red-500 font-bold">{errorMsg}</div>;
  if (!paymentInfo && !cartPaymentInfo) return null;

  const finalAmount = cartMode && cartPaymentInfo
    ? cartPaymentInfo.totalPrice + cartPaymentInfo.totalShipping
    : (paymentInfo ? paymentInfo.price + paymentInfo.shippingFee : 0);

  return (
    <div className="bg-gray-50 min-h-screen py-10">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8 text-gray-900">주문/결제</h1>

        <div className="flex flex-col lg:flex-row gap-8">

          {/* Left Column: Input Forms */}
          <div className="flex-1 space-y-6">

            {/* Product Info Card */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                주문 상품 
                <span className="text-gray-400 text-sm font-normal">
                  {cartMode && cartPaymentInfo ? `${cartPaymentInfo.items.length}건` : "1건"}
                </span>
              </h2>

              {cartMode && cartPaymentInfo ? (
                <div className="space-y-4">
                  {cartPaymentInfo.items.map((item) => (
                    <div key={item.productId} className="flex gap-4 items-start pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                      <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border border-gray-100">
                        {item.images && item.images.length > 0 ? (
                          <img src={item.images[0].imagePath} alt={item.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">No Image</div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-gray-500 mb-1">{item.sellerNickName}</div>
                        <div className="font-medium text-gray-900 mb-1 line-clamp-2">{item.title}</div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">수량: {item.quantity}개</span>
                          <span className="font-bold text-gray-900">{((item.salePrice || 0) * item.quantity).toLocaleString()}원</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                paymentInfo && (
                  <div className="flex gap-4 items-start">
                    <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border border-gray-100">
                      {paymentInfo.productImage ? (
                        <img src={paymentInfo.productImage} alt="Product" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">No Image</div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-gray-500 mb-1">{paymentInfo.sellerName}</div>
                      <div className="text-lg font-medium text-gray-900 mb-2 truncate">{paymentInfo.productTitle}</div>
                      <div className="font-bold text-gray-900">{paymentInfo.price.toLocaleString()}원</div>
                    </div>
                  </div>
                )
              )}
            </div>

            {/* Shipping Info Card */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h2 className="text-xl font-bold mb-6">배송지 정보</h2>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="w-24 pt-3 font-medium text-gray-500">받는 분</div>
                  <div className="flex-1 flex gap-2">
                    <input
                      type="text"
                      value={name} onChange={(e) => setName(e.target.value)}
                      placeholder="이름"
                      className="flex-1 border border-gray-300 rounded-lg p-3 focus:border-black outline-none transition-colors"
                    />
                    <button
                      onClick={handleLoadAddress}
                      disabled={isLoadingAddress}
                      className="px-3 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoadingAddress ? "불러오는 중..." : "내 정보 불러오기"}
                    </button>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-24 pt-3 font-medium text-gray-500">연락처</div>
                  <input
                    type="tel"
                    value={phone} onChange={(e) => setPhone(e.target.value)}
                    placeholder="- 없이 입력"
                    className="flex-1 border border-gray-300 rounded-lg p-3 focus:border-black outline-none transition-colors"
                  />
                </div>
                <div className="flex gap-4">
                  <div className="w-24 pt-3 font-medium text-gray-500">주소</div>
                  <div className="flex-1 space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={postcode} onChange={(e) => setPostcode(e.target.value)}
                        placeholder="우편번호"
                        readOnly
                        className="w-32 border border-gray-300 rounded-lg p-3 bg-gray-50 focus:border-black outline-none transition-colors"
                      />
                      <button
                        type="button"
                        onClick={handleSearchAddress}
                        className="px-4 py-3 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200"
                      >
                        우편번호 찾기
                      </button>
                    </div>
                    <input
                      type="text"
                      value={address} onChange={(e) => setAddress(e.target.value)}
                      placeholder="기본 주소 + 상세 주소"
                      className="w-full border border-gray-300 rounded-lg p-3 focus:border-black outline-none transition-colors"
                    />
                    <div className="mt-2">
                      <CheckboxStyle
                        checked={saveForNextTime}
                        onChange={(checked) => setSaveForNextTime(checked)}
                        label="이 정보를 다음 결제에도 사용하기"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method Card */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h2 className="text-xl font-bold mb-6">결제 수단</h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'card', label: '신용/체크카드' },
                  { id: 'vbank', label: '무통장입금' },
                  { id: 'trans', label: '계좌이체' },
                  { id: 'mobile', label: '휴대폰결제' },
                ].map((method) => (
                  <label
                    key={method.id}
                    className={`
                      cursor-pointer border rounded-xl p-4 flex items-center justify-center gap-2 font-medium transition-all
                      ${paymentMethod === method.id ? 'border-orange-500 bg-orange-50 text-orange-600 ring-1 ring-orange-500' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-600'}
                    `}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={method.id}
                      checked={paymentMethod === method.id}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="hidden"
                    />
                    {method.label}
                  </label>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column: Sticky Summary */}
          <div className="w-full lg:w-[360px]">
            <div className="sticky top-24 space-y-4">
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h2 className="text-xl font-bold mb-6">결제 금액</h2>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-gray-600">
                    <span>주문금액</span>
                    <span>
                      {cartMode && cartPaymentInfo
                        ? cartPaymentInfo.totalPrice.toLocaleString()
                        : (paymentInfo?.price.toLocaleString() || "0")
                      }원
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>배송비</span>
                    <span>
                      {(() => {
                        const shipping = cartMode && cartPaymentInfo
                          ? cartPaymentInfo.totalShipping
                          : (paymentInfo?.shippingFee || 0);
                        return shipping === 0 ? "무료" : `${shipping.toLocaleString()}원`;
                      })()}
                    </span>
                  </div>
                  <div className="h-px bg-gray-100 my-4" />
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-900">최종 결제 금액</span>
                    <span className="text-2xl font-bold text-orange-600">
                      {finalAmount.toLocaleString()}
                      <span className="text-base text-gray-600 font-normal ml-1">원</span>
                    </span>
                  </div>
                </div>

                <button
                  onClick={handlePayment}
                  className="w-full py-4 bg-black text-white rounded-xl font-bold text-lg hover:bg-gray-800 transition-colors shadow-lg"
                >
                  결제하기
                </button>

                <p className="text-xs text-gray-400 mt-4 text-center leading-relaxed">
                  위 주문 내용을 확인하였으며,<br />결제에 동의합니다.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}