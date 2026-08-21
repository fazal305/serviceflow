import { z } from 'zod';

import { env } from '../config/env.js';
import { listServiceCategories } from '../db/serviceCategories.js';

const classificationSchema = z.object({
  problems: z.array(z.string()).min(1).max(6),
  possibleCauses: z.array(z.string()).min(1).max(6),
  suggestedServiceCategory: z.string().nullable(),
  suggestedTechnicianType: z.string(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  summary: z.string(),
});

const TIMEOUT_MS = 12_000;

/**
 * Converts a free-text customer problem description into structured data
 * via OpenRouter. Every failure mode (no key configured, network error,
 * timeout, rate limit, malformed/non-JSON response) normalizes to
 * `{ success: false }` rather than throwing — Section 12 requires the core
 * request-submission workflow to work even when this is fully unavailable,
 * so callers never need to distinguish "AI down" from "AI misconfigured"
 * from "AI returned garbage": they're all just "not available right now".
 */
export async function classifyServiceRequest(description) {
  const apiKey = env.openRouterApiKeyOrNull;
  if (!apiKey) {
    return { success: false, reason: 'AI assistant is not configured' };
  }

  const categories = await listServiceCategories();
  const categoryNames = categories.map((c) => c.name);

  const systemPrompt = `You are a triage assistant for a home/business service company (HVAC, electrical, plumbing, appliance repair, IT support, mechanical, general maintenance). A customer will describe a problem, possibly in a mix of English and Urdu/Roman Urdu. Respond with ONLY a JSON object (no markdown, no commentary) matching exactly this shape:
{
  "problems": string[] (1-4 short phrases naming the distinct problems described),
  "possibleCauses": string[] (1-4 short phrases, plausible technical causes),
  "suggestedServiceCategory": one of exactly these strings, or null if none fit: ${categoryNames.map((n) => `"${n}"`).join(', ')},
  "suggestedTechnicianType": a short phrase naming the kind of technician needed,
  "priority": "LOW" | "MEDIUM" | "HIGH" (HIGH for safety issues, active leaks/flooding, no power/AC in extreme weather, total loss of essential service; LOW for cosmetic/non-urgent; MEDIUM otherwise),
  "summary": a one-sentence plain-English summary of the issue
}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        // OpenRouter uses these to attribute usage in its dashboard — not
        // required, but good practice and harmless if the URL isn't public.
        'HTTP-Referer': 'https://serviceflow.local',
        'X-Title': 'ServiceFlow',
      },
      body: JSON.stringify({
        model: env.openRouterModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: description },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2,
      }),
    });

    if (!res.ok) {
      return { success: false, reason: `OpenRouter returned ${res.status}` };
    }

    const body = await res.json();
    const raw = body.choices?.[0]?.message?.content;
    if (!raw) {
      return { success: false, reason: 'Empty response from model' };
    }

    let parsedJson;
    try {
      parsedJson = JSON.parse(raw);
    } catch {
      return { success: false, reason: 'Model did not return valid JSON' };
    }

    const parsed = classificationSchema.safeParse(parsedJson);
    if (!parsed.success) {
      return { success: false, reason: 'Model response did not match expected shape' };
    }

    const matchedCategory = categories.find(
      (c) => c.name.toLowerCase() === parsed.data.suggestedServiceCategory?.toLowerCase(),
    );

    return {
      success: true,
      data: {
        problems: parsed.data.problems,
        possibleCauses: parsed.data.possibleCauses,
        suggestedServiceCategoryId: matchedCategory?.id ?? null,
        suggestedServiceCategoryName: matchedCategory?.name ?? null,
        suggestedTechnicianType: parsed.data.suggestedTechnicianType,
        priority: parsed.data.priority,
        summary: parsed.data.summary,
      },
    };
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return { success: false, reason: 'AI request timed out' };
    }
    return { success: false, reason: 'AI request failed' };
  } finally {
    clearTimeout(timeout);
  }
}
