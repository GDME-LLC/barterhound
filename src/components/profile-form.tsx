'use client'

import { useActionState } from 'react'
import { saveProfileAction } from '@/app/dashboard/actions'
import { FormMessage } from '@/components/form-message'
import { FormSubmitButton } from '@/components/form-submit-button'
import type { Profile } from '@/types'

export function ProfileForm({
  profile,
}: {
  profile: Profile | null
}) {
  const [state, formAction] = useActionState(saveProfileAction, undefined)

  return (
    <form action={formAction} className="space-y-5 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-2xl font-semibold text-stone-900">
          {profile ? 'Edit profile' : 'Complete your profile'}
        </h2>
        <p className="mt-2 text-sm text-stone-500">
          Keep location approximate. City-level coordinates are enough for the MVP map.
        </p>
      </div>

      <FormMessage state={state} />

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm font-medium text-stone-700">
          Username
          <input name="username" defaultValue={profile?.username ?? ''} className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none transition focus:border-brand-500" required minLength={3} />
        </label>

        <label className="space-y-2 text-sm font-medium text-stone-700">
          Display name
          <input name="display_name" defaultValue={profile?.display_name ?? ''} className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none transition focus:border-brand-500" />
        </label>

        <label className="space-y-2 text-sm font-medium text-stone-700 md:col-span-2">
          Bio
          <textarea name="bio" defaultValue={profile?.bio ?? ''} className="min-h-28 w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none transition focus:border-brand-500" />
        </label>

        <label className="space-y-2 text-sm font-medium text-stone-700">
          City or neighborhood
          <input name="location_label" defaultValue={profile?.location_label ?? ''} className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none transition focus:border-brand-500" />
        </label>

        <label className="space-y-2 text-sm font-medium text-stone-700">
          Trade radius (km)
          <input name="trade_radius_km" type="number" min={1} max={500} defaultValue={profile?.trade_radius_km ?? 50} className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none transition focus:border-brand-500" />
        </label>

        <label className="space-y-2 text-sm font-medium text-stone-700">
          Latitude
          <input name="lat" type="number" step="0.0001" defaultValue={profile?.lat ?? ''} className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none transition focus:border-brand-500" />
        </label>

        <label className="space-y-2 text-sm font-medium text-stone-700">
          Longitude
          <input name="lng" type="number" step="0.0001" defaultValue={profile?.lng ?? ''} className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none transition focus:border-brand-500" />
        </label>

        <label className="space-y-2 text-sm font-medium text-stone-700 md:col-span-2">
          Avatar
          <input name="avatar" type="file" accept="image/*" className="w-full rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-4 py-3" />
        </label>
      </div>

      <input type="hidden" name="existing_avatar_url" value={profile?.avatar_url ?? ''} />

      <FormSubmitButton
        label="Save profile"
        pendingLabel="Saving profile..."
        className="rounded-full bg-brand-500 px-5 py-3 font-medium text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-brand-300"
      />
    </form>
  )
}
