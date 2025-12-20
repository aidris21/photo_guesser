import { useEffect, useMemo, useRef, useState } from "react"

import MapRound from "@/components/MapRound"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { extractGps } from "@/lib/exif"
import type { LatLng } from "@/lib/geo"
import { formatDistance, haversineKm, scoreGuess } from "@/lib/geo"
import { shuffle } from "@/lib/random"

type UploadImage = {
  id: string
  name: string
  file: File
  url: string
  gps: LatLng | null
}

type GameRound = {
  id: string
  image: UploadImage
  guess: LatLng | null
  distanceKm: number | null
  score: number | null
}

type Stage = "setup" | "guess" | "result" | "complete"
type RoundOrder = "upload" | "random"

const googleMapsApiKey = import.meta.env.GOOGLE_MAPS_API_KEY as string | undefined

function makeId(file: File) {
  if ("randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  return `${file.name}-${file.lastModified}-${Math.random().toString(16).slice(2)}`
}

function App() {
  const [uploads, setUploads] = useState<UploadImage[]>([])
  const [rounds, setRounds] = useState<GameRound[]>([])
  const [stage, setStage] = useState<Stage>("setup")
  const [roundOrder, setRoundOrder] = useState<RoundOrder>("upload")
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0)
  const [isParsing, setIsParsing] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const playableUploads = useMemo(() => uploads.filter((image) => image.gps), [uploads])
  const excludedUploads = useMemo(() => uploads.filter((image) => !image.gps), [uploads])
  const currentRound = rounds[currentRoundIndex]
  const totalScore = useMemo(
    () => rounds.reduce((sum, round) => sum + (round.score ?? 0), 0),
    [rounds]
  )

  useEffect(() => {
    return () => {
      uploads.forEach((image) => URL.revokeObjectURL(image.url))
    }
  }, [uploads])

  const handleFiles = async (files: File[]) => {
    const imageFiles = files.filter((file) => file.type.startsWith("image/"))
    if (!imageFiles.length) {
      return
    }

    setIsParsing(true)
    const parsedImages = await Promise.all(
      imageFiles.map(async (file) => {
        const gps = await extractGps(file)
        return {
          id: makeId(file),
          name: file.name,
          file,
          url: URL.createObjectURL(file),
          gps,
        }
      })
    )

    setUploads(parsedImages)
    setRounds([])
    setStage("setup")
    setCurrentRoundIndex(0)
    setIsParsing(false)
  }

  const startGame = () => {
    if (!playableUploads.length) {
      return
    }
    const ordered = roundOrder === "random" ? shuffle(playableUploads) : playableUploads
    const nextRounds = ordered.map((image) => ({
      id: image.id,
      image,
      guess: null,
      distanceKm: null,
      score: null,
    }))
    setRounds(nextRounds)
    setCurrentRoundIndex(0)
    setStage("guess")
  }

  const updateCurrentRound = (updates: Partial<GameRound>) => {
    setRounds((prev) =>
      prev.map((round, index) => (index === currentRoundIndex ? { ...round, ...updates } : round))
    )
  }

  const handleConfirmGuess = () => {
    if (!currentRound?.guess || !currentRound.image.gps) {
      return
    }
    const distanceKm = haversineKm(currentRound.guess, currentRound.image.gps)
    const score = scoreGuess(distanceKm)
    updateCurrentRound({ distanceKm, score })
    setStage("result")
  }

  const handleNextRound = () => {
    if (currentRoundIndex + 1 >= rounds.length) {
      setStage("complete")
      return
    }
    setCurrentRoundIndex((index) => index + 1)
    setStage("guess")
  }

  const replayGame = () => {
    startGame()
  }

  const resetUploads = () => {
    setUploads([])
    setRounds([])
    setStage("setup")
    setCurrentRoundIndex(0)
  }

  const progressValue = rounds.length ? ((currentRoundIndex + 1) / rounds.length) * 100 : 0

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(254,249,235,0.9),_rgba(255,255,255,0.2)),linear-gradient(120deg,_rgba(244,244,249,0.9),_rgba(235,246,255,0.9))] text-foreground">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute left-[-20%] top-[-10%] h-[360px] w-[360px] rounded-full bg-amber-200/40 blur-[120px]" />
        <div className="pointer-events-none absolute right-[-10%] top-[20%] h-[320px] w-[320px] rounded-full bg-sky-200/40 blur-[120px]" />
      </div>

      <div className="container relative mx-auto flex min-h-screen flex-col gap-8 px-4 py-10">
        <header className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.4em] text-muted-foreground">
            <span className="h-[1px] w-8 bg-muted-foreground/40" />
            PhotoGuesser
          </div>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
                Trace the memories on a living map.
              </h1>
              <p className="mt-3 max-w-2xl text-base text-muted-foreground">
                Upload your favorite photos, then test your memory by dropping pins where those
                moments happened. The closer you are, the bigger the score.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="px-3 py-1 text-sm">
                MVP Build
              </Badge>
              <Badge variant="outline" className="px-3 py-1 text-sm">
                GeoGuessr-style scoring
              </Badge>
            </div>
          </div>
        </header>

        {stage === "setup" && (
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <Card className="border-border/60 bg-white/70 shadow-sm backdrop-blur">
              <CardHeader>
                <CardTitle>Upload your photo set</CardTitle>
                <CardDescription>
                  We’ll scan EXIF data to find GPS coordinates for each image.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <label
                  className={`flex min-h-[220px] cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed p-6 text-center transition ${
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
                      handleFiles(Array.from(event.dataTransfer.files))
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
                        handleFiles(Array.from(event.target.files))
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
                        <p className="text-sm font-semibold text-foreground">
                          {uploads.length} images loaded
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {playableUploads.length} usable for gameplay
                        </p>
                      </div>
                      <Button variant="ghost" onClick={resetUploads}>
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
                      {excludedUploads.length} image(s) won’t appear in the game because their EXIF
                      metadata lacks location coordinates.
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
                      if (value === "upload" || value === "random") {
                        setRoundOrder(value)
                      }
                    }}
                    className="grid grid-cols-2 gap-2"
                  >
                    <ToggleGroupItem value="upload" className="w-full justify-center">
                      Upload order
                    </ToggleGroupItem>
                    <ToggleGroupItem value="random" className="w-full justify-center">
                      Randomized
                    </ToggleGroupItem>
                  </ToggleGroup>
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
                  <Button
                    className="w-full"
                    size="lg"
                    disabled={!playableUploads.length}
                    onClick={startGame}
                  >
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
        )}

        {(stage === "guess" || stage === "result") && currentRound && (
          <div className="space-y-6">
            <div className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-white/70 p-4 shadow-sm backdrop-blur md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                  Round {currentRoundIndex + 1} of {rounds.length}
                </p>
                <h2 className="text-2xl font-semibold">Pinpoint the memory</h2>
              </div>
              <div className="min-w-[220px] space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Progress</span>
                  <span>{Math.round(progressValue)}%</span>
                </div>
                <Progress value={progressValue} />
              </div>
              <div className="rounded-full border border-border/70 bg-white/80 px-4 py-2 text-sm font-semibold">
                Total score: {totalScore.toLocaleString()}
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <Card className="border-border/60 bg-white/70 shadow-sm backdrop-blur">
                <CardHeader>
                  <CardTitle>{currentRound.image.name}</CardTitle>
                  <CardDescription>Study the details before you guess.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center rounded-2xl border border-border/70 bg-muted/30 p-2">
                    <img
                      src={currentRound.image.url}
                      alt={currentRound.image.name}
                      className="max-h-[480px] w-full rounded-xl object-contain"
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <Card className="border-border/60 bg-white/70 shadow-sm backdrop-blur">
                  <CardHeader>
                    <CardTitle>Your guess</CardTitle>
                    <CardDescription>
                      Click on the map to place a pin close to the photo’s origin.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-[360px]">
                    <MapRound
                      key={currentRound.id}
                      apiKey={googleMapsApiKey}
                      guess={currentRound.guess}
                      actual={currentRound.image.gps}
                      reveal={stage === "result"}
                      onGuess={(point) => updateCurrentRound({ guess: point })}
                    />
                  </CardContent>
                </Card>

                <div className="flex flex-col gap-3">
                  <Button
                    size="lg"
                    disabled={!currentRound.guess || stage === "result" || !googleMapsApiKey}
                    onClick={handleConfirmGuess}
                  >
                    Lock in my guess
                  </Button>
                  {!googleMapsApiKey && (
                    <p className="text-xs text-muted-foreground">
                      Add GOOGLE_MAPS_API_KEY to enable map guesses.
                    </p>
                  )}
                </div>

                {stage === "result" && currentRound.distanceKm !== null && currentRound.score !== null && (
                  <Card className="border-border/60 bg-white/70 shadow-sm backdrop-blur">
                    <CardHeader>
                      <CardTitle>Round results</CardTitle>
                      <CardDescription>Here’s how close you were.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-muted/30 p-4">
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                            Distance
                          </p>
                          <p className="text-2xl font-semibold">
                            {formatDistance(currentRound.distanceKm)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                            Score
                          </p>
                          <p className="text-3xl font-semibold text-primary">
                            {currentRound.score.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <Button size="lg" onClick={handleNextRound}>
                        {currentRoundIndex + 1 === rounds.length ? "See final score" : "Next round"}
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        )}

        {stage === "complete" && (
          <Card className="border-border/60 bg-white/70 shadow-sm backdrop-blur">
            <CardHeader>
              <CardTitle>That’s the journey!</CardTitle>
              <CardDescription>Relive the highlights and play again.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-start gap-4 rounded-2xl border border-border/70 bg-muted/30 p-6 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Total score
                  </p>
                  <p className="text-4xl font-semibold text-foreground">
                    {totalScore.toLocaleString()}
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button size="lg" onClick={replayGame} disabled={!playableUploads.length}>
                    Replay with same photos
                  </Button>
                  <Button size="lg" variant="outline" onClick={resetUploads}>
                    Upload new set
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {rounds.map((round, index) => (
                  <div
                    key={round.id}
                    className="flex items-center gap-4 rounded-2xl border border-border/70 bg-white/80 p-4"
                  >
                    <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl bg-muted">
                      <img src={round.image.url} alt={round.image.name} className="h-full w-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">
                        Round {index + 1}: {round.image.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {round.distanceKm !== null ? formatDistance(round.distanceKm) : "No guess"}
                      </p>
                    </div>
                    <div className="text-right text-sm font-semibold text-primary">
                      {round.score?.toLocaleString() ?? "0"}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default App
