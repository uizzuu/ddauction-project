import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { SignupForm } from "../common/types";
import { API_BASE_URL } from "../common/api";

export default function Signup() {
  const navigate = useNavigate();

  const [form, setForm] = useState<SignupForm>({
    userName: "",
    nickName: "",
    email: "",
    password: "",
    phone: "",
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
  });

  // 이메일 유효성 체크
  const isEmailValid = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validateAll = () => {
    const newErrors = {
      userName: "",
      nickName: "",
      email: "",
      phone: "",
      password: "",
      passwordConfirm: "",
      submit: "",
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

  const handleSubmit = async () => {
    if (!validateAll()) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await response.json(); // 항상 메시지 읽기

      if (response.ok) {
        // 200~299
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

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2
          onClick={() => navigate("/")}
          className="width-fit margin-auto svg-wrap mb-48 height-40"
        >
          <svg
            viewBox="0 0 127 36"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M52.7549 21.9197C54.4879 22.0975 56.3389 22.2339 58.0205 23.0233H58.0195C59.7091 23.7717 61.2503 25.3214 61.6055 27.2811L61.6064 27.282C61.9613 29.289 61.0293 31.3149 59.6855 32.6219L59.6787 32.6287C58.2877 33.8926 56.4752 34.5367 54.7373 34.8563L54.7334 34.8572C53.1239 35.1309 51.452 35.1797 49.8555 34.7615C48.2505 34.341 46.7285 33.3586 45.7256 31.9031L45.7246 31.9022C44.7623 30.4891 44.3622 28.5072 44.9375 26.7908C45.4068 25.2779 46.1904 23.8937 47.5771 23.1229C48.226 22.7622 48.8051 22.4551 49.582 22.243C50.357 22.0314 51.3136 21.9178 52.7246 21.9178H52.7402L52.7549 21.9197ZM18.3926 21.9197C20.1544 22.0975 22.0337 22.2337 23.7412 23.0223H23.7402C25.4553 23.7697 27.0224 25.3186 27.3838 27.2801L27.3848 27.282C27.7456 29.2912 26.7976 31.3176 25.4326 32.6238L25.4248 32.6307C24.012 33.8935 22.1722 34.5369 20.4072 34.8563L20.4033 34.8572C18.7682 35.1308 17.0703 35.1792 15.4492 34.7615C13.8198 34.3416 12.2733 33.3607 11.2539 31.9051L11.2529 31.9041C10.276 30.4926 9.86811 28.5122 10.4502 26.7957C10.9273 25.2792 11.7248 23.8929 13.1348 23.1219C13.7942 22.7613 14.3822 22.4539 15.1709 22.242C15.9574 22.0308 16.9288 21.9178 18.3623 21.9178H18.377L18.3926 21.9197ZM92.9102 24.3992V34.7684L87.7959 34.5848L87.3262 28.4373L70.2627 26.9227L70.5762 22.702L92.9102 24.3992ZM20.3535 34.5604C19.9711 34.6243 19.5857 34.6751 19.2002 34.7108C19.3829 34.6939 19.5658 34.6748 19.748 34.6512C19.9502 34.625 20.1524 34.595 20.3535 34.5613V34.5604ZM54.6836 34.5604C54.3073 34.6243 53.9282 34.6751 53.5488 34.7108C53.7286 34.6939 53.9086 34.6748 54.0879 34.6512C54.2868 34.625 54.4857 34.595 54.6836 34.5613V34.5604ZM49.6436 34.3895C49.7392 34.4189 49.8353 34.4463 49.9316 34.4715C50.016 34.4936 50.1007 34.5136 50.1855 34.533C50.1007 34.5136 50.016 34.4926 49.9316 34.4705C49.8353 34.4453 49.7392 34.4186 49.6436 34.3895ZM15.2314 34.3895C15.3284 34.4188 15.4267 34.4463 15.5244 34.4715L15.5234 34.4705C15.4254 34.4452 15.3277 34.4179 15.2305 34.3885L15.2314 34.3895ZM108.996 26.1248L122.691 26.6531V31.4041L103.707 30.0604L103.329 20.702H108.477L108.996 26.1248ZM53.1162 27.0057H53.1133C52.1269 27.0499 51.8883 27.0933 51.3564 27.1815L51.3525 27.1824C50.8147 27.2652 50.3353 27.4686 49.9736 27.8191L49.9639 27.8289C49.5809 28.1664 49.3888 28.7583 49.5459 29.2049C49.7409 29.6853 50.2755 29.9654 50.8701 30.0936L50.877 30.0945L50.8076 30.3865L50.877 30.0955C52.3175 30.4402 53.8457 30.355 55.2607 29.9647C55.6464 29.8263 55.9724 29.7144 56.2012 29.4764C56.4333 29.1501 56.421 28.6235 56.1777 28.2088C56.0492 28.013 55.8625 27.8028 55.6523 27.6268C55.4373 27.4466 55.2154 27.3175 55.0225 27.2654C54.5241 27.1313 53.8976 26.9637 53.1162 27.0057ZM18.7598 27.0057H18.7568C17.7539 27.05 17.5107 27.0933 16.9697 27.1815L16.9668 27.1824C16.4183 27.2655 15.9299 27.4698 15.5615 27.8211L15.5566 27.826L15.5508 27.8309C15.1612 28.1688 14.9681 28.7582 15.126 29.202C15.2989 29.6227 15.7375 29.8912 16.251 30.0379L16.4756 30.0936L16.4824 30.0945C17.9495 30.4399 19.5059 30.3552 20.9463 29.9637C21.3373 29.8258 21.6686 29.7122 21.9014 29.4734C22.1363 29.1478 22.1234 28.6236 21.876 28.2098C21.7454 28.0144 21.5571 27.8036 21.3438 27.6277C21.1249 27.4474 20.898 27.3179 20.7002 27.2654C20.1937 27.1313 19.5556 26.9636 18.7598 27.0057ZM15.0303 29.6307C15.0547 29.6624 15.0806 29.6929 15.1074 29.7225C15.0532 29.6628 15.0038 29.5987 14.96 29.5301L15.0303 29.6307ZM45.0605 27.5018C45.0356 27.6327 45.0166 27.7647 45.0029 27.8973C45.0166 27.765 45.0357 27.6333 45.0605 27.5027V27.5018ZM46.6621 24.2156C46.6552 24.223 46.6485 24.2307 46.6416 24.2381C46.6604 24.2178 46.6801 24.1985 46.6992 24.1785C46.6871 24.1911 46.6741 24.2029 46.6621 24.2156ZM126.074 1.69806V21.8543H121.352L120.974 18.4949L114.456 17.7264L114.881 12.8318L120.974 13.3592V10.9598L114.456 9.95196V5.87286H120.974L120.596 1.31427L126.074 1.69806ZM84.4043 15.9109L93.9541 16.0486L94.2148 20.4998L69.0625 20.8201L69.3242 16.3699L78.7686 15.9109L79.082 12.9285H84.4043V15.9109ZM29.5068 1.11407L29.7109 8.79766L35.0029 9.39727L35.1865 9.41681L35.5449 3.30352L35.5615 3.01446L35.8516 3.0213L45.0625 3.24591L45.3818 3.25372L45.3545 3.57208L44.9375 8.32989L44.9111 8.62677L44.6143 8.60235L39.4053 8.18048L39.5947 13.869L44.5469 14.4236L44.8291 14.4559L44.8135 14.7391L44.5215 19.7664L44.502 20.0975L44.1748 20.0457L34.9209 18.5643L34.6533 18.5213L34.6689 18.2508L34.8994 14.3065L29.5156 14.5174L28.9971 18.7088L28.96 19.0076L28.6611 18.9695L24.0859 18.3856L23.8193 18.3524L23.8242 18.0828L24.1201 1.117L24.125 0.822079H29.499L29.5068 1.11407ZM1.21191 3.0213L10.5742 3.24591L10.8945 3.25372L10.8662 3.57208L10.4424 8.32989L10.416 8.62579L10.1201 8.60235L4.82031 8.18048L5.0127 13.869L10.0498 14.4236L10.333 14.4549L10.3164 14.74L10.0195 19.7664L10 20.0965L9.67383 20.0457L0.268555 18.5643L0 18.5223L0.015625 18.2498L0.905273 3.30352L0.922852 3.01446L1.21191 3.0213ZM53.5596 3.93145L54.6016 8.77911L54.6826 9.15606L54.2979 9.14141L49.6543 8.97345L49.7666 14.2947L54.6914 14.4217L55.0029 14.4305L54.9824 14.741L54.6914 19.2742L54.6719 19.575L54.3721 19.5545L45.6191 18.9715L45.335 18.952L45.3389 18.6678L45.5469 4.43927L45.5518 4.16095L45.8291 4.14434L53.248 3.69513L53.5059 3.6795L53.5596 3.93145ZM19.2061 3.93048L20.2656 8.77813L20.3477 9.15606L19.9609 9.14141L15.2363 8.97345L15.3506 14.2947L20.3613 14.4217L20.6729 14.4305L20.6523 14.742L20.3564 19.2752L20.3369 19.574L20.0371 19.5545L11.1406 18.9715L10.8564 18.9529L10.8604 18.6678L11.0723 4.43927L11.0762 4.15997L11.3545 4.14434L18.8955 3.69513L19.1514 3.6795L19.2061 3.93048ZM63.6943 1.11407L63.8955 8.79766L69.0977 9.39727L69.3633 9.42755V14.2918L69.0752 14.3035L63.7031 14.5174L63.1924 18.7078L63.1553 19.0086L62.8555 18.9695L58.3545 18.3856L58.0889 18.3514L58.0928 18.0828L58.3848 1.117L58.3896 0.822079H63.6865L63.6943 1.11407ZM107.296 2.89727L105.738 7.6004L113.152 11.2479L110.46 16.0467L102.668 11.2479L97.2373 16.575L94.2148 12.6873L103.235 1.12188L107.296 2.89727ZM4.7207 14.1385H4.72168L4.50977 7.85431H4.50879L4.7207 14.1385ZM69.0625 14.0037H69.0635V9.69513L69.0625 9.69415V14.0037ZM78.4033 0.357235C81.2211 -0.285111 84.3001 -0.0554698 86.9092 0.999813C88.5789 1.64218 90.0926 2.88127 90.7188 4.39532C91.3968 5.95524 90.927 8.02001 90.04 9.3963C88.2658 12.0572 84.3 12.7907 81.0127 12.5613C75.8989 12.286 72.2981 9.8548 72.5068 5.90899C72.559 4.94548 72.9245 4.07377 73.4463 3.33966C74.4899 1.91735 76.4726 0.816072 78.4033 0.357235ZM54.3066 8.84063L54.3086 8.84161L53.2666 3.99493L54.3066 8.84063ZM81.4824 4.39532C80.3866 4.39532 79.1859 4.85355 78.6641 5.45001C77.9858 6.1382 78.0906 6.96395 78.9775 7.60626C79.0296 7.60632 79.0299 7.65216 79.082 7.65216C80.0735 8.29449 81.8478 8.61587 83.1523 8.20294C84.1435 7.88174 84.7177 7.14782 84.7178 6.41388C84.6134 5.22101 83.1521 4.3954 81.4824 4.39532Z"
              fill="#b17576"
            />
          </svg>
        </h2>

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
            onBlur={() => {
              const val = form.email;
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

          {/* 비밀번호 */}
          <input
            type="password"
            placeholder="비밀번호 (8자리 이상, 대소문자+숫자+특수문자 !*@# 포함)"
            value={form.password}
            onChange={(e) => {
              // 공백 제거
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
              const val = e.target.value.replace(/\s+/g, ""); // 공백 제거
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
