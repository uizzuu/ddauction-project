import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createArticle, getArticleById, updateArticle } from "../../common/api";
import type { ArticleForm as ArticleFormType } from "../../common/types";

interface Props {
  userId: number | null; // 현재 로그인한 사용자 ID
}

export default function ArticleForm({ userId }: Props) {
  const { id } = useParams(); // 게시글 ID (수정 모드일 경우)
  const navigate = useNavigate();

  const fixedBoardId = 1; // 고정 게시판 ID (예: 커뮤니티)

  const [form, setForm] = useState<ArticleFormType>({
    title: "",
    content: "",
    boardId: fixedBoardId,
  });

  const [loading, setLoading] = useState(false);

  // 수정 모드일 때 기존 게시글 데이터 불러오기
  useEffect(() => {
    if (id) {
      setLoading(true);
      getArticleById(Number(id))
        .then((article) => {
          setForm({
            title: article.title,
            content: article.content,
            boardId: article.boardId,
            userId: article.userId,
          });
        })
        .catch(() => alert("게시글을 불러오지 못했습니다."))
        .finally(() => setLoading(false));
    }
  }, [id]);

  // 입력값 변경 핸들러 (title, content 만 처리)
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // 폼 제출 핸들러 (생성/수정)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (userId == null) {
      alert("로그인 후 이용해주세요.");
      return;
    }

    if (!form.title.trim() || !form.content.trim()) {
      alert("제목과 내용을 입력해주세요.");
      return;
    }

    try {
      setLoading(true);

      const articleData = {
        ...form,
        userId,
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
    } catch {
      alert("오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="container">로딩 중...</div>;

  return (
    <div className="container">
      <form onSubmit={handleSubmit} className="flex-column article-form gap-24">
        <input type="hidden" name="boardId" value={form.boardId} />
        <input type="hidden" name="userId" value={userId ?? ""} />

        <div>
          <label htmlFor="title" className="article-label">
            제목
          </label>
          <input
            id="title"
            name="title"
            type="text"
            value={form.title}
            onChange={handleChange}
            required
            className="article-input"
          />
        </div>

        <div>
          <label htmlFor="content" className="article-label">
            내용
          </label>
          <textarea
            id="content"
            name="content"
            value={form.content}
            onChange={handleChange}
            required
            rows={10}
            className="article-textarea"
          />
        </div>

        <div className="btn-wrap">
          <button type="submit" className="article-btn">
            {id ? "수정하기" : "등록하기"}
          </button>
        </div>
      </form>
    </div>
  );
}
