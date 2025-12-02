import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

interface User {
userId: number;
nickName: string;
}

interface PrivateChat {
user?: User;
targetUserId?: number;
content: string;
type: "PRIVATE" | "PUBLIC";
createdAt?: string;
productId?: number;
}

interface PublicChat {
user?: User;
content: string;
type: "PUBLIC";
createdAt?: string;
}

interface ChatMessagePayload {
type: "PRIVATE" | "PUBLIC";
userId: number;
content: string;
nickName: string;
targetUserId?: number;
productId?: number;
}

interface UserChatProps {
user: User | null;
}

export default function UserChat({ user }: UserChatProps) {
const location = useLocation();
const state = location.state as { sellerId?: number; productId?: number } | undefined;

const [messages, setMessages] = useState<(PrivateChat | PublicChat)[]>([]);
const [input, setInput] = useState("");
const [users, setUsers] = useState<User[]>([]);
const [selectedUser, setSelectedUser] = useState<User | null>(null);
const [selectedProductId, setSelectedProductId] = useState<number | undefined>(state?.productId);

const ws = useRef<WebSocket | null>(null);
const messagesEndRef = useRef<HTMLDivElement | null>(null);

// 유저 목록 가져오기
useEffect(() => {
if (!user) return;


fetch("http://localhost:8080/api/chats/users", { credentials: "include" })
  .then((res) => res.json())
  .then((data: User[]) => {
    const filtered = data.filter((u) => u.userId !== user.userId);
    setUsers(filtered);

    if (state?.sellerId) {
      const seller = filtered.find((u) => u.userId === state.sellerId);
      if (seller) setSelectedUser(seller);
    }
  })
  .catch((err) => console.error("유저 목록 가져오기 실패", err));


}, [user, state]);

// 공개 채팅 초기 메시지
useEffect(() => {
if (!user || selectedUser) return;


fetch("http://localhost:8080/api/chats/public/recent", { credentials: "include" })
  .then((res) => res.json())
  .then((data: PublicChat[]) => setMessages(data))
  .catch((err) => console.error("공개 채팅 불러오기 실패", err));


}, [user, selectedUser]);

// 1:1 채팅 초기 메시지
useEffect(() => {
if (!user || !selectedUser || !selectedProductId) return;


fetch(
  `http://localhost:8080/api/chats/private?userId=${user.userId}&targetUserId=${selectedUser.userId}&productId=${selectedProductId}`,
  { credentials: "include" }
)
  .then((res) => res.json())
  .then((data: PrivateChat[]) => setMessages(data))
  .catch((err) => console.error("1:1 채팅 불러오기 실패", err));


}, [user, selectedUser, selectedProductId]);

// 유저 선택 시 messages 초기화
useEffect(() => {
setMessages([]);
}, [selectedUser, selectedProductId]);

// WebSocket 연결
useEffect(() => {
if (!user) return;
if (selectedUser && !selectedProductId) return;


const url = selectedUser
  ? `ws://localhost:8080/ws/chat?userId=${user.userId}&targetUserId=${selectedUser.userId}&productId=${selectedProductId}`
  : `ws://localhost:8080/ws/chat?userId=${user.userId}`;

ws.current?.close();
ws.current = new WebSocket(url);

ws.current.onopen = () => console.log("WebSocket 연결 성공");

ws.current.onmessage = (event) => {
  try {
    const data: PrivateChat | PublicChat = JSON.parse(event.data);

    if (!data.user && (data as any).nickName) {
      data.user = {
        userId: (data as any).userId,
        nickName: (data as any).nickName,
      };
    }

    if (!selectedUser && data.type === "PUBLIC") {
      setMessages((prev) => [...prev, data]);
      return;
    }

    if (selectedUser && data.type === "PRIVATE") {
      if (!selectedProductId && data.productId) {
        setSelectedProductId(data.productId);
      }

      const isMyMsg = data.user?.userId === user.userId;
      const isFromTarget = data.user?.userId === selectedUser.userId;

      if (isMyMsg || isFromTarget) {
        setMessages((prev) => [...prev, data]);
      }
      return;
    }
  } catch (err) {
    console.error("메시지 파싱 오류:", err);
  }
};

ws.current.onclose = () => console.log("WebSocket 연결 종료");
ws.current.onerror = (err) => console.error("WebSocket 오류:", err);

return () => ws.current?.close();


}, [user, selectedUser, selectedProductId]);

// 자동 스크롤
useEffect(() => {
messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
}, [messages]);

const sendMessage = () => {
if (!input.trim() || !user || !ws.current || ws.current.readyState !== WebSocket.OPEN) return;


const isPrivate = !!selectedUser;

if (isPrivate && !selectedProductId) {
  alert("상품을 선택해야 1:1 채팅을 할 수 있습니다.");
  return;
}

const payload: ChatMessagePayload = {
  type: isPrivate ? "PRIVATE" : "PUBLIC",
  userId: user.userId,
  content: input,
  nickName: user.nickName,
  ...(isPrivate && selectedUser ? { targetUserId: selectedUser.userId, productId: selectedProductId } : {}),
};

ws.current.send(JSON.stringify(payload));
setInput("");


};

return (
<div style={{ display: "flex", gap: "10px", padding: "20px" }}>
<div style={{ width: "150px", borderRight: "1px solid #ccc" }}>
<div
style={{ padding: "5px", cursor: "pointer", fontWeight: !selectedUser ? "bold" : "normal" }}
onClick={() => {
setSelectedUser(null);
setSelectedProductId(undefined);
}}
>
공개 채팅 </div>


    {users.map((u) => (
      <div
        key={u.userId}
        style={{
          padding: "5px",
          cursor: "pointer",
          fontWeight: selectedUser?.userId === u.userId ? "bold" : "normal",
        }}
        onClick={() => {
          setSelectedUser(u);
          setSelectedProductId(state?.productId);
        }}
      >
        {u.nickName}
      </div>
    ))}
  </div>

  <div style={{ flex: 1 }}>
    <h1>
      {selectedUser
        ? `1:1 채팅${selectedProductId ? ` - ${selectedUser.nickName}` : " (상품 선택 필요)"}`
        : "공개 채팅"}
    </h1>

    <div
      style={{
        border: "1px solid #ccc",
        padding: "10px",
        width: "100%",
        height: "500px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ flex: 1, overflowY: "auto", marginBottom: "10px" }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ textAlign: msg.user?.userId === user?.userId ? "right" : "left" }}>
            <b>{msg.user?.userId === user?.userId ? "나" : msg.user?.nickName}:</b> {msg.content}
            <span style={{ color: "#888", marginLeft: "6px", fontSize: "12px" }}>
              {msg.createdAt
                ? new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                : ""}
            </span>
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
        <button onClick={sendMessage} style={{ marginLeft: "5px" }}>
          전송
        </button>
      </div>
    </div>
  </div>
</div>


);
}
