'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireUser } from '@/lib/auth'
import {
  optionalString,
  parseFloatValue,
  parseInteger,
  requireString,
  type ActionState,
} from '@/lib/validation'

export async function saveProfileAction(
  _previousState: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  try {
    const { supabase, user } = await requireUser()
    const username = requireString(formData, 'username', 'Username', 3)
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .slice(0, 24)
    const displayName = optionalString(formData, 'display_name')
    const bio = optionalString(formData, 'bio')
    const locationLabel = optionalString(formData, 'location_label')
    const lat = parseFloatValue(formData, 'lat', 'Latitude', {
      min: -90,
      max: 90,
      required: false,
    })
    const lng = parseFloatValue(formData, 'lng', 'Longitude', {
      min: -180,
      max: 180,
      required: false,
    })
    const tradeRadiusKm = parseInteger(formData, 'trade_radius_km', 'Trade radius', {
      min: 1,
      max: 500,
    })

    let avatarUrl = optionalString(formData, 'existing_avatar_url')
    const avatar = formData.get('avatar')

    if (avatar instanceof File && avatar.size > 0) {
      const maxAvatarBytes = 4 * 1024 * 1024 // 4MB
      if (avatar.size > maxAvatarBytes) {
        throw new Error('Avatar image is too large. Please use an image under 4MB.')
      }

      const admin = createAdminClient()

      if (!admin) {
        throw new Error('Avatar uploads require SUPABASE_SERVICE_ROLE_KEY.')
      }

      const extension = avatar.name.split('.').pop()?.toLowerCase() || 'jpg'
      const storagePath = `${user.id}/avatar-${Date.now()}.${extension}`
      const bytes = new Uint8Array(await avatar.arrayBuffer())

      const { error: uploadError } = await admin.storage
        .from('avatars')
        .upload(storagePath, bytes, {
          contentType: avatar.type || 'image/jpeg',
          upsert: true,
        })

      if (uploadError) {
        throw new Error(uploadError.message)
      }

      const { data } = admin.storage.from('avatars').getPublicUrl(storagePath)
      avatarUrl = data.publicUrl
    }

    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      username,
      display_name: displayName,
      bio,
      avatar_url: avatarUrl,
      location_label: locationLabel,
      lat,
      lng,
      trade_radius_km: tradeRadiusKm,
    })

    if (error) {
      throw new Error(error.message)
    }

    revalidatePath('/dashboard')
    revalidatePath(`/profile/${user.id}`)

    return { success: 'Profile saved.' }
  } catch (error) {
    console.error('saveProfileAction failed', error)
    return {
      error: error instanceof Error ? error.message : 'Unable to save profile.',
    }
  }
}
