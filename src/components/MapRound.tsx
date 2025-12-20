import { useEffect, useMemo, useRef, useState } from "react"
import GoogleMapReact from "google-map-react"

import type { LatLng } from "@/lib/geo"

type MapRoundProps = {
  apiKey?: string
  guess?: LatLng | null
  actual?: LatLng | null
  reveal: boolean
  onGuess: (point: LatLng) => void
}

type GoogleMapsRefs = {
  map: google.maps.Map
  maps: typeof google.maps
}

const MapMarker = ({
  label,
  variant,
}: {
  label: string
  variant: "guess" | "actual"
  lat?: number
  lng?: number
}) => {
  const styles =
    variant === "actual"
      ? "bg-primary text-primary-foreground ring-primary/30"
      : "bg-accent text-accent-foreground ring-accent/50"

  return (
    <div className="relative -translate-x-1/2 -translate-y-1/2">
      <div className={`flex h-5 w-5 items-center justify-center rounded-full ring-8 ${styles}`}>
        <div className="h-2 w-2 rounded-full bg-white/80" />
      </div>
      <div className="mt-1 whitespace-nowrap rounded-full bg-background/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-foreground shadow">
        {label}
      </div>
    </div>
  )
}

export default function MapRound({ apiKey, guess, actual, reveal, onGuess }: MapRoundProps) {
  const [mapsReady, setMapsReady] = useState(false)
  const mapRef = useRef<GoogleMapsRefs | null>(null)
  const lineRef = useRef<google.maps.Polyline | null>(null)

  const defaultCenter = useMemo<LatLng>(() => {
    return actual ?? guess ?? { lat: 20, lng: 0 }
  }, [actual, guess])

  const defaultZoom = actual || guess ? 6 : 2

  useEffect(() => {
    if (!mapsReady || !mapRef.current) {
      return
    }

    if (lineRef.current) {
      lineRef.current.setMap(null)
      lineRef.current = null
    }

    if (reveal && actual && guess) {
      const { map, maps } = mapRef.current
      lineRef.current = new maps.Polyline({
        path: [guess, actual],
        geodesic: true,
        strokeColor: "#2563eb",
        strokeOpacity: 0.85,
        strokeWeight: 3,
      })
      lineRef.current.setMap(map)

      const bounds = new maps.LatLngBounds()
      bounds.extend(guess)
      bounds.extend(actual)
      map.fitBounds(bounds, 64)
    }
  }, [mapsReady, reveal, actual, guess])

  if (!apiKey) {
    return (
      <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-muted/40 p-6 text-center">
        <span className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Map Disabled
        </span>
        <p className="max-w-xs text-sm text-muted-foreground">
          Add a Google Maps API key to enable guessing. Set{" "}
          <span className="font-semibold text-foreground">GOOGLE_MAPS_API_KEY</span> in your
          environment.
        </p>
      </div>
    )
  }

  return (
    <div className="relative h-full min-h-[320px] overflow-hidden rounded-2xl border border-border">
      <GoogleMapReact
        bootstrapURLKeys={{ key: apiKey }}
        defaultCenter={defaultCenter}
        defaultZoom={defaultZoom}
        yesIWantToUseGoogleMapApiInternals
        onGoogleApiLoaded={({ map, maps }) => {
          mapRef.current = { map, maps }
          setMapsReady(true)
        }}
        onClick={({ lat, lng }) => {
          if (!reveal) {
            onGuess({ lat, lng })
          }
        }}
        options={{
          fullscreenControl: false,
          mapTypeControl: false,
          streetViewControl: false,
          gestureHandling: "greedy",
        }}
      >
        {guess && <MapMarker lat={guess.lat} lng={guess.lng} label="Your guess" variant="guess" />}
        {reveal && actual && (
          <MapMarker lat={actual.lat} lng={actual.lng} label="Actual" variant="actual" />
        )}
      </GoogleMapReact>

      {!reveal && (
        <div className="pointer-events-none absolute left-4 top-4 rounded-full bg-background/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground shadow">
          Drop a pin
        </div>
      )}
    </div>
  )
}
