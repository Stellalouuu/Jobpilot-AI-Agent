import { analyzeRecruitmentEmail } from "@/lib/ai";
import { GeminiServiceError } from "@/lib/ai";
import type { EmailMessage } from "@/lib/email";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "请求格式无效。" }, { status: 400 });
  }

  const emailContent =
    typeof body === "object" &&
    body !== null &&
    "emailContent" in body &&
    typeof body.emailContent === "string"
      ? body.emailContent.trim()
      : "";

  if (!emailContent) {
    return Response.json({ error: "请输入招聘邮件内容。" }, { status: 400 });
  }

  try {
    const analysis = await analyzeRecruitmentEmail({
      messageId: `manual-${Date.now()}`,
      subject: "手动粘贴邮件",
      from: "",
      date: new Date().toISOString(),
      text: emailContent,
    } satisfies EmailMessage);
    return Response.json(analysis);
  } catch (error) {
    const code = error instanceof Error ? error.message : "AI_REQUEST_FAILED";

    if (code === "GEMINI_API_KEY_MISSING") {
      return Response.json({ error: "服务端尚未配置 Gemini API Key。" }, { status: 503 });
    }
    if (error instanceof GeminiServiceError && error.code === "GEMINI_AUTH_FAILED") {
      return Response.json({ error: "Gemini API Key 无效或没有访问权限。" }, { status: 502 });
    }
    if (error instanceof GeminiServiceError) {
      return Response.json({ error: "Gemini 请求失败，请检查模型配置和网络连接。" }, { status: 502 });
    }

    if (code === "EMPTY_AI_RESPONSE" || code === "INVALID_AI_JSON") {
      return Response.json({ error: "AI 返回结果格式异常，请稍后重试。" }, { status: 502 });
    }

    return Response.json({ error: "AI 服务暂时不可用，请稍后重试。" }, { status: 502 });
  }
}
