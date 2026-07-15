import { NextResponse } from "next/server";

import { fetchLatestBlogCards } from "@/lib/blogs";

export async function GET() {
  try {
    const items = await fetchLatestBlogCards(6);
    return NextResponse.json({ items });
  } catch (error) {
    console.error("Failed to fetch blogs from microCMS", error);
    return NextResponse.json({ error: "Failed to fetch blogs from microCMS." }, { status: 500 });
  }
}
