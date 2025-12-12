import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { UserChatProps, PrivateChat, ChatMessagePayload, User } from "../../common/types";
import { deletePrivateChat, fetchProductById, fetchChatUsers, fetchPrivateMessages, fetchMyChatRooms, API_BASE_URL } from "../../common/api";
import { getCategoryName } from "../../common/util";
import type { ChatRoomListDto } from "../../common/types";

// -----------------------------
// UserChat 컴포넌트
// -----------------------------
export default function UserChat({ user }: UserChatProps) {
  const location = useLocation();
  const navigate = useNavigate(); // Added navigate
  const state =
    (location.state as { sellerId?: number; productId?: number } | null) || undefined;

  const [messages, setMessages] = useState<PrivateChat[]>([]);
  const [input, setInput] = useState("");
  const [searchKeyword, setSearchKeyword] = useState(""); // 유저 검색어

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
  const [adminUsers, setAdminUsers] = useState<User[]>([]);
  const [filteredList, setFilteredList] = useState<(User | ChatRoomListDto)[]>([]);


  // -----------------------------
  // 1. 목록 불러오기 (Admin vs General User) [수정]
  // -----------------------------
  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      if (isAdmin) {
        // [관리자] 유저 목록 로딩 (기존 로직 유지)
        try {
          const data = await fetchChatUsers(user.userId);
          setAdminUsers(data);
          setFilteredList(data);
          // ... (선택된 유저 초기화 로직 유지) ...
        } catch (err) {
          console.error("유저 목록 로딩 실패", err);
        }

      } else {
        // [일반 유저/판매자] 내 채팅방 목록 로딩 [⭐ 추가/수정된 로직 ⭐]
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
              handleRoomSelect(existingRoom); // 기존 방으로 자동 선택
            }
            // * 새 채팅방인 경우, 백엔드가 채팅방을 미리 생성했다고 가정하고,
            //   fetchPrivateMessages가 chatRoomId를 알아내도록 기존 로직을 유지합니다.
          }

        } catch (err) {
          console.error("채팅방 목록 로딩 실패", err);
        }
      }
    };

    loadData();
  }, [user, isAdmin, state]);

  // [⭐ 추가] 채팅방 선택 핸들러 함수
  const handleRoomSelect = (item: ChatRoomListDto | User) => {
    ws.current?.close();
    setMessages([]);
    setChatRoomId(null);

    if (!user) return;

    let targetUser: User | null = null; // 초기값 null
    let productId: number | undefined;

    if ('targetNickName' in item) { // ChatRoomListDto 타입
      // ChatRoomListDto는 userName 필드를 가지고 있지 않으므로, 임시로 빈 문자열 할당
      targetUser = {
        userId: item.targetUserId,
        nickName: item.targetNickName,
        role: 'USER',
        userName: "", // ★ User 타입의 필수 필드가 있다면 추가
      };
      productId = item.productId;
      setChatRoomId(item.chatRoomId);
    } else { // User 타입 (관리자가 유저를 선택한 경우)
      targetUser = item;
      productId = selectedProductId;
    }

    // targetUser가 null이 아닌 경우에만 상태 업데이트
    if (targetUser) {
      setSelectedUser(targetUser);
      setSelectedProductId(productId);
    }
  };


  // [⭐ 추가할 부분: 검색(필터링) 로직 ⭐]
  useEffect(() => {
    // 1. 검색어가 비어 있으면, 전체 목록을 보여줍니다.
    if (searchKeyword.trim() === "") {
      setFilteredList(isAdmin ? adminUsers : chatRooms);
      return;
    }

    const lowerCaseKeyword = searchKeyword.toLowerCase().trim();

    if (isAdmin) {
      // [관리자] 유저 닉네임/이름 검색
      const filtered = adminUsers.filter(u =>
        u.nickName?.toLowerCase().includes(lowerCaseKeyword) ||
        u.userName?.toLowerCase().includes(lowerCaseKeyword)
      );
      setFilteredList(filtered);
    } else {
      // [일반 유저] 상대방 닉네임 또는 상품 제목 검색
      const filtered = chatRooms.filter((room: ChatRoomListDto) => // 명시적 타입 캐스팅 권장
        room.targetNickName?.toLowerCase().includes(lowerCaseKeyword) ||
        room.productTitle?.toLowerCase().includes(lowerCaseKeyword)
      );
      setFilteredList(filtered);
    }
  }, [searchKeyword, isAdmin, adminUsers, chatRooms]); // 의존성 배열에 state 변수들을 포함

  // -----------------------------
  // 2. 일반 유저 초기 설정 (Seller 자동 선택)
  // -----------------------------
  useEffect(() => {
    if (!user) return;
    if (!isAdmin && state?.sellerId && !selectedUser) {
      fetchChatUsers(user.userId)
        .then((data) => {
          const seller = data.find(u => u.userId === state?.sellerId);
          if (seller) setSelectedUser(seller);
        });
    }
  }, [isAdmin, state, selectedUser]);


  // -----------------------------
  // 3. 개인채팅 초기 메시지
  // -----------------------------
  useEffect(() => {
    if (!user || !selectedUser || !selectedProductId) return;

    const loadPrivateMessages = async () => {
      try {
        const msgData = await fetchPrivateMessages(
          user.userId,
          selectedUser.userId,
          selectedProductId
        );
        setMessages(msgData);

        if (msgData.length > 0 && msgData[0].chatRoomId) {
          setChatRoomId(msgData[0].chatRoomId);
        }

      } catch (e: any) {
        console.error("1:1 채팅 내역 불러오기 실패", e);
      }
    };

    loadPrivateMessages();
    loadPrivateMessages();
  }, [user, selectedUser, selectedProductId]);

  // -----------------------------
  // Product Info Fetching
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
  // 4. WebSocket 연결
  // -----------------------------
  useEffect(() => {
    if (!user || !selectedUser) return;

    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const host = isLocal ? "localhost:8080" : window.location.host;
    const url = `${protocol}://${host}/ws/chat?userId=${user.userId}&targetUserId=${selectedUser.userId}`;

    ws.current?.close();
    ws.current = new WebSocket(url);

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

  // 관리자 메시지 삭제
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
  // 7. 화면 렌더링
  // -----------------------------
  return (
    <div className="max-w-[1280px] p-0 mt-[20px] mx-auto flex h-[calc(100vh-180px)] border border-[#ccc] rounded-lg overflow-hidden bg-white shadow-sm">

      {/* 🔹 사이드바 표시 (관리자/일반 유저 모두 표시) [⭐ 수정 ⭐] */}
      {/* 기존의 {isAdmin && ( ... )} 구문을 제거하고, 모든 유저가 보이게 변경 */}
      <div className="w-[300px] border-r border-[#eee] flex flex-col bg-gray-50 py-2">

        {/* 1. 검색 및 제목 영역 */}
        <div className="p-3 border-b border-[#eee]">
          <h3 className="text-sm font-bold mb-2 px-1">
            {/* 제목을 역할에 따라 변경 */}
            {isAdmin ? `유저 목록 (${filteredList.length})` : `내 채팅 목록 (${filteredList.length})`}
          </h3>
          <input
            type="text"
            placeholder={isAdmin ? "이름/닉네임 검색..." : "상대방 닉네임 검색..."} // 플레이스홀더 변경 가능
            className="w-full p-2 border border-[#ddd] rounded text-sm focus:outline-none focus:border-[#333]"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
          />
        </div>

        {/* 2. 목록 영역 */}
        <div className="flex-1 overflow-y-auto">
          {isAdmin ? (
            // [A] 관리자 뷰: 유저 목록 (기존 로직 유지)
            (filteredList as User[]).map((u) => (
              <div
                key={u.userId}
                className={`p-3 cursor-pointer ... ${selectedUser?.userId === u.userId ? "font-bold bg-white border-l-4 border-l-[#333]" : ""}`}
                onClick={() => handleRoomSelect(u)}
              >
                {/* 관리자 UI 유지 */}
                <div className="text-sm">{u.nickName}({u.userName || "이름 없음"})</div>
              </div>
            ))
          ) : (
            // [B] 일반 유저 뷰: 채팅방 목록 (ChatRoomListDto 타입 사용) [⭐ 추가 ⭐]
            (filteredList as ChatRoomListDto[]).map((room) => (
              <div
                key={room.chatRoomId}
                className={`p-3 cursor-pointer transition-colors border-b border-gray-100 hover:bg-white flex flex-col
                                ${selectedUser?.userId === room.targetUserId && selectedProductId === room.productId ? "font-bold bg-white border-l-4 border-l-[#333]" : ""}`}
                onClick={() => handleRoomSelect(room)} // **handleRoomSelect 사용**
              >
                <div className="flex justify-between items-center">
                  {/* 상대방 닉네임 */}
                  <div className="text-sm font-bold">
                    {room.targetNickName}
                    {/* room.unreadCount > 0 && 
                                        <span className="ml-2 text-xs bg-red-500 text-white px-2 rounded-full">{room.unreadCount}</span>
                                    */}
                  </div>
                  {/* 마지막 메시지 시간 */}
                  <div className="text-xs text-gray-400">
                    {new Date(room.lastMessageTime).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                {/* 상품 제목 및 마지막 메시지 미리보기 */}
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

      {/* 🔹 채팅 영역 */}
      <div className="flex-1 flex flex-col">
        {!selectedUser ? (
          // 일반 유저인데 SellerId 없으면 - 잘못된 접근 처리
          !isAdmin && !state?.sellerId ? (
            <div className="flex-1 flex items-center justify-center text-gray-500">대화할 상대를 찾을 수 없습니다.</div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">채팅 상대를 선택해주세요.</div>
          )
        ) : (
          <>
            <div className="p-4 border-b border-[#eee] bg-white flex justify-between items-center">
              <h2 className="text-lg font-bold">
                {/* 관리자 뷰: 닉네임 (실명) */}
                {isAdmin
                  ? `${selectedUser.nickName} (${selectedUser.userName || "이름 없음"})`
                  : selectedUser.nickName}
                <span className="text-sm font-normal text-gray-500 ml-2">님과의 대화</span>
              </h2>
              {/* 관리자: 상단 사용자 제재 버튼 */}
              {isAdmin && (
                <button
                  className="text-xs bg-red-50 text-red-500 px-3 py-1 rounded border border-red-200 hover:bg-red-100"
                  onClick={() => {
                    if (window.confirm(`'${selectedUser.nickName}(${selectedUser.userName || "이름 없음"})' 님을 제재 하시겠습니까?`)) {
                      alert("제재 기능 미구현");
                    }
                  }}
                >🚨 사용자 제재</button>
              )}
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
                      // 관리자: 메시지 클릭 시 삭제
                      onClick={() => {
                        if (isAdmin) {
                          handleDelete(msg.chatId);
                        }
                      }}
                      title={isAdmin ? "클릭하여 메시지 삭제" : ""}
                    >
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
      </div>
    </div>
  );
}