import { analyzeRecruitmentEmail } from "@/lib/ai";
import { getRecentEmails, type EmailMessage } from "@/lib/email";
import type { JobEvent } from "@/types/job-event";

const recruitmentKeywords = [
  "招聘", "校招", "校园招聘", "面试", "笔试", "测评", "在线测评", "人才测评",
  "招聘流程", "应聘", "候选人", "岗位", "职位", "offer", "interview",
  "assessment", "application", "recruitment", "career", "candidate", "hr",
  "campus", "hiring", "job",
];

const excludedKeywords = [
  "验证码", "verification code", "email verification", "newsletter", "unsubscribe",
  "生日祝福", "购物", "促销", "促銷", "优惠", "coupon", "sale",
];

export type SyncResult = {
  emailsRead: number;
  candidates: number;
  recruitmentEmails: number;
  events: JobEvent[];
  failedAnalyses: number;
};

export function isRecruitmentCandidate(email: EmailMessage) {
  const haystack = `${email.subject}\n${email.from}\n${email.text}`.toLowerCase();
  const hasRecruitmentKeyword = recruitmentKeywords.some((keyword) =>
    haystack.includes(keyword.toLowerCase()),
  );
  const hasExcludedKeyword = excludedKeywords.some((keyword) =>
    haystack.includes(keyword.toLowerCase()),
  );
  if (hasExcludedKeyword && !hasRecruitmentKeyword) return false;
  return hasRecruitmentKeyword;
}

async function mapWithConcurrency<T, R>(
  items: T[],
  worker: (item: T) => Promise<R>,
  concurrency: number,
): Promise<PromiseSettledResult<R>[]> {
  const results: PromiseSettledResult<R>[] = [];
  let nextIndex = 0;

  async function run() {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      try {
        results[index] = { status: "fulfilled", value: await worker(items[index]) };
      } catch (reason) {
        results[index] = { status: "rejected", reason };
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, run));
  return results;
}

export async function syncRecruitmentEmails(): Promise<SyncResult> {
  if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY_MISSING");
  const emails = await getRecentEmails(20);
  const candidates = Array.from(
    new Map(
      emails
        .filter(isRecruitmentCandidate)
        .map((email) => [email.messageId, email]),
    ).values(),
  );
  const results = await mapWithConcurrency(candidates, analyzeRecruitmentEmail, 3);
  const events = results
    .filter((result): result is PromiseFulfilledResult<JobEvent> => result.status === "fulfilled")
    .map((result) => result.value)
    .filter((event) => event.isRecruitment);

  return {
    emailsRead: emails.length,
    candidates: candidates.length,
    recruitmentEmails: events.length,
    events,
    failedAnalyses: results.filter((result) => result.status === "rejected").length,
  };
}
