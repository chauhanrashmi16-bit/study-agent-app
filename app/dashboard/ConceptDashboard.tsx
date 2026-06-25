'use client';

'use client';

import { useMemo, useState } from 'react';

export type ConceptRow = {
  subject: string;
  concept: string;
  mastery_level: string;
  weak_areas: string[] | null;
  strong_areas: string[] | null;
  next_steps: string[] | null;
  last_updated: string | null;
};

const subjectColors: Record<string, string> = {
  Physics: 'bg-sky-600 text-sky-100',
  Biology: 'bg-emerald-600 text-emerald-100',
  Mathematics: 'bg-violet-600 text-violet-100',
  'Computer Science': 'bg-orange-500 text-orange-100',
  Chemistry: 'bg-red-600 text-red-100',
};

const masteryColor: Record<string, string> = {
  Strong: 'bg-emerald-500 text-emerald-100',
  Proficient: 'bg-sky-500 text-sky-100',
  Developing: 'bg-amber-500 text-amber-100',
  Introduced: 'bg-violet-500 text-violet-100',
  'In Progress': 'bg-slate-600 text-slate-100',
};

const progressValues: Record<string, number> = {
  Strong: 100,
  Proficient: 75,
  Developing: 50,
  Introduced: 25,
  'In Progress': 10,
};

const tagColors: Record<string, string> = {
  strong: 'bg-emerald-600 text-emerald-100',
  weak: 'bg-red-600 text-red-100',
  next: 'bg-sky-600 text-sky-100',
};

function formatDate(value: string | null) {
  if (!value) return 'Unknown';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function ConceptDashboard({ concepts }: { concepts: ConceptRow[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  const renderedCards = useMemo(
    () =>
      concepts.map((concept) => {
        const id = `${concept.subject}:${concept.concept}`;
        const badgeClass = masteryColor[concept.mastery_level] ?? masteryColor['In Progress'];
        const progress = progressValues[concept.mastery_level] ?? 0;
        const subjectClass = subjectColors[concept.subject] ?? 'bg-slate-600 text-slate-100';

        return (
          <button
            key={id}
            type="button"
            onClick={() => setOpenId(openId === id ? null : id)}
            className="w-full rounded-3xl border border-slate-800 bg-slate-950/90 p-6 text-left shadow-lg shadow-slate-950/20 transition hover:border-slate-700"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${subjectClass}`}>
                    {concept.subject}
                  </span>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeClass}`}>
                    {concept.mastery_level}
                  </span>
                </div>
                <p className="text-lg font-semibold text-white">{concept.concept}</p>
              </div>

              <div className="min-w-[175px] space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Progress</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                  <div className="h-full rounded-full bg-sky-500" style={{ width: `${progress}%` }} />
                </div>
                <p className="text-xs text-slate-500">Updated {formatDate(concept.last_updated)}</p>
              </div>
            </div>

            {openId === id ? (
              <div className="mt-6 space-y-4 border-t border-slate-800 pt-5">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Strong areas</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {concept.strong_areas && concept.strong_areas.length > 0 ? (
                        concept.strong_areas.map((item) => (
                          <span key={item} className={`rounded-full px-3 py-1 text-xs ${tagColors.strong}`}>
                            {item}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-500">None</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Weak areas</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {concept.weak_areas && concept.weak_areas.length > 0 ? (
                        concept.weak_areas.map((item) => (
                          <span key={item} className={`rounded-full px-3 py-1 text-xs ${tagColors.weak}`}>
                            {item}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-500">None</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Next steps</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {concept.next_steps && concept.next_steps.length > 0 ? (
                        concept.next_steps.map((item) => (
                          <span key={item} className={`rounded-full px-3 py-1 text-xs ${tagColors.next}`}>
                            {item}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-500">None</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </button>
        );
      }),
    [concepts, openId]
  );

  return (
    <section className="mt-6 grid gap-4">
      {renderedCards.length > 0 ? (
        renderedCards
      ) : (
        <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-8 text-center text-slate-400 shadow-lg shadow-slate-950/20">
          No concepts found yet.
        </div>
      )}
    </section>
  );
}
