import { NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasServiceSupabaseEnv } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

const MAX_SCORE = 999_999_999_999_999;
const MAX_NICKNAME_LENGTH = 12;

type RankingRecord = {
  id: string;
  nickname: string;
  score: number;
  created_at: string;
};

const normalizeNickname = (value: unknown) => {
  const nickname = typeof value === "string" ? value.trim() : "";
  return (nickname || "名無しマッチョ").slice(0, MAX_NICKNAME_LENGTH);
};

const normalizeScore = (value: unknown) => {
  const score = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(score) || score < 0) return null;
  return Math.min(MAX_SCORE, Math.floor(score));
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

    const body = (await request.json()) as { nickname?: unknown; score?: unknown };
    const nickname = normalizeNickname(body.nickname);
    const score = normalizeScore(body.score);

    if (score === null || score <= 0) {
      return NextResponse.json({ error: "登録できるスコアがありません。" }, { status: 400 });
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
