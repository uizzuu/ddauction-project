import { useState, useEffect } from "react";
import CheckboxStyle from "../../components/ui/CheckboxStyle";
import { useNavigate, useParams } from "react-router-dom";
import { createArticle, getArticleById, updateArticle } from "../../common/api";
import type { ArticleForm as ArticleFormType, User } from "../../common/types";
import { ARTICLE_TYPES, ROLE } from "../../common/enums";
interface Props {
  user: User | null;
}

export default function ArticleForm({ user }: Props) {
  const { id } = useParams(); // 게시글 ID (수정 모드일 경우)
  const navigate = useNavigate();
  const isAdmin = user?.role === ROLE.ADMIN;

  const [form, setForm] = useState<ArticleFormType>({
    title: "",
    content: "",
    articleType: ARTICLE_TYPES.COMMUNITY,
    isSecret: false,
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ title: "", content: "" });

  // 수정 모드일 때 기존 게시글 데이터 불러오기
  useEffect(() => {
    if (id) {
      setLoading(true);
      getArticleById(Number(id))
        .then((article) => {
          setForm({
            title: article.title,
            content: article.content,
            userId: article.userId,
            articleType: article.articleType,
            isSecret: article.isSecret || false,
          });
        })
        .catch(() => alert("게시글을 불러오지 못했습니다."))
        .finally(() => setLoading(false));
    }
  }, [id]);

  // 입력값 변경 핸들러
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user types
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  // 폼 검증
  const validateForm = (): boolean => {
    const newErrors = { title: "", content: "" };
    let isValid = true;

    if (!form.title.trim()) {
      newErrors.title = "제목을 입력해주세요.";
      isValid = false;
    } else if (form.title.length > 100) {
      newErrors.title = "제목은 100자 이내로 입력해주세요.";
      isValid = false;
    }

    if (!form.content.trim()) {
      newErrors.content = "내용을 입력해주세요.";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // 폼 제출 핸들러 (생성/수정)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (user == null) {
      alert("로그인 후 이용해주세요.");
      return;
    }

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const articleData = {
        ...form,
        userId: user.userId,
      };

      if (id) {
        await updateArticle(Number(id), articleData); // 수정
        alert("게시글이 수정되었습니다.");
        navigate(`/articles/${id}`);
      } else {
        const created = await createArticle(articleData); // 생성
        alert("게시글이 생성되었습니다.");
        navigate(`/articles/${created.articleId}`);
      }
    } catch (error) {
      console.error("게시글 등록 오류:", error);
      alert(error instanceof Error ? error.message : "오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="max-w-[1280px] mx-auto py-8 flex items-center justify-center">
      <div className="text-gray-500">로딩 중...</div>
    </div>
  );

  return (
    <div className="max-w-[1280px] mx-auto py-8 px-5">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#111]">
          {id ? "게시글 수정" : "게시글 작성"}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          커뮤니티에서 자유롭게 의견을 나눠보세요
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-[#ddd] rounded-lg p-6 shadow-sm">
        {/* 게시글 유형 선택 (관리자만) */}
        <div className="mb-6">
          <label className="block text-sm font-bold text-[#333] mb-2">
            게시글 유형 <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            {[
              { value: ARTICLE_TYPES.COMMUNITY, label: "자유" },
              ...(isAdmin ? [{ value: ARTICLE_TYPES.NOTICE, label: "공지사항" }] : []),
              { value: ARTICLE_TYPES.FAQ, label: "FAQ" }
            ].map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setForm(prev => ({ ...prev, articleType: type.value }))}
                className={`
                    flex items-center justify-center px-4 py-2 rounded-[18px] text-[14px] font-medium whitespace-nowrap border transition-all
                    ${form.articleType === type.value
                    ? "bg-[#333] text-white border-[#333]"
                    : "bg-gray-100 text-[#666] border-transparent hover:bg-gray-200"}
                  `}
              >
                {type.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            게시글의 성격에 맞는 유형을 선택해주세요
          </p>
        </div>

        {/* 비밀글 설정 (FAQ일 때만 표시) */}
        {form.articleType === ARTICLE_TYPES.FAQ && (
          <div className="mb-6">
            <div className="mb-6">
              <CheckboxStyle
                checked={form.isSecret}
                onChange={(checked) => setForm(prev => ({ ...prev, isSecret: checked }))}
                label="비밀글 설정 (작성자와 관리자만 볼 수 있습니다)"
              />
            </div>
          </div>
        )}

        {/* 제목 입력 */}
        <div className="mb-6">
          <label htmlFor="title" className="block text-sm font-bold text-[#333] mb-2">
            제목 <span className="text-red-500">*</span>
          </label>
          <input
            id="title"
            name="title"
            type="text"
            value={form.title}
            onChange={handleChange}
            className={`w-full px-4 py-3 border ${errors.title ? "border-red-500" : "border-[#ddd]"} rounded-lg focus:outline-none focus:border-[#111] text-sm transition-colors`}
            placeholder="제목을 입력하세요 (최대 100자)"
            maxLength={100}
            required
          />
          <div className="flex justify-between items-center mt-1">
            <span className={`text-xs ${errors.title ? "text-red-500" : "text-gray-500"}`}>
              {errors.title || " "}
            </span>
            <span className="text-xs text-gray-400">
              {form.title.length}/100
            </span>
          </div>
        </div>

        {/* 내용 입력 */}
        <div className="mb-6">
          <label htmlFor="content" className="block text-sm font-bold text-[#333] mb-2">
            내용 <span className="text-red-500">*</span>
          </label>
          <textarea
            id="content"
            name="content"
            value={form.content}
            onChange={handleChange}
            rows={12}
            className={`w-full px-4 py-3 border ${errors.content ? "border-red-500" : "border-[#ddd]"} rounded-lg focus:outline-none focus:border-[#111] text-sm transition-colors resize-none`}
            placeholder="내용을 입력하세요"
            required
          />
          <div className="flex justify-between items-center mt-1">
            <span className={`text-xs ${errors.content ? "text-red-500" : "text-gray-500"}`}>
              {errors.content || " "}
            </span>
            <span className="text-xs text-gray-400">
              {form.content.length}자
            </span>
          </div>
        </div>

        {/* 버튼 그룹 */}
        <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-6 py-2.5 border border-[#ddd] rounded-lg text-[#666] font-medium hover:bg-gray-50 transition-colors text-sm"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-colors shadow-sm ${loading
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-[#111] text-white hover:bg-[#333]"
              }`}
          >
            {loading ? "처리중..." : id ? "수정하기" : "등록하기"}
          </button>
        </div>
      </form>
    </div>
  );
}
