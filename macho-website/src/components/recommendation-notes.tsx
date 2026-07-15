type RecommendationNotesProps = {
  bestFor: string;
  caution: string;
  evaluation: string;
};

export function RecommendationNotes({ bestFor, caution, evaluation }: RecommendationNotesProps) {
  const notes = [
    { label: "こんな人向け", value: bestFor },
    { label: "注意点", value: caution },
    { label: "選定根拠", value: evaluation },
  ];

  return (
    <dl className="grid gap-2 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 text-sm sm:grid-cols-3">
      {notes.map((note) => (
        <div key={note.label} className="min-w-0">
          <dt className="text-xs font-bold text-[#9A3412]">{note.label}</dt>
          <dd className="mt-1 leading-6 text-slate-700">{note.value}</dd>
        </div>
      ))}
    </dl>
  );
}
