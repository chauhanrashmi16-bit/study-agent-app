import { NextResponse } from 'next/server';
import { generateText } from 'ai';

interface RequestBody {
  userMessage?: unknown;
}

const extractionSystemPrompt = `You are an extraction assistant. Given a user message, return only a valid JSON object with two string fields: subject and concept. Do not add any additional text, explanation, or markdown.
- If the message is about studying a concept, set subject and concept to the extracted values.
- If the message is not about studying a concept, return {"subject":"","concept":""}.
Always return exactly one JSON object.`;

function parseJsonObject(rawText: string) {
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return null;
  }

  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const contentType = request.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    return NextResponse.json({ error: 'Content-Type must be application/json' }, { status: 400 });
  }

  const body: RequestBody = await request.json();
  const userMessage = typeof body.userMessage === 'string' ? body.userMessage.trim() : '';

  if (!userMessage) {
    return NextResponse.json({ error: 'userMessage is required' }, { status: 400 });
  }

  const result = await generateText({
    model: 'claude-haiku-4-5-20251001',
    system: extractionSystemPrompt,
    messages: [
      {
        role: 'user',
        content: `Extract the subject and concept from this message: "${userMessage}"`,
      },
    ],
    allowSystemInMessages: true,
  });

  const extracted = parseJsonObject(result.text);
  const subject = typeof extracted?.subject === 'string' ? extracted.subject : '';
  const concept = typeof extracted?.concept === 'string' ? extracted.concept : '';

  return NextResponse.json({ subject, concept });
}
