begin;

alter table public.questions add column question_image_path text;
alter table public.questions add constraint question_image_matches_question
  check (question_image_path is null or question_image_path = id::text || '.webp');
comment on column public.questions.question_image_path is
  'Private question-images object path. Inspect in Dashboard Storage; served only while the answered question is published.';

-- No client read/write policies: only Dashboard/service role can access this bucket.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('question-images', 'question-images', false, 3145728, array['image/webp']);

commit;
