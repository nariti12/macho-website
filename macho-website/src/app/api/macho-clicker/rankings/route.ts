import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(
    { available: false, items: [], error: "マチョクリッカーの公開は終了しました。" },
    { status: 410, headers: { "Cache-Control": "no-store" } },
  );
}

export const POST = GET;
