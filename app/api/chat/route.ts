import { NextResponse } from 'next/server';
import { streamText } from 'ai';
import { createClient } from '../../../lib/supabase';

const supabase = createClient();

interface RequestBody {
  userMessage?: unknown;
  subject?: unknown;
  concept?: unknown;
}

function formatAreas(value: unknown) {
  if (Array.isArray(value)) {
    return value.filter((item) => typeof item === 'string').join(', ');
  }

  return typeof value === 'string' ? value : '';
}

function buildSystemPrompt(subject: string, concept: string, conceptRow: Record<string, unknown> | null) {
  let modeDescription =
    'Mode A — beginner friendly, analogy-first, define all terms.';

  if (conceptRow && typeof conceptRow.mastery_level === 'string') {
    const mastery = conceptRow.mastery_level;

    if (mastery === 'Introduced' || mastery === 'Developing') {
      modeDescription = 'Mode B — reference prior knowledge, mention weak areas, moderate pace.';
    } else if (mastery === 'Proficient' || mastery === 'Strong') {
      modeDescription = 'Mode C — technical, skip basics, focus on nuance.';
    }
  }

  const weakAreas = formatAreas(conceptRow?.weak_areas);
  const strongAreas = formatAreas(conceptRow?.strong_areas);

  const summaryParts: string[] = [
    'You are an educational tutor for learners.',
    modeDescription,
  ];

  if (subject && concept) {
    summaryParts.push(`The learner asked about subject "${subject}" and concept "${concept}".`);
  }

  if (conceptRow) {
    summaryParts.push('Use the learner profile below to tailor the answer.');

    if (weakAreas) {
      summaryParts.push(`Weak areas: ${weakAreas}.`);
    }

    if (strongAreas) {
      summaryParts.push(`Strong areas: ${strongAreas}.`);
    }
  } else {
    summaryParts.push('No prior concept profile was found, so assume the learner is new to the topic.');
  }

  summaryParts.push('When explaining, keep the answer coherent and educational while matching the learner’s level.');

  return summaryParts.join(' ');
}

export async function POST(request: Request) {
  const contentType = request.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    return NextResponse.json({ error: 'Content-Type must be application/json' }, { status: 400 });
  }

  const body: RequestBody = await request.json();
  const userMessage = typeof body.userMessage === 'string' ? body.userMessage.trim() : '';
  const subject = typeof body.subject === 'string' ? body.subject.trim() : '';
  const concept = typeof body.concept === 'string' ? body.concept.trim() : '';

  if (!userMessage) {
    return NextResponse.json({ error: 'userMessage is required' }, { status: 400 });
  }

  let conceptRow: Record<string, unknown> | null = null;

  if (subject && concept) {
    const { data, error } = await supabase
      .from('concepts')
      .select('subject, concept, mastery_level, weak_areas, strong_areas')
      .eq('subject', subject)
      .eq('concept', concept)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    conceptRow = data ?? null;
  }

  const systemPrompt = buildSystemPrompt(subject, concept, conceptRow);

  const streamResult = await streamText({
    model: 'claude-sonnet-4-20250514',
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: userMessage,
      },
    ],
    allowSystemInMessages: true,
  });

  const textResponse = streamResult.toTextStreamResponse();
  return new NextResponse(textResponse.body, {
    status: textResponse.status,
    statusText: textResponse.statusText,
    headers: textResponse.headers,
  });
}
