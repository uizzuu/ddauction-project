import { useState, useEffect } from "react";
import { Bot, ArrowUp } from "lucide-react";
import AIChatBot from "../chat/AIChatBot";

export default function FloatingWidgets() {
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [showTopBtn, setShowTopBtn] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 300) {
                setShowTopBtn(true);
            } else {
                setShowTopBtn(false);
            }
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    return (
        <>
            {/* Floating Buttons Container */}
            <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 flex flex-col gap-3 z-50 items-end">

                {/* Scroll To Top Button */}
                <button
                    onClick={scrollToTop}
                    className={`bg-white border border-[#eee] text-[#333] p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center ${showTopBtn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
                        }`}
                    aria-label="맨 위로"
                >
                    <ArrowUp size={20} />
                </button>

                {/* AI Chatbot Button - 채팅창 열릴 때 숨김 */}
                {!isChatOpen && (
                    <button
                        onClick={() => setIsChatOpen(true)}
                        className="bg-white border border-[#eee] text-[#333] p-3 rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300"
                        aria-label="AI 챗봇 열기"
                    >
                        <Bot size={24} />
                    </button>
                )}
            </div>

            {/* AI Chatbot Modal */}
            <AIChatBot isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
        </>
    );
}
