import type { DisplayStatus } from "@/types/job-event";

const statusStyles: Record<DisplayStatus, string> = {
  待参加: "bg-blue-50 text-blue-700",
  待完成: "bg-amber-50 text-amber-700",
  已完成: "bg-emerald-50 text-emerald-700",
  已取消: "bg-slate-100 text-slate-500",
  待确认: "bg-slate-100 text-slate-600",
};

export default function StatusBadge({ status }: { status: DisplayStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[status]}`}
    >
      <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}
