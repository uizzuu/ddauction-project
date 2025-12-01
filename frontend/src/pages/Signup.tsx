import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { SignupForm } from "../common/types";
import { API_BASE_URL } from "../common/api";

export default function Signup() {
const navigate = useNavigate();

const [form, setForm] = useState<SignupForm & {
address?: string;
zipCode?: string;
detailAddress?: string;
}>({
userName: "",
nickName: "",
email: "",
password: "",
phone: "",
birthday: "",
address: "",
zipCode: "",
detailAddress: ""
});

const [isComposing, setIsComposing] = useState({
userName: false,
nickName: false,
});

const [passwordConfirm, setPasswordConfirm] = useState("");
const [errors, setErrors] = useState({
userName: "",
nickName: "",
email: "",
phone: "",
password: "",
passwordConfirm: "",
submit: "",
birthday: "",
address: "",
});

const isEmailValid = (email: string) =>
/^[^\s@]+@[^\s@]+.[^\s@]+$/.test(email);

const validateAll = () => {
const newErrors = {
userName: "",
nickName: "",
email: "",
phone: "",
password: "",
passwordConfirm: "",
submit: "",
birthday: "",
address: "",
zipCode: "",
detailAddress: "",
};


if (!form.userName) newErrors.userName = "이름을 입력해주세요";
if (!form.nickName) newErrors.nickName = "닉네임을 입력해주세요";
else if (form.nickName.length < 3 || form.nickName.length > 12)
  newErrors.nickName = "닉네임은 3~12자여야 합니다";

if (!form.email) newErrors.email = "이메일을 입력해주세요";
else if (!isEmailValid(form.email))
  newErrors.email = "올바른 이메일 형식이 아닙니다";

if (!form.phone) newErrors.phone = "전화번호를 입력해주세요";
else if (form.phone.length < 10 || form.phone.length > 11)
  newErrors.phone = "전화번호는 10~11자리 숫자여야 합니다";

if (!form.password) newErrors.password = "비밀번호를 입력해주세요";
else if (form.password.length < 8)
  newErrors.password = "비밀번호는 8자리 이상이어야 합니다";

if (!passwordConfirm)
  newErrors.passwordConfirm = "비밀번호 확인을 입력해주세요";
else if (passwordConfirm !== form.password)
  newErrors.passwordConfirm = "비밀번호가 일치하지 않습니다";

setErrors(newErrors);
return Object.values(newErrors).every((err) => !err);


};

const handleSearchAddress = () => {
// @ts-ignore
new window.daum.Postcode({
oncomplete: function (data: any) {
setForm((prev) => ({
...prev,
address: data.address,
zipCode: data.zonecode,
detailAddress: "",
}));
},
}).open();
};

const handleSubmit = async () => {
if (!validateAll()) return;


try {
  const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(form),
  });

  const data = await response.json();

  if (response.ok) {
    alert(data.message || "회원가입 성공!");
    navigate("/login");
  } else {
    setErrors((prev) => ({ ...prev, submit: data || "회원가입 실패" }));
  }
} catch (err) {
  console.log(err);
  setErrors((prev) => ({ ...prev, submit: "회원가입 실패" }));
}


};

