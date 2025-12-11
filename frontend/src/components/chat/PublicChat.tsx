import { useEffect, useRef, useState } from "react";
import { fetchRecentPublicChats, deletePublicChat, banUser } from "../../common/api";
import type { PublicChat, User, ChatMessagePayload } from "../../common/types";
import { UserProfileModal } from "../../components/modal/UserProfileModal";

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

  const [profileModalUser, setProfileModalUser] = useState<User | null>(null); // 프로필 모달 상태

  const isLocal = window.location.hostname === "localhost";

  // 관리자 메뉴 상태
  const [activeMenuUser, setActiveMenuUser] = useState<User | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  const toggleUserMenu = (user: User, e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const menuWidth = 128;
    const menuHeight = 110;
    let left = rect.left + window.scrollX;
    let top = rect.top + window.scrollY - menuHeight;

    if (left + menuWidth > window.scrollX + window.innerWidth) {
      left = window.scrollX + window.innerWidth - menuWidth - 8;
    }

    setMenuPosition({ top, left });
    setActiveMenuUser(prev => (prev?.userId === user.userId ? null : user));
  };

  const handleWarn = (user: User) => {
    alert(`${user.nickName}님에게 경고를 보냅니다.`);
    setActiveMenuUser(null);
  };

  const handleBan = async (targetUser: User) => {
    if (!window.confirm(`${targetUser.nickName}님을 밴 처리하시겠습니까?`)) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("로그인 토큰이 없습니다.");
      const adminId = user.userId;

      await banUser(targetUser.userId, token, adminId);

      alert(`${targetUser.nickName}님이 밴 처리되었습니다.`);
      setActiveMenuUser(null);

      setMessages(prev =>
        prev.map(m => (m.user?.userId === targetUser.userId ? { ...m, content: "밴 처리된 사용자" } : m))
      );
    } catch (err) {
      console.error(err);
      alert("밴 처리 중 오류가 발생했습니다.");
    }
  };

  // 프로필 모달 열기
  const viewProfile = async (clickedUser: User) => {
    try {
      const token = localStorage.getItem("token"); // 관리자 토큰
      if (!token) throw new Error("관리자 토큰이 없습니다.");

      const res = await fetch(`/api/users/${clickedUser.userId}`, {
        headers: {
          Authorization: `Bearer ${token}`, // 토큰 반드시 넣어야 서버에서 전체 정보 줌
        },
      });

      if (!res.ok) throw new Error("유저 정보를 불러오지 못했습니다.");

      const fullUser: User = await res.json();
      setProfileModalUser(fullUser); // 모달에 전체 정보 세팅
      setActiveMenuUser(null);
    } catch (err) {
      console.error(err);
      alert("유저 정보를 불러오는 중 오류가 발생했습니다.");
    }
  };

  // 초기 메시지 불러오기
  useEffect(() => {
    fetchRecentPublicChats()
      .then(data => setMessages(data))
      .catch(err => console.error("공개 채팅 불러오기 실패", err));
  }, []);

  // WebSocket 연결
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const host = isLocal ? "localhost:8080" : window.location.host;
    const url = `${protocol}://${host}/ws/public-chat?userId=${user.userId}`;

    ws.current = new WebSocket(url);

    ws.current.onopen = () => console.log("PublicChat WebSocket 연결 성공");

    ws.current.onmessage = (event) => {
      try {
        const data: any = JSON.parse(event.data);
        if (!data.user && data.nickName) {
          data.user = { userId: data.userId, nickName: data.nickName };
        }

        if (data.type === "PUBLIC") {
          setMessages((prev) => [...prev, data]);
        }
      } catch (err) {
        console.error("메시지 파싱 오류:", err);
      }
    };

    ws.current.onclose = () => console.log("PublicChat WebSocket 종료");
    ws.current.onerror = (err) => console.error("PublicChat 웹소켓 에러:", err);

    return () => ws.current?.close();
  }, [user.userId, isLocal]);

  // 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 메시지 전송
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

  // 화면 클릭하면 메뉴 닫기
  useEffect(() => {
    const handleClickOutside = () => setActiveMenuUser(null);
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <div className="max-w-[1280px] mx-auto flex flex-col mt-[20px] h-[calc(100vh-180px)]">
      <div className="border border-[#ccc] p-3 w-full h-full flex flex-col rounded-lg shadow-sm bg-white relative">
        <div className="flex-1 overflow-y-auto mb-3 p-4 bg-gray-50 rounded-lg border border-[#eee]">
          {messages.map((msg, i) => {
            const isMe = msg.user?.userId === user?.userId;
            const isAdmin = user.role === "ADMIN";
            const isDeleted = msg.isDeleted;

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

                  {/* 관리자: 닉네임 + 메뉴 버튼 */}
                  {!isMe && isAdmin && msg.user && (
                    <div className="flex items-center gap-1 mb-1">
                      <div className="text-xs text-gray-500 font-bold cursor-pointer hover:text-red-500 hover:underline">
                        {displayName}
                      </div>

                      <button
                        className="text-gray-400 hover:text-gray-600 px-1"
                        onClick={(e) => toggleUserMenu(msg.user!, e)}
                      >
                        ⋮
                      </button>
                    </div>
                  )}

                  {/* 메시지 내용 */}
                  <div
                    className={`relative group px-4 py-2 rounded-lg shadow-sm cursor-pointer transition-all hover:shadow-md 
                      ${isMe ? "bg-[#333] text-white rounded-br-none" : "bg-white border border-gray-200 text-black rounded-bl-none"}`}
                    onClick={() => {
                      if (isAdmin) {
                        if (window.confirm("이 메시지를 삭제하시겠습니까?")) {
                          deletePublicChat(msg.publicChatId!)
                            .then(() => {
                              setMessages(prev => prev.map(m => m.publicChatId === msg.publicChatId ? { ...m, isDeleted: true } : m));
                            })
                            .catch(() => alert("삭제 실패"));
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

        {/* 관리자 메뉴 포탈 */}
        {activeMenuUser && (
          <div
            className="absolute w-32 bg-white border border-gray-300 rounded shadow-md z-50"
            style={{ top: menuPosition.top, left: menuPosition.left }}
          >
            <div
              className="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer"
              onClick={() => handleWarn(activeMenuUser)}
            >
              ⚠️ 경고
            </div>
            <div
              className="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer"
              onClick={() => handleBan(activeMenuUser)}
            >
              ⛔ 밴
            </div>
            <div
              className="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer"
              onClick={() => viewProfile(activeMenuUser)}
            >
              👤 프로필 확인
            </div>
          </div>
        )}

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
            🔒 관리자 모드: 메시지를 클릭하여 삭제하거나, 유저 이름 옆 ⋮ 버튼으로 제재 메뉴 사용
          </div>
        )}

        {/* 프로필 모달 */}
        {profileModalUser && (
          <UserProfileModal
            user={profileModalUser}
            isOpen={!!profileModalUser}
            onClose={() => setProfileModalUser(null)}
          />
        )}
      </div>
    </div>
  );
}
