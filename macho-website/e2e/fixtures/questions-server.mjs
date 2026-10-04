import { createServer } from "node:http";
import { readFile } from "node:fs/promises";

const image = await readFile(new URL("../../public/images/questions-og.png", import.meta.url));
let legacySchema = false;
let denyRate = false;
let failInsert = false;
const uploads = new Map();
const rows = [
  { id: "photo", question: "腹筋見せてよ", answer: "トレーニングの成果です！", status: "published", published_at: "2026-10-04T00:00:00Z", answer_image_url: "http://localhost:4319/storage/v1/object/public/question-answers/abs.png" },
  { id: "text", question: "好きな種目は？", answer: "スクワットです。", status: "published", published_at: "2026-10-03T00:00:00Z", answer_image_url: null },
  { id: "unsafe", question: "不正な画像URL", answer: "文章は表示されます。", status: "published", published_at: "2026-10-02T00:00:00Z", answer_image_url: "https://example.com/tracking.png" },
  { id: "pending", question: "未公開の質問", answer: "未公開の回答", status: "pending", published_at: null, answer_image_url: "http://localhost:4319/storage/v1/object/public/question-answers/private.png" },
];

const readBody = async (request) => {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  return Buffer.concat(chunks);
};

createServer(async (request, response) => {
  const url = new URL(request.url, "http://localhost:4319");
  if (url.pathname === "/fixture") {
    legacySchema = url.searchParams.get("legacy") === "true";
    denyRate = url.searchParams.get("denyRate") === "true";
    failInsert = url.searchParams.get("failInsert") === "true";
    rows.splice(4);
    uploads.clear();
    response.end("ok");
    return;
  }
  if (url.pathname === "/fixture/state") {
    response.setHeader("Content-Type", "application/json");
    response.end(JSON.stringify({ rows: rows.slice(4), uploadedFiles: uploads.size }));
    return;
  }
  if (url.pathname === "/fixture/legacy-image") {
    const id = "11111111-1111-4111-8111-111111111111";
    rows.push({ id, question: "以前の画像付き質問", answer: "回答文は引き続き表示", status: "published", published_at: "2026-10-04T00:00:00Z", question_image_path: `${id}.webp`, answer_image_url: null });
    uploads.set(`${id}.webp`, image);
    response.end("ok");
    return;
  }
  if (url.pathname === "/fixture/publish") {
    const row = rows.find((row) => row.id === url.searchParams.get("id"));
    row.status = url.searchParams.get("status") ?? "published";
    row.answer = "添付写真を確認しました。";
    row.published_at = "2026-10-04T01:00:00Z";
    response.end("ok");
    return;
  }
  if (url.pathname === "/rest/v1/rpc/consume_question_rate_limit") {
    response.setHeader("Content-Type", "application/json");
    response.end(JSON.stringify([{ allowed: !denyRate, retry_after_seconds: 60, reason: denyRate ? "limit" : "ok" }]));
    return;
  }
  if (url.pathname.includes("/question-images")) {
    if (request.headers.authorization !== "Bearer question-test-service-key") {
      response.statusCode = 403;
      response.end("Private bucket");
      return;
    }
    if (request.method === "DELETE") {
      const body = JSON.parse((await readBody(request)).toString());
      for (const path of body.prefixes) uploads.delete(path);
      response.setHeader("Content-Type", "application/json");
      response.end("[]");
      return;
    }
    const path = url.pathname.split("/question-images/")[1];
    if (request.method === "POST") {
      uploads.set(path, await readBody(request));
      response.setHeader("Content-Type", "application/json");
      response.end(JSON.stringify({ Key: `question-images/${path}` }));
      return;
    }
    if (!uploads.has(path)) {
      response.statusCode = 404;
      response.end("Missing image");
      return;
    }
    response.setHeader("Content-Type", "image/webp");
    response.end(uploads.get(path));
    return;
  }
  if (url.pathname.startsWith("/storage/")) {
    response.setHeader("Content-Type", "image/png");
    response.end(image);
    return;
  }
  if (url.pathname === "/rest/v1/questions") {
    response.setHeader("Content-Type", "application/json");
    if (request.method === "POST") {
      if (failInsert) {
        response.statusCode = 500;
        response.end(JSON.stringify({ message: "Simulated DB save failure" }));
        return;
      }
      rows.push({ ...JSON.parse((await readBody(request)).toString()), answer: null, published_at: null });
      response.statusCode = 201;
      response.end("{}");
      return;
    }
    const columns = (url.searchParams.get("select") ?? "*").split(",");
    if (legacySchema && columns.some((column) => column === "answer_image_url" || column === "question_image_path")) {
      response.statusCode = 400;
      response.end(JSON.stringify({ code: "42703", message: "column questions.answer_image_url does not exist" }));
      return;
    }
    const data = rows.filter((row) => !url.searchParams.get("id") || url.searchParams.get("id") === `eq.${row.id}`).filter((row) =>
      url.searchParams.get("status") === "eq.published" ? row.status === "published" : true,
    ).map((row) => Object.fromEntries(columns.filter((column) => !legacySchema || column !== "answer_image_url").map((column) => [column, row[column]])));
    response.end(JSON.stringify(data));
    return;
  }
  response.end("ok");
}).listen(4319);
