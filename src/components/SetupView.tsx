import { useRef, useState } from "react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { ScoreScale } from "@/lib/geo"
import { RoundOrder } from "@/types/game"
import type { UploadImage } from "@/types/game"

type SetupViewProps = {
  uploads: UploadImage[]
  playableUploads: UploadImage[]
  excludedUploads: UploadImage[]
  isParsing: boolean
  roundOrder: RoundOrder
  scoreScale: ScoreScale
  googleMapsApiKey?: string
  onFiles: (files: File[]) => void
  onRoundOrderChange: (order: RoundOrder) => void
  onScoreScaleChange: (scale: ScoreScale) => void
  onStart: () => void
  onReset: () => void
}

export default function SetupView({
  uploads,
  playableUploads,
  excludedUploads,
  isParsing,
  roundOrder,
  scoreScale,
  googleMapsApiKey,
  onFiles,
  onRoundOrderChange,
  onScoreScaleChange,
  onStart,
  onReset,
}: SetupViewProps) {
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const scoreOptions: Record<ScoreScale, { label: string; description: string }> = {
    [ScoreScale.City]: { label: "City scale", description: "Best for close memories within a metro area." },
    [ScoreScale.State]: { label: "State scale", description: "A forgiving midpoint for regions and road trips." },
    [ScoreScale.Country]: { label: "Country scale", description: "Loose scoring for big, cross-country spreads." },
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <Card className="border-border/60 bg-white/70 shadow-sm backdrop-blur">
        <CardHeader>
          <CardTitle>Upload your photo set</CardTitle>
          <CardDescription>We’ll scan EXIF data to find GPS coordinates for each image.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <label
            className={`flex min-h-[13.75rem] cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed p-6 text-center transition ${
              dragActive ? "border-primary bg-primary/10" : "border-border/70 bg-muted/30"
            }`}
            onDragEnter={(event) => {
              event.preventDefault()
              setDragActive(true)
            }}
            onDragOver={(event) => {
              event.preventDefault()
            }}
            onDragLeave={(event) => {
              event.preventDefault()
              setDragActive(false)
            }}
            onDrop={(event) => {
              event.preventDefault()
              setDragActive(false)
              if (event.dataTransfer?.files) {
                onFiles(Array.from(event.dataTransfer.files))
              }
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(event) => {
                if (event.target.files) {
                  onFiles(Array.from(event.target.files))
                }
              }}
            />
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
              <span className="text-2xl">📍</span>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">
                Drop your images here or click to browse
              </p>
              <p className="text-xs text-muted-foreground">
                JPEGs with GPS data work best. We never upload your files.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={(event) => {
                event.preventDefault()
                fileInputRef.current?.click()
              }}
            >
              Choose files
            </Button>
          </label>

          {isParsing && (
            <Alert>
              <AlertTitle>Scanning metadata</AlertTitle>
              <AlertDescription>Parsing EXIF data to locate GPS info.</AlertDescription>
            </Alert>
          )}

          {uploads.length > 0 && (
            <div className="rounded-2xl border border-border/70 bg-white/70 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">{uploads.length} images loaded</p>
                  <p className="text-xs text-muted-foreground">
                    {playableUploads.length} usable for gameplay
                  </p>
                </div>
                <Button variant="ghost" onClick={onReset}>
                  Clear
                </Button>
              </div>
              <Separator className="my-3" />
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                {uploads.map((image) => (
                  <span
                    key={image.id}
                    className="rounded-full border border-border/70 bg-white/80 px-3 py-1"
                  >
                    {image.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {excludedUploads.length > 0 && (
            <Alert>
              <AlertTitle>Some photos are missing GPS data</AlertTitle>
              <AlertDescription>
                {excludedUploads.length} image(s) won’t appear in the game because their EXIF metadata
                lacks location coordinates.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-white/70 shadow-sm backdrop-blur">
        <CardHeader>
          <CardTitle>Game setup</CardTitle>
          <CardDescription>Customize your round order and map settings.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground">Round order</p>
            <ToggleGroup
              type="single"
              value={roundOrder}
              onValueChange={(value) => {
                if (value === RoundOrder.Upload || value === RoundOrder.Random) {
                  onRoundOrderChange(value)
                }
              }}
              className="grid grid-cols-2 gap-2"
            >
              <ToggleGroupItem value={RoundOrder.Upload} className="w-full justify-center">
                Upload order
              </ToggleGroupItem>
              <ToggleGroupItem value={RoundOrder.Random} className="w-full justify-center">
                Randomized
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground">Scoring scale</p>
            <ToggleGroup
              type="single"
              value={scoreScale}
              onValueChange={(value) => {
                if (
                  value === ScoreScale.City ||
                  value === ScoreScale.State ||
                  value === ScoreScale.Country
                ) {
                  onScoreScaleChange(value)
                }
              }}
              className="grid grid-cols-1 gap-2 sm:grid-cols-3"
            >
              <ToggleGroupItem value={ScoreScale.City} className="w-full justify-center">
                City
              </ToggleGroupItem>
              <ToggleGroupItem value={ScoreScale.State} className="w-full justify-center">
                State
              </ToggleGroupItem>
              <ToggleGroupItem value={ScoreScale.Country} className="w-full justify-center">
                Country
              </ToggleGroupItem>
            </ToggleGroup>
            <p className="text-xs text-muted-foreground">{scoreOptions[scoreScale].description}</p>
          </div>

          <div className="space-y-2 rounded-2xl border border-border/70 bg-muted/30 p-4">
            <p className="text-sm font-semibold text-foreground">Map readiness</p>
            <p className="text-sm text-muted-foreground">
              {googleMapsApiKey
                ? "Google Maps is ready to go."
                : "Add GOOGLE_MAPS_API_KEY to enable interactive guessing."}
            </p>
          </div>

          <div className="space-y-3">
            <Button className="w-full" size="lg" disabled={!playableUploads.length} onClick={onStart}>
              Start the journey
            </Button>
            {!playableUploads.length && (
              <p className="text-xs text-muted-foreground">
                Upload at least one photo with GPS data to begin.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
