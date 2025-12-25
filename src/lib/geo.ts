export type LatLng = {
  lat: number
  lng: number
}

export type ScoreScale = "city" | "state" | "country"

const EARTH_RADIUS_KM = 6371
// Tuned for city-level accuracy expectations.
const MAX_SCORE = 5000
const SCORE_PROFILES: Record<ScoreScale, { scaleKm: number; falloff: number }> = {
  city: { scaleKm: 12, falloff: 1.6 },
  state: { scaleKm: 220, falloff: 1.4 },
  country: { scaleKm: 900, falloff: 1.2 },
}

function toRadians(deg: number) {
  return (deg * Math.PI) / 180
}

export function haversineKm(a: LatLng, b: LatLng) {
  const dLat = toRadians(b.lat - a.lat)
  const dLng = toRadians(b.lng - a.lng)
  const lat1 = toRadians(a.lat)
  const lat2 = toRadians(b.lat)

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h))
}

export function scoreGuess(distanceKm: number, scale: ScoreScale = "city") {
  const profile = SCORE_PROFILES[scale]
  const normalized = (distanceKm / profile.scaleKm) ** profile.falloff
  const raw = MAX_SCORE / (1 + normalized)
  return Math.max(0, Math.min(MAX_SCORE, Math.round(raw)))
}

export function formatDistance(distanceKm: number) {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`
  }
  return `${distanceKm.toFixed(1)} km`
}
