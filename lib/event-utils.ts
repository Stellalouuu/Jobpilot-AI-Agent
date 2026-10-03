import type { DisplayStatus, EventStatus, JobEvent } from "@/types/job-event";

export type EventUrgency = "overdue" | "urgent" | "soon" | "normal";

export type EventOverride = {
  status?: EventStatus;
  isPinned?: boolean;
};

export type EventOverrides = Record<string, EventOverride>;

const statusOrder: Record<EventUrgency, number> = {
  overdue: 0,
  urgent: 1,
  soon: 2,
  normal: 3,
};

export function getEventTargetTime(event: JobEvent): number | null {
  const value = event.deadline
    ? event.deadline.includes("T")
      ? event.deadline
      : `${event.deadline}T23:59`
    : event.eventDate
      ? `${event.eventDate}T${event.eventTime ?? "23:59"}`
      : null;
  if (!value) return null;
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

export function isEventOverdue(event: JobEvent, now = Date.now()) {
  const target = getEventTargetTime(event);
  return target !== null &&
    target < now &&
    event.status !== "已完成" &&
    event.status !== "已取消";
}

export function getEventUrgency(event: JobEvent, now = Date.now()): EventUrgency {
  if (event.status === "已完成" || event.status === "已取消") return "normal";
  if (isEventOverdue(event, now)) return "overdue";
  const target = getEventTargetTime(event);
  if (target === null) return "normal";
  const hours = (target - now) / (1000 * 60 * 60);
  if (hours <= 24) return "urgent";
  if (hours <= 72) return "soon";
  return "normal";
}

export function getCountdownText(event: JobEvent, now = Date.now()) {
  const target = getEventTargetTime(event);
  if (target === null) return "时间待确认";
  const difference = target - now;
  const absoluteMinutes = Math.floor(Math.abs(difference) / (1000 * 60));
  const days = Math.floor(absoluteMinutes / (60 * 24));
  const hours = Math.floor((absoluteMinutes % (60 * 24)) / 60);
  const minutes = absoluteMinutes % 60;
  const text = days > 0
    ? `${days}天${hours > 0 ? ` ${hours}小时` : ""}`
    : hours > 0
      ? `${hours}小时`
      : `${Math.max(minutes, 1)}分钟`;
  return difference < 0 ? `已逾期 ${text}` : `还有 ${text}`;
}

export function getDisplayStatus(event: JobEvent): DisplayStatus {
  if (
    event.eventType === "Offer" &&
    event.status === "待参加"
  ) {
    return "待确认";
  }
  return event.status;
}

export function sortJobEvents(events: JobEvent[], now = Date.now()) {
  return [...events].sort((a, b) => {
    const pinnedDifference = Number(b.isPinned) - Number(a.isPinned);
    if (pinnedDifference !== 0) return pinnedDifference;
    const urgencyDifference =
      statusOrder[getEventUrgency(a, now)] - statusOrder[getEventUrgency(b, now)];
    if (urgencyDifference !== 0) return urgencyDifference;
    return (getEventTargetTime(a) ?? Number.POSITIVE_INFINITY) -
      (getEventTargetTime(b) ?? Number.POSITIVE_INFINITY);
  });
}

export function loadEventOverrides(): EventOverrides {
  try {
    const value = window.localStorage.getItem("jobpilot:event-overrides");
    return value ? JSON.parse(value) as EventOverrides : {};
  } catch {
    return {};
  }
}

export function saveEventOverrides(overrides: EventOverrides) {
  window.localStorage.setItem("jobpilot:event-overrides", JSON.stringify(overrides));
}
