import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ThemeToggle } from "@/components/ui";

export const metadata = {
  title: { default: "Admin", template: "%s | Admin — 재린월드" },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const role = session.user.role;

  return (
    <div className="min-h-screen bg-bg-secondary flex">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 bg-white border-r border-border-default flex flex-col">
        <div className="px-5 py-4 border-b border-border-default">
          <Link href="/" className="flex items-center gap-1.5 text-base font-bold text-text-primary">
            <img src="/logo.png?v=3" alt="" className="h-7 w-auto" />
            재린월드
          </Link>
          <p className="text-xs text-text-tertiary mt-0.5">{role}</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 text-sm">
          <NavItem href="/admin" label="대시보드" />
          {role !== "VIEWER" && (
            <>
              <NavItem href="/admin/posts" label="글" />
              <NavItem href="/admin/albums" label="앨범" />
              <NavItem href="/admin/milestones" label="마일스톤" />
              <NavItem href="/admin/growth" label="성장기록" />
              <NavItem href="/admin/map" label="지도 핀" />
            </>
          )}
          {role === "OWNER" && (
            <>
              <div className="pt-3 pb-1 px-3 text-xs font-semibold text-text-tertiary uppercase tracking-wide">
                관리
              </div>
              <NavItem href="/admin/users" label="사용자" />
              <NavItem href="/admin/settings" label="설정" />
              <NavItem href="/admin/audit" label="감사 로그" />
            </>
          )}
        </nav>

        {/* 테마 토글 */}
        <div className="px-3 py-2 border-t border-border-default flex items-center justify-between">
          <span className="text-xs text-text-tertiary px-3">테마</span>
          <ThemeToggle />
        </div>

        {/* Sign out */}
        <div className="px-3 py-4 border-t border-border-default">
          <form action="/api/auth/signout" method="POST">
            <button
              type="submit"
              className="w-full text-left px-3 py-2 rounded-lg text-sm text-text-secondary hover:bg-bg-secondary hover:text-text-primary transition-colors"
            >
              로그아웃
            </button>
          </form>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}

function NavItem({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="block px-3 py-2 rounded-lg text-text-secondary hover:bg-bg-secondary hover:text-text-primary transition-colors"
    >
      {label}
    </Link>
  );
}
