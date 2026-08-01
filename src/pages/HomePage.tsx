import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useGame } from "../context/GameContext"


function HomePage() {

  console.log("HomePage読み込み")

  const navigate = useNavigate()

  const { addPlayer } = useGame()


  const [playerName, setPlayerName] =
    useState("")

  const [horseName, setHorseName] =
    useState("")


  const startGame = () => {

    alert("ボタン押されました")

    console.log("登録ボタン押下")

    console.log({
      playerName,
      horseName,
    })


    addPlayer({
      playerName,
      horseName,
    })


    navigate("/game")
  }


  return (
    <div>

      <h1>
        💍 Wedding Derby
      </h1>


      <p>
        参加者名
      </p>

      <input
        value={playerName}
        onChange={(e) =>
          setPlayerName(e.target.value)
        }
      />


      <p>
        馬の名前
      </p>

      <input
        value={horseName}
        onChange={(e) =>
          setHorseName(e.target.value)
        }
      />


      <button
        onClick={startGame}
      >
        レース会場へ
      </button>


    </div>
  )
}


export default HomePage