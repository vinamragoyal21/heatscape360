import { Router } from 'express';
import { config } from '../config.js';
import { matchFAQ, DEFAULT_ANSWER, HEAT_SAFETY_STEPS, HEAT_STROKE_WARNING } from '../knowledge/firstAid.js';

export const assistantRouter = Router();

const SYSTEM_PROMPT = `You are the in-app AI Assistant for HeatScape 360, a heat-risk and safety app.
Answer briefly (2-4 sentences) and only about: heat risk zones/scores, heat-aware routing,
heat safety/first aid, nearby cooling/water/medical help, and the app's cost estimates.
Ground safety advice in this exact guidance: ${HEAT_SAFETY_STEPS.map((s) => s.text).join(' ')}
${HEAT_STROKE_WARNING}
If someone describes a medical emergency, tell them clearly to seek real medical help immediately.
If asked something unrelated to the app, politely redirect to what you can help with.`;

assistantRouter.post('/', async (req, res) => {
  const message = (req.body?.message || '').toString().trim();
  if (!message) return res.status(400).json({ error: 'body.message is required' });

  const history = Array.isArray(req.body?.history) ? req.body.history.slice(-6) : [];

  try {
    if (config.anthropicKey) {
      const reply = await askClaude(message, history);
      return res.json({ reply, source: 'claude' });
    }
    if (config.openaiKey) {
      const reply = await askOpenAI(message, history);
      return res.json({ reply, source: 'openai' });
    }
  } catch (err) {
    // Fall through to the offline knowledge base rather than failing the request.
  }

  const faqAnswer = matchFAQ(message);
  res.json({ reply: faqAnswer || DEFAULT_ANSWER, source: 'knowledge-base' });
});

async function askClaude(message, history) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.anthropicKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-haiku-latest',
      max_tokens: 400,
      system: SYSTEM_PROMPT,
      messages: [
        ...history.map((h) => ({ role: h.role === 'assistant' ? 'assistant' : 'user', content: h.content })),
        { role: 'user', content: message },
      ],
    }),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`Anthropic API responded ${res.status}`);
  const data = await res.json();
  return data.content?.[0]?.text?.trim() || DEFAULT_ANSWER;
}

async function askOpenAI(message, history) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.openaiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      max_tokens: 300,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...history.map((h) => ({ role: h.role === 'assistant' ? 'assistant' : 'user', content: h.content })),
        { role: 'user', content: message },
      ],
    }),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`OpenAI API responded ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || DEFAULT_ANSWER;
}
