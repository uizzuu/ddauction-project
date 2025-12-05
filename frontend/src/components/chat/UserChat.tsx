import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import "../../css/UserChat.css";
import type { UserChatProps, PrivateChat, PublicChat, ChatMessagePayload, User } from "../../common/types";

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
        // ✅ ChatRoomDto 단일 객체 반환됨
        const roomRes = await fetch(
          `${backendHost}/api/chats/private/room?userId=${user.userId}&targetUserId=${selectedUser.userId}&productId=${selectedProductId}`,
          { credentials: "include" }
        );

        if (!roomRes.ok) throw new Error("채팅방 조회 실패");

        const roomData = await roomRes.json();

        // --------------------------
        // ✅ 단일 객체에서 chatRoomId 가져옴 (수정됨)
        // --------------------------
        const roomId = roomData.chatRoomId; // ✔ 수정됨

        if (!roomId) {
          setChatRoomId(null);
          setMessages([]);
          return;
        }

        setChatRoomId(roomId); // ✔ 채팅방 ID 저장

        // --------------------------
        // 2단계: 이제 해당 방의 메시지 불러오기 (신규 추가됨)
        // --------------------------
        const msgRes = await fetch(
          `${backendHost}/api/chats/private/messages?chatRoomId=${roomId}`, // ✔ 새로운 엔드포인트 필요
          { credentials: "include" }
        );

        const msgData = await msgRes.json();

        setMessages(msgData); // ✔ 메시지 세팅

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
    // if (selectedUser && !selectedProductId) return;

    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const host = isLocal ? "localhost:8080" : window.location.host;

    const url = selectedUser
  ? `${protocol}://${host}/ws/chat?userId=${user.userId}&targetUserId=${selectedUser.userId}`
  : `${protocol}://${host}/ws/public-chat?userId=${user.userId}`;

    console.log("[WebSocket] 연결 시도 URL:", url); // 🔹 연결 URL 확인

    ws.current?.close();
    ws.current = new WebSocket(url);

    ws.current.onopen = () => console.log("WebSocket 연결 성공");

    ws.current.onmessage = (event) => {
      console.log("[WebSocket] 수신 메시지:", event.data); // 🔹 수신 메시지
      try {
        const data: any = JSON.parse(event.data);
        console.log("[WebSocket] 파싱된 데이터:", data); // 🔹 JSON 확인

        if (!data.user && data.nickName) {
          data.user = { userId: data.userId, nickName: data.nickName };
        }

        // ---------- PUBLIC ----------
        if (!selectedUser && data.type === "PUBLIC") {
          setMessages((prev) => [...prev, data]);
          return;
        }

        // PRIVATE 메시지
        if (data.type === "PRIVATE") {
          if (!chatRoomId && data.chatRoomId) setChatRoomId(data.chatRoomId);
          if (selectedUser && data.chatRoomId === chatRoomId) {
            setMessages((prev) => [...prev, data]);
          }

          // 방 번호가 같으면 메시지 반영
          if (data.chatRoomId === chatRoomId || !chatRoomId) {
            setMessages((prev) => [...prev, data]);
          }

          return;
        }
      } catch (err) {
        console.error("메시지 파싱 오류:", err);
      }
    };


    ws.current.onclose = () => console.log("웹소켓 종료");
    ws.current.onerror = (err) => console.error("웹소켓 에러:", err);

    return () => ws.current?.close();
  }, [user, selectedUser, selectedProductId, isLocal]);

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
        ? { targetUserId: selectedUser?.userId, productId: selectedProductId, chatRoomId: chatRoomId || undefined }
        : {}),
    };

    ws.current.send(JSON.stringify(payload));
    setInput("");
  };

  // -----------------------------
  // 7. 화면 렌더링
  // -----------------------------
  return (
    <div className="user-chat-container">
      {/* 유저 목록 */}
      <div className="user-list">
        <div
          className={!selectedUser ? "selected" : ""}
          onClick={() => {
            ws.current?.close();
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
            className={selectedUser?.userId === u.userId ? "selected" : ""}
            onClick={() => {
              ws.current?.close();
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
      <div className="chat-area">
        <h1>{selectedUser ? `1:1 채팅 - ${selectedUser.nickName}` : "공개 채팅"}</h1>

        <div className="chat-box">
          <div className="chat-messages">
            {messages.map((msg, i) => (
              <div
                key={i}
                className="chat-message"
                style={{ textAlign: msg.user?.userId === user?.userId ? "right" : "left" }}
              >
                <b>{msg.user?.userId === user?.userId ? "나" : msg.user?.nickName}:</b>{" "}
                {msg.content}
                {msg.createdAt && (
                  <span>
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

          <div className="chat-input">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <button onClick={sendMessage}>전송</button>
          </div>
        </div>
      </div>
    </div>
  );
}