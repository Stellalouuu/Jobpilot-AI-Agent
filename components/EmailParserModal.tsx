"use client";

import { useState } from "react";
import type { JobEvent } from "@/types/job-event";
import StatusBadge from "@/components/StatusBadge";

type EmailParserModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (event: JobEvent) => void;
};

export default function EmailParserModal({
  isOpen,
  onClose,
  onConfirm,
}: EmailParserModalProps) {
  const [email, setEmail] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [analysis, setAnalysis] = useState<JobEvent | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleParse = async () => {
    if (!email.trim()) {
      setError("请先粘贴招聘邮件内容。");
      return;
    }

    setError(null);
    setAnalysis(null);
    setIsParsing(true);

    try {
      const response = await fetch("/api/analyze-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailContent: email }),
      });
      const result: JobEvent | { error?: string } = await response.json();

      if (!response.ok) {
        throw new Error("error" in result && result.error ? result.error : "解析失败，请稍后重试。");
      }

      setAnalysis(result as JobEvent);
    } catch (requestError) {
      setError(
        requestError instanceof TypeError
          ? "网络连接失败，请检查网络后重试。"
          : requestError instanceof Error
            ? requestError.message
            : "解析失败，请稍后重试。",
      );
    } finally {
      setIsParsing(false);
    }
  };

  const handleClose = () => {
    setEmail("");
    setAnalysis(null);
    setError(null);
    setIsParsing(false);
    onClose();
  };

  const handleConfirm = () => {
    if (analysis?.isRecruitment) {
      onConfirm(analysis);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4" role="dialog" aria-modal="true" aria-labelledby="email-parser-title">
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 id="email-parser-title" className="text-lg font-semibold text-slate-900">AI 解析招聘邮件</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">粘贴招聘邮件，JobPilot AI 将自动识别公司、岗位和重要日程。</p>
          </div>
          <button type="button" onClick={handleClose} aria-label="关闭" className="text-2xl leading-none text-slate-400 hover:text-slate-700">×</button>
        </div>
        <div className="space-y-5 px-6 py-5">
          {!analysis && (
            <textarea
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={isParsing}
              className="min-h-44 w-full resize-y border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700 outline-none placeholder:text-slate-400 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 disabled:opacity-60"
              placeholder="在这里粘贴面试邀请、在线测评、笔试等招聘邮件……"
            />
          )}
          {isParsing && (
            <div className="flex items-center gap-3 border border-teal-100 bg-teal-50 px-4 py-3 text-sm text-teal-800">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-teal-200 border-t-teal-700" />
              AI 正在解析招聘邮件……
            </div>
          )}
          {error && <p className="border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
          {analysis && !analysis.isRecruitment && (
            <p className="border border-amber-100 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
              这似乎不是一封招聘相关邮件，因此没有创建求职事项。
            </p>
          )}
          {analysis?.isRecruitment && (
            <div className="border border-slate-200">
              <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800">解析结果</div>
              <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 px-4 py-4 text-sm">
                <dt className="text-slate-500">公司</dt><dd className="font-medium text-slate-900">{analysis.company ?? "未识别"}</dd>
                <dt className="text-slate-500">岗位</dt><dd className="font-medium text-slate-900">{analysis.position ?? "未识别"}</dd>
                <dt className="text-slate-500">事件类型</dt><dd className="text-slate-700">{analysis.eventType ?? "未识别"}</dd>
                <dt className="text-slate-500">面试轮次</dt><dd className="text-slate-700">{analysis.interviewRound ?? "未识别"}</dd>
                <dt className="text-slate-500">日期时间</dt><dd className="text-slate-700">{analysis.eventDate ?? "未识别"} {analysis.eventTime ?? ""}</dd>
                {analysis.deadline && <><dt className="text-slate-500">截止时间</dt><dd className="text-slate-700">{analysis.deadline}</dd></>}
                <dt className="text-slate-500">面试方式</dt><dd className="text-slate-700">{analysis.meetingType ?? "未识别"}</dd>
                <dt className="text-slate-500">状态</dt><dd>{analysis.status ? <StatusBadge status={analysis.status} /> : "未识别"}</dd>
              </dl>
              {analysis.summary && <p className="border-t border-slate-100 px-4 py-3 text-sm leading-6 text-slate-600">{analysis.summary}</p>}
              {analysis.needsConfirmation && <p className="border-t border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">部分信息无法可靠识别，请确认后再添加。</p>}
            </div>
          )}
        </div>
        <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
          <button type="button" onClick={handleClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">取消</button>
          {!analysis && <button type="button" onClick={handleParse} disabled={isParsing} className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60">AI 智能解析</button>}
          {analysis?.isRecruitment && <button type="button" onClick={handleConfirm} className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800">确认添加</button>}
        </div>
      </div>
    </div>
  );
}
