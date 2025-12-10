import { useState } from "react";
import CheckboxStyle from "../../components/ui/CheckboxStyle";
import { useNavigate } from "react-router-dom";

export default function TermsAgreement() {
    const navigate = useNavigate();
    const [allAgreed, setAllAgreed] = useState(false);
    const [agreements, setAgreements] = useState({
        service: false,
        privacy: false,
        age: false,
    });

    const handleAllCheck = (checked: boolean) => {
        setAllAgreed(checked);
        setAgreements({
            service: checked,
            privacy: checked,
            age: checked,
        });
    };

    const handleSingleCheck = (key: keyof typeof agreements) => {
        const newState = { ...agreements, [key]: !agreements[key] };
        setAgreements(newState);
        setAllAgreed(Object.values(newState).every(Boolean));
    };

    const handleNext = () => {
        if (!allAgreed) {
            alert("모든 필수 약관에 동의해주세요.");
            return;
        }
        navigate("/signup");
    };

    return (
        <div className="min-h-screen bg-[#f5f6f7] flex flex-col justify-center items-center py-10 px-4">
            {/* Logo Area */}
            <a
                href="/"
                className="relative block w-32 h-8 flex flex-shrink-0 mb-6"
                aria-label="DDANG 홈으로 이동"
            >
                <img
                    src="https://c.animaapp.com/vpqlbV8X/img/ddang.svg"
                    alt="DDANG"
                    className="w-full h-full object-contain"
                />
            </a>

            <div className="bg-white p-8 md:p-10 border border-gray-200 shadow-sm rounded-lg w-full max-w-[500px]">
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-[#333]">약관 동의</h2>
                    <p className="mt-2 text-sm text-gray-400">
                        서비스 이용을 위해 약관에 동의해주세요.
                    </p>
                </div>

                <div className="space-y-4">
                    {/* 전체 동의 */}
                    <div className="flex items-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <CheckboxStyle
                            checked={allAgreed}
                            onChange={(checked) => handleAllCheck(checked)}
                            label="전체 동의하기"
                        />
                    </div>

                    <div className="space-y-4 pl-1">
                        {/* 서비스 이용약관 */}
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center h-5 gap-2">
                                <CheckboxStyle
                                    checked={agreements.service}
                                    onChange={() => handleSingleCheck("service")}
                                    label="(필수) 서비스 이용약관 동의"
                                />
                            </div>
                            <div className="mt-1 ml-6 text-xs text-gray-400 h-20 overflow-y-auto bg-gray-50 p-3 rounded border border-gray-100 leading-relaxed scrollbar-hide">
                                제1조(목적) 본 약관은 땅땅옥션(이하 "회사")이 제공하는 경매 서비스 이용과 관련하여 회사와 회원의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
                                <br />
                                제2조(정의) "서비스"란 구현되는 단말기와 상관없이 회원이 이용할 수 있는 땅땅옥션 및 관련 제반 서비스를 의미합니다.
                                <br />
                                제3조(약관의 게시와 개정) 회사는 이 약관의 내용을 회원이 쉽게 알 수 있도록 서비스 초기 화면에 게시합니다.
                            </div>
                        </div>

                        {/* 개인정보 처리방침 */}
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center h-5 gap-2">
                                <CheckboxStyle
                                    checked={agreements.privacy}
                                    onChange={() => handleSingleCheck("privacy")}
                                    label="(필수) 개인정보 수집 및 이용 동의"
                                />
                            </div>
                            <div className="mt-1 ml-6 text-xs text-gray-400 h-20 overflow-y-auto bg-gray-50 p-3 rounded border border-gray-100 leading-relaxed scrollbar-hide">
                                1. 수집하는 개인정보 항목: 이름, 이메일, 휴대전화번호, 주소 등
                                <br />
                                2. 수집 및 이용 목적: 회원 관리, 서비스 제공, 계약 이행
                                <br />
                                3. 보유 및 이용 기간: 회원 탈퇴 시까지 (관련 법령에 따름)
                                <br />
                                4. 동의 거부 권리 및 불이익: 귀하는 개인정보 수집 및 이용에 거부할 권리가 있으나, 동의 거부 시 서비스 이용이 제한될 수 있습니다.
                            </div>
                        </div>

                        {/* 만 14세 이상 */}
                        <div className="flex items-start pt-2">
                            <div className="flex items-center h-5 gap-2">
                                <CheckboxStyle
                                    checked={agreements.age}
                                    onChange={() => handleSingleCheck("age")}
                                    label="(필수) 만 14세 이상입니다"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 mt-8">
                    <button
                        onClick={() => navigate("/")}
                        className="flex-1 py-4 border border-gray-300 rounded-[4px] text-gray-700 font-medium hover:bg-gray-50 transition-colors text-sm"
                    >
                        취소
                    </button>
                    <button
                        onClick={handleNext}
                        disabled={!allAgreed}
                        className={`flex-1 py-4 rounded-[4px] text-white font-bold transition-all text-sm ${allAgreed
                            ? "bg-[#888] hover:bg-[#333]"
                            : "bg-gray-300 cursor-not-allowed"
                            }`}
                    >
                        다음 단계
                    </button>
                </div>
            </div>
            <div className="mt-8 text-xs text-gray-400">
                &copy; DDAUCTION Corp.
            </div>
        </div>
    );
}
