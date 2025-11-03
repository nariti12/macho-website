import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const CANONICAL_HOST = "www.machoda.com";
const PLACEHOLDER_QUERY_VALUES = new Set(["{search_term_string}", "search_term_string", ""]);
const REMOVABLE_QUERY_KEYS = new Set(["vercelToolbarCode"]);

const shouldBypassCanonicalRedirect = (host: string | null) => {
  if (!host) {
    return true;
  }

  const lowerHost = host.toLowerCase();

  return (
    lowerHost === "localhost" ||
    lowerHost.startsWith("localhost:") ||
    lowerHost.startsWith("127.0.0.1") ||
    lowerHost.endsWith(".vercel.app") ||
    lowerHost.endsWith(".internal")
  );
};

export function middleware(request: NextRequest) {
  const { nextUrl } = request;
  const url = nextUrl.clone();
  const host = request.headers.get("host");

  const isCanonicalHost = host?.toLowerCase() === CANONICAL_HOST;

  if (!isCanonicalHost && !shouldBypassCanonicalRedirect(host)) {
    url.hostname = CANONICAL_HOST;
    url.protocol = "https";
    url.port = "";
    return NextResponse.redirect(url, 308);
  }

  if (!isCanonicalHost) {
    return NextResponse.next();
  }

  let shouldRedirect = false;
  const params = url.searchParams;

  for (const key of Array.from(params.keys())) {
    const value = params.get(key);

    if (key === "q" && PLACEHOLDER_QUERY_VALUES.has((value ?? "").trim())) {
      params.delete(key);
      shouldRedirect = true;
      continue;
    }

    if (key.startsWith("utm_") || REMOVABLE_QUERY_KEYS.has(key)) {
      params.delete(key);
      shouldRedirect = true;
    }
  }

  if (shouldRedirect) {
    url.search = params.toString();
    return NextResponse.redirect(url, 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/|api/|.*\\..*).*)"],
};
