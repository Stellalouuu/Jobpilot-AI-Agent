"use client";

import { useState } from "react";
import StatusBadge from "@/components/StatusBadge";
import StatusSelect from "@/components/StatusSelect";
import CalendarButton from "@/components/CalendarButton";
import {
  getCountdownText,
  getDisplayStatus,
  getEventUrgency,
  isEventOverdue,
} from "@/lib/event-utils";
import type { EventStatus, JobEvent } from "@/types/job-event";

type EventFilter = "全部" | "待办" | "面试" | "测评" | "已完成" | "已逾期" | "收藏";

type ApplicationsTableProps = {
  events: JobEvent[];
  now: number;
  onStatusChange: (messageId: string, status: EventStatus) => void;
  onTogglePinned: (messageId: string) => void;
  isDemoMode: boolean;
};

const filters: EventFilter[] = ["全部", "待办", "面试", "测评", "已完成", "已逾期", "收藏"];

function matchesFilter(event: JobEvent, filter: EventFilter, now: number) {
  if (filter === "全部") return true;
  if (filter === "待办") return event.status === "待参加" || event.status === "待完成";
  if (filter === "面试") return event.eventType === "面试";
  if (filter === "测评") return event.eventType === "在线测评" || event.eventType === "笔试";
  if (filter === "已完成") return event.status === "已完成";
  if (filter === "已逾期") return isEventOverdue(event, now);
  return event.isPinned;
}

export default function ApplicationsTable({
  events,
  now,
  onStatusChange,
  onTogglePinned,
  isDemoMode,
}: ApplicationsTableProps) {
  const [filter, setFilter] = useState<EventFilter>("全部");
  const visibleEvents = events.filter((event) => matchesFilter(event, filter, now));

  return (
    <section className="border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-5 py-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-700">All activity</p>
            <div className="flex items-center gap-2">
              <h2 className="mt-1 text-lg font-semibold text-slate-900">招聘日程</h2>
              {isDemoMode && <span className="border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-500">Synthetic Data</span>}
            </div>
          </div>
          <span className="text-sm text-slate-400">{visibleEvents.length} 条记录</span>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {filters.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setFilter(option)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === option
                  ? "bg-teal-700 text-white"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[850px] text-left text-sm">
          <thead className="bg-slate-50 text-xs font-medium text-slate-500">
            <tr>
              {["", "公司", "岗位", "事件类型", "面试轮次", "日期 / 截止时间", "状态", "紧急程度", "日历"].map((heading) => (
                <th key={heading} className="whitespace-nowrap px-5 py-3">{heading}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visibleEvents.map((event) => {
              const overdue = isEventOverdue(event, now);
              const urgency = getEventUrgency(event, now);
              return (
                <tr key={event.sourceMessageId} className="text-slate-700">
                  <td className="px-5 py-4">
                    <button
                      type="button"
                      onClick={() => onTogglePinned(event.sourceMessageId)}
                      className={`text-lg leading-none ${event.isPinned ? "text-amber-500" : "text-slate-300 hover:text-amber-400"}`}
                      aria-label={event.isPinned ? "取消收藏" : "收藏事项"}
                    >
                      {event.isPinned ? "★" : "☆"}
                    </button>
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 font-medium text-slate-900">{event.company ?? "待确认"}</td>
                  <td className="whitespace-nowrap px-5 py-4">{event.position ?? "待确认"}</td>
                  <td className="whitespace-nowrap px-5 py-4">{event.eventType}</td>
                  <td className="whitespace-nowrap px-5 py-4">{event.interviewRound ?? "待确认"}</td>
                  <td className="whitespace-nowrap px-5 py-4">
                    {event.deadline ? `截止 ${event.deadline}` : `${event.eventDate ?? "待确认"} ${event.eventTime ?? ""}`}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4">
                    <div className="flex items-center gap-2">
                      <StatusSelect status={event.status} onChange={(status) => onStatusChange(event.sourceMessageId, status)} />
                      {getDisplayStatus(event) === "待确认" && <StatusBadge status="待确认" />}
                    </div>
                    {overdue && <p className="mt-1 text-xs font-medium text-red-600">{getCountdownText(event, now)}</p>}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4">
                    {urgency === "overdue" && <span className="text-xs font-medium text-red-600">已逾期</span>}
                    {urgency === "urgent" && <span className="text-xs font-medium text-amber-700">紧急</span>}
                    {urgency === "soon" && <span className="text-xs font-medium text-teal-700">即将到期</span>}
                    {urgency === "normal" && <span className="text-xs text-slate-400">—</span>}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4">
                    <CalendarButton event={event} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {visibleEvents.length === 0 && <p className="px-5 py-10 text-center text-sm text-slate-400">暂无符合条件的招聘事项</p>}
      </div>
    </section>
  );
}
