/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from "next/og";

import { siteUrl } from "@/lib/seo";

export const runtime = "edge";

const WIDTH = 1200;
const HEIGHT = 630;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title") ?? "マチョ田の部屋";
  const description =
    searchParams.get("description") ?? "筋トレの悩みを解決する統合プラットフォーム";

  const mascotUrl = `${siteUrl}/picture/man.png`;

  return new ImageResponse(
    (
      <div
        style={{
          width: WIDTH,
          height: HEIGHT,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #FCC081 10%, #FCE0C2 90%)",
          padding: "80px",
          fontFamily: "'Noto Sans JP', sans-serif",
          color: "#4B1F0E",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: "60%" }}>
          <span style={{ fontSize: 32, fontWeight: 600, letterSpacing: 4, textTransform: "uppercase" }}>
            Machoda.com
          </span>
          <h1 style={{ fontSize: 72, fontWeight: 800, margin: 0, lineHeight: 1.1 }}>{title}</h1>
          <p style={{ fontSize: 32, margin: 0, color: "#623522" }}>{description}</p>
        </div>
        <div
          style={{
            alignSelf: "flex-end",
            position: "relative",
            display: "flex",
            justifyContent: "flex-end",
            width: "100%",
          }}
        >
          <div
            style={{
              width: 320,
              height: 320,
              borderRadius: "48px",
              background: "rgba(255, 255, 255, 0.75)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              boxShadow: "0 30px 80px rgba(107, 46, 16, 0.35)",
            }}
          >
            <img
              src={mascotUrl}
              alt="マチョ田のキャラクター"
              style={{ width: "85%", height: "85%", objectFit: "contain" }}
            />
          </div>
        </div>
      </div>
    ),
    {
      width: WIDTH,
      height: HEIGHT,
    },
  );
}
