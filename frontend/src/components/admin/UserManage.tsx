import type { User } from "../../common/types";
import { Search } from "lucide-react";
import CustomSelect from "../ui/CustomSelect";

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

  // 필터링 관련 props 추가
  userFilterField: "userName" | "nickName" | "email" | "phone";
  setUserFilterField: React.Dispatch<
    React.SetStateAction<"userName" | "nickName" | "email" | "phone">
  >;
  userFilterKeyword: string;
  setUserFilterKeyword: React.Dispatch<React.SetStateAction<string>>;
  fetchUsers: () => void;
};

export default function UserManage({
  users,
  editingUserId,
  editUserForm,
  setEditUserForm,
  handleEditUserClick,
  handleSaveUserClick,
  handleCancelUserClick,
  handleChangeRole,
  // 필터링 props
  userFilterField,
  setUserFilterField,
  userFilterKeyword,
  setUserFilterKeyword,
  fetchUsers,
}: Props) {
  return (
    <div>
      <h2 className="text-xl font-bold text-[#111] mb-6">회원 관리</h2>

      {/* Filter Section */}
      <div className="mb-6 flex gap-3 items-end">
        <div>
          <label className="block text-sm font-medium text-[#666] mb-1.5">검색 필드</label>
          <CustomSelect
            value={userFilterField}
            onChange={(value) =>
              setUserFilterField(value as "userName" | "nickName" | "email" | "phone")
            }
            options={[
              { value: "userName", label: "이름" },
              { value: "nickName", label: "닉네임" },
              { value: "email", label: "이메일" },
              { value: "phone", label: "전화번호" },
            ]}
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-[#666] mb-1.5">검색어</label>
          <div className="relative">
            <input
              placeholder="검색어를 입력하세요"
              value={userFilterKeyword}
              onChange={(e) => setUserFilterKeyword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchUsers()}
              className="w-full px-3 py-2 pr-10 border border-[#ddd] rounded-lg bg-white text-[#111] text-sm focus:outline-none focus:ring-1 focus:ring-[#111] focus:border-[#111]"
            />
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#999]" />
          </div>
        </div>
        <button
          onClick={fetchUsers}
          className="px-6 py-2 bg-[#111] text-white rounded-lg text-sm font-medium hover:bg-[#333] transition-colors"
        >
          검색
        </button>
      </div>

      {/* Table */}
      <div className="border border-[#eee] rounded-lg">
        <table className="w-full">
          <thead>
            <tr className="bg-[#f9f9f9] border-b-2 border-[#eee]">
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider">ID</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider">이름</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider">닉네임</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider">이메일</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider">전화번호</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider">가입일</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider">권한</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider">관리</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-[#eee]">
            {users.map((u) => (
              <tr key={u.userId} className="hover:bg-[#f9f9f9] transition-colors">
                <td className="px-4 py-3 text-sm text-[#111]">{u.userId}</td>
                <td className="px-4 py-3 text-sm text-[#111]">{u.userName}</td>
                <td className="px-4 py-3 text-sm">
                  {editingUserId === u.userId ? (
                    <input
                      value={editUserForm.nickName}
                      onChange={(e) =>
                        setEditUserForm({
                          ...editUserForm,
                          nickName: e.target.value,
                        })
                      }
                      className="px-2 py-1 border border-[#ddd] rounded text-sm w-full focus:outline-none focus:ring-1 focus:ring-[#111]"
                    />
                  ) : (
                    <span className="text-[#111]">{u.nickName}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-[#666]">{u.email}</td>
                <td className="px-4 py-3 text-sm">
                  {editingUserId === u.userId ? (
                    <input
                      value={editUserForm.phone}
                      onChange={(e) =>
                        setEditUserForm({
                          ...editUserForm,
                          phone: e.target.value,
                        })
                      }
                      className="px-2 py-1 border border-[#ddd] rounded text-sm w-full focus:outline-none focus:ring-1 focus:ring-[#111]"
                    />
                  ) : (
                    <span className="text-[#666]">{u.phone}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-[#666]">
                  {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "-"}
                </td>
                <td className="px-4 py-3 text-sm">
                  <CustomSelect
                    value={u.role || "USER"}
                    onChange={(value) =>
                      handleChangeRole(u.userId, value as User["role"])
                    }
                    options={[
                      { value: "USER", label: "USER" },
                      { value: "BANNED", label: "BANNED" },
                      { value: "ADMIN", label: "ADMIN" },
                    ]}
                    className="w-32"
                  />
                </td>
                <td className="px-4 py-3 text-sm">
                  {editingUserId === u.userId ? (
                    <div className="flex gap-2">
                      <input
                        type="password"
                        placeholder="새 비밀번호"
                        value={editUserForm.password}
                        onChange={(e) =>
                          setEditUserForm({
                            ...editUserForm,
                            password: e.target.value,
                          })
                        }
                        className="px-2 py-1 border border-[#ddd] rounded text-sm w-24 focus:outline-none focus:ring-1 focus:ring-[#111]"
                      />
                      <button
                        onClick={() => handleSaveUserClick(u.userId)}
                        className="px-3 py-1 bg-[#111] text-white rounded text-xs font-medium hover:bg-[#333] transition-colors"
                      >
                        저장
                      </button>
                      <button
                        onClick={handleCancelUserClick}
                        className="px-3 py-1 bg-white border border-[#ddd] text-[#666] rounded text-xs font-medium hover:bg-[#f9f9f9] transition-colors"
                      >
                        취소
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleEditUserClick(u)}
                      className="px-3 py-1 border border-[#ddd] text-[#666] rounded text-xs font-medium hover:bg-[#f9f9f9] transition-colors"
                    >
                      수정
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
