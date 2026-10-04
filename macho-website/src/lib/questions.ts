import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasServiceSupabaseEnv } from "@/lib/supabase/config";
import { isQuestionImagePath } from "@/lib/question-images";

export type PublishedQuestion = {
  id: string;
  question: string;
  answer: string;
  answerImageUrl: string | null;
  questionImageUrl: string | null;
  publishedAt: string;
};

type PublishedQuestionRow = {
  id: string;
  question: string;
  answer: string | null;
  answer_image_url?: string | null;
  question_image_path?: string | null;
  published_at: string | null;
};

// Only the owner's public answer-photo bucket is accepted, never arbitrary URLs.
const getAnswerImageUrl = (value: string | null | undefined): string | null => {
  if (!value || !process.env.NEXT_PUBLIC_SUPABASE_URL) return null;

  try {
    const baseUrl = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL);
    const imageUrl = new URL(value);
    if (
      imageUrl.origin !== baseUrl.origin ||
      imageUrl.username || imageUrl.password || imageUrl.search || imageUrl.hash ||
      !imageUrl.pathname.startsWith("/storage/v1/object/public/question-answers/") ||
      !/\.(?:jpe?g|png|webp)$/i.test(imageUrl.pathname)
    ) return null;

    return imageUrl.href;
  } catch {
    return null;
  }
};

export async function fetchPublishedQuestions(limit = 50): Promise<PublishedQuestion[]> {
  if (!hasServiceSupabaseEnv()) {
    return [];
  }

  const safeLimit = Math.min(Math.max(Math.floor(limit), 1), 100);
  const supabase = createSupabaseAdminClient();
  const fetchRows = (columns: string) => supabase
    .from("questions")
    .select(columns)
    .eq("status", "published")
    .not("answer", "is", null)
    .not("published_at", "is", null)
    .order("published_at", { ascending: false })
    .limit(safeLimit);
  let { data, error } = await fetchRows("id, question, answer, answer_image_url, question_image_path, published_at");

  if (error?.code === "42703" && error.message.includes("question_image_path")) {
    ({ data, error } = await fetchRows("id, question, answer, answer_image_url, published_at"));
  }

  // Keep existing answers available if the application is deployed before the migration.
  if (error?.code === "42703" && error.message.includes("answer_image_url")) {
    ({ data, error } = await fetchRows("id, question, answer, published_at"));
  }

  if (error) {
    throw new Error(`Failed to fetch published questions: ${error.message}`);
  }

  return ((data ?? []) as unknown as PublishedQuestionRow[])
    .filter(
      (row): row is PublishedQuestionRow & { answer: string; published_at: string } =>
        Boolean(row.answer?.trim() && row.published_at),
    )
    .map((row) => ({
      id: row.id,
      question: row.question,
      answer: row.answer,
      answerImageUrl: getAnswerImageUrl(row.answer_image_url),
      questionImageUrl: isQuestionImagePath(row.id, row.question_image_path) ? `/api/questions/${row.id}/image` : null,
      publishedAt: row.published_at,
    }));
}
