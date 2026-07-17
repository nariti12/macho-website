import { NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasServiceSupabaseEnv } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

const MAX_SCORE = Number.MAX_SAFE_INTEGER;
const MAX_NICKNAME_LENGTH = 12;
const MAX_REQUEST_BYTES = 2_048;
const MAX_CLICKS_PER_SECOND = 25;
const CLICK_BURST_ALLOWANCE = 100;

type RankingRecord = {
  id: string;
  nickname: string;
  score: number;
  created_at: string;
};

const normalizeNickname = (value: unknown) => {
  const nickname = typeof value === "string" ? value.replace(/[\u0000-\u001f\u007f]/g, "").trim() : "";
  return (nickname || "名無しマッチョ").slice(0, MAX_NICKNAME_LENGTH);
};

const normalizeScore = (value: unknown) => {
  const score = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(score) || score < 0 || score > MAX_SCORE) return null;
  return Math.floor(score);
};

const normalizeNonNegativeInteger = (value: unknown) => {
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isSafeInteger(number) || number < 0) return null;
  return number;
};

const hasValidOrigin = (request: Request) => {
  const origin = request.headers.get("origin");
  if (!origin) return true;

  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
};

const toResponseItem = (item: RankingRecord) => ({
  id: item.id,
  nickname: item.nickname,
  score: Number(item.score),
  createdAt: item.created_at,
});

const fetchRankings = async () => {
  if (!hasServiceSupabaseEnv()) {
    return [];
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("macho_clicker_scores")
    .select("id, nickname, score, created_at")
    .order("score", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(50);

  if (error) {
    throw new Error(`Failed to fetch macho clicker rankings: ${error.message}`);
  }

  return ((data ?? []) as RankingRecord[]).map(toResponseItem);
};

export async function GET() {
  try {
    const items = await fetchRankings();
    return NextResponse.json({ items });
  } catch (error) {
    console.error("Failed to load macho clicker rankings", error);
    return NextResponse.json({ error: "ランキングの取得に失敗しました。" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!hasServiceSupabaseEnv()) {
      return NextResponse.json({ error: "ランキング保存設定が完了していません。" }, { status: 500 });
    }

    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > MAX_REQUEST_BYTES) {
      return NextResponse.json({ error: "送信データが大きすぎます。" }, { status: 413 });
    }

    if (!hasValidOrigin(request)) {
      return NextResponse.json({ error: "このサイト以外からは登録できません。" }, { status: 403 });
    }

    const body = (await request.json()) as {
      nickname?: unknown;
      score?: unknown;
      playSeconds?: unknown;
      clickCount?: unknown;
    };
    const nickname = normalizeNickname(body.nickname);
    const score = normalizeScore(body.score);
    const playSeconds = normalizeNonNegativeInteger(body.playSeconds);
    const clickCount = normalizeNonNegativeInteger(body.clickCount);

    if (score === null || score <= 0) {
      return NextResponse.json({ error: "登録できるスコアがありません。" }, { status: 400 });
    }

    if (playSeconds === null || clickCount === null || playSeconds < 5) {
      return NextResponse.json({ error: "プレイ情報を確認できませんでした。" }, { status: 400 });
    }

    if (clickCount > playSeconds * MAX_CLICKS_PER_SECOND + CLICK_BURST_ALLOWANCE) {
      console.warn("Rejected suspicious Macho Clicker ranking", { nickname, score, playSeconds, clickCount });
      return NextResponse.json({ error: "クリック数に異常な値があるため登録できません。" }, { status: 422 });
    }

    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("macho_clicker_scores").insert({
      nickname,
      score,
    });

    if (error) {
      throw new Error(`Failed to save macho clicker ranking: ${error.message}`);
    }

    const items = await fetchRankings();
    return NextResponse.json({ ok: true, items });
  } catch (error) {
    console.error("Failed to save macho clicker ranking", error);
    return NextResponse.json({ error: "ランキング登録に失敗しました。" }, { status: 500 });
  }
}
