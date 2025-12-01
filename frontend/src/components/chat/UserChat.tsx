import { useEffect, useRef, useState } from "react";

// 프론트에서 사용할 타입 정의
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
}

interface UserChatProps {
  user: User | null;
}

export default function UserChat({ user }: UserChatProps) {
  const [messages, setMessages] = useState<(PrivateChat | PublicChat)[]>([]);
  const [input, setInput] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const ws = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // DB에서 유저 목록 가져오기
  useEffect(() => {
    if (!user) return;

    fetch("http://localhost:8080/api/chats/users", { credentials: "include" })
      .then((res) => res.json())
      .then((data: User[]) => {
        const filtered = data.filter((u) => u.userId !== user.userId);
        setUsers(filtered);
      })
      .catch((err) => console.error("유저 목록 가져오기 실패", err));
  }, [user]);

  // 공개채팅 초기 메시지 불러오기
  useEffect(() => {
    if (!user || selectedUser) return; // 공개채팅일 때만
    fetch("http://localhost:8080/api/chats/public/recent", { credentials: "include" })
      .then((res) => res.json())
      .then((data: PublicChat[]) => {
        setMessages(data);
      })
      .catch((err) => console.error("공개 채팅 불러오기 실패", err));
  }, [user, selectedUser]);

  // WebSocket 연결
  useEffect(() => {
    if (!user) return;

    // 선택된 유저가 있으면 1:1 WebSocket, 없으면 공개 채팅 WebSocket
    const url = selectedUser
      ? `ws://localhost:8080/ws/chat?userId=${user.userId}&targetUserId=${selectedUser.userId}`
      : `ws://localhost:8080/ws/chat?userId=${user.userId}`;

    ws.current?.close();
    ws.current = new WebSocket(url);

    ws.current.onopen = () => console.log("WebSocket 연결 성공");

    ws.current.onmessage = (event) => {
      try {
        const data: PrivateChat | PublicChat = JSON.parse(event.data);

        // user 정보 없으면 추가
        if (!data.user && (data as any).nickName) {
          data.user = { userId: (data as any).userId, nickName: (data as any).nickName };
        }

        // PRIVATE 메시지일 경우 선택된 상대와 관련된 메시지만 표시
        if (data.type === "PRIVATE" && selectedUser) {
          if (
            data.user?.userId === selectedUser.userId ||
            data.targetUserId === selectedUser.userId ||
            data.user?.userId === user.userId
          ) {
            setMessages((prev) => [...prev, data]);
          }
        } else {
          setMessages((prev) => [...prev, data]);
        }
      } catch (err) {
        console.error("메시지 파싱 오류:", err);
      }
    };

    ws.current.onclose = () => console.log("WebSocket 연결 종료");
    ws.current.onerror = (err) => console.error("WebSocket 오류:", err);

    return () => ws.current?.close();
  }, [user, selectedUser]);

  // 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 메시지 전송
  const sendMessage = () => {
    if (!input.trim() || !user || !ws.current || ws.current.readyState !== WebSocket.OPEN) return;

    const isPrivate = !!selectedUser;
    const payload: ChatMessagePayload = {
      type: isPrivate ? "PRIVATE" : "PUBLIC",
      userId: user.userId,
      content: input,
      nickName: user.nickName,
      ...(isPrivate && selectedUser ? { targetUserId: selectedUser.userId } : {}),
    };

    ws.current.send(JSON.stringify(payload));
    setInput("");
  };

  return (
    <div style={{ display: "flex", gap: "10px", padding: "20px" }}>
      {/* 좌측: 사용자 목록 */}
      <div style={{ width: "150px", borderRight: "1px solid #ccc" }}>
        <div
          style={{ padding: "5px", cursor: "pointer", fontWeight: !selectedUser ? "bold" : "normal" }}
          onClick={() => setSelectedUser(null)}
        >
          공개 채팅
        </div>
        {users.map((u) => (
          <div
            key={u.userId}
            style={{
              padding: "5px",
              cursor: "pointer",
              fontWeight: selectedUser?.userId === u.userId ? "bold" : "normal",
            }}
            onClick={() => setSelectedUser(u)}
          >
            {u.nickName}
          </div>
        ))}
      </div>

      {/* 우측: 채팅창 */}
      <div style={{ flex: 1 }}>
        <h1>{selectedUser ? `1:1 채팅 - ${selectedUser.nickName}` : "공개 채팅"}</h1>
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
