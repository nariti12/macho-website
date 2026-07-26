import { createHmac, randomUUID } from "node:crypto";

import { NextResponse } from "next/server";
import { Resend } from "resend";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasServiceSupabaseEnv } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

const MAX_REQUEST_BYTES = 8_192;
const MAX_QUESTION_LENGTH = 1_000;
const MAX_TURNSTILE_TOKEN_LENGTH = 2_048;
const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const TURNSTILE_ACTION = "submit_question";
const DEFAULT_NOTIFICATION_EMAIL = "nariti12@gmail.com";

type RateLimitResult = {
  allowed: boolean;
  retry_after_seconds: number;
  reason: string;
};

type TurnstileResult = {
  success?: boolean;
  hostname?: string;
  action?: string;
  "error-codes"?: string[];
};

class RequestTooLargeError extends Error {}

const noStoreHeaders = {
  "Cache-Control": "private, no-store, max-age=0",
};

const jsonResponse = (body: object, init?: ResponseInit) => {
  const headers = new Headers(init?.headers);
  Object.entries(noStoreHeaders).forEach(([name, value]) => headers.set(name, value));

  return NextResponse.json(body, {
    ...init,
    headers,
  });
};

const getClientIp = (request: Request) => {
  const forwarded =
    request.headers.get("x-vercel-forwarded-for") ??
    request.headers.get("x-forwarded-for") ??
    request.headers.get("x-real-ip");

  return forwarded?.split(",")[0]?.trim() || "unknown";
};

const hasValidOrigin = (request: Request) => {
  const origin = request.headers.get("origin");

  if (!origin) {
    return process.env.NODE_ENV !== "production";
  }

  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
};

const hasValidFetchMetadata = (request: Request) => {
  const fetchSite = request.headers.get("sec-fetch-site");
  return !fetchSite || fetchSite === "same-origin";
};

const normalizeQuestion = (value: unknown) =>
  typeof value === "string"
    ? value
        .replace(/\r\n?/g, "\n")
        .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
        .trim()
    : "";

const characterLength = (value: string) => Array.from(value).length;

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const readLimitedJson = async (request: Request) => {
  if (!request.body) {
    return {};
  }

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let receivedBytes = 0;
  let rawBody = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    receivedBytes += value.byteLength;
    if (receivedBytes > MAX_REQUEST_BYTES) {
      await reader.cancel();
      throw new RequestTooLargeError("Request body exceeded the configured limit.");
    }

    rawBody += decoder.decode(value, { stream: true });
  }

  rawBody += decoder.decode();
  return JSON.parse(rawBody) as unknown;
};

const getRateLimitHash = (request: Request) => {
  const secret =
    process.env.QUESTION_RATE_LIMIT_SECRET ??
    (process.env.NODE_ENV !== "production" ? "local-question-rate-limit-secret" : "");

  if (!secret || (process.env.NODE_ENV === "production" && secret.length < 32)) {
    throw new Error("QUESTION_RATE_LIMIT_SECRET is not configured.");
  }

  const clientIp = getClientIp(request);
  if (clientIp === "unknown" && process.env.NODE_ENV === "production") {
    throw new Error("Client IP could not be determined.");
  }

  return createHmac("sha256", secret).update(clientIp).digest("hex");
};

const consumeRateLimit = async (
  identifierHash: string,
  stage: "attempt" | "submission",
): Promise<RateLimitResult> => {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.rpc("consume_question_rate_limit", {
    p_identifier_hash: identifierHash,
    p_stage: stage,
  });

  if (error) {
    throw new Error(`Failed to consume question rate limit: ${error.message}`);
  }

  const result = (Array.isArray(data) ? data[0] : data) as RateLimitResult | null;
  if (!result) {
    throw new Error("Question rate limiter returned no result.");
  }

  return result;
};

const verifyTurnstile = async (token: string, request: Request) => {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  if (!secret) {
    return process.env.NODE_ENV !== "production";
  }

  if (!token || token.length > MAX_TURNSTILE_TOKEN_LENGTH) {
    return false;
  }

  const formData = new URLSearchParams({
    secret,
    response: token,
    remoteip: getClientIp(request),
    idempotency_key: randomUUID(),
  });

  try {
    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData,
      cache: "no-store",
      signal: AbortSignal.timeout(7_000),
    });

    if (!response.ok) {
      return false;
    }

    const result = (await response.json()) as TurnstileResult;
    if (!result.success || result.action !== TURNSTILE_ACTION) {
      return false;
    }

    const allowedHostnames = (
      process.env.TURNSTILE_ALLOWED_HOSTNAMES ?? new URL(request.url).hostname
    )
      .split(",")
      .map((hostname) => hostname.trim().toLowerCase())
      .filter(Boolean);

    return Boolean(
      result.hostname && allowedHostnames.includes(result.hostname.toLowerCase()),
    );
  } catch (error) {
    console.error("Turnstile validation failed", error);
    return false;
  }
};

