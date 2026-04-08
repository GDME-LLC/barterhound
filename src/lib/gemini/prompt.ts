import type { ListingCondition } from '@/types'

export type ListingValueSuggestionInput = {
  title: string
  description: string | null
  category: string
  condition: ListingCondition
  brand: string | null
  model: string | null
  quantity: number | null
  isBundle: boolean
  desiredCategories: string[] | null
  openToAnything: boolean
}

export function buildListingValuePrompt(input: ListingValueSuggestionInput) {
  const safe = {
    ...input,
    description: input.description?.slice(0, 1200) ?? null,
    title: input.title.slice(0, 140),
    brand: input.brand?.slice(0, 80) ?? null,
    model: input.model?.slice(0, 80) ?? null,
    desiredCategories: input.desiredCategories?.slice(0, 8) ?? null,
  }

  return [
    `You are helping a barter marketplace user estimate a FAIR TRADE VALUE range (not a resale price).`,
    `This is guidance only, used to help find fair trades. The user always decides.`,
    ``,
    `Rules:`,
    `- Output ONLY valid JSON (no markdown, no backticks, no commentary).`,
    `- Suggest a BROAD realistic range in USD whole dollars (integers).`,
    `- Never output hyper-specific numbers (no decimals).`,
    `- Do not invent details you were not given.`,
    `- If uncertain, set estimatedLow/estimatedHigh to null and use confidence "low", plus follow-up questions.`,
    `- Keep explanation concise (1-3 sentences).`,
    ``,
    `Required JSON shape:`,
    `{"normalizedTitle": string, "detectedBrand": string|null, "detectedModel": string|null, "estimatedLow": number|null, "estimatedHigh": number|null, "confidence": "low"|"medium"|"high", "explanation": string, "followUpQuestions": string[]}`,
    ``,
    `Item info (user-provided):`,
    JSON.stringify(safe),
  ].join('\n')
}

