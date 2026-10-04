import type { JobEvent } from "@/types/job-event";

function addHours(hours: number) {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

function addDays(days: number) {
  return addHours(days * 24);
}

function datePart(value: Date) {
  return [
    value.getFullYear().toString().padStart(4, "0"),
    (value.getMonth() + 1).toString().padStart(2, "0"),
    value.getDate().toString().padStart(2, "0"),
  ].join("-");
}

function timePart(value: Date) {
  return [
    value.getHours().toString().padStart(2, "0"),
    value.getMinutes().toString().padStart(2, "0"),
  ].join(":");
}

function interviewEvent(
  id: string,
  company: string,
  position: string,
  interviewRound: string,
  date: Date | null,
  status: JobEvent["status"],
  options: Partial<JobEvent> = {},
): JobEvent {
  return {
    sourceMessageId: `demo-${id}`,
    isRecruitment: true,
    company,
    position,
    eventType: "面试",
    interviewRound,
    eventDate: date ? datePart(date) : null,
    eventTime: date ? timePart(date) : null,
    deadline: null,
    meetingType: null,
    meetingLink: null,
    location: null,
    status,
    summary: `${company}${position}${interviewRound}，这是用于公开演示的模拟招聘事项。`,
    needsConfirmation: false,
    sourceSubject: `[Demo] ${company} 面试邀请`,
    sourceFrom: `招聘团队 <demo-${id}@example.com>`,
    isPinned: false,
    timezone: null,
    ...options,
  };
}

function deadlineEvent(
  id: string,
  company: string,
  position: string,
  eventType: JobEvent["eventType"],
  deadline: Date,
  status: JobEvent["status"],
  options: Partial<JobEvent> = {},
): JobEvent {
  return {
    sourceMessageId: `demo-${id}`,
    isRecruitment: true,
    company,
    position,
    eventType,
    interviewRound: null,
    eventDate: null,
    eventTime: null,
    deadline: `${datePart(deadline)}T${timePart(deadline)}`,
    meetingType: null,
    meetingLink: null,
    location: null,
    status,
    summary: `${company}${position}${eventType}，这是用于公开演示的模拟招聘事项。`,
    needsConfirmation: false,
    sourceSubject: `[Demo] ${company} ${eventType}`,
    sourceFrom: `招聘团队 <demo-${id}@example.com>`,
    isPinned: false,
    timezone: null,
    ...options,
  };
}

export function getDemoJobEvents(): JobEvent[] {
  return [
    interviewEvent("novatech", "NovaTech", "AI Product Manager", "一面", addHours(6), "待参加", {
      isPinned: true,
      meetingType: "Google Meet",
      meetingLink: "https://meet.example.com/demo-novatech",
    }),
    deadlineEvent("cloudpeak", "CloudPeak", "Product Manager", "在线测评", addHours(20), "待完成"),
    interviewEvent("orbit-labs", "Orbit Labs", "Product Strategy Intern", "二面", addDays(2), "待参加", {
      isPinned: true,
      meetingType: "Zoom",
      meetingLink: "https://zoom.example.com/demo-orbit",
    }),
    deadlineEvent("nexapay", "NexaPay", "Graduate Product Manager", "在线测评", addHours(-8), "待完成"),
    interviewEvent("brightai", "BrightAI", "AI Product Intern", "一面", null, "待参加", {
      needsConfirmation: true,
    }),
    deadlineEvent("vertex-mobility", "Vertex Mobility", "Product Management Intern", "笔试", addDays(3), "待完成"),
    interviewEvent("horizon-robotics", "Horizon Robotics", "AI Product Manager", "终面", addDays(5), "待参加", {
      isPinned: true,
      meetingType: "线下面试",
      location: "Singapore",
    }),
    deadlineEvent("lumina-cloud", "Lumina Cloud", "Associate Product Manager", "材料提交", addDays(7), "待完成"),
    deadlineEvent("atlas-commerce", "Atlas Commerce", "Product Manager", "Offer", addDays(4), "待完成", {
      isPinned: true,
    }),
    interviewEvent("quantumworks", "QuantumWorks", "AI Strategy Intern", "HR面", addDays(-2), "已完成"),
    deadlineEvent("bluepeak-technology", "BluePeak Technology", "Product Intern", "在线测评", addDays(-4), "已完成"),
    interviewEvent("stellar-finance", "Stellar Finance", "Graduate Product Analyst", "一面", addDays(8), "已取消"),
    interviewEvent("echo-systems", "Echo Systems", "Product Operations Intern", "HR沟通", addDays(4), "待参加"),
    interviewEvent("aurora-digital", "Aurora Digital", "AI Product Manager", "三面", addDays(-1), "待参加"),
    {
      sourceMessageId: "demo-northstar-tech",
      isRecruitment: true,
      company: "Northstar Tech",
      position: "Product Manager",
      eventType: "其他",
      interviewRound: null,
      eventDate: datePart(addDays(12)),
      eventTime: timePart(addDays(12)),
      deadline: null,
      meetingType: null,
      meetingLink: null,
      location: null,
      status: "待完成",
      summary: "招聘团队通知候选人进入下一阶段，具体安排将在后续邮件中确认。",
      needsConfirmation: true,
      sourceSubject: "[Demo] Northstar Tech 招聘流程更新",
      sourceFrom: "招聘团队 <demo-northstar@example.com>",
      isPinned: false,
      timezone: null,
    },
  ];
}
