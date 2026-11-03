import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, MapPin, Target } from 'lucide-react'
import * as L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useInView } from '../../hooks'
import { REGIONS, resolveRegions } from '../../homeContent'
import type { HomeRegion } from '../../homeContent'
import type { SiteContent } from '../../api'
import { AccentHeading } from './AccentHeading'
import { StatFigure } from './StatFigure'

type Props = {
  content: SiteContent
  go: (id: string) => void
}

const COMPANY_LOCATION: [number, number] = [-8.895108, 33.440568]
const COMPANY_ICON = L.divIcon({
  className: 'lishelab-hq-icon',
  html: '<span class="lishelab-hq-marker"><span>HQ</span></span>',
  iconSize: [42, 42],
  iconAnchor: [21, 41],
  popupAnchor: [0, -40],
})
const USER_ICON = L.divIcon({
  className: 'lishelab-user-icon',
  html: '<span class="lishelab-user-marker" aria-hidden="true"></span>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
})

export function RegionsSection({ content, go }: Props) {
  const regions = resolveRegions(content)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [ref, inView] = useInView<HTMLElement>(0.2)
  const [locating, setLocating] = useState(true)
  const mapRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const userMarkerRef = useRef<L.Marker | null>(null)
  const companyMarkerRef = useRef<L.Marker | null>(null)

  const active: HomeRegion | null = regions.find((region) => region.id === activeId) ?? regions[0] ?? null

  const mappableRegions = regions.filter(
    (r) => r.lat != null && r.lng != null
  )

  // Initialise the Leaflet map once the container exists.
  useEffect(() => {
    if (!mapRef.current || typeof L === 'undefined') return

    const map = L.map(mapRef.current).setView(COMPANY_LOCATION, 8)
    L.control.zoom({ position: 'bottomright' }).addTo(map)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
    }).addTo(map)

    companyMarkerRef.current = L.marker(COMPANY_LOCATION, {
      title: 'Lishe Lab HQ',
      icon: COMPANY_ICON,
      zIndexOffset: 1000,
    })
      .addTo(map)
      .bindPopup('Lishe Lab HQ')

    mapInstanceRef.current = map

    // Try GPS on mount; fall back to company location.
    if ('geolocation' in navigator) {
      window.setTimeout(() => setLocating(true), 0)
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (mapInstanceRef.current !== map) return
          const [lat, lng] = [position.coords.latitude, position.coords.longitude]
          map.setView([lat, lng], 12)
          if (userMarkerRef.current) map.removeLayer(userMarkerRef.current)
          userMarkerRef.current = L.marker([lat, lng], {
            title: 'Your location',
            icon: USER_ICON,
          }).addTo(map).bindPopup('Your current location').openPopup()
          window.setTimeout(() => setLocating(false), 0)
        },
        () => {
          if (mapInstanceRef.current !== map) return
          map.setView(COMPANY_LOCATION, 8)
          window.setTimeout(() => setLocating(false), 0)
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 },
      )
    } else {
      map.setView(COMPANY_LOCATION, 8)
      window.setTimeout(() => setLocating(false), 0)
    }

    return () => {
      map.remove()
      mapInstanceRef.current = null
      userMarkerRef.current = null
      companyMarkerRef.current = null
    }
  }, [])

  // Add/update region markers whenever regions change.
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || typeof L === 'undefined') return

    // Remove existing region markers (keep user marker).
    map.eachLayer((layer: L.Layer) => {
      const layerWithMarker = layer as L.Layer & { options?: { isRegionMarker?: boolean } }
      if (layerWithMarker.options?.isRegionMarker) map.removeLayer(layer)
    })

    mappableRegions.forEach((region) => {
      const regionMarker = L.marker([region.lat!, region.lng!], {
        title: region.name,
      }) as L.Marker & { options: L.MarkerOptions & { isRegionMarker?: boolean } }

      regionMarker.options.isRegionMarker = true
      regionMarker.addTo(map).bindPopup(
        `<strong>${region.name}</strong><br>${region.description}<br><em>${Math.max(1, region.initiatives)} initiatives</em>`
      )
    })

    return () => {
      map.eachLayer((layer: L.Layer) => {
        const layerWithMarker = layer as L.Layer & { options?: { isRegionMarker?: boolean } }
        if (layerWithMarker.options?.isRegionMarker) map.removeLayer(layer)
      })
    }
  }, [mappableRegions])

  const centerMyLocation = () => {
    const map = mapInstanceRef.current
    if (!map || !('geolocation' in navigator)) return
    window.setTimeout(() => setLocating(true), 0)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (mapInstanceRef.current !== map) return
        const [lat, lng] = [position.coords.latitude, position.coords.longitude]
        map.setView([lat, lng], 12)
        if (userMarkerRef.current) map.removeLayer(userMarkerRef.current)
        userMarkerRef.current = L.marker([lat, lng], {
          title: 'Your location',
          icon: USER_ICON,
        }).addTo(map).bindPopup('Your current location').openPopup()
        window.setTimeout(() => setLocating(false), 0)
      },
      () => {
        if (mapInstanceRef.current !== map) return
        window.setTimeout(() => setLocating(false), 0)
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 },
    )
  }

  const centerCompany = () => {
    const map = mapInstanceRef.current
    if (!map) return
    map.setView(COMPANY_LOCATION, 13)
    companyMarkerRef.current?.openPopup()
    if (userMarkerRef.current) {
      map.removeLayer(userMarkerRef.current)
      userMarkerRef.current = null
    }
  }

  const goToRegion = (region: HomeRegion) => {
    const map = mapInstanceRef.current
    if (!map || region.lat == null || region.lng == null) return
    setActiveId(region.id)
    map.setView([region.lat, region.lng], 11)
    if (userMarkerRef.current) {
      map.removeLayer(userMarkerRef.current)
      userMarkerRef.current = null
    }
  }

  return (
    <section className="section home-regions reveal" ref={ref}>
      <div className="home-regions-head">
        <div>
          <span className="section-kicker">{REGIONS.eyebrow}</span>
          <AccentHeading lines={REGIONS.heading} className="home-regions-title" />
        </div>
        <p>{REGIONS.description}</p>
      </div>

      <div className="home-regions-body">
        <div className="home-map">
          <div className="home-map-stage">
            <div
              className="map-photo"
              ref={mapRef}
              style={{ height: '100%', width: '100%' }}
            />
          </div>
        </div>

        <aside className="home-region-panel" aria-live="polite">
          {active ? (
            <>
              <span className="tag">
                <MapPin size={13} /> {active.name}
              </span>

              <ul className="home-region-focus">
                {(active.focus.length > 0 ? active.focus : REGIONS.allFocus).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>

              <div className="home-region-stat">
                <strong>
                  <StatFigure
                    stat={{
                      id: active.id,
                      value: Math.max(1, active.initiatives),
                      suffix: '',
                      label: 'initiatives',
                      source: 'database',
                    }}
                    play={inView}
                  />
                </strong>
                <span>active initiatives</span>
              </div>

              <p>{active.description}</p>

              <button className="button button--green" onClick={() => go('contact')}>
                {REGIONS.partner} <ArrowUpRight size={16} />
              </button>
              <button
                className="button"
                onClick={centerMyLocation}
                disabled={locating}
              >
                {locating ? 'Locating…' : <Target size={16} />}
                {!locating && 'Current location'}
              </button>
              <button className="button" onClick={centerCompany}>
                <MapPin size={16} /> Lishe Lab HQ
              </button>
            </>
          ) : (
            <p>{REGIONS.description}</p>
          )}
        </aside>
      </div>

      <div className="home-region-legend">
        <Target size={15} />
        {mappableRegions.map((region, index) => (
          <button
            type="button"
            key={region.id}
            className={active?.id === region.id ? 'is-active' : ''}
            onMouseEnter={() => setActiveId(region.id)}
            onFocus={() => setActiveId(region.id)}
            onClick={() => goToRegion(region)}
          >
            <span>{`0${index + 1}`}</span>
            {region.name}
          </button>
        ))}
      </div>
    </section>
  )
}
