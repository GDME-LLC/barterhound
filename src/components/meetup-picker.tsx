'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useActionState } from 'react'
import { saveMeetupLocationAction } from '@/app/trades/actions'
import { FormMessage } from '@/components/form-message'
import { FormSubmitButton } from '@/components/form-submit-button'

type MapboxPlace = {
  id: string
  place_name: string
  center: [number, number]
}

export function MeetupPicker({
  tradeId,
  token,
  initialLabel,
  initialLat,
  initialLng,
  disabled,
}: {
  tradeId: string
  token: string
  initialLabel?: string | null
  initialLat?: number | null
  initialLng?: number | null
  disabled?: boolean
}) {
  const mapRef = useRef<HTMLDivElement | null>(null)
  const instanceRef = useRef<mapboxgl.Map | null>(null)
  const markerRef = useRef<mapboxgl.Marker | null>(null)

  const [state, formAction] = useActionState(saveMeetupLocationAction, undefined)
  const [isPending, startTransition] = useTransition()

  const [query, setQuery] = useState(initialLabel ?? '')
  const [options, setOptions] = useState<MapboxPlace[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)

  const [label, setLabel] = useState(initialLabel ?? '')
  const [lat, setLat] = useState<number | null>(
    typeof initialLat === 'number' ? initialLat : null,
  )
  const [lng, setLng] = useState<number | null>(
    typeof initialLng === 'number' ? initialLng : null,
  )

  useEffect(() => {
    if (!mapRef.current || instanceRef.current) return

    mapboxgl.accessToken = token
    const map = new mapboxgl.Map({
      container: mapRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: typeof initialLng === 'number' && typeof initialLat === 'number' ? [initialLng, initialLat] : [-96, 37.8],
      zoom: typeof initialLng === 'number' && typeof initialLat === 'number' ? 11 : 3,
    })

    instanceRef.current = map

    function setMarker(nextLng: number, nextLat: number) {
      setLng(nextLng)
      setLat(nextLat)

      if (!markerRef.current) {
        markerRef.current = new mapboxgl.Marker({ color: '#f97316', draggable: true })
          .setLngLat([nextLng, nextLat])
          .addTo(map)

        markerRef.current.on('dragend', () => {
          const pos = markerRef.current?.getLngLat()
          if (!pos) return
          setLng(pos.lng)
          setLat(pos.lat)
        })
      } else {
        markerRef.current.setLngLat([nextLng, nextLat])
      }
    }

    if (typeof initialLng === 'number' && typeof initialLat === 'number') {
      setMarker(initialLng, initialLat)
    }

    map.on('click', (event) => {
      const nextLng = event.lngLat.lng
      const nextLat = event.lngLat.lat
      setMarker(nextLng, nextLat)

      // Reverse geocode to a human label when possible.
      fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          `${nextLng},${nextLat}`,
        )}.json?types=poi,address,place,locality,neighborhood&limit=1&access_token=${encodeURIComponent(token)}`,
      )
        .then(async (res) => {
          if (!res.ok) return null
          return res.json()
        })
        .then((data) => {
          const place = data?.features?.[0]?.place_name
          if (typeof place === 'string' && place.trim()) {
            setLabel(place)
            setQuery(place)
            setOptions([])
          }
        })
        .catch(() => {})
    })

    return () => {
      map.remove()
      instanceRef.current = null
      markerRef.current = null
    }
  }, [initialLat, initialLng, token])

  useEffect(() => {
    const q = query.trim()
    setSearchError(null)

    if (!token) {
      setOptions([])
      return
    }

    if (q.length < 3) {
      setOptions([])
      return
    }

    setSearchLoading(true)
    const controller = new AbortController()
    const timeout = setTimeout(() => {
      fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          q,
        )}.json?types=poi,address,place,locality,neighborhood&limit=5&access_token=${encodeURIComponent(
          token,
        )}`,
        { signal: controller.signal },
      )
        .then(async (res) => {
          if (!res.ok) throw new Error(`Search failed (${res.status})`)
          return res.json()
        })
        .then((data) => {
          const features = Array.isArray(data?.features) ? (data.features as MapboxPlace[]) : []
          setOptions(features)
        })
        .catch((error) => {
          if (error?.name === 'AbortError') return
          setOptions([])
          setSearchError(error instanceof Error ? error.message : 'Unable to search locations.')
        })
        .finally(() => {
          setSearchLoading(false)
        })
    }, 250)

    return () => {
      clearTimeout(timeout)
      controller.abort()
    }
  }, [query, token])

  function choosePlace(place: MapboxPlace) {
    const nextLng = place.center?.[0]
    const nextLat = place.center?.[1]
    if (typeof nextLng !== 'number' || typeof nextLat !== 'number') return

    setLabel(place.place_name)
    setQuery(place.place_name)
    setOptions([])
    setLng(nextLng)
    setLat(nextLat)

    const map = instanceRef.current
    if (map) {
      map.flyTo({ center: [nextLng, nextLat], zoom: Math.max(map.getZoom(), 12) })
      if (!markerRef.current) {
        markerRef.current = new mapboxgl.Marker({ color: '#f97316', draggable: true })
          .setLngLat([nextLng, nextLat])
          .addTo(map)
        markerRef.current.on('dragend', () => {
          const pos = markerRef.current?.getLngLat()
          if (!pos) return
          setLng(pos.lng)
          setLat(pos.lat)
        })
      } else {
        markerRef.current.setLngLat([nextLng, nextLat])
      }
    }
  }

  return (
    <form
      action={(formData) => {
        // Ensure we submit the latest client-side state values.
        formData.set('meetup_location', label)
        formData.set('meetup_lat', lat == null ? '' : String(lat))
        formData.set('meetup_lng', lng == null ? '' : String(lng))
        startTransition(() => formAction(formData))
      }}
      className="space-y-4 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm"
    >
      <div>
        <h2 className="text-lg font-semibold text-stone-900">Meetup spot</h2>
        <p className="mt-1 text-sm text-stone-500">
          Search landmarks or tap the map to drop a pin. This stores an approximate location, not an exact address requirement.
        </p>
      </div>

      <FormMessage state={state} />

      <input type="hidden" name="trade_id" value={tradeId} />
      <input type="hidden" name="meetup_location" value={label} readOnly />
      <input type="hidden" name="meetup_lat" value={lat == null ? '' : String(lat)} readOnly />
      <input type="hidden" name="meetup_lng" value={lng == null ? '' : String(lng)} readOnly />

      <label className="space-y-2 text-sm font-medium text-stone-700">
        Search (landmark, address, keyword)
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="e.g. Tom's West Bay, Acme Shell Station"
          className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none transition focus:border-brand-500"
          disabled={disabled}
        />
      </label>

      {searchLoading ? <p className="text-xs text-stone-500">Searching…</p> : null}
      {searchError ? <p className="text-xs text-rose-700">{searchError}</p> : null}

      {options.length > 0 ? (
        <div className="grid gap-2">
          {options.map((option) => (
            <button
              key={option.id}
              type="button"
              className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-left text-sm font-medium text-stone-700 transition hover:border-brand-300 hover:text-brand-700"
              onClick={() => choosePlace(option)}
              disabled={disabled}
            >
              {option.place_name}
            </button>
          ))}
        </div>
      ) : null}

      <div
        ref={mapRef}
        className="h-[320px] w-full overflow-hidden rounded-[2rem] border border-stone-200 sm:h-[420px]"
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-stone-600">
          {label ? (
            <p className="font-medium text-stone-900">{label}</p>
          ) : (
            <p className="text-stone-500">No meetup spot selected yet.</p>
          )}
          {lat != null && lng != null ? (
            <p className="mt-1 text-xs text-stone-500">
              Pin: {lat.toFixed(5)}, {lng.toFixed(5)}
            </p>
          ) : null}
        </div>

        <FormSubmitButton
          label="Save meetup spot"
          pendingLabel="Saving…"
          className="rounded-full bg-brand-500 px-5 py-2.5 font-medium text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-brand-300 sm:py-3"
          disabled={disabled || isPending}
        />
      </div>
    </form>
  )
}

