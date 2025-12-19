import type { User } from "../../common/types";
import * as API from "../../common/api";
import { Search, AlertTriangle, ChevronsUpDown, ChevronUp, ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";
import CustomSelect from "../ui/CustomSelect";
import { ROLE } from "../../common/enums";

type Props = {
  users: User[];
  editingUserId: number | null;
  editUserForm: { nickName: string; password: string; phone: string };
  setEditUserForm: React.Dispatch<
    React.SetStateAction<{ nickName: string; password: string; phone: string }>
  >;
  handleEditUserClick: (user: User) => void;
  handleSaveUserClick: (userId: number) => void;
  handleCancelUserClick: () => void;
  handleChangeRole: (userId: number, newRole: User["role"]) => void;

  userFilterField: "all" | "userName" | "nickName" | "email" | "phone" | "role" | "social";
  setUserFilterField: React.Dispatch<
    React.SetStateAction<"all" | "userName" | "nickName" | "email" | "phone" | "role" | "social">
  >;
  userFilterKeyword: string;
  setUserFilterKeyword: React.Dispatch<React.SetStateAction<string>>;
  fetchUsers: () => void;
};

type SortKey = keyof User | "activeBan";
type SortDirection = "asc" | "desc";

export default function UserManage({
  users,
  editingUserId,
  editUserForm,
  setEditUserForm,
  handleEditUserClick,
  handleSaveUserClick,
  handleCancelUserClick,
  handleChangeRole,
  userFilterField,
  setUserFilterField,
  userFilterKeyword,
  setUserFilterKeyword,
  fetchUsers,
}: Props) {
  // --- Ban Modal State ---
  const [isBanModalOpen, setIsBanModalOpen] = useState(false);
  const [selectedBanUser, setSelectedBanUser] = useState<User | null>(null);
  const [banDuration, setBanDuration] = useState("1"); // days
  const [_banReason, setBanReason] = useState("");

  // --- Sorting State ---
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection } | null>(null);

  // --- 검색 필터링 & 정렬 ---
  const filteredUsers = useMemo(() => {
    let result = [...users];

    // 필터링
    if (userFilterKeyword.trim()) {
      const lowerKeyword = userFilterKeyword.toLowerCase();
      result = result.filter((user) => {
        if (userFilterField === "all") {
          return (
            user.userName.toLowerCase().includes(lowerKeyword) ||
            user.nickName.toLowerCase().includes(lowerKeyword) ||
            (user.email && user.email.toLowerCase().includes(lowerKeyword)) ||
            (user.phone && user.phone.includes(lowerKeyword)) ||
            (user.provider && user.provider.toLowerCase().includes(lowerKeyword)) ||
            (user.role && user.role.toLowerCase().includes(lowerKeyword))
          );
        }
        if (userFilterField === "social") {
          return user.provider && user.provider.toLowerCase().includes(lowerKeyword);
        }
        if (userFilterField === "role") {
          return user.role && user.role.toLowerCase().includes(lowerKeyword);
        }

        const fieldKey = userFilterField as keyof User;
        const value = user[fieldKey];
        if (!value) return false;
        return value.toString().toLowerCase().includes(lowerKeyword);
      });
    }

    // 정렬
    if (sortConfig !== null) {
      result.sort((a, b) => {
        let aValue: any = a[sortConfig.key];
        let bValue: any = b[sortConfig.key];

        // Special handling for activeBan (sort by banUntil date)
        if (sortConfig.key === "activeBan") {
          aValue = a.activeBan ? a.activeBan.banUntil : "";
          bValue = b.activeBan ? b.activeBan.banUntil : "";
        }

        // Special handling for provider (Social)
        if (sortConfig.key === "provider") {
          aValue = a.provider || "";
          bValue = b.provider || "";
        }

        if (aValue < bValue) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }

    return result;
  }, [users, userFilterField, userFilterKeyword, sortConfig]);

  // --- Sorting Handler ---
  const handleSort = (key: SortKey) => {
    let direction: SortDirection = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: SortKey) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ChevronsUpDown size={14} className="text-gray-300 ml-1" />;
    }
    return sortConfig.direction === "asc" ? (
      <ChevronUp size={14} className="text-black ml-1" />
    ) : (
      <ChevronDown size={14} className="text-black ml-1" />
    );
  };

  // --- Handlers for Ban ---
  const openBanModal = (user: User) => {
    setSelectedBanUser(user);
    setBanDuration("1");
    setBanReason("");
    setIsBanModalOpen(true);
  };

  const closeBanModal = () => {
    setIsBanModalOpen(false);
    setSelectedBanUser(null);
  };

  const handleBanSubmit = async () => {
    if (!selectedBanUser) return;
    try {
      const hours = parseInt(banDuration) * 24;
      await API.warnUser(selectedBanUser.userId, hours);
      alert(`${selectedBanUser.nickName}님을 ${banDuration}일간 정지했습니다.`);
      closeBanModal();
      fetchUsers(); // Refresh list
    } catch (err: any) {
      console.error(err);
      alert(err.message || "정지 처리에 실패했습니다.");
    }
  };

  const handleLiftBan = async (user: User) => {
    if (!user.activeBan) return;
    if (!confirm(`${user.nickName}님의 정지를 해제하시겠습니까?`)) return;

    try {
      await API.liftWarn(user.activeBan.banId);
      alert("정지가 해제되었습니다.");
      fetchUsers();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "정지 해제 실패");
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-[#111] mb-6">회원 관리</h2>

      {/* Filter Section */}
      <div className="mb-6 flex gap-3 items-end">
        <div>
          <label className="block text-sm font-medium text-[#666] mb-1.5">
            검색 필드
          </label>
          <CustomSelect
            value={userFilterField}
            onChange={(value) =>
              setUserFilterField(
                value as "all" | "userName" | "nickName" | "email" | "phone" | "role" | "social"
              )
            }
            options={[
              { value: "all", label: "전체" },
              { value: "userName", label: "이름" },
              { value: "nickName", label: "닉네임" },
              { value: "email", label: "이메일" },
              { value: "phone", label: "전화번호" },
              { value: "role", label: "권한" },
              { value: "social", label: "소셜로그인" },
            ]}
          />
        </div>

        <div className="flex-1">
          <label className="block text-sm font-medium text-[#666] mb-1.5">
            검색어
          </label>
          <div className="relative">
            <input
              placeholder="검색어를 입력하세요"
              value={userFilterKeyword}
              onChange={(e) => setUserFilterKeyword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchUsers()}
              className="w-full px-3 py-2 pr-10 border border-[#ddd] rounded-lg bg-white text-[#111] text-sm focus:outline-none focus:ring-1 focus:ring-[#111]"
            />
            <Search
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#999]"
            />
          </div>
        </div>

        <button
          onClick={fetchUsers}
          className="px-6 py-2 bg-[#111] text-white rounded-lg text-sm font-medium hover:bg-[#333]"
        >
          검색
        </button>
      </div>

      {/* Table */}
      <div className="border border-[#eee] rounded-lg">
        <table className="w-full table-fixed">
          <thead>
            <tr className="bg-[#f9f9f9] border-b border-[#eee]">
              {[
                { label: "ID", key: "userId", width: "w-[5%]" },
                { label: "이름", key: "userName", width: "w-[10%]" },
                { label: "닉네임", key: "nickName", width: "w-[12%]" },
                { label: "이메일", key: "email", width: "w-[20%]" },
                { label: "소셜", key: "provider", width: "w-[8%]" },
                { label: "전화번호", key: "phone", width: "w-[15%]" },
                { label: "권한", key: "role", width: "w-[8%]" },
                { label: "정지 정보", key: "activeBan", width: "w-[10%]" },
              ].map((col) => (
                <th
                  key={col.key}
                  className={`${col.width} px-4 py-3 text-left text-xs font-semibold text-[#666] cursor-pointer hover:bg-gray-100 select-none`}
                  onClick={() => handleSort(col.key as SortKey)}
                >
                  <div className="flex items-center">
                    {col.label}
                    {getSortIcon(col.key as SortKey)}
                  </div>
                </th>
              ))}
              <th className="w-[12%] px-4 py-3 text-left text-xs font-semibold text-[#666]">관리</th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-[#eee]">
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-6 text-center text-sm text-[#999]">
                  검색 결과가 없습니다.
                </td>
              </tr>
            )}

            {filteredUsers.map((u) => (
              <tr key={u.userId} className="hover:bg-[#f9f9f9]">
                <td className="px-4 py-3 text-sm text-[#666]">{u.userId}</td>
                <td className="px-4 py-3 text-sm font-medium text-[#333]">{u.userName}</td>

                <td className="px-4 py-3 text-sm">
                  {editingUserId === u.userId ? (
                    <input
                      value={editUserForm.nickName}
                      onChange={(e) =>
                        setEditUserForm({ ...editUserForm, nickName: e.target.value })
                      }
                      className="px-2 py-1 border rounded text-sm w-full focus:border-black outline-none"
                    />
                  ) : (
                    u.nickName
                  )}
                </td>

                <td className="px-4 py-3 text-sm text-[#666]">{u.email}</td>

                {/* Social Login Column */}
                <td className="px-4 py-3 text-sm">
                  {u.provider ? (
                    <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs font-medium uppercase">
                      {u.provider}
                    </span>
                  ) : (
                    <span className="text-gray-300 text-xs">-</span>
                  )}
                </td>

                <td className="px-4 py-3 text-sm">
                  {editingUserId === u.userId ? (
                    <input
                      value={editUserForm.phone}
                      onChange={(e) =>
                        setEditUserForm({ ...editUserForm, phone: e.target.value })
                      }
                      className="px-2 py-1 border rounded text-sm w-full focus:border-black outline-none"
                    />
                  ) : (
                    <span className="text-[#666]">{u.phone}</span>
                  )}
                </td>

                <td className="px-4 py-3 text-sm">
                  <CustomSelect
                    value={u.role || ROLE.USER}
                    onChange={(value) =>
                      handleChangeRole(u.userId, value as User["role"])
                    }
                    options={[
                      { value: ROLE.USER, label: ROLE.USER },
                      { value: ROLE.BANNED, label: ROLE.BANNED },
                      { value: ROLE.ADMIN, label: ROLE.ADMIN },
                    ]}
                    className="w-32"
                  />
                </td>

                {/* 정지 정보 컬럼 */}
                <td className="px-4 py-3 text-sm">
                  {u.activeBan ? (
                    <div className="flex items-center text-red-600 gap-1">
                      <AlertTriangle size={14} />
                      <span className="text-xs font-semibold">
                        {/* 남은 기간 계산/필요시 추가 로직 */}
                        ~{new Date(u.activeBan.banUntil).toLocaleDateString()}
                      </span>
                    </div>
                  ) : (
                    <span className="text-gray-400 text-xs">-</span>
                  )}
                </td>

                <td className="px-4 py-3 text-sm">
                  <div className="flex gap-2 items-center">
                    {editingUserId === u.userId ? (
                      <>
                        <button
                          onClick={() => handleSaveUserClick(u.userId)}
                          className="px-3 py-1 bg-[#111] text-white rounded text-xs hover:bg-[#333]"
                        >
                          저장
                        </button>
                        <button
                          onClick={handleCancelUserClick}
                          className="px-3 py-1 border rounded text-xs hover:bg-gray-50"
                        >
                          취소
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleEditUserClick(u)}
                          className="px-3 py-1 border border-[#ddd] rounded text-xs hover:bg-white bg-[#f5f5f5]"
                        >
                          수정
                        </button>

                        {/* Ban / Unban Buttons */}
                        {u.activeBan ? (
                          <button
                            onClick={() => handleLiftBan(u)}
                            className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 flex items-center gap-1"
                          >
                            해제
                          </button>
                        ) : (
                          <button
                            onClick={() => openBanModal(u)}
                            className="px-3 py-1 bg-red-100 text-red-600 rounded text-xs hover:bg-red-200 font-medium"
                          >
                            정지
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Ban Modal */}
      {isBanModalOpen && selectedBanUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl w-[400px] p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <AlertTriangle className="text-red-500" />
              유저 일시 정지
            </h3>

            <p className="text-sm text-gray-600 mb-4">
              <span className="font-bold text-black">{selectedBanUser.nickName}</span>님을 정지하시겠습니까?
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">정지 기간</label>
                <select
                  value={banDuration}
                  onChange={(e) => setBanDuration(e.target.value)}
                  className="w-full border rounded p-2 text-sm focus:border-black outline-none"
                >
                  <option value="1">1일</option>
                  <option value="3">3일</option>
                  <option value="7">7일</option>
                  <option value="30">30일</option>
                </select>
              </div>

              {/* Optional: Reason input if needed */}
              {/* 
              <div>
                <label className="block text-sm font-medium mb-1">사유</label>
                <input 
                  value={banReason} 
                  onChange={(e) => setBanReason(e.target.value)}
                  className="w-full border rounded p-2 text-sm"
                  placeholder="정지 사유 (선택)" 
                />
              </div> 
              */}
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={closeBanModal}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded"
              >
                취소
              </button>
              <button
                onClick={handleBanSubmit}
                className="px-4 py-2 text-sm bg-red-600 text-white hover:bg-red-700 rounded font-medium"
              >
                정지 적용
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
