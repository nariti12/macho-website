import { NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasServiceSupabaseEnv } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

const TABLE = "macho_clicker_tap_scores";
const MAX_TAPS = 100_000_000;
const MAX_REQUEST_BYTES = 2_048;
const PLAYER_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type ScoreRow = {
  id: string;
  player_id: string;
  nickname: string;
  taps: number;
  updated_at: string;
};

const responseItem = (row: ScoreRow) => ({
  id: row.id,
  playerId: row.player_id,
  nickname: row.nickname,
  taps: Number(row.taps),
  updatedAt: row.updated_at,
});

const getItems = async () => {
  const { data, error } = await createSupabaseAdminClient()
    .from(TABLE)
    .select("id, player_id, nickname, taps, updated_at")
    .order("taps", { ascending: false })
    .order("updated_at", { ascending: true })
    .limit(50);
  if (error) throw error;
  return ((data ?? []) as ScoreRow[]).map(responseItem);
};

const sameOrigin = (request: Request) => {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try { return new URL(origin).host === new URL(request.url).host; } catch { return false; }
};

export async function GET() {
  if (!hasServiceSupabaseEnv()) return NextResponse.json({ items: [], available: false });
  try {
    return NextResponse.json({ items: await getItems(), available: true });
  } catch (error) {
    console.error("Failed to load tap rankings", error);
    return NextResponse.json({ items: [], available: false, error: "ランキングを取得できませんでした。" }, { status: 503 });
  }
}

export async function POST(request: Request) {
  if (!hasServiceSupabaseEnv()) return NextResponse.json({ error: "ランキングは準備中です。" }, { status: 503 });
  if (!sameOrigin(request)) return NextResponse.json({ error: "このサイトからのみ登録できます。" }, { status: 403 });
  if (Number(request.headers.get("content-length") ?? 0) > MAX_REQUEST_BYTES) {
    return NextResponse.json({ error: "送信データが大きすぎます。" }, { status: 413 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const playerId = typeof body.playerId === "string" ? body.playerId : "";
    const nickname = typeof body.nickname === "string"
      ? body.nickname.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, 12)
      : "";
    const taps = body.taps;
    if (!PLAYER_ID.test(playerId) || !nickname || typeof taps !== "number" || !Number.isSafeInteger(taps) || taps < 1 || taps > MAX_TAPS) {
      return NextResponse.json({ error: "名前とタップ数を確認してください。" }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();
    const { data: prior, error: readError } = await supabase
      .from(TABLE)
      .select("taps")
      .eq("player_id", playerId)
      .maybeSingle();
    if (readError) throw readError;
    if (!prior || taps > Number(prior.taps)) {
      const { error: writeError } = await supabase.from(TABLE).upsert(
        { player_id: playerId, nickname, taps, updated_at: new Date().toISOString() },
        { onConflict: "player_id" },
      );
      if (writeError) throw writeError;
    }
    return NextResponse.json({ items: await getItems(), available: true });
  } catch (error) {
    console.error("Failed to save tap ranking", error);
    return NextResponse.json({ error: "ランキングを登録できませんでした。" }, { status: 503 });
  }
}
