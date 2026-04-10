import crypto from 'node:crypto'
import { getGeminiClient, getGeminiModelName } from '@/lib/gemini/client'
import { buildListingValuePrompt, type ListingValueSuggestionInput } from '@/lib/gemini/prompt'
import {
  listingValueSuggestionSchema,
  type ListingValueSuggestion,
} from '@/lib/gemini/schema'

export function fingerprintListingValueInput(input: ListingValueSuggestionInput) {
  // Stable fingerprint to avoid re-calling the model for identical inputs.
  // Note: This is not a security boundary; it is only used for cost control.
  const payload = JSON.stringify({
    title: input.title.trim(),
    description: input.description?.trim() ?? '',
    category: input.category,
    condition: input.condition,
    brand: input.brand?.trim() ?? '',
    model: input.model?.trim() ?? '',
    quantity: input.quantity ?? null,
    isBundle: input.isBundle,
    desiredCategories: input.desiredCategories ?? null,
    openToAnything: input.openToAnything,
  })

  return crypto.createHash('sha256').update(payload).digest('hex')
}

function extractFirstJsonObject(text: string) {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('AI returned an unexpected response.')
  }
  return text.slice(start, end + 1)
}

export async function suggestListingValue(input: ListingValueSuggestionInput): Promise<{
  suggestion: ListingValueSuggestion
  fingerprint: string
}> {
  const client = getGeminiClient()
  const preferredModel = getGeminiModelName()
  const fingerprint = fingerprintListingValueInput(input)
  const prompt = buildListingValuePrompt(input)

  const modelCandidates = Array.from(
    new Set([
      preferredModel,
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'models/gemini-2.5-flash',
      'models/gemini-2.0-flash',
    ]),
  )

  let lastError: unknown = null
  let response: { text?: string } | null = null

  for (const model of modelCandidates) {
    try {
      response = await client.models.generateContent({
        model,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          temperature: 0.2,
          maxOutputTokens: 600,
        },
      })
      break
    } catch (error) {
      lastError = error
    }
  }

  if (!response) {
    throw lastError instanceof Error ? lastError : new Error('Unable to generate suggestion.')
  }

  const rawText = response.text ?? ''
  const jsonText = extractFirstJsonObject(rawText)
  const parsed = listingValueSuggestionSchema.safeParse(JSON.parse(jsonText))

  if (!parsed.success) {
    throw new Error('AI returned a malformed response.')
  }

  const suggestion = parsed.data

  // If the model provided only one bound, treat it as low confidence and request clarification.
  if ((suggestion.estimatedLow === null) !== (suggestion.estimatedHigh === null)) {
    return {
      suggestion: {
        ...suggestion,
        estimatedLow: null,
        estimatedHigh: null,
        confidence: 'low',
        followUpQuestions: suggestion.followUpQuestions.length
          ? suggestion.followUpQuestions
          : ['What condition issues or included accessories should we consider?'],
      },
      fingerprint,
    }
  }

  // Ensure low <= high when both exist.
  if (
    suggestion.estimatedLow !== null &&
    suggestion.estimatedHigh !== null &&
    suggestion.estimatedLow > suggestion.estimatedHigh
  ) {
    return {
      suggestion: {
        ...suggestion,
        estimatedLow: suggestion.estimatedHigh,
        estimatedHigh: suggestion.estimatedLow,
        confidence: 'low',
      },
      fingerprint,
    }
  }

  return { suggestion, fingerprint }
}
