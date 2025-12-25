import { Badge } from "@/components/ui/badge"
import ThemeToggle from "@/components/ThemeToggle"

type AppHeaderProps = {
  compact?: boolean
}

export default function AppHeader({ compact = false }: AppHeaderProps) {
  if (compact) {
    return (
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.4em] text-muted-foreground">
            <span className="h-[0.0625rem] w-8 bg-muted-foreground/40" />
            PhotoGuesser
          </div>
          <span className="hidden text-sm text-muted-foreground md:inline">
            Trace the memories on a living map.
          </span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle size="sm" />
          <Badge variant="secondary" className="px-3 py-1 text-xs">
            MVP
          </Badge>
        </div>
      </header>
    )
  }

  return (
    <header className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.4em] text-muted-foreground">
          <span className="h-[0.0625rem] w-8 bg-muted-foreground/40" />
          PhotoGuesser
        </div>
        <ThemeToggle size="default" />
      </div>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
            Trace the memories on a living map.
          </h1>
          <p className="mt-3 max-w-2xl text-base text-muted-foreground">
            Upload your favorite photos, then test your memory by dropping pins where those moments
            happened. The closer you are, the bigger the score.
          </p>
        </div>
      </div>
    </header>
  )
}
