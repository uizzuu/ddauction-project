import React from "react";

type Props = {
  form: { nickName: string; password: string; phone: string };
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleUpdate: () => Promise<void>;
  setEditing: (editing: boolean) => void;
};

export default function MyProfile({
  form,
  handleChange,
  handleUpdate,
  setEditing,
}: Props) {
  return (
    <div className="flex flex-col gap-2">
      <label className="label title-16">닉네임</label>
      <input
        name="nickName"
        placeholder="닉네임"
        value={form.nickName}
        onChange={handleChange}
        className="input"
      />
      <label className="label title-16 mt-2.5">비밀번호</label>
      <input
        name="password"
        placeholder="비밀번호"
        type="password"
        value={form.password}
        onChange={handleChange}
        className="input"
      />
      <label className="label title-16 mt-2.5">전화번호</label>
      <input
        name="phone"
        placeholder="전화번호"
        value={form.phone}
        onChange={handleChange}
        className="input"
      />
      <div className="flex gap-2 w-full mt-2.5">
        <button className="search-btn" onClick={handleUpdate}>
          저장
        </button>
        <button className="search-btn" onClick={() => setEditing(false)}>
          취소
        </button>
      </div>
    </div>
  );
}