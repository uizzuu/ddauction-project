import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { UserChatProps, PrivateChat, ChatMessagePayload, User, ChatListItem } from "../../common/types";
import { deletePrivateChat, fetchProductById, fetchChatUsers, fetchPrivateMessages, API_BASE_URL, fetchMyChatRooms, fetchPrivateMessagesByRoomId, fetchAdminAllChatRooms } from "../../common/api"; // fetchAdminAllChatRooms, fetchPrivateMessagesByRoomId API 추가 가정
import { getCategoryName } from "../../common/util";
import type { ChatRoomListDto, AdminChatRoomListDto } from "../../common/types";

// -----------------------------
// UserChat 컴포넌트
// -----------------------------
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

  // -----------------------------
  // 1. 목록 불러오기 (Admin vs General User) [수정]
  // -----------------------------
  useEffect(() => {
    console.log("UserChat Component Mounted.");
    if (!user) return;

    const loadData = async () => {
      if (isAdmin) {
        // [관리자] 모든 채팅방 목록 로딩
        try {
          // ⭐ fetchAdminAllChatRooms API가 AdminChatRoomListDto[]를 반환한다고 가정
          const rooms = await fetchAdminAllChatRooms();
          setAdminChatRooms(rooms);
          setFilteredList(rooms);
        } catch (err) {
          console.error("유저 목록 로딩 실패", err);
        }

      } else {
        // [일반 유저/판매자] 내 채팅방 목록 로딩
        try {
          const rooms = await fetchMyChatRooms(user.userId);
          setChatRooms(rooms);
          setFilteredList(rooms);

          // 상품 페이지에서 들어온 경우 (state?.sellerId 존재)
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
    // selectedUser 의존성은 제거. 초기 로딩은 user/isAdmin/state에 의존
  }, [user, isAdmin, state]);

  // [⭐ 수정] 채팅방 선택 핸들러 함수
  const handleRoomSelect = (item: ChatRoomListDto | User | AdminChatRoomListDto) => {
    ws.current?.close();
    setMessages([]);
    setChatRoomId(null);
    setProduct(null);

    if (!user) return;

    let targetUser: User | null = null;
    let productId: number | undefined;
    let newChatRoomId: number | null = null;

    if ('chatRoomId' in item) { // ChatRoomListDto 또는 AdminChatRoomListDto 타입
      newChatRoomId = item.chatRoomId;
      productId = item.productId;

      if (isAdmin) {
        // [관리자] AdminChatRoomListDto를 선택한 경우
        const adminRoom = item as AdminChatRoomListDto;
        // selectedUser는 관리자 뷰의 UI 정보를 담는 용도로 사용됨
        targetUser = {
          // WS 연결은 사용하지 않으므로, userId는 임의로 설정 (필수 아님)
          userId: adminRoom.sellerId,
          // 채팅창 제목에 사용될 정보
          nickName: `${adminRoom.sellerNickName} vs ${adminRoom.buyerNickName}`,
          role: 'USER',
          // 관리자 뷰 상단에 사용될 정보
          userName: `판매자: ${adminRoom.sellerNickName} | 구매자: ${adminRoom.buyerNickName}`,
        };

      } else {
        // [일반 유저] ChatRoomListDto를 선택한 경우
        const userRoom = item as ChatRoomListDto;
        targetUser = {
          userId: userRoom.targetUserId,
          nickName: userRoom.targetNickName,
          role: 'USER',
          userName: "",
        };
      }
    } else {
      // User 타입은 이제 사용되지 않음. AdminChatRoomListDto와 ChatRoomListDto만 처리
      return;
    }

    if (targetUser) {
      setSelectedUser(targetUser);
      setSelectedProductId(productId);
      setChatRoomId(newChatRoomId);
    }
  };


  // [⭐ 수정] 검색(필터링) 로직
  useEffect(() => {
    if (searchKeyword.trim() === "") {
      setFilteredList(isAdmin ? adminChatRooms : chatRooms);
      return;
    }

    const lowerCaseKeyword = searchKeyword.toLowerCase().trim();

    if (isAdmin) {
      // [관리자] 판매자/구매자 닉네임, 상품 제목 검색
      const filtered = adminChatRooms.filter(r =>
        r.sellerNickName?.toLowerCase().includes(lowerCaseKeyword) ||
        r.buyerNickName?.toLowerCase().includes(lowerCaseKeyword) ||
        r.productTitle?.toLowerCase().includes(lowerCaseKeyword)
      );
      setFilteredList(filtered);
    } else {
      // [일반 유저] 상대방 닉네임 또는 상품 제목 검색
      const filtered = chatRooms.filter((room: ChatRoomListDto) =>
        room.targetNickName?.toLowerCase().includes(lowerCaseKeyword) ||
        room.productTitle?.toLowerCase().includes(lowerCaseKeyword)
      );
      setFilteredList(filtered);
    }
  }, [searchKeyword, isAdmin, adminChatRooms, chatRooms]);

  // -----------------------------
  // 2. 일반 유저 초기 설정 (Seller 자동 선택) - 상품 페이지 진입 시
  // 이 로직은 1번 로딩 로직에 통합되었거나, 더 이상 필요하지 않을 수 있습니다. 
  // 그러나 selectedUser가 null일 때 seller를 찾으려는 기존 로직은 유지합니다.
  // -----------------------------
  useEffect(() => {
    if (!user) return;
    if (!isAdmin && state?.sellerId && !selectedUser) {
      // 이 fetchChatUsers 로직은 이제 ChatRoomListDto를 선택하는 handleRoomSelect와 충돌할 수 있습니다.
      // 1. 목록 로딩 후 자동 선택 (1번 useEffect에 통합됨)
      // 2. 새로운 채팅 시작 (fetchPrivateMessages에서 처리)
      // 이 로직이 남아있다면 fetchPrivateMessages가 targetUserId로 메시지를 가져올 수 있도록 selectedUser를 설정하기 위함입니다.
      fetchChatUsers(user.userId)
        .then((data) => {
          const seller = data.find(u => u.userId === state?.sellerId);
          if (seller) setSelectedUser(seller);
        });
    }
  }, [isAdmin, state, selectedUser, user]);


  // -----------------------------
  // 3. 개인채팅 초기 메시지 [⭐ 수정 ⭐]
  // -----------------------------
  useEffect(() => {
    if (!user) return;

    const loadPrivateMessages = async () => {
      try {
        let msgData: PrivateChat[] = [];

        if (isAdmin && chatRoomId) {
          // [관리자] ChatRoomId만으로 메시지 조회
          msgData = await fetchPrivateMessagesByRoomId(chatRoomId); // ⭐ API 호출 가정
        } else if (selectedUser && selectedProductId) {
          // [일반 유저] 기존 로직: 두 유저 ID와 상품 ID로 메시지 조회 (채팅방 생성 포함)
          msgData = await fetchPrivateMessages(
            user.userId,
            selectedUser.userId,
            selectedProductId
          );
        } else {
          return;
        }

        setMessages(msgData);

        // 채팅방 ID 업데이트 (일반 유저의 경우 채팅방이 새로 생성되었을 때)
        if (!isAdmin && msgData.length > 0 && msgData[0].chatRoomId && !chatRoomId) {
          setChatRoomId(msgData[0].chatRoomId);
        }
      } catch (e: any) {
        console.error("1:1 채팅 내역 불러오기 실패", e);
      }
    };

    // selectedUser가 null이면 메시지 로딩을 시도하지 않습니다.
    if (selectedUser || (isAdmin && chatRoomId)) {
      loadPrivateMessages();
    }
  }, [user, selectedUser, selectedProductId, chatRoomId, isAdmin]);


  // -----------------------------
  // Product Info Fetching (변경 없음)
  // -----------------------------
  const [product, setProduct] = useState<any>(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (!selectedProductId) {
      setProduct(null);
      return;
    }
    fetchProductById(selectedProductId)
      .then(setProduct)
      .catch((err: any) => console.error("상품 정보 조회 실패:", err));
  }, [selectedProductId]);


  // -----------------------------
  // 4. WebSocket 연결 (변경 없음, 관리자 모드 제외)
  // -----------------------------
  useEffect(() => {
    if (!user || !selectedUser || isAdmin) return;

    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const host = isLocal ? "localhost:8080" : window.location.host;
    const url = `${protocol}://${host}/ws/chat?userId=${user.userId}&targetUserId=${selectedUser.userId}`;

    ws.current?.close();
    ws.current = new WebSocket(url);

    // ... (onmessage 로직 동일)

    ws.current.onmessage = (event) => {
      try {
        const data: any = JSON.parse(event.data);
        if (!data.user && data.nickName) {
          data.user = { userId: data.userId, nickName: data.nickName };
        }

        if (data.type === "PRIVATE") {
          // 현재 보고 있는 방이면 메시지 추가
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
  }, [user, selectedUser, isLocal, chatRoomId, isAdmin]); // selectedProductId는 URL에 사용되지 않으므로 제거 가능

  // -----------------------------
  // 5. 자동 스크롤 (변경 없음)
  // -----------------------------
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // -----------------------------
  // 6. 메시지 전송 (변경 없음, 관리자 모드 제외)
  // -----------------------------
  const sendMessage = () => {
    if (isAdmin) return; // 관리자 채팅 비활성화

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

  // 관리자 메시지 삭제 (변경 없음)
  const handleDelete = async (chatId: number) => {
    if (!window.confirm("이 메시지를 삭제하시겠습니까?")) return;
    try {
      await deletePrivateChat(chatId);
      setMessages(prev => prev.map(m => m.chatId === chatId ? { ...m, isDeleted: true } : m));
    } catch (e) {
      alert("삭제 실패");
    }
  };


  // -----------------------------
  // 7. 화면 렌더링 [⭐ 수정 ⭐]
  // -----------------------------
  return (
    <div className="max-w-[1280px] p-0 mt-[20px] mx-auto flex h-[calc(100vh-180px)] border border-[#ccc] rounded-lg overflow-hidden bg-white shadow-sm">

      {/* 🔹 사이드바 표시 */}
      <div className="w-[300px] border-r border-[#eee] flex flex-col bg-gray-50 py-2">

        {/* 1. 검색 및 제목 영역 */}
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

        {/* 2. 목록 영역 */}
        <div className="flex-1 overflow-y-auto">
          {isAdmin ? (
            // [A] 관리자 뷰: 모든 채팅방 목록
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
            // [B] 일반 유저 뷰: 채팅방 목록
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

      {/* 🔹 채팅 영역 전체 컨테이너 (flex-1 flex flex-col로 수정) */}
      <div className="flex-1 flex flex-col">
        {!selectedUser ? ( // selectedUser가 null이면
          <div className="flex-1 flex items-center justify-center text-gray-500">채팅 상대를 선택해주세요.</div>
        ) : ( // selectedUser가 null이 아니면 (빨간 줄 오류 해결)
          <>
            {/* 채팅 헤더 */}
            <div className="p-4 border-b border-[#eee] bg-white flex justify-between items-center">
              <div className="flex flex-col">
                <h2 className="text-lg font-bold">
                  {/* selectedUser!를 사용하여 null이 아님을 TypeScript에 알림 */}
                  {selectedUser!.nickName}
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    {isAdmin ? `(채팅방 ID: ${chatRoomId})` : '님과의 대화'}
                  </span>
                </h2>
                {/* 관리자: 판매자/구매자 상세 정보 표시 */}
                {isAdmin && selectedUser!.userName && ( // selectedUser! 사용
                  <p className="text-xs text-gray-600 mt-1">
                    {selectedUser!.userName} // selectedUser! 사용
                  </p>
                )}
              </div>
              {/* 관리자: 상단 사용자 제재 버튼 */}
              {isAdmin && (
                <button
                  className="text-xs bg-red-50 text-red-500 px-3 py-1 rounded border border-red-200 hover:bg-red-100 flex-shrink-0 ml-4"
                  onClick={() => {
                    if (window.confirm(`'${selectedUser!.nickName}' 채팅방의 사용자들을 제재하시겠습니까?`)) { // selectedUser! 사용
                      alert("제재 기능 미구현");
                    }
                  }}
                >🚨 사용자 제재</button>
              )}
            </div>

            {/* 상품 정보 */}
            {product && (
              <div
                className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-200 p-3 flex items-center gap-3 shadow-sm cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => navigate(`/products/${product.productId}`)}
              >
                {/* ... 상품 정보 렌더링 로직 (생략) ... */}
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
                    <span className="text-xs font-bold text-[#333] bg-blue-50 px-1.5 py-0.5 rounded">
                      {getCategoryName(product.productCategoryType)}
                    </span>
                    <h3 className="text-sm font-medium text-gray-900 truncate">{product.title}</h3>
                  </div>
                  <p className="text-sm font-bold text-gray-900">
                    {product.startingPrice?.toLocaleString()}원
                  </p>
                </div>
              </div>
            )}

            {/* 채팅 메시지 영역 */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              {messages.map((msg, i) => {
                const isMe = msg.user?.userId === user?.userId;
                if (msg.isDeleted) {
                  return (
                    <div key={i} className={`mb-3 flex ${isMe ? "justify-end" : "justify-start"}`}>
                      <div className="bg-gray-200 text-gray-400 px-4 py-2 rounded-lg text-sm italic">
                        삭제된 메시지입니다.
                      </div>
                    </div>
                  );
                }
                return (
                  <div key={i} className={`mb-3 flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[70%] group relative px-4 py-2 rounded-lg shadow-sm cursor-pointer transition-all hover:shadow-md
                        ${isMe ? "bg-[#333] text-white rounded-br-none" : "bg-white border border-gray-200 text-black rounded-bl-none"}
                      `}
                      onClick={() => {
                        if (isAdmin) {
                          handleDelete(msg.chatId);
                        }
                      }}
                      title={isAdmin ? "클릭하여 메시지 삭제" : ""}
                    >
                      {/* [추가] 관리자에게는 누가 보낸 메시지인지 표시 */}
                      {isAdmin && (
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
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* 메시지 입력/전송 영역 */}
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
                    className="flex-1 p-3 border border-[#ddd] rounded-lg focus:outline-none focus:border-[#333] text-sm shadow-sm"
                    placeholder="메시지를 입력하세요..."
                  />
                  <button onClick={sendMessage} className="px-5 py-2 bg-[#333] text-white rounded-lg hover:bg-[#555] transition-colors font-medium text-sm shadow">
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