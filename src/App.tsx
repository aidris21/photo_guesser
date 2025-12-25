import { useEffect, useMemo, useState } from "react"
import confetti from "canvas-confetti"

import AppHeader from "@/components/AppHeader"
import CompleteView from "@/components/CompleteView"
import RoundView from "@/components/RoundView"
import SetupView from "@/components/SetupView"
import { extractGps } from "@/lib/exif"
import { haversineKm, scoreGuess, ScoreScale } from "@/lib/geo"
import { shuffle } from "@/lib/random"
import { RoundOrder, Stage } from "@/types/game"
import type { GameRound, UploadImage } from "@/types/game"

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
  const [stage, setStage] = useState<Stage>(Stage.Setup)
  const [roundOrder, setRoundOrder] = useState<RoundOrder>(RoundOrder.Upload)
  const [scoreScale, setScoreScale] = useState<ScoreScale>(ScoreScale.City)
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0)
  const [isParsing, setIsParsing] = useState(false)

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

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return
    }

    let shouldPlay = true
    try {
      const key = "photo-guesser-intro-played"
      if (sessionStorage.getItem(key)) {
        shouldPlay = false
      } else {
        sessionStorage.setItem(key, "true")
      }
    } catch {
      // If storage is unavailable, play once per page load.
    }

    if (!shouldPlay) {
      return
    }

    const colors = ["#d63b33", "#1f8a4c", "#d6a520", "#2a7db6", "#f0c74a"]
    const base = { spread: 70, startVelocity: 35, ticks: 220, colors }
    confetti({ ...base, particleCount: 140, origin: { x: 0.2, y: 0.2 } })
    const timer = window.setTimeout(() => {
      confetti({ ...base, particleCount: 160, origin: { x: 0.8, y: 0.15 } })
    }, 260)
    return () => window.clearTimeout(timer)
  }, [])

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
    setStage(Stage.Setup)
    setCurrentRoundIndex(0)
    setIsParsing(false)
  }

  const startGame = () => {
    if (!playableUploads.length) {
      return
    }
    const ordered = roundOrder === RoundOrder.Random ? shuffle(playableUploads) : playableUploads
    const nextRounds = ordered.map((image) => ({
      id: image.id,
      image,
      guess: null,
      distanceKm: null,
      score: null,
    }))
    setRounds(nextRounds)
    setCurrentRoundIndex(0)
    setStage(Stage.Guess)
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
    const score = scoreGuess(distanceKm, scoreScale)
    updateCurrentRound({ distanceKm, score })
    setStage(Stage.Result)
  }

  const handleNextRound = () => {
    if (currentRoundIndex + 1 >= rounds.length) {
      setStage(Stage.Complete)
      return
    }
    setCurrentRoundIndex((index) => index + 1)
    setStage(Stage.Guess)
  }

  const replayGame = () => {
    startGame()
  }

  const resetUploads = () => {
    setUploads([])
    setRounds([])
    setStage(Stage.Setup)
    setCurrentRoundIndex(0)
  }

  const progressValue = rounds.length ? ((currentRoundIndex + 1) / rounds.length) * 100 : 0

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(254,249,235,0.9),_rgba(255,255,255,0.2)),linear-gradient(120deg,_rgba(244,244,249,0.9),_rgba(235,246,255,0.9))] text-foreground">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute left-[-20%] top-[-10%] h-[22.5rem] w-[22.5rem] rounded-full bg-amber-200/40 blur-[7.5rem]" />
        <div className="pointer-events-none absolute right-[-10%] top-[20%] h-[20rem] w-[20rem] rounded-full bg-sky-200/40 blur-[7.5rem]" />
      </div>

      <div className="container relative mx-auto flex min-h-screen flex-col gap-8 px-4 py-10">
        <AppHeader compact={stage === Stage.Guess || stage === Stage.Result} />

        {stage === Stage.Setup && (
          <SetupView
            uploads={uploads}
            playableUploads={playableUploads}
            excludedUploads={excludedUploads}
            isParsing={isParsing}
            roundOrder={roundOrder}
            scoreScale={scoreScale}
            googleMapsApiKey={googleMapsApiKey}
            onFiles={handleFiles}
            onRoundOrderChange={setRoundOrder}
            onScoreScaleChange={setScoreScale}
            onStart={startGame}
            onReset={resetUploads}
          />
        )}

        {(stage === Stage.Guess || stage === Stage.Result) && currentRound && (
          <RoundView
            stage={stage}
            currentRound={currentRound}
            currentRoundIndex={currentRoundIndex}
            totalRounds={rounds.length}
            totalScore={totalScore}
            progressValue={progressValue}
            googleMapsApiKey={googleMapsApiKey}
            onGuess={(point) => updateCurrentRound({ guess: point })}
            onConfirmGuess={handleConfirmGuess}
            onNextRound={handleNextRound}
          />
        )}

        {stage === Stage.Complete && (
          <CompleteView
            rounds={rounds}
            totalScore={totalScore}
            canReplay={playableUploads.length > 0}
            onReplay={replayGame}
            onReset={resetUploads}
          />
        )}
      </div>
    </div>
  )
}

export default App
