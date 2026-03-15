import { NextResponse } from "next/server";

import { refreshProteinRankings } from "@/lib/protein-rankings/service";
import { hasServiceSupabaseEnv } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const isAuthorized = (request: Request) => {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    throw new Error("Missing environment variable: CRON_SECRET");
  }

  const authorization = request.headers.get("authorization");
  const headerSecret = request.headers.get("x-cron-secret");

  return authorization === `Bearer ${secret}` || headerSecret === secret;
};

const handleCronRequest = async (request: Request) => {
  try {
    if (!hasServiceSupabaseEnv()) {
      return NextResponse.json(
        {
          ok: false,
          error: "Supabase service role environment variables are not configured.",
        },
        { status: 500 }
      );
    }

    if (!isAuthorized(request)) {
      return NextResponse.json(
        {
          ok: false,
          error: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const result = await refreshProteinRankings();
    console.info("Protein rankings refreshed", result);

    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    console.error("Failed to refresh protein rankings", error);

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unexpected error",
      },
      { status: 500 }
    );
  }
};

export const GET = handleCronRequest;
export const POST = handleCronRequest;
