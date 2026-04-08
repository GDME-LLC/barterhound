import { z } from 'zod'

export const listingValueSuggestionSchema = z.object({
  normalizedTitle: z.string().min(1),
  detectedBrand: z.string().min(1).nullable(),
  detectedModel: z.string().min(1).nullable(),
  estimatedLow: z.number().int().positive().nullable(),
  estimatedHigh: z.number().int().positive().nullable(),
  confidence: z.enum(['low', 'medium', 'high']),
  explanation: z.string().min(1),
  followUpQuestions: z.array(z.string().min(1)).default([]),
})

export type ListingValueSuggestion = z.infer<typeof listingValueSuggestionSchema>

