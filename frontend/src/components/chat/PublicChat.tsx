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
        <div className="container mx-auto flex flex-col p-5 h-[calc(100vh-160px)]">
            <h1 className="mb-3 text-xl font-bold border-b pb-2">공개 채팅</h1>

            <div className="border border-[#ccc] p-3 w-full h-full flex flex-col rounded-lg shadow-sm bg-white">
                <div className="flex-1 overflow-y-auto mb-3 p-4 bg-gray-50 rounded-lg border border-[#eee]">
                    {messages.map((msg, i) => {
                        const isMe = msg.user?.userId === user?.userId;
                        const isAdmin = user.role === "ADMIN";
                        const isDeleted = msg.isDeleted; // 백엔드 isDeleted 필드 (boolean)

                        // 닉네임 표시 로직 (관리자는 "닉네임(실명)" 형태)
                        const displayName = isAdmin && msg.user?.userName
                            ? `${msg.user.nickName} (${msg.user.userName})`
                            : msg.user?.nickName;

                        if (isDeleted) {
                            return (
                                <div key={i} className={`mb-3 flex ${isMe ? "justify-end" : "justify-start"}`}>
                                    <div className="bg-gray-100 text-gray-400 px-4 py-2 rounded-lg text-sm italic border border-gray-200">
                                        관리자에 의해 삭제된 메시지입니다.
                                    </div>
                                </div>
                            );
                        }

                        return (
                            <div key={i} className={`mb-3 flex ${isMe ? "justify-end" : "justify-start"}`}>
                                <div className={`max-w-[70%] flex flex-col ${isMe ? "items-end" : "items-start"}`}>

                                    {/* 유저 이름 (관리자: 클릭 시 제재 메뉴) */}
                                    {!isMe && (
                                        <div
                                            className={`text-xs text-gray-500 mb-1 font-bold ${isAdmin ? "cursor-pointer hover:text-red-500 hover:underline" : ""}`}
                                            onClick={() => {
                                                if (isAdmin) {
                                                    // TODO: 제재 메뉴 (모달 or 드롭다운) 구현 필요
                                                    if (window.confirm(`'${displayName}' 님을 제재(경고/정지) 하시겠습니까?`)) {
                                                        alert("제재 기능은 아직 구현되지 않았습니다.");
                                                    }
                                                }
                                            }}
                                        >
                                            {displayName}
                                        </div>
                                    )}

                                    {/* 메시지 내용 (관리자: 클릭 시 삭제 메뉴) */}
                                    <div
                                        className={`relative group px-4 py-2 rounded-lg shadow-sm cursor-pointer transition-all hover:shadow-md 
                                            ${isMe ? "bg-[#333] text-white rounded-br-none" : "bg-white border border-gray-200 text-black rounded-bl-none"}
                                        `}
                                        onClick={() => {
                                            if (isAdmin) {
                                                if (window.confirm("이 메시지를 삭제하시겠습니까?")) {
                                                    const token = localStorage.getItem("token");
                                                    fetch(`${backendHost}/api/chats/public/${msg.publicChatId}`, {
                                                        method: "DELETE",
                                                        headers: { Authorization: `Bearer ${token}` }
                                                    }).then(res => {
                                                        if (res.ok) {
                                                            setMessages(prev => prev.map(m => m.publicChatId === msg.publicChatId ? { ...m, isDeleted: true } : m));
                                                        } else {
                                                            alert("삭제 실패");
                                                        }
                                                    });
                                                }
                                            }
                                        }}
                                        title={isAdmin ? "클릭하여 메시지 삭제" : ""}
                                    >
                                        <div className="text-sm break-all whitespace-pre-wrap">{msg.content}</div>
                                    </div>

                                    {/* 시간 표시 */}
                                    <div className="text-[10px] text-gray-400 mt-1 px-1">
                                        {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                {user.role !== "ADMIN" ? (
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && !e.nativeEvent.isComposing && sendMessage()}
                            className="flex-1 p-3 border border-[#ddd] rounded-lg focus:outline-none focus:border-[#111] text-sm shadow-sm"
                            placeholder="메시지를 입력하세요..."
                        />
                        <button onClick={sendMessage} className="px-6 py-2 bg-[#111] text-white rounded-lg hover:bg-[#333] transition-colors font-bold text-sm shadow-md">
                            전송
                        </button>
                    </div>
                ) : (
                    <div className="p-3 bg-gray-100 text-center text-gray-500 text-sm rounded-lg border border-gray-200">
                        🔒 관리자 모드: 메시지를 클릭하여 삭제하거나, 유저 이름을 클릭하여 제재할 수 있습니다.
                    </div>
                )}
            </div>
        </div>
    );
}