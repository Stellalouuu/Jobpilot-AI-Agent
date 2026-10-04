import { EmailServiceError } from "@/lib/email";
import { syncRecruitmentEmails } from "@/lib/email-sync";
import { GeminiServiceError } from "@/lib/ai";

export async function GET() {
  if (process.env.DEMO_MODE === "true") {
    const { getDemoJobEvents } = await import("@/lib/demo-data");
    const events = getDemoJobEvents();
    return Response.json({
      success: true,
      demoMode: true,
      emailsRead: 15,
      candidates: 15,
      recruitmentEmails: 15,
      events,
      failedAnalyses: 0,
      needsConfirmation: events.filter((event) => event.needsConfirmation).length,
    });
  }

  try {
    const result = await syncRecruitmentEmails();
    return Response.json({ success: true, ...result });
  } catch (error) {
    if (error instanceof EmailServiceError) {
      const status =
        error.code === "EMAIL_CONFIG_MISSING" || error.code === "EMAIL_AUTH_FAILED"
          ? 503
          : 502;
      return Response.json({ success: false, error: error.message }, { status });
    }

    if (error instanceof Error && error.message === "GEMINI_API_KEY_MISSING") {
      return Response.json({ success: false, error: "服务端尚未配置 Gemini API Key。" }, { status: 503 });
    }
    if (error instanceof GeminiServiceError && error.code === "GEMINI_AUTH_FAILED") {
      return Response.json({ success: false, error: "Gemini API Key 无效或没有访问权限。" }, { status: 502 });
    }
    if (error instanceof GeminiServiceError) {
      return Response.json({ success: false, error: "Gemini 请求失败，请检查模型配置和网络连接。" }, { status: 502 });
    }

    return Response.json(
      { success: false, error: "同步邮箱或 AI 解析失败，请稍后重试。" },
      { status: 502 },
    );
  }
}
