export type LatLng = {
  lat: number
  lng: number
}

const EARTH_RADIUS_KM = 6371

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

export function scoreGuess(distanceKm: number) {
  const raw = 5000 * Math.exp(-distanceKm / 2000)
  return Math.max(0, Math.min(5000, Math.round(raw)))
}

export function formatDistance(distanceKm: number) {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`
  }
  return `${distanceKm.toFixed(1)} km`
}
