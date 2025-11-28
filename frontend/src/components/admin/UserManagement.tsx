import type { User } from "../../common/types";

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

export default function UserManagement({
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
    <div className="admin-section">
      <h3>회원 관리</h3>

      {/* --- 회원 필터 UI (AdminPage에서 이동) --- */}
      <div style={{ marginBottom: "1rem" }}>
        <select
          value={userFilterField}
          onChange={(e) =>
            setUserFilterField(
              e.target.value as "userName" | "nickName" | "email" | "phone"
            )
          }
        >
          <option value="userName">이름</option>
          <option value="nickName">닉네임</option>
          <option value="email">이메일</option>
          <option value="phone">전화번호</option>
        </select>
        <input
          placeholder="검색어 입력"
          value={userFilterKeyword}
          onChange={(e) => setUserFilterKeyword(e.target.value)}
        />
        <button onClick={fetchUsers}>검색</button>
      </div>

      <table className="admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>이름</th>
            <th>닉네임</th>
            <th>이메일</th>
            <th>전화번호</th>
            <th>가입일</th>
            <th>최종수정일</th>
            <th>권한</th>
            <th>수정</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.userId}>
              <td>{u.userId}</td>
              <td>{u.userName}</td>
              <td>
                {editingUserId === u.userId ? (
                  <input
                    value={editUserForm.nickName}
                    onChange={(e) =>
                      setEditUserForm({
                        ...editUserForm,
                        nickName: e.target.value,
                      })
                    }
                  />
                ) : (
                  u.nickName
                )}
              </td>
              <td>{u.email}</td>
              <td>
                {editingUserId === u.userId ? (
                  <input
                    value={editUserForm.phone}
                    onChange={(e) =>
                      setEditUserForm({
                        ...editUserForm,
                        phone: e.target.value,
                      })
                    }
                  />
                ) : (
                  u.phone
                )}
              </td>
              <td>
                {u.createdAt ? new Date(u.createdAt).toLocaleString() : "-"}
              </td>
              <td>
                {u.updatedAt ? new Date(u.updatedAt).toLocaleString() : "-"}
              </td>

              {/* 권한 칸 */}
              <td>
                <select
                  value={u.role}
                  onChange={(e) =>
                    handleChangeRole(u.userId, e.target.value as User["role"])
                  }
                >
                  <option value="USER">USER</option>
                  <option value="BANNED">BANNED</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </td>

              {/* 수정 칸 */}
              <td>
                {editingUserId === u.userId ? (
                  <>
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
                    />
                    <button onClick={() => handleSaveUserClick(u.userId)}>
                      저장
                    </button>
                    <button onClick={handleCancelUserClick}>취소</button>
                  </>
                ) : (
                  <button onClick={() => handleEditUserClick(u)}>수정</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
