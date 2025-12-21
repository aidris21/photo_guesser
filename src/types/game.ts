import type { LatLng } from "@/lib/geo"

export type UploadImage = {
  id: string
  name: string
  file: File
  url: string
  gps: LatLng | null
}

export type GameRound = {
  id: string
  image: UploadImage
  guess: LatLng | null
  distanceKm: number | null
  score: number | null
}

export type Stage = "setup" | "guess" | "result" | "complete"
export type RoundOrder = "upload" | "random"
