import { useEffect, useRef, useState } from "react";
import type { User, PrivateChat, PublicChat, ChatMessagePayload } from "../../types/types";

interface UserChatProps {
  user: User | null;
}

export default function UserChat({ user }: UserChatProps) {
  const [messages, setMessages] = useState<(PrivateChat | PublicChat)[]>([]);
  const [input, setInput] = useState("");
  const ws = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // WebSocket 연결
  useEffect(() => {
    if (!user) return;

    ws.current = new WebSocket("ws://localhost:8080/ws/chat");

    ws.current.onopen = () => console.log("WebSocket 연결 성공");

    ws.current.onmessage = (event) => {
      try {
        const data: PrivateChat | PublicChat = JSON.parse(event.data);
        setMessages((prev) => [...prev, data]);
      } catch (err) {
        console.error("메시지 파싱 오류:", err);
      }
    };

    ws.current.onclose = () => console.log("WebSocket 연결 종료");
    ws.current.onerror = (err) => console.error("WebSocket 오류:", err);

    return () => ws.current?.close();
  }, [user]);

  // 새 메시지 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 메시지 전송
  const sendMessage = (isPrivate = false, targetUserId?: number) => {
    if (!input.trim() || !user || !ws.current || ws.current.readyState !== WebSocket.OPEN) return;

    const payload: ChatMessagePayload = {
      type: isPrivate ? "private" : "public",
      userId: user.userId,
      content: input,
      ...(isPrivate && targetUserId ? { targetUserId } : {}),
    };

    ws.current.send(JSON.stringify(payload));
    setInput("");
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>채팅 페이지</h1>
      <div
        style={{
          border: "1px solid #ccc",
          padding: "10px",
          width: "400px",
          height: "500px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ flex: 1, overflowY: "auto", marginBottom: "10px" }}>
          {messages.map((msg, i) => (
            <div key={i}>
              <b>{msg.user?.nickName ?? "익명"}:</b> {msg.content}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <div style={{ display: "flex" }}>
          <input
            style={{ flex: 1, padding: "5px" }}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <button onClick={() => sendMessage()} style={{ marginLeft: "5px" }}>
            전송
          </button>
        </div>
      </div>
    </div>
  );
}
