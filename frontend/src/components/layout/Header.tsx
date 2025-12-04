import { useState } from "react";

export default function Header() {
    const [searchQuery, setSearchQuery] = useState("");
    const cartItemCount = 34;

    return (
        <header
            className="tail-container"
            data-model-id="395:13790"
            role="banner"
        >
            <a
                href="/"
                className="relative block w-36 h-6 flex-shrink-0"
                aria-label="DDANG 홈으로 이동"
            >
                <img
                    src="https://c.animaapp.com/vpqlbV8X/img/ddang.svg"
                    alt="DDANG"
                    className="w-full h-full object-contain"
                />
            </a>

            <div className="flex-col items-start gap-2.5 flex-1 grow flex relative">
                <form
                    className="header-search-form"
                    role="search"
                    onSubmit={(e) => {
                        e.preventDefault();
                        console.log("Search submitted:", searchQuery);
                    }}
                >
                    <label htmlFor="search-input" className="sr-only">
                        검색
                    </label>
                    <input
                        id="search-input"
                        type="search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="검색어를 입력하세요"
                        className="search-input"
                        aria-label="검색어 입력"
                    />

                    <button
                        type="button"
                        className="inline-flex flex-col items-start gap-2.5 p-[0.5px] relative flex-[0_0_auto]"
                        aria-label="음성 검색"
                    >
                        <img
                            className="relative w-[9px] h-1.5 mt-[-0.50px] mb-[-0.50px] ml-[-0.50px] mr-[-0.50px]"
                            alt=""
                            src="https://c.animaapp.com/vpqlbV8X/img/vector.svg"
                        />
                    </button>

                    <div
                        className="search-divider"
                        aria-hidden="true"
                    />

                    <button type="submit" aria-label="검색">
                        <img
                            className="relative flex-[0_0_auto]"
                            alt=""
                            src="https://c.animaapp.com/vpqlbV8X/img/search.svg"
                        />
                    </button>
                </form>
            </div>

            <nav
                className="inline-flex items-center gap-5 relative"
                aria-label="주요 메뉴"
            >
                <button
                    className="inline-flex flex-col items-center gap-px p-px relative flex-[0_0_auto]"
                    aria-label="알림"
                >
                    <img
                        className="w-[23.29px] aspect-[0.95] relative h-[24.5px] mt-[-0.75px] mb-[-0.75px] ml-[-0.75px] mr-[-0.75px]"
                        alt=""
                        src="https://c.animaapp.com/vpqlbV8X/img/group@2x.png"
                    />
                </button>

                <button
                    className="flex flex-col w-6 h-[23px] items-start gap-2.5 p-px relative"
                    aria-label="찜하기"
                >
                    <img
                        className="relative flex-1 self-stretch w-full grow mt-[-0.75px] mb-[-0.75px] ml-[-0.75px] mr-[-0.75px]"
                        alt=""
                        src="https://c.animaapp.com/vpqlbV8X/img/vector-1.svg"
                    />
                </button>

                <a href="/mypage" aria-label="마이페이지">
                    <img
                        className="relative flex-[0_0_auto]"
                        alt=""
                        src="https://c.animaapp.com/vpqlbV8X/img/mypage.svg"
                    />
                </a>

                <a
                    href="/cart"
                    className="inline-flex flex-col items-start gap-2.5 p-px relative flex-[0_0_auto]"
                    aria-label={`장바구니 ${cartItemCount}개 상품`}
                >
                    <img
                        className="w-[21.81px] aspect-[0.88] relative h-[24.5px] mt-[-0.75px] mb-[-0.75px] ml-[-0.75px] mr-[-0.75px]"
                        alt=""
                        src="https://c.animaapp.com/vpqlbV8X/img/group-1@2x.png"
                    />

                    {cartItemCount > 0 && (
                        <div
                            className="cart-badge-container"
                            aria-hidden="true"
                        >
                            <div className="cart-badge-count">
                                {cartItemCount}
                            </div>
                        </div>
                    )}
                </a>
            </nav>
        </header>
    );
}