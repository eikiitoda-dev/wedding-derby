import { useGame } from "../context/GameContext"


function GamePage() {

  const { players } = useGame()


  const player =
    players[players.length - 1]


  const playerName =
    player?.playerName || "ゲスト"


  const horseName =
    player?.horseName || "ゲスト馬"


  return (
    <div>

      <h1>
        🏇 Wedding Derby
      </h1>


      <h2>
        参加者：
        {playerName}
      </h2>


      <h3>
        愛馬：
        🐎 {horseName}
      </h3>


      <hr />


      <p>
        レース画面準備中
      </p>


    </div>
  )
}


export default GamePage