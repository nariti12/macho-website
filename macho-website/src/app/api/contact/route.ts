import { NextResponse } from "next/server";
import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY ?? "re_GTo3TNmQ_NzCyeHyGpu7ucyuE2BqaKtLm";
const contactRecipient = "nariti12@gmail.com";

const resend = resendApiKey ? new Resend(resendApiKey) : null;

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string;
      email?: string;
      subject?: string;
      message?: string;
    };

    const name = body.name?.trim() ?? "";
    const email = body.email?.trim() ?? "";
    const subject = body.subject?.trim() ?? "";
    const message = body.message?.trim() ?? "";

    if (!email || !message) {
      return NextResponse.json({ error: "メールアドレスとメッセージは必須です。" }, { status: 400 });
    }

    const inferredSubject = subject || "サイトからのお問合せ";

    const safeName = escapeHtml(name || "未入力");
    const safeEmail = escapeHtml(email);
    const safeSubject = escapeHtml(inferredSubject);
    const safeMessage = escapeHtml(message).replace(/\n/g, "<br/>");

    const htmlContent = `
      <div style="font-family: 'Hiragino Sans', 'Noto Sans JP', sans-serif; line-height: 1.6;">
        <p><strong>お名前:</strong> ${safeName}</p>
        <p><strong>メールアドレス:</strong> ${safeEmail}</p>
        <p><strong>件名:</strong> ${safeSubject}</p>
        <p><strong>メッセージ:</strong></p>
        <p>${safeMessage}</p>
      </div>
    `;

    const textContent = `お名前: ${name || "未入力"}\nメールアドレス: ${email}\n件名: ${inferredSubject}\n\n${message}`;

    if (!resend) {
      return NextResponse.json({ error: "メール送信設定が完了していません。" }, { status: 500 });
    }

    await resend.emails.send({
      from: "Machoda Contact <onboarding@resend.dev>",
      to: contactRecipient,
      subject: `[お問い合わせ] ${inferredSubject}`,
      reply_to: email,
      html: htmlContent,
      text: textContent,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to process contact request", error);
    return NextResponse.json({ error: "送信に失敗しました。" }, { status: 500 });
  }
}
