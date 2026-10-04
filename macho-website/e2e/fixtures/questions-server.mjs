import { createServer } from "node:http";
import { readFile } from "node:fs/promises";

const image = await readFile(new URL("../../public/images/questions-og.png", import.meta.url));
let legacySchema = false;
const rows = [
  { id: "photo", question: "腹筋見せてよ", answer: "トレーニングの成果です！", status: "published", published_at: "2026-10-04T00:00:00Z", answer_image_url: "http://localhost:4319/storage/v1/object/public/question-answers/abs.png" },
  { id: "text", question: "好きな種目は？", answer: "スクワットです。", status: "published", published_at: "2026-10-03T00:00:00Z", answer_image_url: null },
  { id: "unsafe", question: "不正な画像URL", answer: "文章は表示されます。", status: "published", published_at: "2026-10-02T00:00:00Z", answer_image_url: "https://example.com/tracking.png" },
  { id: "pending", question: "未公開の質問", answer: "未公開の回答", status: "pending", published_at: null, answer_image_url: "http://localhost:4319/storage/v1/object/public/question-answers/private.png" },
];

createServer((request, response) => {
  const url = new URL(request.url, "http://localhost:4319");
  if (url.pathname === "/fixture") {
    legacySchema = url.searchParams.get("legacy") === "true";
    response.end("ok");
    return;
  }
  if (url.pathname.startsWith("/storage/")) {
    response.setHeader("Content-Type", "image/png");
    response.end(image);
    return;
  }
  if (url.pathname === "/rest/v1/questions") {
    response.setHeader("Content-Type", "application/json");
    const columns = (url.searchParams.get("select") ?? "*").split(",");
    if (legacySchema && columns.includes("answer_image_url")) {
      response.statusCode = 400;
      response.end(JSON.stringify({ code: "42703", message: "column questions.answer_image_url does not exist" }));
      return;
    }
    const data = rows.filter((row) =>
      url.searchParams.get("status") === "eq.published" ? row.status === "published" : true,
    ).map((row) => Object.fromEntries(columns.filter((column) => !legacySchema || column !== "answer_image_url").map((column) => [column, row[column]])));
    response.end(JSON.stringify(data));
    return;
  }
  response.end("ok");
}).listen(4319);
