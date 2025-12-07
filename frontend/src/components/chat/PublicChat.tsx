import { useEffect, useRef, useState } from "react";
import type { PublicChat, User, ChatMessagePayload } from "../../common/types";

// -----------------------------
// PublicChat 컴포넌트
// -----------------------------
type Props = {
    user: User;
};

export default function PublicChat({ user }: Props) {
    const [messages, setMessages] = useState<PublicChat[]>([]);
    const [input, setInput] = useState("");
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const ws = useRef<WebSocket | null>(null);

    const isLocal = window.location.hostname === "localhost";
    const backendHost = isLocal ? "http://localhost:8080" : "";

    // 1. 초기 메시지 불러오기
    useEffect(() => {
        fetch(`${backendHost}/api/chats/public/recent`, { credentials: "include" })
            .then((res) => res.json())
            .then((data: PublicChat[]) => setMessages(data))
            .catch((err) => console.error("공개 채팅 불러오기 실패", err));
    }, [backendHost]);

    // 2. WebSocket 연결
    useEffect(() => {
        const protocol = window.location.protocol === "https:" ? "wss" : "ws";
        const host = isLocal ? "localhost:8080" : window.location.host;
        const url = `${protocol}://${host}/ws/public-chat?userId=${user.userId}`;

        console.log("[PublicChat WebSocket] 연결 시도 URL:", url);

        ws.current = new WebSocket(url);

        ws.current.onopen = () => console.log("PublicChat WebSocket 연결 성공");

        ws.current.onmessage = (event) => {
            console.log("[PublicChat WebSocket] 수신 메시지:", event.data);
            try {
                const data: any = JSON.parse(event.data);
                if (!data.user && data.nickName) {
                    data.user = { userId: data.userId, nickName: data.nickName };
                }

                // PUBLIC 메시지만 처리
                if (data.type === "PUBLIC") {
                    setMessages((prev) => [...prev, data]);
                }
            } catch (err) {
                console.error("메시지 파싱 오류:", err);
            }
        };

        ws.current.onclose = () => console.log("PublicChat WebSocket 종료");
        ws.current.onerror = (err) => console.error("PublicChat 웹소켓 에러:", err);

        return () => {
            ws.current?.close();
        };
    }, [user.userId, isLocal]);

    // 3. 자동 스크롤
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // 4. 메시지 전송
    const sendMessage = () => {
        if (!input.trim() || !ws.current) return;
        if (ws.current.readyState !== WebSocket.OPEN) return;

        const payload: ChatMessagePayload = {
            type: "PUBLIC",
            userId: user.userId,
            content: input,
            nickName: user.nickName,
        };

        ws.current.send(JSON.stringify(payload));
        setInput("");
    };

    return (
        <div className="flex-1 flex flex-col max-w-[1280px] mx-auto w-full h-[calc(100vh-120px)] p-5">
            <h1 className="mb-3 text-xl font-bold border-b pb-2">공개 채팅</h1>

            <div className="border border-[#ccc] p-3 w-full h-full flex flex-col rounded-lg shadow-sm bg-white">
                <div className="flex-1 overflow-y-auto mb-3 p-2 bg-gray-50 rounded border border-[#eee]">
                    {messages.map((msg, i) => (
                        <div
                            key={i}
                            className="mb-2"
                            style={{ textAlign: msg.user?.userId === user?.userId ? "right" : "left" }}
                        >
                            <b>{msg.user?.userId === user?.userId ? "나" : msg.user?.nickName}:</b>{" "}
                            {msg.content}
                            {msg.createdAt && (
                                <span className="text-[#888] ml-2 text-xs">
                                    {new Date(msg.createdAt).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}
                                </span>
                            )}
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                        className="flex-1 p-2 border border-[#ddd] rounded focus:outline-none focus:border-[#111]"
                        placeholder="메시지를 입력하세요..."
                    />
                    <button onClick={sendMessage} className="px-4 py-2 bg-[#333] text-white rounded hover:bg-[#555] transition-colors">
                        전송
                    </button>
                </div>
            </div>
        </div>
    );
}