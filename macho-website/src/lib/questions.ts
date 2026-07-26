import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasServiceSupabaseEnv } from "@/lib/supabase/config";

export type PublishedQuestion = {
  id: string;
  question: string;
  answer: string;
  publishedAt: string;
};

type PublishedQuestionRow = {
  id: string;
  question: string;
  answer: string | null;
  published_at: string | null;
};

export async function fetchPublishedQuestions(limit = 50): Promise<PublishedQuestion[]> {
  if (!hasServiceSupabaseEnv()) {
    return [];
  }

  const safeLimit = Math.min(Math.max(Math.floor(limit), 1), 100);
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("questions")
    .select("id, question, answer, published_at")
    .eq("status", "published")
    .not("answer", "is", null)
    .not("published_at", "is", null)
    .order("published_at", { ascending: false })
    .limit(safeLimit);

  if (error) {
    throw new Error(`Failed to fetch published questions: ${error.message}`);
  }

  return ((data ?? []) as PublishedQuestionRow[])
    .filter(
      (row): row is PublishedQuestionRow & { answer: string; published_at: string } =>
        Boolean(row.answer?.trim() && row.published_at),
    )
    .map((row) => ({
      id: row.id,
      question: row.question,
      answer: row.answer,
      publishedAt: row.published_at,
    }));
}
