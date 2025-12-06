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
            <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-50 items-end">

                {/* Scroll To Top Button */}
                <button
                    onClick={scrollToTop}
                    className={`bg-white border border-[#eee] text-[#333] p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center ${showTopBtn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
                        }`}
                    aria-label="맨 위로"
                >
                    <ArrowUp size={20} />
                </button>

                {/* AI Chatbot Button */}
                <button
                    onClick={() => setIsChatOpen(true)}
                    className="bg-white border border-[#eee] text-[#333] p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 group relative"
                    aria-label="AI 챗봇 열기"
                >
                    <Bot size={24} />

                    {/* Tooltip (Hover) */}
                    <span className="absolute right-full top-1/2 -translate-y-1/2 mr-3 px-2 py-1 bg-black/70 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        AI 챗봇 문의
                    </span>
                </button>
            </div>

            {/* AI Chatbot Modal */}
            <AIChatBot isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
        </>
    );
}
