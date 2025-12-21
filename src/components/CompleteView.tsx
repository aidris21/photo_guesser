import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDistance } from "@/lib/geo"
import type { GameRound } from "@/types/game"

type CompleteViewProps = {
  rounds: GameRound[]
  totalScore: number
  canReplay: boolean
  onReplay: () => void
  onReset: () => void
}

export default function CompleteView({
  rounds,
  totalScore,
  canReplay,
  onReplay,
  onReset,
}: CompleteViewProps) {
  return (
    <Card className="border-border/60 bg-white/70 shadow-sm backdrop-blur">
      <CardHeader>
        <CardTitle>That’s the journey!</CardTitle>
        <CardDescription>Relive the highlights and play again.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col items-start gap-4 rounded-2xl border border-border/70 bg-muted/30 p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Total score</p>
            <p className="text-4xl font-semibold text-foreground">{totalScore.toLocaleString()}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button size="lg" onClick={onReplay} disabled={!canReplay}>
              Replay with same photos
            </Button>
            <Button size="lg" variant="outline" onClick={onReset}>
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
  )
}
