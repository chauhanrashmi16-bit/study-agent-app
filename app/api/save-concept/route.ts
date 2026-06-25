import { NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase';

const supabase = createClient();

interface RequestBody {
  subject?: unknown;
  concept?: unknown;
  masteryLevel?: unknown;
  overviewGist?: unknown;
  deepDiveGist?: unknown;
  strongAreas?: unknown;
  weakAreas?: unknown;
  nextSteps?: unknown;
  notes?: unknown;
}

function parseString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function parseStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item) => typeof item === 'string').map((item) => item.trim())
    : [];
}

export async function POST(request: Request) {
  const contentType = request.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    return NextResponse.json({ error: 'Content-Type must be application/json' }, { status: 400 });
  }

  const body: RequestBody = await request.json();
  const subject = parseString(body.subject);
  const concept = parseString(body.concept);
  const masteryLevel = parseString(body.masteryLevel);
  const overviewGist = parseString(body.overviewGist);
  const deepDiveGist = parseStringArray(body.deepDiveGist);
  const strongAreas = parseStringArray(body.strongAreas);
  const weakAreas = parseStringArray(body.weakAreas);
  const nextSteps = parseStringArray(body.nextSteps);
  const notes = parseString(body.notes);

  if (!subject || !concept) {
    return NextResponse.json({ error: 'subject and concept are required' }, { status: 400 });
  }

  const { error } = await supabase
    .from('concepts')
    .upsert(
      {
        subject,
        concept,
        mastery_level: masteryLevel,
        overview_gist: overviewGist,
        deep_dive_gist: deepDiveGist,
        strong_areas: strongAreas,
        weak_areas: weakAreas,
        next_steps: nextSteps,
        notes,
        last_updated: new Date().toISOString(),
      },
      { onConflict: ['subject', 'concept'] }
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
