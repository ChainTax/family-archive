import { PostForm } from "../PostForm";

export const metadata = { title: "새 글 쓰기" };

export default function NewPostPage() {
  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center gap-3 mb-8">
        <a href="/admin/posts" className="text-text-tertiary hover:text-text-primary transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </a>
        <h1 className="text-xl font-bold text-text-primary">새 글 쓰기</h1>
      </div>
      <PostForm />
    </div>
  );
}
