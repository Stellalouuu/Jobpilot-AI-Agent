import StatusBadge from "@/components/StatusBadge";
import CalendarButton from "@/components/CalendarButton";
import {
  getCountdownText,
  getDisplayStatus,
  getEventUrgency,
  isEventOverdue,
} from "@/lib/event-utils";
import type { JobEvent } from "@/types/job-event";

type UpcomingEventsProps = {
  events: JobEvent[];
  now: number;
};

export default function UpcomingEvents({ events, now }: UpcomingEventsProps) {
  return (
    <section>
      <div className="mb-4 flex items-end justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-700">Next up</p>
          <h2 className="mt-1 text-lg font-semibold text-slate-900">即将到来</h2>
        </div>
        <span className="text-sm text-slate-400">{events.length} 个日程</span>
      </div>
      {events.length === 0 ? (
        <div className="border border-dashed border-slate-300 bg-white px-5 py-10 text-center text-sm text-slate-400">
          暂无待处理的招聘事项
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-3">
          {events.slice(0, 5).map((event) => {
            const overdue = isEventOverdue(event, now);
            const urgency = getEventUrgency(event, now);
            return (
              <article key={event.sourceMessageId} className="border border-slate-200 bg-white p-4 transition-colors hover:border-teal-200">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2">
                    <span className={`text-lg leading-5 ${event.isPinned ? "text-amber-500" : "text-slate-200"}`}>
                      {event.isPinned ? "★" : "☆"}
                    </span>
                    <div>
                      <p className="font-semibold text-slate-900">{event.company ?? "待确认"}</p>
                      <p className="mt-1 text-sm text-slate-500">{event.position ?? "待确认"}</p>
                    </div>
                  </div>
                  <StatusBadge status={getDisplayStatus(event)} />
                </div>
                <div className="mt-5 flex items-end justify-between border-t border-slate-100 pt-3">
                  <div>
                    <p className="text-sm font-medium text-slate-700">
                      {event.eventType}{event.interviewRound ? ` / ${event.interviewRound}` : ""}
                    </p>
                    <p className={`mt-2 text-xs font-medium ${overdue ? "text-red-600" : urgency === "urgent" ? "text-amber-700" : "text-slate-500"}`}>
                      {getCountdownText(event, now)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-teal-700">
                      {event.deadline ? `截止 ${event.deadline}` : event.eventDate ?? "待确认"}
                    </p>
                    {!event.deadline && <p className="mt-1 text-xs text-slate-400">{event.eventTime ?? "时间待确认"}</p>}
                    {overdue && <p className="mt-1 text-xs font-medium text-red-600">已逾期</p>}
                    {!overdue && urgency === "urgent" && <p className="mt-1 text-xs font-medium text-amber-700">紧急</p>}
                  </div>
                </div>
                <div className="mt-3 border-t border-slate-100 pt-3">
                  <CalendarButton event={event} />
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
