import { useEffect, useState } from "react"
import { Maximize2 } from "lucide-react"
import MapRound from "@/components/MapRound"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { formatDistance } from "@/lib/geo"
import type { LatLng } from "@/lib/geo"
import { Stage } from "@/types/game"
import type { GameRound } from "@/types/game"

type RoundViewProps = {
  stage: Stage.Guess | Stage.Result
  currentRound: GameRound
  currentRoundIndex: number
  totalRounds: number
  totalScore: number
  progressValue: number
  googleMapsApiKey?: string
  onGuess: (point: LatLng) => void
  onConfirmGuess: () => void
  onNextRound: () => void
}

export default function RoundView({
  stage,
  currentRound,
  currentRoundIndex,
  totalRounds,
  totalScore,
  progressValue,
  googleMapsApiKey,
  onGuess,
  onConfirmGuess,
  onNextRound,
}: RoundViewProps) {
  const [isImageOpen, setIsImageOpen] = useState(false)
  const isResult = stage === Stage.Result
  const isLastRound = currentRoundIndex + 1 === totalRounds

  useEffect(() => {
    if (!isImageOpen) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsImageOpen(false)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [isImageOpen])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-card/80 p-4 shadow-sm backdrop-blur md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Round {currentRoundIndex + 1} of {totalRounds}
          </p>
          <h2 className="text-2xl font-semibold">Pinpoint the memory</h2>
        </div>
        <div className="min-w-[13.75rem] space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span>{Math.round(progressValue)}%</span>
          </div>
          <Progress value={progressValue} />
        </div>
        <div className="rounded-full border border-border/70 bg-muted/40 px-4 py-2 text-sm font-semibold">
          Total score: {totalScore.toLocaleString()}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.85fr_1.35fr]">
        <Card className="border-border/60 bg-card/80 shadow-sm backdrop-blur">
          <CardHeader>
            <CardTitle>{currentRound.image.name}</CardTitle>
            <CardDescription>Study the details before you guess.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative flex items-center justify-center rounded-2xl border border-border/70 bg-muted/30 p-2">
              <button
                type="button"
                onClick={() => setIsImageOpen(true)}
                className="group relative flex w-full items-center justify-center rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
                aria-label={`Expand ${currentRound.image.name}`}
                aria-haspopup="dialog"
              >
                <img
                  src={currentRound.image.url}
                  alt={currentRound.image.name}
                  className="max-h-[30rem] w-full rounded-xl object-contain"
                />
                <span className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-transparent transition group-hover:ring-primary/40" />
              </button>
              <Button
                type="button"
                size="icon"
                variant="secondary"
                onClick={() => setIsImageOpen(true)}
                className="absolute right-4 top-4 shadow-sm"
                aria-haspopup="dialog"
                aria-label={`Expand ${currentRound.image.name}`}
              >
                <Maximize2 className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-border/60 bg-card/80 shadow-sm backdrop-blur">
            <CardHeader>
              <CardTitle>Your guess</CardTitle>
              <CardDescription>Click on the map to place a pin close to the photo’s origin.</CardDescription>
            </CardHeader>
            <CardContent className="h-[26.25rem] md:h-[32.5rem]">
              <MapRound
                key={currentRound.id}
                apiKey={googleMapsApiKey}
                guess={currentRound.guess}
                actual={currentRound.image.gps}
                reveal={isResult}
                onGuess={onGuess}
              />
            </CardContent>
          </Card>

          <div className="flex flex-col gap-3">
            <Button size="lg" disabled={!currentRound.guess || isResult || !googleMapsApiKey} onClick={onConfirmGuess}>
              Lock in my guess
            </Button>
            {!googleMapsApiKey && (
              <p className="text-xs text-muted-foreground">Add GOOGLE_MAPS_API_KEY to enable map guesses.</p>
            )}
          </div>

          {isResult && currentRound.distanceKm !== null && currentRound.score !== null && (
            <Card className="border-border/60 bg-card/80 shadow-sm backdrop-blur">
              <CardHeader>
                <CardTitle>Round results</CardTitle>
                <CardDescription>Here’s how close you were.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-muted/30 p-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Distance</p>
                    <p className="text-2xl font-semibold">{formatDistance(currentRound.distanceKm)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Score</p>
                    <p className="text-3xl font-semibold text-primary">
                      {currentRound.score.toLocaleString()}
                    </p>
                  </div>
                </div>
                <Button size="lg" onClick={onNextRound}>
                  {isLastRound ? "See final score" : "Next round"}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {isImageOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            onClick={() => setIsImageOpen(false)}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            aria-label="Close expanded image"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`${currentRound.image.name} expanded`}
            className="relative z-10 flex max-h-[90vh] w-full max-w-6xl flex-col gap-4 rounded-2xl border border-border/60 bg-card/95 p-4 shadow-xl"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Photo detail</p>
                <h3 className="truncate text-lg font-semibold">{currentRound.image.name}</h3>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsImageOpen(false)}>
                Close
              </Button>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden rounded-xl border border-border/70 bg-muted/30 p-2">
              <img
                src={currentRound.image.url}
                alt={currentRound.image.name}
                className="h-full w-full object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
