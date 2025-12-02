import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

// -----------------------------
// 타입 정의
// -----------------------------
interface User {
  userId: number;
  nickName: string;
}

interface PrivateChat {
  user?: User;
  content: string;
  type: "PRIVATE";
  createdAt?: string;
  chatRoomId?: number;
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
  chatRoomId?: number;
}

interface UserChatProps {
  user: User | null;
}

// -----------------------------
// UserChat 컴포넌트
// -----------------------------
export default function UserChat({ user }: UserChatProps) {
  const location = useLocation();
  const state =
    (location.state as { sellerId?: number; productId?: number }) || undefined;

  const [messages, setMessages] = useState<(PrivateChat | PublicChat)[]>([]);
  const [input, setInput] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<number | undefined>(
    state?.productId
  );
  const [chatRoomId, setChatRoomId] = useState<number | null>(null);

  const ws = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const isLocal = window.location.hostname === "localhost";
  const backendHost = isLocal ? "http://localhost:8080" : "";

  // -----------------------------
  // 1. 유저 목록 불러오기
  // -----------------------------
  useEffect(() => {
    if (!user) return;

    fetch(`${backendHost}/api/chats/users`, { credentials: "include" })
      .then((res) => res.json())
      .then((data: User[]) => {
        const filtered = data.filter((u) => u.userId !== user.userId);
        setUsers(filtered);

        if (state?.sellerId) {
          const seller = filtered.find((u) => u.userId === state.sellerId);
          if (seller) setSelectedUser(seller);
        }
      })
      .catch((err) => console.error("유저 목록 로딩 실패", err));
  }, [user, state]);

  // -----------------------------
  // 2. 공개 채팅 초기 메시지
  // -----------------------------
  useEffect(() => {
    if (!user || selectedUser) return;

    fetch(`${backendHost}/api/chats/public/recent`, { credentials: "include" })
      .then((res) => res.json())
      .then((data: PublicChat[]) => setMessages(data))
      .catch((err) => console.error("공개 채팅 불러오기 실패", err));
  }, [user, selectedUser]);

  // -----------------------------
  // 3. 개인채팅 초기 메시지
  // -----------------------------
  useEffect(() => {
    if (!user || !selectedUser || !selectedProductId) return;

    const loadPrivateMessages = async () => {
      try {
        // 1) 채팅방 조회/생성
        const roomRes = await fetch(
          `${backendHost}/api/chats/private/room?userId=${user.userId}&targetUserId=${selectedUser.userId}&productId=${selectedProductId}`,
          { credentials: "include" }
        );

        if (!roomRes.ok) throw new Error("채팅방 조회 실패");

        const roomData = await roomRes.json();

        const roomId = roomData[0].chatRoomId; // ChatRoomDto id 사용
        console.log("roomData:", roomData); // 객체 그대로 출력
        console.log("roomId:", roomId); // roomId 값만 출력
        setChatRoomId(roomId);



        const msgData: PrivateChat[] = roomData;
        setMessages(msgData);
      } catch (e) {
        console.error("1:1 채팅 내역 불러오기 실패", e);
      }
    };

    loadPrivateMessages();
  }, [user, selectedUser, selectedProductId]);

  // -----------------------------
  // 4. WebSocket 연결
  // -----------------------------
  useEffect(() => {
    if (!user) return;
    if (selectedUser && !selectedProductId) return;

    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const host = isLocal ? "localhost:8080" : window.location.host;

    const url = selectedUser
      ? `${protocol}://${host}/ws/chat?userId=${user.userId}&targetUserId=${selectedUser.userId}&productId=${selectedProductId}`
      : `${protocol}://${host}/ws/chat?userId=${user.userId}`;

    ws.current?.close();
    ws.current = new WebSocket(url);

    ws.current.onopen = () => console.log("WebSocket 연결 성공");

    ws.current.onmessage = (event) => {
      try {
        const data: any = JSON.parse(event.data);

        if (!data.user && data.nickName) {
          data.user = { userId: data.userId, nickName: data.nickName };
        }

        // PUBLIC 메시지
        if (!selectedUser && data.type === "PUBLIC") {
          setMessages((prev) => [...prev, data]);
          return;
        }

        // PRIVATE 메시지
        if (selectedUser && data.type === "PRIVATE") {
          if (chatRoomId && data.chatRoomId === chatRoomId) {
            setMessages((prev) => [...prev, data]);
          }
        }
      } catch (err) {
        console.error("메시지 파싱 오류:", err);
      }
    };

    ws.current.onclose = () => console.log("웹소켓 종료");
    ws.current.onerror = (err) => console.error("웹소켓 에러:", err);

    return () => ws.current?.close();
  }, [user, selectedUser, selectedProductId, chatRoomId, isLocal]);

  // -----------------------------
  // 5. 자동 스크롤
  // -----------------------------
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // -----------------------------
  // 6. 메시지 전송
  // -----------------------------
  const sendMessage = () => {
    if (!input.trim() || !user || !ws.current) return;
    if (ws.current.readyState !== WebSocket.OPEN) return;

    const isPrivate = !!selectedUser;

    if (isPrivate && !selectedProductId) {
      alert("상품을 선택해야 개인채팅이 가능합니다.");
      return;
    }

    const payload: ChatMessagePayload = {
      type: isPrivate ? "PRIVATE" : "PUBLIC",
      userId: user.userId,
      content: input,
      nickName: user.nickName,
      ...(isPrivate
        ? { targetUserId: selectedUser?.userId, productId: selectedProductId, chatRoomId: chatRoomId || undefined } // ✅ chatRoomId 사용
        : {}),
        
    };


    ws.current.send(JSON.stringify(payload));
    setInput("");
  };

  // -----------------------------
  // 7. 화면 렌더링
  // -----------------------------
  return (
    <div style={{ display: "flex", gap: "10px", padding: "20px" }}>
      {/* 유저 목록 */}
      <div style={{ width: "150px", borderRight: "1px solid #ccc" }}>
        <div
          style={{
            padding: "5px",
            cursor: "pointer",
            fontWeight: !selectedUser ? "bold" : "normal",
          }}
          onClick={() => {
            setSelectedUser(null);
            setSelectedProductId(undefined);
            setChatRoomId(null);
            setMessages([]);
          }}
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
            onClick={() => {
              setSelectedUser(u);
              setSelectedProductId(state?.productId);
              setChatRoomId(null);
              setMessages([]);
            }}
          >
            {u.nickName}
          </div>
        ))}
      </div>

      {/* 메시지 영역 */}
      <div style={{ flex: 1 }}>
        <h1>
          {selectedUser
            ? `1:1 채팅 - ${selectedUser.nickName}`
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
              <div
                key={i}
                style={{
                  textAlign:
                    msg.user?.userId === user?.userId ? "right" : "left",
                }}
              >
                <b>{msg.user?.userId === user?.userId ? "나" : msg.user?.nickName}:</b>{" "}
                {msg.content}
                <span
                  style={{
                    color: "#888",
                    marginLeft: "6px",
                    fontSize: "12px",
                  }}
                >
                  {msg.createdAt
                    ? new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
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
