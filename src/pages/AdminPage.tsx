import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  subscribePlayers,
  setRaceStarted,
  resetGame,
  type Player,
} from "../firebase/gameService";

import "../styles/derby.css";




function AdminPage() {

  const navigate =
    useNavigate();


  const [
    players,
    setPlayers,
  ] = useState<Player[]>([]);


  const [
    resetting,
    setResetting,
  ] = useState(false);


  useEffect(() => {

    return subscribePlayers(
      setPlayers
    );

  }, []);


  /*
   * レース開始
   */

  async function handleStartRace() {

    const confirmed =
      window.confirm(
        "レースを開始しますか？"
      );


    if (!confirmed) {
      return;
    }


    try {

      await setRaceStarted(
        true
      );


      navigate("/game");


    } catch (error) {

      console.error(error);

      alert(
        "レース開始に失敗しました。"
      );

    }

  }


  /*
   * ゲームリセット
   */

  async function handleResetGame() {

    const confirmed =
      window.confirm(
        "現在のゲームを完全にリセットします。\n\n参加者・馬・ポイントがすべて削除されます。\n\n本当にリセットしますか？"
      );


    if (!confirmed) {
      return;
    }


    try {

      setResetting(true);


      await resetGame();


      alert(
        "ゲームをリセットしました。"
      );


    } catch (error) {

      console.error(error);

      alert(
        "リセットに失敗しました。"
      );


    } finally {

      setResetting(false);

    }

  }


  return (

    <div
      className="derby-container"
    >

      <h1 className="title">
        💍 管理画面
      </h1>


      <div
        className="card"
      >

        <h2>
          🏇 出走馬一覧
        </h2>


        <p>
          参加人数：
          {players.length}
          名
        </p>


        {
          players.length === 0 &&

          <p>
            参加者はいません。
          </p>
        }


        {
          players.map(
            (
              player,
              index
            ) => (

              <div
                className="horse"
                key={
                  player.id ||
                  `${player.tableNumber}-${index}`
                }
              >

                <h3>
                  【{player.tableNumber}卓】
                </h3>


                <p>
                  👤 {player.playerName}
                </p>


                <p>
                  🐎 {player.horseName}
                </p>


                <p>
                  ポイント：
                  {player.score ?? 0}
                </p>

              </div>

            )
          )

        }

      </div>


      <button
        disabled={
          players.length === 0
        }
        onClick={
          handleStartRace
        }
      >

        🏁 レース開始

      </button>


      <div
        style={{
          marginTop:
            "30px",
          paddingTop:
            "20px",
          borderTop:
            "1px solid #ddd",
        }}
      >

        <button
          onClick={
            handleResetGame
          }
          disabled={
            resetting
          }
          style={{
            background:
              "#777",
          }}
        >

          {
            resetting
              ? "リセット中..."
              : "🔄 ゲームリセット"
          }

        </button>

      </div>


    </div>

  );

}


export default AdminPage;