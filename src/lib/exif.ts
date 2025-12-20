import exifr from "exifr"

import type { LatLng } from "@/lib/geo"

export async function extractGps(file: File): Promise<LatLng | null> {
  try {
    const gps = await exifr.gps(file)
    if (!gps || typeof gps.latitude !== "number" || typeof gps.longitude !== "number") {
      return null
    }
    return { lat: gps.latitude, lng: gps.longitude }
  } catch (error) {
    console.warn("Failed to read EXIF GPS data", error)
    return null
  }
}
