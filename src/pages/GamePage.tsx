import { useState } from "react"

function GamePage() {
  const [status, setStatus] = useState("待機中")

  const startRace = () => {
    setStatus("走行中")
  }

  return (
    <div>
      <h1>🏇 Wedding Derby</h1>

      <h2>第1レース</h2>

      <h3>参加馬</h3>

      <div>
        🐎 ホワイト号
        <p>進行度：0%</p>
      </div>

      <div>
        🐎 ブラック号
        <p>進行度：0%</p>
      </div>

      <div>
        🐎 ゴールド号
        <p>進行度：0%</p>
      </div>

      <button onClick={startRace}>
        レース開始
      </button>

      <p>
        レース状態：{status}
      </p>
    </div>
  )
}

export default GamePage