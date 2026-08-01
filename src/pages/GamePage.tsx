import { useLocation } from "react-router-dom"
import { useState } from "react"

type Horse = {
  name: string
  progress: number
}

function GamePage() {
  const location = useLocation()

  const playerName =
    location.state?.playerName || "ゲスト"

  const customHorseName =
    location.state?.horseName || "ゲスト馬"

  const initialHorses: Horse[] = [
    {
      name: customHorseName,
      progress: 0,
    },
    {
      name: "ホワイト号",
      progress: 0,
    },
    {
      name: "ブラック号",
      progress: 0,
    },
  ]

  const [horses, setHorses] =
    useState<Horse[]>(initialHorses)

  const [status, setStatus] =
    useState("待機中")

  const [ranking, setRanking] =
    useState<string[]>([])

  const [running, setRunning] =
    useState(false)


  const startRace = () => {
    if (running) return

    setRanking([])
    setStatus("走行中")
    setRunning(true)

    const finishOrder: string[] = []

    const timer = setInterval(() => {
      setHorses((current) => {

        const updated =
          current.map((horse) => {

            if (horse.progress >= 100) {
              return horse
            }

            return {
              ...horse,
              progress: Math.min(
                horse.progress +
                  Math.floor(Math.random() * 12),
                100
              ),
            }
          })


        updated.forEach((horse) => {

          if (
            horse.progress >= 100 &&
            !finishOrder.includes(horse.name)
          ) {
            finishOrder.push(horse.name)
          }

        })


        if (
          finishOrder.length ===
          updated.length
        ) {
          clearInterval(timer)

          setRanking(finishOrder)
          setStatus("終了")
          setRunning(false)
        }


        return updated
      })

    }, 500)
  }


  return (
    <div>

      <h1>🏇 Wedding Derby</h1>

      <h2>
        参加者：{playerName}
      </h2>


      <h3>現在順位</h3>


      {[...horses]
        .sort(
          (a,b) =>
            b.progress -
            a.progress
        )
        .map(
          (horse,index)=>(

          <div key={horse.name}>

            <p>
              {index+1}位 🐎 {horse.name}
            </p>

            <p>
              {"█".repeat(
                Math.floor(
                  horse.progress / 10
                )
              )}

              {"░".repeat(
                10 -
                Math.floor(
                  horse.progress / 10
                )
              )}

              {horse.progress}%

            </p>

          </div>

        ))}


      <button
        onClick={startRace}
        disabled={running}
      >
        {running
          ? "レース中..."
          : "レース開始"}
      </button>


      <p>
        状態：{status}
      </p>


      {
        ranking.length > 0 &&
        <div>

          <h2>
            🏆 結果
          </h2>


          {
            ranking.map(
              (name,index)=>(

              <p key={name}>
                {index===0 && "🥇"}
                {index===1 && "🥈"}
                {index===2 && "🥉"}

                {index+1}着：
                {name}

              </p>

            ))
          }


        </div>
      }

    </div>
  )
}

export default GamePage