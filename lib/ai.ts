import { GoogleGenAI } from "@google/genai";
import type { EmailMessage } from "@/lib/email";
import type { JobEvent, RecruitmentEventType } from "@/types/job-event";

type AiEventFields = Omit<JobEvent, "sourceMessageId" | "sourceSubject" | "sourceFrom" | "isPinned">;
export const GEMINI_MODEL = "gemini-flash-lite-latest";

export class GeminiServiceError extends Error {
  constructor(
    public readonly code: "GEMINI_AUTH_FAILED" | "GEMINI_REQUEST_FAILED",
    message: string,
    public readonly details?: {
      httpStatus: number | null;
      errorCode: string | null;
      model: string;
    },
  ) {
    super(message);
    this.name = "GeminiServiceError";
  }
}

const systemInstruction = `
你是 JobPilot AI 的招聘邮件解析器。判断邮件是否与求职招聘有关，并提取一个招聘事项。
只返回符合 JSON Schema 的 JSON，不要 Markdown、解释或额外字段。
支持中文和英文。日期必须是 YYYY-MM-DD，时间必须是 HH:mm（24小时制）。
邮件没有的信息必须返回 null，绝不编造。无法确认具体时间时 eventTime=null 且 needsConfirmation=true。
如果是测评或笔试，优先提取 deadline；如果是面试，优先提取 eventDate、eventTime、interviewRound、meetingType、meetingLink。
如果邮件是转发邮件（转发：、Fw:、Fwd:、---------- Forwarded message ----------），优先从正文中的原始 From、Subject 和内容识别公司、岗位与事件，不要把转发人当作招聘公司。
普通广告、验证码、Newsletter、生日祝福、购物邮件、学校通知等非招聘邮件必须 isRecruitment=false；此时 company/position/interviewRound/eventDate/eventTime/deadline/meetingType/meetingLink/location 返回 null，eventType="其他"，status="待参加"，summary 简短说明不是招聘邮件，needsConfirmation=false。
eventType 只能是：面试、在线测评、笔试、Offer、HR沟通、材料提交、其他。
`;

function getApiKey() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY_MISSING");
  return apiKey;
}

export async function analyzeRecruitmentEmail(email: EmailMessage): Promise<JobEvent> {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  let response;
  try {
    response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: `${systemInstruction}

原始邮件主题：${email.subject}
原始发件人：${email.from}
邮件日期：${email.date}
邮件正文：
${email.text}`,
      config: {
        responseMimeType: "application/json",
        temperature: 0,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message.toLowerCase() : "";
    const status = typeof error === "object" && error !== null && "status" in error
      ? String(error.status)
      : "";
    const errorCode = typeof error === "object" && error !== null && "code" in error
      ? String(error.code)
      : null;
    const httpStatus = Number(status || errorCode);
    const normalizedStatus = Number.isNaN(httpStatus) ? null : httpStatus;
    if (process.env.NODE_ENV === "development") {
      console.error("[Gemini] request failed", JSON.stringify({
        httpStatus: normalizedStatus,
        errorCode,
        errorMessage: error instanceof Error ? error.message : String(error),
        model: GEMINI_MODEL,
      }));
    }
    const code = ["401", "403"].includes(status) ||
      message.includes("401") ||
      message.includes("403") ||
      message.includes("api key")
      ? "GEMINI_AUTH_FAILED"
      : "GEMINI_REQUEST_FAILED";
    throw new GeminiServiceError(code, code, {
      httpStatus: normalizedStatus,
      errorCode,
      model: GEMINI_MODEL,
    });
  }

  if (!response.text) throw new Error("EMPTY_AI_RESPONSE");

  let fields: AiEventFields;
  try {
    const normalizedText = response.text
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
    const parsed: unknown = JSON.parse(normalizedText);
    if (!parsed || typeof parsed !== "object") throw new Error();
    const value = parsed as Record<string, unknown>;
    const eventTypes = ["面试", "在线测评", "笔试", "Offer", "HR沟通", "材料提交", "其他"];
    const statuses = ["待参加", "待完成", "已完成", "已取消"];
    if (
      typeof value.isRecruitment !== "boolean" ||
      typeof value.eventType !== "string" ||
      !eventTypes.includes(value.eventType) ||
      typeof value.status !== "string" ||
      !statuses.includes(value.status) ||
      typeof value.summary !== "string" ||
      typeof value.needsConfirmation !== "boolean"
    ) {
      throw new Error();
    }
    fields = value as unknown as AiEventFields;
  } catch {
    throw new Error("INVALID_AI_JSON");
  }

  return {
    ...fields,
    eventType: fields.eventType as RecruitmentEventType,
    sourceMessageId: email.messageId,
    sourceSubject: email.subject,
    sourceFrom: email.from,
    isPinned: false,
  };
}
