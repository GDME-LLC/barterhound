import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { suggestListingValue } from '@/lib/gemini/suggest'
import { z } from 'zod'

const requestSchema = z.object({
  title: z.string().min(3),
  description: z.string().nullish(),
  category: z.string().min(1),
  condition: z.enum(['new', 'like_new', 'good', 'fair', 'poor']),
  brand: z.string().nullish(),
  model: z.string().nullish(),
  quantity: z.number().int().min(1).max(99).nullish(),
  isBundle: z.boolean(),
  desiredCategories: z.array(z.string()).nullish(),
  openToAnything: z.boolean(),
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase is not configured.' }, { status: 500 })
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle()

    if (!profile) {
      return NextResponse.json({ error: 'Complete your profile first.' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = requestSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request.' },
        { status: 400 },
      )
    }

    const { suggestion, fingerprint } = await suggestListingValue({
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      category: parsed.data.category,
      condition: parsed.data.condition,
      brand: parsed.data.brand ?? null,
      model: parsed.data.model ?? null,
      quantity: parsed.data.quantity ?? null,
      isBundle: parsed.data.isBundle,
      desiredCategories: parsed.data.desiredCategories ?? null,
      openToAnything: parsed.data.openToAnything,
    })

    return NextResponse.json({ suggestion, fingerprint })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to generate suggestion.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
