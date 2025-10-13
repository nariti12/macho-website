import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

const MICROCMS_REVALIDATE_SECRET = process.env.MICROCMS_REVALIDATE_SECRET;

export async function POST(request: Request) {
  if (!MICROCMS_REVALIDATE_SECRET) {
    return NextResponse.json({ error: "Revalidation secret is not configured." }, { status: 500 });
  }

  const url = new URL(request.url);
  const secret = url.searchParams.get("secret");

  if (secret !== MICROCMS_REVALIDATE_SECRET) {
    return NextResponse.json({ error: "Invalid secret." }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch (error) {
    console.error("Failed to parse webhook payload", error);
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const data = payload as {
    api?: string;
    contents?: { id?: string; publishValue?: { id?: string } };
    id?: string;
  };

  const apiName = data.api;
  const contentId =
    data.contents?.id ?? data.contents?.publishValue?.id ?? data.id ?? undefined;

  if (apiName && apiName !== "blogs") {
    return NextResponse.json({ skipped: true, reason: `Unsupported api: ${apiName}` });
  }

  revalidateTag("blog-list");

  if (contentId) {
    revalidateTag(`blog-${contentId}`);
  }

  return NextResponse.json({ revalidated: true, contentId: contentId ?? null });
}
