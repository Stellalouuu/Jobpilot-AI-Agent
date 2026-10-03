type HeaderProps = {
  onSyncEmail: () => void;
  isSyncing: boolean;
};

export default function Header({ onSyncEmail, isSyncing }: HeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-8">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-700 text-sm font-bold text-white">
          JP
        </div>
        <div>
          <p className="text-base font-semibold tracking-tight text-slate-900">
            JobPilot AI
          </p>
          <p className="text-xs text-slate-500">AI 求职管理 Agent</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onSyncEmail}
        disabled={isSyncing}
        className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2"
      >
        <span className="text-base leading-none">{isSyncing ? "..." : "↻"}</span>
        <span className="hidden sm:inline">{isSyncing ? "正在读取邮箱…" : "同步邮箱"}</span>
        <span className="sm:hidden">{isSyncing ? "读取中" : "同步邮箱"}</span>
      </button>
    </header>
  );
}
