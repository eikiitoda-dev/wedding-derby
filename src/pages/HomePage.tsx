import { useState } from "react"
import { useNavigate } from "react-router-dom"

function HomePage() {
  const navigate = useNavigate()

  const [playerName, setPlayerName] = useState("")
  const [horseName, setHorseName] = useState("")

  const startGame = () => {
    navigate("/game", {
      state: {
        playerName,
        horseName,
      },
    })
  }

  return (
    <div>
      <h1>💍 Wedding Derby</h1>

      <p>
        新郎新婦からの挑戦状！
      </p>

      <div>
        <label>
          参加者名
        </label>

        <br />

        <input
          type="text"
          value={playerName}
          onChange={(e) =>
            setPlayerName(e.target.value)
          }
          placeholder="名前を入力"
        />
      </div>

      <br />

      <div>
        <label>
          馬の名前
        </label>

        <br />

        <input
          type="text"
          value={horseName}
          onChange={(e) =>
            setHorseName(e.target.value)
          }
          placeholder="馬名を入力"
        />
      </div>

      <br />

      <button onClick={startGame}>
        レース会場へ
      </button>
    </div>
  )
}

export default HomePage