return ( <div className="auth-container"> <div className="auth-box">
<h2
onClick={() => navigate("/")}
className="width-fit margin-auto svg-wrap mb-48 height-40"
>
{/* 로고 SVG 생략 */} </h2>


    <div className="form-group">
      {/* 이름 */}
      <input
        type="text"
        placeholder="이름"
        value={form.userName}
        onCompositionStart={() =>
          setIsComposing((prev) => ({ ...prev, userName: true }))
        }
        onCompositionEnd={() =>
          setIsComposing((prev) => ({ ...prev, userName: false }))
        }
        onChange={(e) => {
          let val = e.target.value;
          if (!isComposing.userName)
            val = val.replace(/[^가-힣a-zA-Z]/g, "");
          setForm((prev) => ({ ...prev, userName: val }));
          setErrors((prev) => ({
            ...prev,
            userName: val ? "" : "이름을 입력해주세요",
          }));
        }}
        className="input"
      />
      {errors.userName && (
        <p className="error-message">{errors.userName}</p>
      )}

      {/* 닉네임 */}
      <input
        type="text"
        placeholder="닉네임"
        value={form.nickName}
        onCompositionStart={() =>
          setIsComposing((prev) => ({ ...prev, nickName: true }))
        }
        onCompositionEnd={() =>
          setIsComposing((prev) => ({ ...prev, nickName: false }))
        }
        onChange={(e) => {
          let val = e.target.value;
          if (!isComposing.nickName)
            val = val.replace(/[^가-힣a-zA-Z0-9]/g, "");
          setForm((prev) => ({ ...prev, nickName: val }));
          let msg = "";
          if (!val) msg = "닉네임을 입력해주세요";
          else if (val.length < 3 || val.length > 12)
            msg = "닉네임은 3~12자여야 합니다";
          setErrors((prev) => ({ ...prev, nickName: msg }));
        }}
        className="input"
      />
      {errors.nickName && (
        <p className="error-message">{errors.nickName}</p>
      )}

      {/* 이메일 */}
      <input
        type="text"
        placeholder="이메일"
        value={form.email}
        onChange={(e) => {
          const val = e.target.value.replace(/[ㄱ-ㅎㅏ-ㅣ가-힣\s]/g, "");
          setForm((prev) => ({ ...prev, email: val }));
          let msg = "";
          if (!val) msg = "이메일을 입력해주세요";
          else if (!isEmailValid(val))
            msg = "올바른 이메일 형식이 아닙니다";
          setErrors((prev) => ({ ...prev, email: msg }));
        }}
        className="input"
      />
      {errors.email && <p className="error-message">{errors.email}</p>}

      {/* 전화번호 */}
      <input
        type="tel"
        placeholder="전화번호 (숫자만 입력)"
        value={form.phone}
        onChange={(e) => {
          const filtered = e.target.value
            .replace(/[^0-9]/g, "")
            .slice(0, 11);
          setForm((prev) => ({ ...prev, phone: filtered }));
          let msg = "";
          if (!filtered) msg = "전화번호를 입력해주세요";
          else if (filtered.length < 10)
            msg = "전화번호는 10~11자리 숫자여야 합니다";
          setErrors((prev) => ({ ...prev, phone: msg }));
        }}
        className="input"
      />
      {errors.phone && <p className="error-message">{errors.phone}</p>}

      {/* 생일 */}
      <input
        type="date"
        placeholder="생일"
        value={form.birthday}
        onChange={(e) =>
          setForm((prev) => ({ ...prev, birthday: e.target.value }))
        }
        className="input"
      />
      {errors.birthday && <p className="error-message">{errors.birthday}</p>}

      {/* 주소 검색 */}
      <div className="address-search">
        <input
          type="text"
          placeholder="주소"
          value={form.address}
          readOnly
          className="input"
        />
        <button
          type="button"
          onClick={handleSearchAddress}
          className="btn-address-search"
        >
          주소 검색
        </button>
      </div>
      {errors.address && <p className="error-message">{errors.address}</p>}

      {/* 우편번호 */}
      <input
        type="text"
        placeholder="우편번호"
        value={form.zipCode}
        readOnly
        className="input"
      />

      {/* 상세주소 */}
      <input
        type="text"
        placeholder="상세주소"
        value={form.detailAddress}
        onChange={(e) =>
          setForm((prev) => ({ ...prev, detailAddress: e.target.value }))
        }
        className="input"
      />

      {/* 비밀번호 */}
      <input
        type="password"
        placeholder="비밀번호 (8자리 이상, 대소문자+숫자+특수문자 !*@# 포함)"
        value={form.password}
        onChange={(e) => {
          const val = e.target.value.replace(/\s+/g, "");
          setForm((prev) => ({ ...prev, password: val }));
          const pattern =
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!*@#]).{8,}$/;
          let msg = "";
          if (!val) msg = "비밀번호를 입력해주세요";
          else if (!pattern.test(val))
            msg =
              "비밀번호는 8자리 이상, 대소문자+숫자+특수문자 !*@# 1개 이상 포함";
          setErrors((prev) => ({
            ...prev,
            password: msg,
            passwordConfirm:
              passwordConfirm && passwordConfirm !== val
                ? "비밀번호가 일치하지 않습니다"
                : "",
          }));
        }}
        className="input"
      />
      {errors.password && (
        <p className="error-message">{errors.password}</p>
      )}

      {/* 비밀번호 확인 */}
      <input
        type="password"
        placeholder="비밀번호 확인"
        value={passwordConfirm}
        onChange={(e) => {
          const val = e.target.value.replace(/\s+/g, "");
          setPasswordConfirm(val);
          setErrors((prev) => ({
            ...prev,
            passwordConfirm:
              val && val !== form.password
                ? "비밀번호가 일치하지 않습니다"
                : "",
          }));
        }}
        onPaste={(e) => e.preventDefault()}
        className="input"
      />
      {errors.passwordConfirm && (
        <p className="error-message">{errors.passwordConfirm}</p>
      )}
    </div>

    {errors.submit && <p className="error-message">{errors.submit}</p>}

    <button onClick={handleSubmit} className="btn-submit">
      회원가입
    </button>

    <div className="auth-links">
      <button onClick={() => navigate("/login")} className="auth-link-btn">
        로그인하기
      </button>
      <button onClick={() => navigate("/")} className="auth-link-btn">
        메인으로
      </button>
    </div>
  </div>
</div>


);
}
