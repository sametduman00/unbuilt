/**
 * LANGUAGE_RULE — appended to every user-facing Claude system prompt.
 *
 * Why this exists:
 *   The site copy is English (per Bible v5 strategy — global audience).
 *   But the AI tools (Dig, Stack) accept free-form idea input from
 *   anywhere in the world. Without this rule, Claude defaults to
 *   English regardless of input language, which creates a broken
 *   experience for non-English speakers — they type a Turkish idea,
 *   get an English wall of text back, can't read it, and bounce.
 *
 * What it does:
 *   Tells Claude to detect the language of the user's idea and respond
 *   in that same language for all narrative content. Field names in
 *   JSON output stay English (so our parsers keep working) but field
 *   values are localised. Brand names, tool names, frameworks stay in
 *   their original form regardless of language.
 *
 * Where it goes:
 *   Append to the system prompt string used in app/api/analyze/route.ts,
 *   app/api/analyze-free/route.ts, app/api/stack/route.ts, and
 *   app/api/stack-free/route.ts. Putting it last gives it recency
 *   priority — Claude is more likely to obey rules near the end of
 *   the system prompt.
 */
export const LANGUAGE_RULE = `

==== LANGUAGE OUTPUT RULE ====
Detect the language of the user's idea or query. Respond in THAT SAME LANGUAGE for all narrative text, section headers, labels, recommendations, and reasoning.

- Turkish input → Turkish output
- Spanish input → Spanish output
- French input → French output
- German input → German output
- English input → English output
- Any other language → respond in that language

Keep these as-is in their original form regardless of output language: brand names (Lovable, Bolt, Base44, Cursor, Supabase, etc.), product names, framework names, package names, file extensions, code snippets, URLs, and proper nouns generally.

If the response format is JSON: keep the JSON KEYS in English so our parsers can read them, but the VALUES (descriptions, narrative strings, recommendations, summaries) should be in the user's language.

If you cannot confidently identify the language (very short input, mixed languages, etc.), default to English.

This rule overrides any earlier instruction about output language.
==== END LANGUAGE OUTPUT RULE ====
`;
