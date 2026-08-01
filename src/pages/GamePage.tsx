import { useState } from "react"

type Horse = {
  name: string
  progress: number
}

function GamePage() {
  const [horses, setHorses] = useState<Horse[]>([
    { name: "ホワイト号", progress: 0 },
    { name: "ブラック号", progress: 0 },
    { name: "ゴールド号", progress: 0 },
  ])

  const [status, setStatus] = useState("待機中")
  const [winner, setWinner] = useState("")

  const startRace = () => {
    setStatus("走行中")
    setWinner("")

    const timer = setInterval(() => {
      setHorses((current) => {
        const updated = current.map((horse) => ({
          ...horse,
          progress: Math.min(
            horse.progress + Math.floor(Math.random() * 10),
            100
          ),
        }))

        const finished = updated.find(
          (horse) => horse.progress >= 100
        )

        if (finished) {
          clearInterval(timer)
          setStatus("終了")
          setWinner(`${finished.name} の勝利！`)
        }

        return updated
      })
    }, 500)
  }

  const ranking = [...horses].sort(
    (a, b) => b.progress - a.progress
  )

  return (
    <div>
      <h1>🏇 Wedding Derby</h1>

      <h2>現在順位</h2>

      {ranking.map((horse, index) => (
        <div key={horse.name}>
          <p>
            {index + 1}位 {horse.name}
          </p>

          <p>
            {"█".repeat(Math.floor(horse.progress / 10))}
            {"░".repeat(10 - Math.floor(horse.progress / 10))}
            {" "}
            {horse.progress}%
          </p>
        </div>
      ))}

      <button onClick={startRace}>
        レース開始
      </button>

      <p>
        レース状態：{status}
      </p>

      <h2>
        {winner}
      </h2>
    </div>
  )
}

export default GamePage