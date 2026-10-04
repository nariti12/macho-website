export const MAX_QUESTION_IMAGE_BYTES = 3 * 1024 * 1024;
export const QUESTION_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const QUESTION_IMAGE_BUCKET = "question-images";

export const isQuestionImagePath = (id: string, path: unknown): path is string =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) &&
  path === `${id}.webp`;
