import type { JobEvent } from "@/types/job-event";

type CalendarDateParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};

function parseDateParts(value: string): CalendarDateParts | null {
  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:T|\s)?(\d{2})?:?(\d{2})?/,
  );
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = match[4] ? Number(match[4]) : 23;
  const minute = match[5] ? Number(match[5]) : 59;
  if (
    month < 1 || month > 12 || day < 1 || day > 31 ||
    hour < 0 || hour > 23 || minute < 0 || minute > 59
  ) {
    return null;
  }
  return { year, month, day, hour, minute };
}

function parseEventDate(event: JobEvent): CalendarDateParts | null {
  if (!event.eventDate || !event.eventTime) return null;
  const date = parseDateParts(`${event.eventDate}T${event.eventTime}`);
  return date;
}

function parseDeadline(event: JobEvent): CalendarDateParts | null {
  return event.deadline ? parseDateParts(event.deadline) : null;
}

function addMinutes(parts: CalendarDateParts, minutes: number): CalendarDateParts {
  const value = new Date(Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
  ));
  value.setUTCMinutes(value.getUTCMinutes() + minutes);
  return {
    year: value.getUTCFullYear(),
    month: value.getUTCMonth() + 1,
    day: value.getUTCDate(),
    hour: value.getUTCHours(),
    minute: value.getUTCMinutes(),
  };
}

function formatCalendarDate(parts: CalendarDateParts) {
  const date = [
    parts.year.toString().padStart(4, "0"),
    parts.month.toString().padStart(2, "0"),
    parts.day.toString().padStart(2, "0"),
  ].join("");
  const time = [
    parts.hour.toString().padStart(2, "0"),
    parts.minute.toString().padStart(2, "0"),
    "00",
  ].join("");
  return `${date}T${time}`;
}

function display(value: string | null | undefined) {
  return value || "待确认";
}

function interviewDescription(event: JobEvent) {
  return [
    `公司：${display(event.company)}`,
    `岗位：${display(event.position)}`,
    `面试轮次：${display(event.interviewRound)}`,
    `面试方式：${display(event.meetingType)}`,
    `会议链接：${display(event.meetingLink)}`,
    `地点：${display(event.location)}`,
    `AI摘要：${display(event.summary)}`,
  ].join("\n");
}

function deadlineDescription(event: JobEvent) {
  return [
    `公司：${display(event.company)}`,
    `岗位：${display(event.position)}`,
    `事项：${event.eventType}`,
    `截止时间：${display(event.deadline)}`,
    `测评链接：${display(event.meetingLink)}`,
    `AI摘要：${display(event.summary)}`,
  ].join("\n");
}

/**
 * Builds a Google Calendar template URL without creating or modifying an event.
 * Dates intentionally remain timezone-free; ctz is added only when the email
 * supplied a timezone so the AI-provided local clock time is not rewritten.
 */
export function buildGoogleCalendarUrl(event: JobEvent): string | null {
  if (event.needsConfirmation) return null;

  let start: CalendarDateParts | null = null;
  let end: CalendarDateParts | null = null;
  let title: string;
  let details: string;

  if (event.eventType === "面试") {
    start = parseEventDate(event);
    if (!start) return null;
    end = addMinutes(start, 60);
    title = `【面试】${display(event.company)}｜${display(event.position)}｜${display(event.interviewRound ?? event.meetingType)}`;
    details = interviewDescription(event);
  } else if (event.deadline) {
    start = parseDeadline(event);
    if (!start) return null;
    end = addMinutes(start, -30);
    title = event.eventType === "Offer"
      ? `【截止】${display(event.company)}｜Offer确认`
      : event.eventType === "材料提交"
        ? `【截止】${display(event.company)}｜材料提交`
        : `【截止】${display(event.company)}｜${event.eventType}`;
    details = deadlineDescription(event);
  } else {
    start = parseEventDate(event);
    if (!start) return null;
    end = addMinutes(start, 60);
    title = `【${event.eventType}】${display(event.company)}｜${display(event.position)}`;
    details = [
      `公司：${display(event.company)}`,
      `岗位：${display(event.position)}`,
      `事项：${event.eventType}`,
      `AI摘要：${display(event.summary)}`,
    ].join("\n");
  }

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${formatCalendarDate(start)} / ${formatCalendarDate(end)}`,
    details,
  });
  if (event.location) params.set("location", event.location);
  if (event.timezone) params.set("ctz", event.timezone);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
