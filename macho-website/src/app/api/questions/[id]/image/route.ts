import { isQuestionImagePath, QUESTION_IMAGE_BUCKET } from "@/lib/question-images";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const headers = {
  "Cache-Control": "private, no-store, max-age=0",
  "X-Content-Type-Options": "nosniff",
};

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isQuestionImagePath(id, `${id}.webp`)) return new Response(null, { status: 404, headers });

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.from("questions")
      .select("question_image_path, answer, published_at")
      .eq("id", id).eq("status", "published").limit(1);
    if (error) throw error;
    const question = data?.[0];
    if (!question?.answer?.trim() || !question.published_at || !isQuestionImagePath(id, question.question_image_path)) {
      return new Response(null, { status: 404, headers });
    }
    const { data: image, error: downloadError } = await supabase.storage.from(QUESTION_IMAGE_BUCKET).download(question.question_image_path);
    if (downloadError || !image) return new Response(null, { status: 404, headers });
    return new Response(await image.arrayBuffer(), { headers: {
      ...headers, "Content-Type": "image/webp", "Content-Disposition": 'inline; filename="question-image.webp"',
    } });
  } catch (error) {
    console.error("Failed to serve published question image", error);
    return new Response(null, { status: 503, headers });
  }
}
