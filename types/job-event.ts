export type EventStatus = "待参加" | "待完成" | "已完成" | "已取消";
export type DisplayStatus = EventStatus | "待确认";

export type RecruitmentEventType =
  | "面试"
  | "在线测评"
  | "笔试"
  | "Offer"
  | "HR沟通"
  | "材料提交"
  | "其他";

export interface JobEvent {
  sourceMessageId: string;
  isRecruitment: boolean;
  company: string | null;
  position: string | null;
  eventType: RecruitmentEventType;
  interviewRound: string | null;
  eventDate: string | null;
  eventTime: string | null;
  deadline: string | null;
  meetingType: string | null;
  meetingLink: string | null;
  location: string | null;
  status: EventStatus;
  summary: string;
  needsConfirmation: boolean;
  sourceSubject: string;
  sourceFrom: string;
  isPinned: boolean;
  timezone?: string | null;
}
