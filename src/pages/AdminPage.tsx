import { useGame } from "../context/GameContext"


function AdminPage() {

  const {
    players,
    clearPlayers,
  } = useGame()


  return (
    <div>

      <h1>
        💍 Wedding Derby 管理画面
      </h1>


      <h2>
        参加人数：
        {players.length}人
      </h2>


      <button
        onClick={clearPlayers}
      >
        🗑 全データ削除
      </button>


      <hr />


      <h2>
        参加者一覧
      </h2>


      {
        players.length === 0 ? (

          <p>
            参加者はいません
          </p>

        ) : (

          players.map(
            (player, index) => (

              <div key={index}>

                <h3>
                  {index + 1}人目
                </h3>

                <p>
                  👤 {player.playerName}
                </p>

                <p>
                  🐎 {player.horseName}
                </p>

                <hr />

              </div>

            )

          )

        )
      }


    </div>
  )
}


export default AdminPage