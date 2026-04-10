'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

type MapListing = {
  id: string
  title: string
  location_label: string | null
  estimated_value: number
  lat: number | null
  lng: number | null
}

export function ListingMap({
  listings,
  token,
}: {
  listings: MapListing[]
  token: string
}) {
  const mapRef = useRef<HTMLDivElement | null>(null)
  const instanceRef = useRef<mapboxgl.Map | null>(null)

  useEffect(() => {
    if (!mapRef.current || instanceRef.current) {
      return
    }

    mapboxgl.accessToken = token
    const map = new mapboxgl.Map({
      container: mapRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-96, 37.8],
      zoom: 3,
    })

    instanceRef.current = map

    const bounds = new mapboxgl.LngLatBounds()

    listings
      .filter((listing) => typeof listing.lng === 'number' && typeof listing.lat === 'number')
      .forEach((listing) => {
        const popupHtml = `
          <div style="min-width: 180px;">
            <strong>${listing.title}</strong><br />
            <span>${listing.location_label ?? 'Location pending'}</span><br />
            <a href="/listings/${listing.id}" style="color:#ea580c;font-weight:600;">Open listing</a>
          </div>
        `

        new mapboxgl.Marker({ color: '#f97316' })
          .setLngLat([listing.lng!, listing.lat!])
          .setPopup(new mapboxgl.Popup({ offset: 16 }).setHTML(popupHtml))
          .addTo(map)

        bounds.extend([listing.lng!, listing.lat!])
      })

    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, { padding: 48, maxZoom: 11 })
    }

    return () => {
      map.remove()
      instanceRef.current = null
    }
  }, [listings, token])

  return (
    <div className="space-y-4">
      <div
        ref={mapRef}
        className="h-[360px] w-full overflow-hidden rounded-[2rem] border border-stone-200 sm:h-[480px]"
      />
      <div className="flex flex-wrap gap-3">
        {listings.slice(0, 6).map((listing) => (
          <Link
            key={listing.id}
            href={`/listings/${listing.id}`}
            className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm text-stone-700 transition hover:border-brand-300 hover:text-brand-700"
          >
            {listing.title}
          </Link>
        ))}
      </div>
    </div>
  )
}
