import { useEffect, useRef, useState } from "react";
import type { User, PrivateChat, ChatMessagePayload } from "../../common/types";

interface PrivateChatProps {
user: User | null;
selectedUser: User | null; // 대화 상대
}

export default function PrivateChat({ user, selectedUser }: PrivateChatProps) {
const [messages, setMessages] = useState<PrivateChat[]>([]);
const [input, setInput] = useState("");
const ws = useRef<WebSocket | null>(null);
const messagesEndRef = useRef<HTMLDivElement | null>(null);

// WebSocket 연결
useEffect(() => {
if (!user) return;


// 선택 상대가 없으면 연결하지 않음
if (!selectedUser) return;

// 기존 연결 종료
ws.current?.close();

// WebSocket 연결 (userId 쿼리 포함)
ws.current = new WebSocket(
  `ws://localhost:8080/ws/chat?userId=${user.userId}&targetUserId=${selectedUser.userId}`
);

ws.current.onopen = () => console.log("WebSocket 연결 성공");

ws.current.onmessage = (event) => {
  try {
    const data: PrivateChat = JSON.parse(event.data);

    // 현재 선택한 상대와 관련된 메시지만 추가
    if (
      (data.user.userId === user.userId && data.targetUserId === selectedUser.userId) ||
      (data.user.userId === selectedUser.userId && data.targetUserId === user.userId)
    ) {
      setMessages((prev) => [...prev, data]);
    }
  } catch (err) {
    console.error("메시지 파싱 오류:", err);
  }
};

ws.current.onclose = () => console.log("WebSocket 연결 종료");
ws.current.onerror = (err) => console.error("WebSocket 오류:", err);

// 선택 상대가 바뀌면 메시지 초기화
setMessages([]);

return () => ws.current?.close();


}, [user, selectedUser]);

// 새 메시지 자동 스크롤
useEffect(() => {
messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
}, [messages]);

// 메시지 전송
const sendMessage = () => {
if (!input.trim() || !user || !selectedUser || !ws.current || ws.current.readyState !== WebSocket.OPEN) return;


const payload: ChatMessagePayload = {
  type: "PRIVATE",
  userId: user.userId,
  targetUserId: selectedUser.userId,
  content: input,
  nickName: user.nickName,
};

ws.current.send(JSON.stringify(payload));
setInput("");

// 서버에서 다시 받아 표시되므로 로컬 추가는 선택사항
// setMessages((prev) => [...prev, { ...payload, createdAt: new Date().toISOString(), user }]);


};

return (
<div style={{ padding: "20px" }}> <h2>1:1 채팅 - {selectedUser?.nickName ?? "선택하세요"}</h2>
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
<div
key={i}
style={{ textAlign: msg.user.userId === user?.userId ? "right" : "left" }}
> <b>{msg.user.userId === user?.userId ? "나" : msg.user.nickName}:</b>{" "}
{msg.content}
<span style={{ color: "#888", marginLeft: "6px", fontSize: "12px" }}>
{msg.createdAt
? new Date(msg.createdAt).toLocaleTimeString([], {
hour: "2-digit",
minute: "2-digit",
})
: ""} </span> </div>
))} <div ref={messagesEndRef} /> </div>
<div style={{ display: "flex" }}>
<input
style={{ flex: 1, padding: "5px" }}
type="text"
value={input}
onChange={(e) => setInput(e.target.value)}
onKeyDown={(e) => e.key === "Enter" && sendMessage()}
/>
<button onClick={sendMessage} style={{ marginLeft: "5px" }}>
전송 </button> </div> </div> </div>
);
}
