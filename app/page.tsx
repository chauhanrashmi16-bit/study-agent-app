"use client";

import { useMemo, useRef, useState } from 'react';
import Navbar from './components/Navbar';

type Role = 'user' | 'assistant';

type ChatMessage = {
  id: string;
  role: Role;
  text: string;
  status?: 'pending' | 'done';
  subject?: string;
  concept?: string;
  saved?: boolean;
  error?: string;
};

const initialMessages: ChatMessage[] = [
  {
    id: 'welcome',
    role: 'assistant',
    text: 'Hi! Send a study question and I’ll help explain the concept with the right tone.',
    status: 'done',
  },
];

function createSavePayload(message: ChatMessage) {
  const text = message.text.trim();
  const overviewGist = text.split(/\n\n+/)[0].slice(0, 220).trim();
  const deepDiveGist = text
    .split(/\n\n+/)
    .slice(1)
    .filter(Boolean)
    .slice(0, 3);
  const lower = text.toLowerCase();
  let masteryLevel = 'Developing';

  if (/advanced|technical|nuance|expert|proficient/.test(lower)) {
    masteryLevel = 'Proficient';
  } else if (/beginner|intro|simple|analogy|basic|define/.test(lower)) {
    masteryLevel = 'Introduced';
  }

  return {
    subject: message.subject ?? '',
    concept: message.concept ?? '',
    masteryLevel,
    overviewGist: overviewGist || text.slice(0, 220),
    deepDiveGist: deepDiveGist.length > 0 ? deepDiveGist : [text],
    strongAreas: [],
    weakAreas: [],
    nextSteps: [],
    notes: text,
  };
}

function getMessageAlignment(message: ChatMessage) {
  return message.role === 'user' ? 'justify-end' : 'justify-start';
}

export default function HomePage() {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const listRef = useRef<HTMLDivElement | null>(null);

  const canSave = useMemo(
    () => messages.some((message) => message.role === 'assistant' && message.status === 'done' && message.subject && message.concept && !message.saved),
    [messages]
  );

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
    });
  };

  const setMessageText = (id: string, text: string, status?: ChatMessage['status']) => {
    setMessages((prev) =>
      prev.map((message) =>
        message.id === id
          ? {
              ...message,
              text,
              status: status ?? message.status,
            }
          : message
      )
    );
  };

  const handleSend = async () => {
    if (!draft.trim() || isSending) {
      return;
    }

    setError('');
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: draft.trim(),
      status: 'done',
    };

    setMessages((prev) => [...prev, userMessage]);
    setDraft('');
    scrollToBottom();
    setIsSending(true);

    try {
      const detectResponse = await fetch('/api/detect-concept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userMessage: userMessage.text }),
      });

      if (!detectResponse.ok) {
        const errorBody = await detectResponse.json().catch(() => null);
        throw new Error(errorBody?.error ?? 'Concept detection failed');
      }

      const detectData = await detectResponse.json();
      const subject = typeof detectData.subject === 'string' ? detectData.subject : '';
      const concept = typeof detectData.concept === 'string' ? detectData.concept : '';
      const assistantId = `assistant-${Date.now()}`;

      setMessages((prev) => [
        ...prev,
        {
          id: assistantId,
          role: 'assistant',
          text: '',
          status: 'pending',
          subject,
          concept,
        },
      ]);

      scrollToBottom();

      const chatResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userMessage: userMessage.text,
          subject,
          concept,
        }),
      });

      if (!chatResponse.ok || !chatResponse.body) {
        const errorBody = await chatResponse.json().catch(() => null);
        throw new Error(errorBody?.error ?? 'Chat response failed');
      }

      const reader = chatResponse.body.getReader();
      const decoder = new TextDecoder();
      let text = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        setMessageText(assistantId, text);
        scrollToBottom();
      }

      setMessageText(assistantId, text, 'done');
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Unknown error';
      setError(message);
      setMessages((prev) =>
        prev.map((entry) =>
          entry.role === 'assistant' && entry.status === 'pending'
            ? { ...entry, text: `Error: ${message}`, status: 'done', error: message }
            : entry
        )
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleSaveConcept = async (message: ChatMessage) => {
    if (!message.subject || !message.concept) {
      return;
    }

    const payload = createSavePayload(message);
    try {
      const response = await fetch('/api/save-concept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Save failed');
      }

      setMessages((prev) =>
        prev.map((entry) =>
          entry.id === message.id ? { ...entry, saved: true } : entry
        )
      );
    } catch {
      setError('Unable to save concept progress.');
    }
  };

  return (
    <main className="min-h-screen bg-background text-slate-100">
      <Navbar />
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-6 rounded-3xl border border-slate-800 bg-slate-950/80 p-6 shadow-xl shadow-slate-950/10 backdrop-blur-md">
          <h1 className="text-3xl font-semibold tracking-tight text-white">Study Agent</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-400">
            Ask a study question, detect the concept, and stream a focused explanation. Save progress when a concept is recognized.
          </p>
        </header>

        <section className="flex-1 overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/80 shadow-xl shadow-slate-950/20">
          <div ref={listRef} className="flex h-full flex-col gap-4 overflow-y-auto p-6 scrollbar-thin">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${getMessageAlignment(message)}`}>
                <div className={`max-w-[85%] ${message.role === 'user' ? 'rounded-3xl rounded-br-none bg-sky-900/90 px-4 py-3 text-sky-100 shadow-lg shadow-sky-900/10' : 'rounded-3xl rounded-bl-none border border-slate-800 bg-slate-900/95 px-5 py-4 text-slate-100 shadow-lg shadow-slate-950/30'}`}>
                  <div className="whitespace-pre-wrap break-words text-sm leading-7">{message.text || (message.status === 'pending' ? 'Thinking…' : '')}</div>

                  {message.role === 'assistant' && message.subject && message.concept ? (
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-400">
                      <span className="rounded-full bg-slate-800 px-3 py-1">Subject: {message.subject}</span>
                      <span className="rounded-full bg-slate-800 px-3 py-1">Concept: {message.concept}</span>
                    </div>
                  ) : null}

                  {message.role === 'assistant' && message.status === 'done' && message.subject && message.concept ? (
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <button
                        type="button"
                        disabled={message.saved}
                        onClick={() => handleSaveConcept(message)}
                        className="rounded-full bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:bg-slate-700"
                      >
                        {message.saved ? 'Saved' : 'Save progress'}
                      </button>
                      <p className="text-xs text-slate-500">Save concept info to Supabase.</p>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-800 bg-slate-950/90 p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <label htmlFor="chat-input" className="sr-only">
                Message
              </label>
              <textarea
                id="chat-input"
                rows={2}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Type your study question here..."
                className="min-h-[96px] w-full resize-none rounded-3xl border border-slate-800 bg-slate-900/95 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={!draft.trim() || isSending}
                className="inline-flex shrink-0 items-center justify-center rounded-3xl bg-sky-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:bg-slate-700"
              >
                {isSending ? 'Sending…' : 'Send'}
              </button>
            </div>
            {error ? <p className="mt-3 text-sm text-amber-300">{error}</p> : null}
            <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
              <span className="rounded-full bg-slate-900/80 px-3 py-1">Dark theme</span>
              <span className="rounded-full bg-slate-900/80 px-3 py-1">Streaming chat</span>
              <span className="rounded-full bg-slate-900/80 px-3 py-1">Concept detection</span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
