'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { saveProfileAction } from '@/app/dashboard/actions'
import { FormMessage } from '@/components/form-message'
import { FormSubmitButton } from '@/components/form-submit-button'
import { createClient as createBrowserSupabaseClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'

export function ProfileForm({
  profile,
  userId,
}: {
  profile: Profile | null
  userId: string
}) {
  const [state, formAction] = useActionState(saveProfileAction, undefined)
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null)
  const [avatarFileError, setAvatarFileError] = useState<string | null>(null)
  const [avatarUploadError, setAvatarUploadError] = useState<string | null>(null)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const formRef = useRef<HTMLFormElement | null>(null)
  const avatarInputRef = useRef<HTMLInputElement | null>(null)
  const uploadedAvatarUrlRef = useRef<HTMLInputElement | null>(null)
  const didUploadRef = useRef(false)

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) {
        URL.revokeObjectURL(avatarPreviewUrl)
      }
    }
  }, [avatarPreviewUrl])

  async function uploadAvatarIfNeeded() {
    const input = avatarInputRef.current
    const urlField = uploadedAvatarUrlRef.current

    if (!input || !urlField) return { ok: true as const }
    if (didUploadRef.current) return { ok: true as const }

    const file = input.files?.[0]
    if (!file || file.size === 0) return { ok: true as const }

    const maxAvatarBytes = 10 * 1024 * 1024 // 10MB
    if (file.size > maxAvatarBytes) {
      return { ok: false as const, error: 'Selected avatar is too large. Please use an image under 10MB.' }
    }

    const supabase = createBrowserSupabaseClient()
    if (!supabase) {
      return { ok: false as const, error: 'Supabase is not configured.' }
    }

    setIsUploadingAvatar(true)
    setAvatarUploadError(null)

    try {
      const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const storagePath = `${userId}/avatar-${Date.now()}.${extension}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(storagePath, file, { contentType: file.type || 'image/jpeg', upsert: true })

      if (uploadError) {
        throw new Error(uploadError.message)
      }

      const { data } = supabase.storage.from('avatars').getPublicUrl(storagePath)
      urlField.value = data.publicUrl

      didUploadRef.current = true
      input.disabled = true

      return { ok: true as const }
    } catch (error) {
      return { ok: false as const, error: error instanceof Error ? error.message : 'Avatar upload failed.' }
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      className="space-y-5 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm"
      onSubmit={(event) => {
        if (didUploadRef.current) return
        if (avatarFileError) return

        const file = avatarInputRef.current?.files?.[0]
        if (!file) return

        event.preventDefault()

        uploadAvatarIfNeeded().then((result) => {
          if (!result.ok) {
            setAvatarUploadError(result.error)
            return
          }
          formRef.current?.requestSubmit()
        })
      }}
    >
      <div>
        <h2 className="text-2xl font-semibold text-stone-900">
          {profile ? 'Edit profile' : 'Complete your profile'}
        </h2>
        <p className="mt-2 text-sm text-stone-500">
          Keep location approximate. City-level coordinates are enough for the MVP map.
        </p>
      </div>

      <FormMessage state={state} />
      {avatarUploadError ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {avatarUploadError}
        </p>
      ) : null}

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
          <input
            ref={avatarInputRef}
            name="avatar"
            type="file"
            accept="image/*"
            disabled={isUploadingAvatar}
            onChange={(event) => {
              const file = event.currentTarget.files?.[0]
              const maxAvatarBytes = 10 * 1024 * 1024 // 10MB
              if (file && file.size > maxAvatarBytes) {
                setAvatarFileError('Selected avatar is too large. Please use an image under 10MB.')
              } else {
                setAvatarFileError(null)
              }
              setAvatarPreviewUrl((current) => {
                if (current) URL.revokeObjectURL(current)
                return file ? URL.createObjectURL(file) : null
              })
            }}
            className="w-full rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-4 py-3"
          />
          {avatarFileError ? (
            <span className="block text-xs font-normal text-rose-700">{avatarFileError}</span>
          ) : (
            <span className="block text-xs font-normal text-stone-500">
              Tip: smaller avatars upload faster and fail less often.
            </span>
          )}
        </label>
      </div>

      <input type="hidden" name="existing_avatar_url" value={profile?.avatar_url ?? ''} />
      <input ref={uploadedAvatarUrlRef} type="hidden" name="uploaded_avatar_url" defaultValue="" />

      {avatarPreviewUrl ? (
        <div className="rounded-3xl border border-stone-200 bg-stone-50 p-4">
          <p className="text-sm font-medium text-stone-800">Selected avatar</p>
          <Image
            src={avatarPreviewUrl}
            alt="Selected avatar preview"
            width={96}
            height={96}
            unoptimized
            className="mt-3 h-24 w-24 rounded-3xl object-cover"
          />
        </div>
      ) : profile?.avatar_url ? (
        <div className="rounded-3xl border border-stone-200 bg-stone-50 p-4">
          <p className="text-sm font-medium text-stone-800">Current avatar</p>
          <Image
            src={profile.avatar_url}
            alt={profile.username}
            width={96}
            height={96}
            className="mt-3 h-24 w-24 rounded-3xl object-cover"
          />
        </div>
      ) : null}

      <FormSubmitButton
        label="Save profile"
        pendingLabel="Saving profile..."
        className="rounded-full bg-brand-500 px-5 py-3 font-medium text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-brand-300"
      />
    </form>
  )
}
