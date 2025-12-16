import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { UserChatProps, PrivateChat, ChatMessagePayload, User, ChatListItem } from "../../common/types";
import { deletePrivateChat, fetchProductById, fetchChatUsers, fetchPrivateMessages, API_BASE_URL, fetchMyChatRooms, fetchPrivateMessagesByRoomId, fetchAdminAllChatRooms, banUser } from "../../common/api";
import { getCategoryName } from "../../common/util";
import type { ChatRoomListDto, AdminChatRoomListDto } from "../../common/types";

export default function UserChat({ user }: UserChatProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const state =
    (location.state as { sellerId?: number; productId?: number } | null) || undefined;

  const [messages, setMessages] = useState<PrivateChat[]>([]);
  const [input, setInput] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<number | undefined>(
    state?.productId
  );
  const [chatRoomId, setChatRoomId] = useState<number | null>(null);

  const ws = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const isAdmin = user?.role === "ADMIN";
  const isLocal = window.location.hostname === "localhost";

  const [chatRooms, setChatRooms] = useState<ChatRoomListDto[]>([]);
  const [adminChatRooms, setAdminChatRooms] = useState<AdminChatRoomListDto[]>([]);
  const [filteredList, setFilteredList] = useState<ChatListItem[]>([]);

  const [product, setProduct] = useState<any>(null);
  const [imageError, setImageError] = useState(false);

  const [activeMenuMessageIndex, setActiveMenuMessageIndex] = useState<number | null>(null);

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
    if (!user) return;

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

          if (data.banned) {
            setIsBanned(true);
            if (data.banUntil) {
              const endTime = new Date(data.banUntil.replace(' ', 'T'));
              setBanEndTime(endTime);
            }
       
          } else {
            setIsBanned(false);
            setBanEndTime(null);
         
          }
        }
      } catch (err) {
        console.error("채팅 금지 상태 확인 실패:", err);
      }
    };

    checkBanStatus();
    const interval = setInterval(checkBanStatus, 60000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const handleClickOutside = () => setActiveMenuMessageIndex(null);
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  const toggleUserMenu = (index: number, e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    e.stopPropagation();
    setActiveMenuMessageIndex(prev => (prev === index ? null : index));
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
      setActiveMenuMessageIndex(null);
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
      const adminId = user!.userId;

      await banUser(targetUser.userId, token, adminId);

      alert(`${targetUser.nickName}님이 밴 처리되었습니다.`);
      setActiveMenuMessageIndex(null);

      if (chatRoomId) {
        const updatedMessages = await fetchPrivateMessagesByRoomId(chatRoomId);
        setMessages(updatedMessages);
      }

    } catch (err) {
      console.error(err);
      alert("밴 처리 중 오류가 발생했습니다.");
    }
  };

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      if (isAdmin) {
        try {
          const rooms = await fetchAdminAllChatRooms();
          setAdminChatRooms(rooms);
          setFilteredList(rooms);
        } catch (err) {
          console.error("유저 목록 로딩 실패", err);
        }

      } else {
        try {
          const rooms = await fetchMyChatRooms(user.userId);
          setChatRooms(rooms);
          setFilteredList(rooms);

          if (state?.sellerId && state?.productId) {
            const existingRoom = rooms.find(r =>
              r.targetUserId === state.sellerId && r.productId === state.productId
            );
            if (existingRoom) {
              handleRoomSelect(existingRoom);
            }
          }

        } catch (err) {
          console.error("채팅방 목록 로딩 실패", err);
        }
      }
    };

    loadData();
  }, [user, isAdmin, state]);

  const handleRoomSelect = (item: ChatRoomListDto | User | AdminChatRoomListDto) => {
    ws.current?.close();
    setMessages([]);
    setChatRoomId(null);
    setProduct(null);
    setActiveMenuMessageIndex(null);

    if (!user) return;

    let targetUser: User | null = null;
    let productId: number | undefined;
    let newChatRoomId: number | null = null;

    if ('chatRoomId' in item) {
      newChatRoomId = item.chatRoomId;
      productId = item.productId;

      if (isAdmin) {
        const adminRoom = item as AdminChatRoomListDto;
        targetUser = {
          userId: adminRoom.sellerId,
          nickName: `${adminRoom.sellerNickName} vs ${adminRoom.buyerNickName}`,
          role: 'USER',
          userName: `판매자: ${adminRoom.sellerNickName} | 구매자: ${adminRoom.buyerNickName}`,
        };

      } else {
        const userRoom = item as ChatRoomListDto;
        targetUser = {
          userId: userRoom.targetUserId,
          nickName: userRoom.targetNickName,
          role: 'USER',
          userName: "",
        };
      }
    } else {
      return;
    }

    if (targetUser) {
      setSelectedUser(targetUser);
      setSelectedProductId(productId);
      setChatRoomId(newChatRoomId);
    }
  };

  useEffect(() => {
    if (searchKeyword.trim() === "") {
      setFilteredList(isAdmin ? adminChatRooms : chatRooms);
      return;
    }

    const lowerCaseKeyword = searchKeyword.toLowerCase().trim();

    if (isAdmin) {
      const filtered = adminChatRooms.filter(r =>
        r.sellerNickName?.toLowerCase().includes(lowerCaseKeyword) ||
        r.buyerNickName?.toLowerCase().includes(lowerCaseKeyword) ||
        r.productTitle?.toLowerCase().includes(lowerCaseKeyword)
      );
      setFilteredList(filtered);
    } else {
      const filtered = chatRooms.filter((room: ChatRoomListDto) =>
        room.targetNickName?.toLowerCase().includes(lowerCaseKeyword) ||
        room.productTitle?.toLowerCase().includes(lowerCaseKeyword)
      );
      setFilteredList(filtered);
    }
  }, [searchKeyword, isAdmin, adminChatRooms, chatRooms]);

  useEffect(() => {
    if (!user) return;
    if (!isAdmin && state?.sellerId && !selectedUser) {
      fetchChatUsers(user.userId)
        .then((data) => {
          const seller = data.find(u => u.userId === state?.sellerId);
          if (seller) setSelectedUser(seller);
        });
    }
  }, [isAdmin, state, selectedUser, user]);

  useEffect(() => {
    if (!user) return;

    const loadPrivateMessages = async () => {
      try {
        let msgData: PrivateChat[] = [];

        if (isAdmin && chatRoomId) {
          msgData = await fetchPrivateMessagesByRoomId(chatRoomId);
        } else if (selectedUser && selectedProductId) {
          msgData = await fetchPrivateMessages(
            user.userId,
            selectedUser.userId,
            selectedProductId
          );
        } else {
          return;
        }

        setMessages(msgData);

        if (!isAdmin && msgData.length > 0 && msgData[0].chatRoomId && !chatRoomId) {
          setChatRoomId(msgData[0].chatRoomId);
        }
      } catch (e: any) {
        console.error("1:1 채팅 내역 불러오기 실패", e);
      }
    };

    if (selectedUser || (isAdmin && chatRoomId)) {
      loadPrivateMessages();
    }
  }, [user, selectedUser, selectedProductId, chatRoomId, isAdmin]);

  useEffect(() => {
    if (!selectedProductId) {
      setProduct(null);
      return;
    }
    fetchProductById(selectedProductId)
      .then(setProduct)
      .catch((err: any) => console.error("상품 정보 조회 실패:", err));
  }, [selectedProductId]);

  useEffect(() => {
    if (!user || !selectedUser || isAdmin) return;

    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const host = isLocal ? "localhost:8080" : window.location.host;
    const url = chatRoomId
      ? `${protocol}://${host}/ws/chat?userId=${user.userId}&targetUserId=${selectedUser.userId}&chatRoomId=${chatRoomId}`
      : `${protocol}://${host}/ws/chat?userId=${user.userId}&targetUserId=${selectedUser.userId}`;

    ws.current?.close();
    ws.current = new WebSocket(url);

    ws.current.onmessage = (event) => {
      try {
        const data: any = JSON.parse(event.data);
        if (!data.user && data.nickName) {
          data.user = { userId: data.userId, nickName: data.nickName };
        }

        if (data.type === "PRIVATE") {
          if (data.chatRoomId === chatRoomId || !chatRoomId) {
            setMessages((prev) => [...prev, data]);
            if (!chatRoomId && data.chatRoomId) setChatRoomId(data.chatRoomId);
          }
        }
      } catch (err) {
        console.error("메시지 파싱 오류:", err);
      }
    };

    return () => ws.current?.close();
  }, [user, selectedUser, isLocal, chatRoomId, isAdmin]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (isAdmin) return;

    if (isBanned) {
      alert(`채팅이 제한되었습니다. ${getRemainingTime()} 후 이용 가능합니다.`);
      return;
    }

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

  const handleDelete = async (chatId: number) => {
    if (!window.confirm("이 메시지를 삭제하시겠습니까?")) return;
    try {
      await deletePrivateChat(chatId);
      setMessages(prev => prev.map(m => m.chatId === chatId ? { ...m, isDeleted: true } : m));
    } catch (e) {
      alert("삭제 실패");
    }
  };

  return (
    <div className="max-w-[1280px] p-0 mt-[20px] mx-auto flex h-[calc(100vh-180px)] border border-[#ccc] rounded-lg overflow-hidden bg-white shadow-sm">

      <div className="w-[300px] border-r border-[#eee] flex flex-col bg-gray-50 py-2">

        <div className="p-3 border-b border-[#eee]">
          <h3 className="text-sm font-bold mb-2 px-1">
            {isAdmin ? `전체 채팅방 목록 (${filteredList.length})` : `내 채팅 목록 (${filteredList.length})`}
          </h3>
          <input
            type="text"
            placeholder={isAdmin ? "판매자/구매자 닉네임, 상품 검색..." : "상대방 닉네임, 상품 검색..."}
            className="w-full p-2 border border-[#ddd] rounded text-sm focus:outline-none focus:border-[#333]"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {isAdmin ? (
            (filteredList as AdminChatRoomListDto[]).map((room) => (
              <div
                key={room.chatRoomId}
                className={`p-3 cursor-pointer transition-colors border-b border-gray-100 hover:bg-white flex flex-col
                  ${chatRoomId === room.chatRoomId ? "font-bold bg-white border-l-4 border-l-[#333]" : ""}`}
                onClick={() => handleRoomSelect(room)}
              >
                <div className="flex justify-between items-center">
                  <div className="text-sm font-bold">
                    {room.sellerNickName} vs {room.buyerNickName}
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(room.lastMessageTime).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <div className="text-xs mt-1 text-gray-600 truncate">
                  📢 {room.productTitle}
                </div>
                <div className="text-xs text-gray-500 truncate italic">
                  {room.lastMessage || '대화 내용 없음'}
                </div>
              </div>
            ))
          ) : (
            (filteredList as ChatRoomListDto[]).map((room) => (
              <div
                key={room.chatRoomId}
                className={`p-3 cursor-pointer transition-colors border-b border-gray-100 hover:bg-white flex flex-col
                  ${selectedUser?.userId === room.targetUserId && selectedProductId === room.productId ? "font-bold bg-white border-l-4 border-l-[#333]" : ""}`}
                onClick={() => handleRoomSelect(room)}
              >
                <div className="flex justify-between items-center">
                  <div className="text-sm font-bold">
                    {room.targetNickName}
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(room.lastMessageTime).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <div className="text-xs mt-1 text-gray-600 truncate">
                  📢 {room.productTitle}
                </div>
                <div className="text-xs text-gray-500 truncate italic">
                  {room.lastMessage || '대화 내용 없음'}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {!selectedUser ? (
          <div className="flex-1 flex items-center justify-center text-gray-500">채팅 상대를 선택해주세요.</div>
        ) : (
          <>
            <div className="p-4 border-b border-[#eee] bg-white flex justify-between items-center">
              <div className="flex flex-col">
                <h2 className="text-lg font-bold">
                  {selectedUser!.nickName}
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    {isAdmin ? `(채팅방 ID: ${chatRoomId})` : '님과의 대화'}
                  </span>
                </h2>
                {isAdmin && selectedUser!.userName && (
                  <p className="text-xs text-gray-600 mt-1">
                    {selectedUser!.userName}
                  </p>
                )}
              </div>
            </div>

            {product && (
              <div
                className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-200 p-3 flex items-center gap-3 shadow-sm cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => navigate(`/products/${product.productId}`)}
              >
                <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-100 flex-shrink-0 bg-gray-100 flex items-center justify-center">
                  {product.images?.[0]?.imagePath && !imageError ? (
                    <img
                      src={
                        product.images[0].imagePath.startsWith("http")
                          ? product.images[0].imagePath
                          : `${API_BASE_URL}${product.images[0].imagePath}`
                      }
                      alt={product.title}
                      className="w-full h-full object-cover"
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    <></>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-semibold text-[#333] bg-blue-50 px-1.5 py-0.5 rounded">
                      {getCategoryName(product.productCategoryType)}
                    </span>
                    <h3 className="text-sm font-medium text-gray-900 truncate">{product.title}</h3>
                  </div>
                  <p className="text-sm font-bold text-gray-900">
                    {product.originalPrice?.toLocaleString()}원
                  </p>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              {messages.map((msg, i) => {
                const isMe = msg.user?.userId === user?.userId;
                const isDeleted = msg.isDeleted;

                const displayName = isAdmin && msg.user?.userName
                  ? `${msg.user.nickName} (${msg.user.userName})`
                  : msg.user?.nickName;

                if (isDeleted) {
                  return (
                    <div key={i} className={`mb-3 flex ${isMe ? "justify-end" : "justify-start"}`}>
                      <div className="bg-gray-200 text-gray-400 px-4 py-2 rounded-lg text-sm italic border border-gray-300">
                        {isAdmin ? '관리자에 의해 삭제된 메시지입니다.' : '삭제된 메시지입니다.'}
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={i} className={`mb-3 flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[70%] relative flex flex-col ${isMe ? "items-end" : "items-start"}`}>

                      {!isMe && msg.user && (
                        <div className="flex items-center gap-1 mb-1 relative">

                          {isAdmin && (
                            <div
                              className="text-gray-400 hover:text-gray-600 cursor-pointer p-1 rounded hover:bg-gray-200"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleUserMenu(i, e);
                              }}
                            >
                              ⋮
                            </div>
                          )}

                          <div
                            className="text-xs text-gray-500 font-bold hover:text-[#111] hover:underline cursor-pointer px-1 py-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/users/${msg.user!.userId}`);
                            }}
                          >
                            {displayName}
                          </div>

                          {isAdmin && activeMenuMessageIndex === i && (
                            <div
                              className="absolute top-full left-0 mt-1 w-32 bg-white border border-gray-300 rounded shadow-md z-50"
                              style={{ left: '-5px' }}
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
                                  setActiveMenuMessageIndex(null);
                                }}
                              >
                                👤 프로필 확인
                              </div>
                            </div>
                          )}

                        </div>
                      )}

                      <div
                        className={`max-w-full group relative px-4 py-2 rounded-lg shadow-sm cursor-pointer transition-all hover:shadow-md
                          ${isMe ? "bg-[#333] text-white rounded-br-none" : "bg-white border border-gray-200 text-black rounded-bl-none"}
                        `}
                        title={isAdmin ? "관리자 모드 (메시지 삭제는 ✕ 버튼 이용)" : ""}
                      >
                        {isAdmin && isMe && (
                          <div className={`text-[10px] mb-1 ${isMe ? "text-gray-300" : "text-gray-500"}`}>
                            {msg.nickName}
                          </div>
                        )}
                        <div className="text-sm break-all whitespace-pre-wrap">{msg.content}</div>
                        <div className={`text-[10px] mt-1 text-right ${isMe ? "text-gray-400" : "text-gray-400"}`}>
                          {msg.createdAt && new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>

                        {isAdmin && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(msg.chatId); }}
                            className="absolute top-[-5px] right-[-5px] w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs shadow-md"
                            title="삭제"
                          >✕</button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white border-t border-[#eee] flex gap-2">
              {isAdmin ? (
                <div className="w-full text-center text-gray-400 text-sm py-2 bg-gray-50 rounded">
                  🔒 관리자는 대화 내용을 조회 및 삭제할 수 있습니다. (채팅 불가)
                </div>
              ) : (
                <>
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.nativeEvent.isComposing && sendMessage()}
                    disabled={isBanned}
                    className={`flex-1 p-3 border rounded-lg text-sm shadow-sm ${isBanned
                        ? "bg-red-50 border-red-300 text-red-600 cursor-not-allowed"
                        : "border-[#ddd] focus:outline-none focus:border-[#333]"
                      }`}
                    placeholder={isBanned ? `🚫 이용이 제한되었습니다 (남은 시간: ${getRemainingTime()})` : "메시지를 입력하세요..."}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={isBanned}
                    className={`px-5 py-2 rounded-lg font-medium text-sm shadow transition-colors ${isBanned
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-[#333] text-white hover:bg-[#555]"
                      }`}
                  >
                    전송
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div >
    </div >
  );
}