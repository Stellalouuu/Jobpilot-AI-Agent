type StatsCardsProps = {
  interviewsThisWeek: number;
  pendingAssessments: number;
  activeProcesses: number;
};

export default function StatsCards({
  interviewsThisWeek,
  pendingAssessments,
  activeProcesses,
}: StatsCardsProps) {
  const stats = [
    { label: "本周面试", value: interviewsThisWeek, detail: "来自真实招聘邮件", accent: "text-teal-700" },
    { label: "待完成测评", value: pendingAssessments, detail: "请留意截止时间", accent: "text-amber-600" },
    { label: "进行中流程", value: activeProcesses, detail: "按公司与岗位去重", accent: "text-slate-900" },
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-3">
      {stats.map((stat) => (
        <div key={stat.label} className="border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">{stat.label}</p>
          <div className="mt-3 flex items-end justify-between gap-3">
            <p className={`text-3xl font-semibold tracking-tight ${stat.accent}`}>
              {stat.value}
            </p>
            <p className="text-right text-xs text-slate-400">{stat.detail}</p>
          </div>
        </div>
      ))}
    </section>
  );
}
