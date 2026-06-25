import { getSupabaseClient } from '../../lib/supabase';
import ConceptDashboard from './ConceptDashboard';
import Navbar from '../components/Navbar';

type ConceptRow = {
  subject: string;
  concept: string;
  mastery_level: string;
  weak_areas: string[] | null;
  strong_areas: string[] | null;
  next_steps: string[] | null;
  last_updated: string | null;
};

function masteryScore(level: string) {
  switch (level) {
    case 'Strong':
      return 4;
    case 'Proficient':
      return 3;
    case 'Developing':
      return 2;
    case 'Introduced':
      return 1;
    default:
      return 0;
  }
}

async function getConcepts() {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from('concepts')
    .select('subject, concept, mastery_level, weak_areas, strong_areas, next_steps, last_updated')
    .order('last_updated', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as ConceptRow[];
}

export default async function DashboardPage() {
  const concepts = await getConcepts();
  const uniqueSubjects = new Set(concepts.map((concept) => concept.subject)).size;
  const totalConcepts = concepts.length;
  const averageScore =
    totalConcepts > 0
      ? concepts.reduce((sum, concept) => sum + masteryScore(concept.mastery_level), 0) / totalConcepts
      : 0;

  const averagePercentage = Math.round((averageScore / 4) * 100);

  return (
    <main className="min-h-screen bg-background text-slate-100">
      <Navbar />
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 rounded-3xl border border-slate-800 bg-slate-950/80 p-6 shadow-xl shadow-slate-950/10 backdrop-blur-md">
          <h1 className="text-3xl font-semibold tracking-tight text-white">Dashboard</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-400">
            Review your studied concepts, mastery progress, and growth areas.
          </p>
        </div>

      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 shadow-xl shadow-slate-950/10">
          <h2 className="text-lg font-semibold text-white">Study stats</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl bg-slate-900/95 p-5 shadow-sm shadow-slate-950/20">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Total concepts</p>
              <p className="mt-3 text-3xl font-semibold text-white">{totalConcepts}</p>
            </div>
            <div className="rounded-3xl bg-slate-900/95 p-5 shadow-sm shadow-slate-950/20">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Unique subjects</p>
              <p className="mt-3 text-3xl font-semibold text-white">{uniqueSubjects}</p>
            </div>
            <div className="rounded-3xl bg-slate-900/95 p-5 shadow-sm shadow-slate-950/20">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Avg mastery</p>
              <p className="mt-3 text-3xl font-semibold text-white">{averagePercentage}%</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 shadow-xl shadow-slate-950/10">
          <h2 className="text-lg font-semibold text-white">Mastery scale</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-400">
            <p>
              Strong = 4, Proficient = 3, Developing = 2, Introduced = 1, In Progress = 0.
            </p>
            <p>Average mastery percentage uses the maximum score of 4 as 100%.</p>
          </div>
        </div>
      </div>

      <ConceptDashboard concepts={concepts} stats={{ totalConcepts, uniqueSubjects, averagePercentage }} />
    </div>
    </main>
  );
}
