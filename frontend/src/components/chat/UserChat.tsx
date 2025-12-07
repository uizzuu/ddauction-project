import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import type { UserChatProps, PrivateChat, ChatMessagePayload, User } from "../../common/types";


// -----------------------------
// UserChat 컴포넌트
// -----------------------------
export default function UserChat({ user }: UserChatProps) {
  const location = useLocation();
  const state =
    (location.state as { sellerId?: number; productId?: number }) || undefined;



  const [messages, setMessages] = useState<PrivateChat[]>([]);
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
  // 3. 개인채팅 초기 메시지
  // -----------------------------
  useEffect(() => {
    if (!user || !selectedUser || !selectedProductId) return;

    const loadPrivateMessages = async () => {
      console.log("[DEBUG] 개인채팅 fetch 시작", { user, selectedUser, selectedProductId });
      try {
        // ✅ 이제 userId, targetUserId, productId로 직접 조회
        const msgRes = await fetch(
          `${backendHost}/api/chats/private/messages?userId=${user.userId}&targetUserId=${selectedUser.userId}&productId=${selectedProductId}`,
          { credentials: "include" }
        );

        console.log("[DEBUG] 메시지 fetch 상태", msgRes.status);

        if (!msgRes.ok) throw new Error("메시지 조회 실패");

        const msgData = await msgRes.json();
        console.log("[DEBUG] 메시지 데이터", msgData);

        setMessages(msgData);

        // chatRoomId 설정 (첫 번째 메시지가 있으면)
        if (msgData.length > 0 && msgData[0].chatRoomId) {
          setChatRoomId(msgData[0].chatRoomId);
        }

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
    if (!selectedUser) return;

    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const host = isLocal ? "localhost:8080" : window.location.host;

    const url = `${protocol}://${host}/ws/chat?userId=${user.userId}&targetUserId=${selectedUser.userId}`;

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
  }, [user, selectedUser, selectedProductId, isLocal, chatRoomId]);

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
    if (!input.trim() || !user || !ws.current || !selectedUser) return;
    if (ws.current.readyState !== WebSocket.OPEN) return;

    if (!selectedProductId) {
      alert("상품을 선택해야 개인채팅이 가능합니다.");
      return;
    }

    const payload: ChatMessagePayload = {
      type: "PRIVATE",
      userId: user.userId,
      content: input,
      nickName: user.nickName,
      targetUserId: selectedUser.userId,
      productId: selectedProductId,
      chatRoomId: chatRoomId || undefined,
    };

    ws.current.send(JSON.stringify(payload));
    setInput("");
  };

  // -----------------------------
  // 7. 화면 렌더링
  // -----------------------------
  return (
    <div className="flex gap-4 p-5 h-[calc(100vh-120px)] max-w-[1280px] mx-auto">
      {/* 유저 목록 */}
      <div className="w-[180px] border-r border-[#ccc] pr-4 flex flex-col gap-1">


        {users.map((u) => (
          <div
            key={u.userId}
            className={`p-2 cursor-pointer transition-colors hover:bg-gray-100 rounded ${selectedUser?.userId === u.userId ? "font-bold bg-gray-100" : ""}`}
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
      {!selectedUser ? (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          채팅 상대를 선택해주세요.
        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          <h1 className="mb-3 text-xl font-bold border-b pb-2">
            1:1 채팅 - {selectedUser.nickName}
          </h1>

          <div className="border border-[#ccc] p-3 w-full h-full flex flex-col rounded-lg shadow-sm bg-white">
            <div className="flex-1 overflow-y-auto mb-3 p-2 bg-gray-50 rounded border border-[#eee]">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className="mb-2"
                  style={{
                    textAlign: msg.user?.userId === user?.userId ? "right" : "left",
                  }}
                >
                  <b>
                    {msg.user?.userId === user?.userId
                      ? "나"
                      : msg.user?.nickName}
                    :
                  </b>{" "}
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
              <button
                onClick={sendMessage}
                className="px-4 py-2 bg-[#333] text-white rounded hover:bg-[#555] transition-colors"
              >
                전송
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}