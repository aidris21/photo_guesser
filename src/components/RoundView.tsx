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
  const isResult = stage === Stage.Result
  const isLastRound = currentRoundIndex + 1 === totalRounds

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
            <div className="flex items-center justify-center rounded-2xl border border-border/70 bg-muted/30 p-2">
              <img
                src={currentRound.image.url}
                alt={currentRound.image.name}
                className="max-h-[30rem] w-full rounded-xl object-contain"
              />
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
    </div>
  )
}
