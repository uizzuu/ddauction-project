import { useEffect, useRef, useState } from "react";
import { fetchRecentPublicChats, deletePublicChat, banUser } from "../../common/api";
import type { PublicChat, User, ChatMessagePayload } from "../../common/types";
import { useNavigate } from "react-router-dom";

// -----------------------------
// PublicChat 컴포넌트
// -----------------------------
type Props = {
  user: User;
};

export default function PublicChat({ user }: Props) {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<PublicChat[]>([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const ws = useRef<WebSocket | null>(null);

  const isLocal = window.location.hostname === "localhost";

  // 관리자 메뉴 상태
  const [activeMenuMessageId, setActiveMenuMessageId] = useState<number | null>(null);
  const [selectedMessageId, setSelectedMessageId] = useState<number | null>(null);
  
  // 채팅 금지 상태
  const [isBanned, setIsBanned] = useState(false);
  const [banEndTime, setBanEndTime] = useState<Date | null>(null);
 

  // 남은 시간 계산
  const getRemainingTime = () => {
    if (!banEndTime) return "";
    const now = new Date();
    const diff = banEndTime.getTime() - now.getTime();
    
    if (diff <= 0) {
      setIsBanned(false);
      return "";
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}시간 ${minutes}분`;
    }
    return `${minutes}분`;
  };

  // 채팅 금지 상태 확인
  useEffect(() => {
    const checkBanStatus = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const response = await fetch(`/api/warn/status/${user.userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          console.log("경고 상태 응답:", data);
          
          // banned가 true이면 경고 상태
          if (data.banned) {
            console.log("경고 상태 감지!");
            setIsBanned(true);
            // banUntil 문자열을 Date 객체로 변환
            if (data.banUntil) {
              const endTime = new Date(data.banUntil.replace(' ', 'T'));
              setBanEndTime(endTime);
              console.log("종료시간:", endTime);
            }
       
          } else {
            console.log("경고 없음");
            setIsBanned(false);
            setBanEndTime(null);
     
          }
        } else {
          console.error("API 응답 실패:", response.status);
        }
      } catch (err) {
        console.error("채팅 금지 상태 확인 실패:", err);
      }
    };

    checkBanStatus();
    // 1분마다 금지 상태 확인
    const interval = setInterval(checkBanStatus, 60000);
    return () => clearInterval(interval);
  }, [user.userId]);

  const toggleUserMenu = (messageId: number | undefined, e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    e.stopPropagation();
    if (!messageId) return;
    setActiveMenuMessageId(prev => (prev === messageId ? null : messageId));
  };

  const handleWarn = async (targetUser: User) => {
    if (!window.confirm(`${targetUser.nickName}님에게 경고를 보내시겠습니까?`)) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("로그인 토큰이 없습니다.");

      await fetch("/api/warn", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: targetUser.userId,
          reason: "※경고 24시간동안 공개채팅이 제한되었습니다.",
          banHours: 24,
        }),
      });

      alert(`${targetUser.nickName}님에게 경고가 전달되었습니다.`);
      setActiveMenuMessageId(null);
    } catch (err) {
      console.error(err);
      alert("경고 전송 중 오류가 발생했습니다.");
    }
  };

  const handleBan = async (targetUser: User) => {
    if (!window.confirm(`${targetUser.nickName}님을 밴 처리하시겠습니까?`)) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("로그인 토큰이 없습니다.");
      const adminId = user.userId;

      await banUser(targetUser.userId, token, adminId);

      alert(`${targetUser.nickName}님이 밴 처리되었습니다.`);
      setActiveMenuMessageId(null);

      setMessages(prev =>
        prev.map(m => (m.user?.userId === targetUser.userId ? { ...m, content: "밴 처리된 사용자" } : m))
      );
    } catch (err) {
      console.error(err);
      alert("밴 처리 중 오류가 발생했습니다.");
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
    if (isBanned) {
      alert(`채팅이 제한되었습니다. ${getRemainingTime()} 후 이용 가능합니다.`);
      return;
    }
    
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
    const handleClickOutside = () => setActiveMenuMessageId(null);
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <div className="max-w-[1280px] mx-auto flex flex-col mt-[20px] h-[calc(100vh-180px)]">
      <div className="border border-[#ccc] pb-3 md:px-0 w-full h-full flex flex-col rounded-lg shadow-sm bg-white relative">
        <div className="flex-1 overflow-y-auto mb-3 p-4 rounded-lg">
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
                <div className={`max-w-[70%] relative flex flex-col ${isMe ? "items-end" : "items-start"}`}>

                  {!isMe && msg.user && (
                    <div
                      className="flex items-center gap-1 mb-1 cursor-pointer hover:bg-gray-100 px-2 py-1 rounded relative"
                      onClick={(e) => {
                        if (isAdmin) {
                          toggleUserMenu(msg.publicChatId, e);
                        } else {
                          navigate(`/users/${msg.user!.userId}`);
                        }
                      }}
                    >
                      {isAdmin && (
                        <div className="text-gray-400 hover:text-gray-600">
                          ⋮
                        </div>
                      )}

                      <div className="text-xs text-gray-500 font-bold hover:text-[#111] hover:underline">
                        {displayName}
                      </div>

                      {isAdmin && activeMenuMessageId === msg.publicChatId && (
                        <div
                          className="absolute top-full left-0 mt-1 w-32 bg-white border border-gray-300 rounded shadow-md z-50"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div
                            className="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer"
                            onClick={() => handleWarn(msg.user!)}
                          >
                            ⚠️ 경고
                          </div>
                          <div
                            className="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer"
                            onClick={() => handleBan(msg.user!)}
                          >
                            ⛔ 밴
                          </div>
                          <div
                            className="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer"
                            onClick={() => {
                              navigate(`/users/${msg.user!.userId}`);
                              setActiveMenuMessageId(null);
                            }}
                          >
                            👤 프로필 확인
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div
                    className={`relative group px-4 py-2 rounded-lg shadow-sm cursor-pointer transition-all hover:shadow-md 
                      ${isMe ? "bg-[#333] text-white rounded-br-none" : "bg-white border border-gray-200 text-black rounded-bl-none"}
                      ${selectedMessageId === msg.publicChatId ? "ring-2 ring-red-500 bg-red-50" : ""}`}
                    onClick={() => {
                      if (isAdmin) {
                        if (msg.publicChatId) {
                          setSelectedMessageId(msg.publicChatId);
                          setTimeout(() => {
                            if (window.confirm("이 메시지를 삭제하시겠습니까?")) {
                              deletePublicChat(msg.publicChatId!)
                                .then(() => {
                                  setMessages(prev => prev.map(m => m.publicChatId === msg.publicChatId ? { ...m, isDeleted: true } : m));
                                })
                                .catch(() => alert("삭제 실패"))
                                .finally(() => setSelectedMessageId(null));
                            } else {
                              setSelectedMessageId(null);
                            }
                          }, 50);
                        }
                      }
                    }}
                    title={isAdmin ? "클릭하여 메시지 삭제" : ""}
                  >
                    <div className="text-sm break-all whitespace-pre-wrap">{msg.content}</div>

                    <div className="text-[10px] text-gray-400 mt-1 px-1">
                      {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {user.role !== "ADMIN" ? (
          <div className="flex gap-2 px-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.nativeEvent.isComposing && sendMessage()}
              disabled={isBanned}
              className={`flex-1 p-3 border rounded-lg text-sm shadow-sm ${
                isBanned 
                  ? "bg-red-50 border-red-300 text-red-600 cursor-not-allowed" 
                  : "border-[#ddd] focus:outline-none focus:border-[#111]"
              }`}
              placeholder={isBanned ? `🚫 이용이 제한되었습니다 (남은 시간: ${getRemainingTime()})` : "메시지를 입력하세요..."}
            />
            <button 
              onClick={sendMessage} 
              disabled={isBanned}
              className={`px-6 py-2 rounded-lg font-bold text-sm shadow-md transition-colors ${
                isBanned
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-[#111] text-white hover:bg-[#333]"
              }`}
            >
              전송
            </button>
          </div>
        ) : (
          <div className="p-3 bg-gray-100 text-center text-gray-500 text-sm rounded-lg border border-gray-200">
            🔒 관리자 모드: 메시지를 클릭하여 삭제하거나, 유저 이름 옆 ⋮ 버튼으로 제재 메뉴 사용
          </div>
        )}
      </div>
    </div>
  );
}