const notifyOwner = async (question: string) => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const resend = new Resend(apiKey);
  const recipient = process.env.QUESTION_NOTIFICATION_EMAIL ?? DEFAULT_NOTIFICATION_EMAIL;
  const safeQuestion = escapeHtml(question).replace(/\n/g, "<br/>");

  await resend.emails.send({
    from: "Machoda Question Box <onboarding@resend.dev>",
    to: recipient,
    subject: "【質問箱】匿名の質問が届きました",
    html: `
      <div style="font-family: 'Hiragino Sans', 'Noto Sans JP', sans-serif; line-height: 1.7;">
        <p>マチョ田の質問箱に新しい匿名質問が届きました。</p>
        <div style="padding: 16px; border-radius: 12px; background: #fff6eb;">
          ${safeQuestion}
        </div>
        <p>Supabase の <strong>questions</strong> テーブルから回答・公開してください。</p>
      </div>
    `,
    text: `マチョ田の質問箱に新しい匿名質問が届きました。\n\n${question}\n\nSupabase の questions テーブルから回答・公開してください。`,
  });
};

export async function POST(request: Request) {
  try {
    if (!hasServiceSupabaseEnv()) {
      return jsonResponse({ error: "質問箱の保存設定が完了していません。" }, { status: 503 });
    }

    if (
      process.env.NODE_ENV === "production" &&
      ((!process.env.QUESTION_RATE_LIMIT_SECRET ||
        process.env.QUESTION_RATE_LIMIT_SECRET.length < 32) ||
        !process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ||
        !process.env.TURNSTILE_SECRET_KEY)
    ) {
      console.error("Question box security environment variables are not configured.");
      return jsonResponse({ error: "質問箱の安全設定が完了していません。" }, { status: 503 });
    }

    const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
    if (!contentType.startsWith("application/json")) {
      return jsonResponse({ error: "送信形式が正しくありません。" }, { status: 415 });
    }

    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > MAX_REQUEST_BYTES) {
      return jsonResponse({ error: "送信データが大きすぎます。" }, { status: 413 });
    }

    if (!hasValidOrigin(request) || !hasValidFetchMetadata(request)) {
      return jsonResponse({ error: "このサイト以外からは送信できません。" }, { status: 403 });
    }

    const parsedBody = await readLimitedJson(request);
    if (!parsedBody || typeof parsedBody !== "object" || Array.isArray(parsedBody)) {
      return jsonResponse({ error: "送信内容を読み取れませんでした。" }, { status: 400 });
    }

    const body = parsedBody as {
      question?: unknown;
      website?: unknown;
      turnstileToken?: unknown;
    };

    if (typeof body.website === "string" && body.website.trim()) {
      return jsonResponse({ ok: true });
    }

    const question = normalizeQuestion(body.question);
    const questionLength = characterLength(question);

    if (questionLength < 1 || questionLength > MAX_QUESTION_LENGTH) {
      return jsonResponse(
        { error: `質問は1〜${MAX_QUESTION_LENGTH.toLocaleString("ja-JP")}文字で入力してください。` },
        { status: 400 },
      );
    }

    const identifierHash = getRateLimitHash(request);
    const attemptLimit = await consumeRateLimit(identifierHash, "attempt");

    if (!attemptLimit.allowed) {
      const retryAfter = Math.max(1, attemptLimit.retry_after_seconds);
      return jsonResponse(
        { error: "送信が集中しています。少し時間をおいてからお試しください。" },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfter),
          },
        },
      );
    }

    const turnstileToken =
      typeof body.turnstileToken === "string" ? body.turnstileToken : "";
    const isHuman = await verifyTurnstile(turnstileToken, request);

    if (!isHuman) {
      return jsonResponse(
        { error: "セキュリティ確認に失敗しました。もう一度お試しください。" },
        { status: 403 },
      );
    }

    const submissionLimit = await consumeRateLimit(identifierHash, "submission");
    if (!submissionLimit.allowed) {
      const retryAfter = Math.max(1, submissionLimit.retry_after_seconds);
      return jsonResponse(
        { error: "短時間に複数の質問は送信できません。時間をおいてからお試しください。" },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfter),
          },
        },
      );
    }

    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("questions").insert({
      question,
      status: "pending",
    });

    if (error) {
      throw new Error(`Failed to save anonymous question: ${error.message}`);
    }

    try {
      await notifyOwner(question);
    } catch (error) {
      console.error("Failed to send question notification", error);
    }

    return jsonResponse({ ok: true }, { status: 201 });
  } catch (error) {
    if (error instanceof RequestTooLargeError) {
      return jsonResponse({ error: "送信データが大きすぎます。" }, { status: 413 });
    }

    if (error instanceof SyntaxError) {
      return jsonResponse({ error: "送信内容を読み取れませんでした。" }, { status: 400 });
    }

    console.error("Failed to process anonymous question", error);
    return jsonResponse({ error: "質問の送信に失敗しました。" }, { status: 500 });
  }
}
