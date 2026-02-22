export const metadata = { title: "사용자" };

export default function UsersPage() {
  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-text-primary mb-2">사용자</h1>
      <p className="text-text-secondary mb-8">가족 구성원 계정을 관리합니다.</p>
      <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-border-default text-center gap-3">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-tertiary">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
        <p className="font-medium text-text-secondary">준비 중입니다</p>
        <p className="text-sm text-text-tertiary">사용자 관리 기능은 추후 업데이트될 예정입니다.</p>
      </div>
    </div>
  );
}
