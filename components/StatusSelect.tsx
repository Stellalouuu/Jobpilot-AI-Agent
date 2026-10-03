"use client";

import type { EventStatus } from "@/types/job-event";

const statuses: EventStatus[] = ["待参加", "待完成", "已完成", "已取消"];

type StatusSelectProps = {
  status: EventStatus;
  onChange: (status: EventStatus) => void;
};

export default function StatusSelect({ status, onChange }: StatusSelectProps) {
  return (
    <label className="relative inline-flex items-center">
      <span className="pointer-events-none absolute left-2 h-1.5 w-1.5 rounded-full bg-current" />
      <select
        value={status}
        onChange={(event) => onChange(event.target.value as EventStatus)}
        className="appearance-none rounded-full border-0 bg-slate-100 py-1 pl-5 pr-7 text-xs font-medium text-slate-700 outline-none transition-colors hover:bg-slate-200 focus:ring-2 focus:ring-teal-600"
        aria-label="修改事项状态"
      >
        {statuses.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
      <span className="pointer-events-none absolute right-2 text-[10px] text-slate-500">▼</span>
    </label>
  );
}
