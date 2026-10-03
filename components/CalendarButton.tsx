"use client";

import { useState } from "react";
import { buildGoogleCalendarUrl } from "@/lib/calendar";
import type { JobEvent } from "@/types/job-event";

type CalendarButtonProps = {
  event: JobEvent;
};

export default function CalendarButton({ event }: CalendarButtonProps) {
  const [opened, setOpened] = useState(false);
  const url = buildGoogleCalendarUrl(event);

  if (!url) {
    return (
      <button
        type="button"
        disabled
        className="whitespace-nowrap text-xs font-medium text-slate-400"
        title="需要确认明确的日期和时间后才能添加到日历"
      >
        时间待确认
      </button>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => setOpened(true)}
      className="whitespace-nowrap text-xs font-medium text-teal-700 hover:text-teal-900"
    >
      {opened ? "已打开日历" : "添加到日历"}
    </a>
  );
}
