begin;

alter table public.questions
  add column if not exists answer_image_url text;

alter table public.questions
  add constraint question_answer_image_url_format check (
    answer_image_url is null
    or (
      char_length(answer_image_url) <= 2048
      and answer_image_url ~* '^https://[^/]+/storage/v1/object/public/question-answers/.+\.(jpg|jpeg|png|webp)$'
    )
  );

comment on column public.questions.answer_image_url is
  'Optional public URL of one owner-uploaded photo in the question-answers Storage bucket.';

-- Public viewing only. Uploads, edits, and deletion remain restricted to the
-- Dashboard/service role; do not add anon/authenticated write policies.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'question-answers',
  'question-answers',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
);

commit;
