"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import StatsCards from "@/components/StatsCards";
import UpcomingEvents from "@/components/UpcomingEvents";
import ApplicationsTable from "@/components/ApplicationsTable";
import {
  loadEventOverrides,
  saveEventOverrides,
  sortJobEvents,
  type EventOverrides,
} from "@/lib/event-utils";
import type { JobEvent } from "@/types/job-event";
import type { EventStatus } from "@/types/job-event";

type SyncStage =
  | "idle"
  | "reading"
  | "filtering"
  | "analyzing"
  | "generating"
  | "complete";

type SyncResponse = {
  success: boolean;
  emailsRead?: number;
  candidates?: number;
  recruitmentEmails?: number;
  events?: JobEvent[];
  failedAnalyses?: number;
  demoMode?: boolean;
  needsConfirmation?: number;
  error?: string;
};

function isThisWeek(date: string | null, nowTimestamp: number) {
  if (!date) return false;
  const current = new Date(nowTimestamp);
  const target = new Date(`${date}T12:00:00`);
  const day = current.getDay() || 7;
  const start = new Date(current);
  start.setHours(0, 0, 0, 0);
  start.setDate(current.getDate() - day + 1);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return target >= start && target < end;
}

export default function Dashboard({ isDemoMode }: { isDemoMode: boolean }) {
  const [events, setEvents] = useState<JobEvent[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStage, setSyncStage] = useState<SyncStage>("idle");
  const [nowTimestamp, setNowTimestamp] = useState(() => Date.now());
  const [overrides, setOverrides] = useState<EventOverrides>({});
  const [syncSummary, setSyncSummary] = useState<SyncResponse | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const hydrationTimer = window.setTimeout(() => setOverrides(loadEventOverrides()), 0);
    const clock = window.setInterval(() => setNowTimestamp(Date.now()), 60_000);
    return () => {
      window.clearTimeout(hydrationTimer);
      window.clearInterval(clock);
    };
  }, []);

  const applyOverrides = (nextEvents: JobEvent[], savedOverrides = overrides) =>
    nextEvents.map((event) => ({
      ...event,
      ...savedOverrides[event.sourceMessageId],
      isPinned: savedOverrides[event.sourceMessageId]?.isPinned ?? event.isPinned ?? false,
    }));

  const handleSyncEmail = async () => {
    setIsSyncing(true);
    setSyncStage("reading");
    setSyncSummary(null);
    setSyncError(null);
    setShowDetails(false);
    const filteringTimer = window.setTimeout(() => setSyncStage("filtering"), isDemoMode ? 450 : 300);
    const analyzingTimer = window.setTimeout(() => setSyncStage("analyzing"), isDemoMode ? 950 : 800);
    const generatingTimer = window.setTimeout(() => setSyncStage("generating"), isDemoMode ? 1450 : 1_000_000);

    try {
      const response = await fetch("/api/emails");
      const result: SyncResponse = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "同步邮箱失败，请稍后重试。");
      }
      if (isDemoMode) {
        await new Promise((resolve) => window.setTimeout(resolve, 1_900));
      }
      setEvents(applyOverrides(result.events ?? []));
      setSyncSummary(result);
      setSyncStage("complete");
    } catch (error) {
      setSyncError(
        error instanceof TypeError
          ? "网络连接失败，请检查网络后重试。"
          : error instanceof Error
            ? error.message
            : "同步邮箱失败，请稍后重试。",
      );
      setSyncStage("idle");
    } finally {
      window.clearTimeout(filteringTimer);
      window.clearTimeout(analyzingTimer);
      window.clearTimeout(generatingTimer);
      setIsSyncing(false);
    }
  };

  const sortedEvents = sortJobEvents(events, nowTimestamp);
  const upcomingEvents = sortedEvents.filter(
    (event) => event.status !== "已完成" && event.status !== "已取消",
  );
  const interviewsThisWeek = events.filter(
    (event) =>
      event.eventType === "面试" &&
      isThisWeek(event.eventDate, nowTimestamp),
  ).length;
  const pendingAssessments = events.filter(
    (event) =>
      (event.eventType === "在线测评" || event.eventType === "笔试") &&
      event.status === "待完成",
  ).length;
  const activeProcesses = new Set(
    events
      .filter((event) => event.status !== "已完成" && event.status !== "已取消")
      .map((event) => `${event.company ?? "待确认"}\u0000${event.position ?? "待确认"}`),
  ).size;

  const stageText = {
    reading: isDemoMode ? "正在读取15封模拟招聘邮件…" : "正在读取邮箱…",
    filtering: isDemoMode ? "正在筛选招聘相关信息…" : "正在筛选招聘邮件…",
    analyzing: syncSummary?.candidates
      ? (isDemoMode ? "正在模拟AI信息提取…" : `正在AI解析${syncSummary.candidates}封候选邮件…`)
      : (isDemoMode ? "正在模拟AI信息提取…" : "正在AI解析候选邮件…"),
    generating: isDemoMode ? "正在生成结构化 Job Event…" : "正在整理结构化求职事项…",
    complete: isDemoMode ? "Demo 同步完成" : "同步完成",
    idle: "",
  }[syncStage];

  const handleStatusChange = (messageId: string, status: EventStatus) => {
    setEvents((current) =>
      current.map((event) => event.sourceMessageId === messageId ? { ...event, status } : event),
    );
    setOverrides((current) => {
      const next = {
        ...current,
        [messageId]: { ...current[messageId], status },
      };
      saveEventOverrides(next);
      return next;
    });
  };

  const handleTogglePinned = (messageId: string) => {
    const event = events.find((item) => item.sourceMessageId === messageId);
    if (!event) return;
    const isPinned = !event.isPinned;
    setEvents((current) =>
      current.map((item) => item.sourceMessageId === messageId ? { ...item, isPinned } : item),
    );
    setOverrides((current) => {
      const next = {
        ...current,
        [messageId]: { ...current[messageId], isPinned },
      };
      saveEventOverrides(next);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header onSyncEmail={handleSyncEmail} isSyncing={isSyncing} isDemoMode={isDemoMode} />
      <main className="mx-auto max-w-7xl px-5 py-9 sm:px-8 sm:py-12">
        <div className="mb-9 max-w-2xl">
          {isDemoMode && (
            <p className="mb-3 border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              公开演示模式 · 当前展示15条模拟秋招事项，不会访问真实邮箱或外部AI服务。
              <span className="mt-1 block text-xs text-amber-700">使用模拟招聘邮件体验完整工作流，不会访问真实邮箱或外部 AI 服务</span>
            </p>
          )}
          <p className="mb-3 text-sm font-medium text-teal-700">Good morning, 求职者</p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">你的秋招，一目了然</h1>
          <p className="mt-3 text-base text-slate-500">AI 自动整理招聘邮件、面试与测评日程</p>
        </div>
        <div className="space-y-10">
          {(stageText || syncError) && (
            <div className={`border px-4 py-3 text-sm ${syncError ? "border-red-100 bg-red-50 text-red-700" : "border-teal-100 bg-teal-50 text-teal-800"}`}>
              <p>{syncError || stageText}</p>
              {syncSummary && syncStage === "complete" && !syncError && (
                <p className="mt-1 text-xs opacity-80">
                  {isDemoMode
                    ? `读取Demo邮件：${syncSummary.emailsRead ?? 0} · 招聘候选：${syncSummary.candidates ?? 0} · 生成求职事项：${syncSummary.events?.length ?? 0} · 需要确认：${syncSummary.needsConfirmation ?? 0}`
                    : `读取${syncSummary.emailsRead ?? 0}封邮件 · 筛选出${syncSummary.candidates ?? 0}封招聘候选邮件 · 生成${syncSummary.events?.length ?? 0}个求职事项`}
                  {(syncSummary.failedAnalyses ?? 0) > 0 ? ` · ${syncSummary.failedAnalyses}封解析失败` : ""}
                </p>
              )}
            </div>
          )}
          {syncSummary && (
            <div>
              <button type="button" onClick={() => setShowDetails((visible) => !visible)} className="text-sm font-medium text-teal-700 hover:text-teal-800">
                {showDetails ? "收起同步详情" : "查看同步详情"}
              </button>
              {showDetails && (
                <div className="mt-3 border border-slate-200 bg-white px-5 py-4 text-sm text-slate-600">
                  {isDemoMode
                    ? `读取Demo邮件：${syncSummary.emailsRead ?? 0} · 招聘候选：${syncSummary.candidates ?? 0} · 生成求职事项：${syncSummary.events?.length ?? 0} · 需要确认：${syncSummary.needsConfirmation ?? 0}`
                    : `读取 ${syncSummary.emailsRead ?? 0} 封 · 预筛选 ${syncSummary.candidates ?? 0} 封 · AI 确认招聘邮件 ${syncSummary.recruitmentEmails ?? 0} 封 · 生成 ${syncSummary.events?.length ?? 0} 个事项`}
                </div>
              )}
            </div>
          )}
          <StatsCards
            interviewsThisWeek={interviewsThisWeek}
            pendingAssessments={pendingAssessments}
            activeProcesses={activeProcesses}
          />
          <UpcomingEvents events={upcomingEvents} now={nowTimestamp} isDemoMode={isDemoMode} />
          <ApplicationsTable
            events={sortedEvents}
            now={nowTimestamp}
            onStatusChange={handleStatusChange}
            onTogglePinned={handleTogglePinned}
            isDemoMode={isDemoMode}
          />
        </div>
      </main>
    </div>
  );
}
