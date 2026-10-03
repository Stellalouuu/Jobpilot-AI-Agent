import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";

export type EmailMessage = {
  messageId: string;
  subject: string;
  from: string;
  date: string;
  text: string;
};

type EmailServiceErrorCode =
  | "EMAIL_CONFIG_MISSING"
  | "EMAIL_CONNECTION_TIMEOUT"
  | "EMAIL_AUTH_FAILED"
  | "EMAIL_CONNECTION_FAILED"
  | "EMAIL_PARSE_FAILED";

export class EmailServiceError extends Error {
  constructor(
    public readonly code: EmailServiceErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "EmailServiceError";
  }
}

function getEmailConfig() {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_AUTH_CODE;
  const host = process.env.EMAIL_IMAP_HOST || "imap.qq.com";
  const port = Number(process.env.EMAIL_IMAP_PORT || "993");

  if (!user || !pass || !host || !Number.isInteger(port) || port <= 0) {
    throw new EmailServiceError(
      "EMAIL_CONFIG_MISSING",
      "邮箱服务端配置不完整，请检查环境变量。",
    );
  }

  return { user, pass, host, port };
}

function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message.toLowerCase() : "";
}

export async function getRecentEmails(limit = 20): Promise<EmailMessage[]> {
  const config = getEmailConfig();
  const client = new ImapFlow({
    host: config.host,
    port: config.port,
    secure: true,
    auth: { user: config.user, pass: config.pass },
    greetingTimeout: 10_000,
    connectionTimeout: 15_000,
    socketTimeout: 30_000,
  });
  let lock: Awaited<ReturnType<typeof client.getMailboxLock>> | undefined;

  try {
    await client.connect();
    lock = await client.getMailboxLock("INBOX");
    const exists = client.mailbox && client.mailbox.exists
      ? client.mailbox.exists
      : 0;
    if (exists === 0) return [];

    const start = Math.max(1, exists - limit + 1);
    const messages: EmailMessage[] = [];

    for await (const message of client.fetch(`${start}:*`, {
      source: true,
      envelope: true,
      internalDate: true,
    })) {
      if (!message.source) continue;

      try {
        const parsed = await simpleParser(message.source);
        const from = parsed.from?.value
          .map((sender) => sender.name ? `${sender.name} <${sender.address}>` : sender.address)
          .join(", ") || "";
        const rawDate = parsed.date ?? message.internalDate ?? new Date();
        const date = rawDate instanceof Date
          ? rawDate.toISOString()
          : new Date(rawDate).toISOString();

        messages.push({
          messageId: parsed.messageId || message.envelope?.messageId || `imap-${message.seq}`,
          subject: parsed.subject || "(无主题)",
          from,
          date,
          text: (parsed.text || "").trim(),
        });
      } catch {
        throw new EmailServiceError(
          "EMAIL_PARSE_FAILED",
          "部分邮件解析失败，请稍后重试。",
        );
      }
    }

    return messages.reverse().slice(0, limit);
  } catch (error) {
    if (error instanceof EmailServiceError) throw error;

    const message = toErrorMessage(error);
    if (message.includes("authentication") || message.includes("invalid credentials") || message.includes("login")) {
      throw new EmailServiceError("EMAIL_AUTH_FAILED", "邮箱授权码错误或邮箱登录失败。");
    }
    if (message.includes("timeout") || message.includes("timed out")) {
      throw new EmailServiceError("EMAIL_CONNECTION_TIMEOUT", "连接邮箱服务器超时，请稍后重试。");
    }
    throw new EmailServiceError("EMAIL_CONNECTION_FAILED", "无法连接 QQ 邮箱，请检查网络和邮箱设置。");
  } finally {
    lock?.release();
    if (client.usable) {
      await client.logout().catch(() => undefined);
    }
  }
}
