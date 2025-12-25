import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { type ThemePreference } from "@/context/theme-context"
import { useTheme } from "@/context/useTheme"
import { cn } from "@/lib/utils"

const themeOptions: Array<{ value: ThemePreference; label: string }> = [
  { value: "light", label: "Light" },
  { value: "system", label: "System" },
  { value: "dark", label: "Dark" },
]

type ThemeToggleProps = {
  className?: string
  size?: "default" | "sm" | "lg"
}

export default function ThemeToggle({ className, size = "sm" }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme()

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="hidden text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-muted-foreground sm:inline">
        Theme
      </span>
      <ToggleGroup
        type="single"
        value={theme}
        onValueChange={(value) => {
          if (value) {
            setTheme(value as ThemePreference)
          }
        }}
        size={size}
        variant="outline"
        className="rounded-full border border-border/60 bg-background/70 p-1 text-xs shadow-sm backdrop-blur"
        aria-label="Theme preference"
      >
        {themeOptions.map((option) => (
          <ToggleGroupItem key={option.value} value={option.value} className="px-2 text-xs">
            {option.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  )
}
