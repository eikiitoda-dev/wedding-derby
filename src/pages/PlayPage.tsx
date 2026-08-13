import {
  useEffect,
  useState,
} from "react";

import {
  doc,
  onSnapshot,
  updateDoc,
  increment,
} from "firebase/firestore";

import {
  useParams,
} from "react-router-dom";

import {
  db,
} from "../firebase";

import "../styles/derby.css";


type Player = {
  playerName: string;
  horseName: string;
  score: number;
  finished?: boolean;
};


function PlayPage() {

  const { id } = useParams();


  const [
    player,
    setPlayer,
  ] = useState<Player | null>(null);


  const [
    raceStarted,
    setRaceStarted,
  ] = useState(false);


  const [
    pressing,
    setPressing,
  ] = useState(false);


  const [
    raceEvent,
    setRaceEvent,
  ] = useState<
    "none" | "banana"
  >("none");


  /*
   * 自分の参加者情報を監視
   */

  useEffect(() => {

    if (!id) {
      return;
    }


    return onSnapshot(
      doc(
        db,
        "players",
        id
      ),
      snapshot => {

        if (!snapshot.exists()) {
          return;
        }


        const data =
          snapshot.data();


        setPlayer({

          playerName:
            data.playerName ?? "",

          horseName:
            data.horseName ?? "",

          score:
            data.score ?? 0,

          finished:
            data.finished ?? false,

        });

      }
    );

  }, [id]);


  /*
   * レース状態・イベントを監視
   */

  useEffect(() => {

    return onSnapshot(
      doc(
        db,
        "game",
        "status"
      ),
      snapshot => {

        const data =
          snapshot.data();


        setRaceStarted(
          data?.raceStarted ?? false
        );


        setRaceEvent(
          data?.eventType === "banana" ||
          data?.eventType === "trap"
            ? "banana"
            : "none"
        );

      }
    );

  }, []);


  /*
   * 通常のムチ
   */

  const advanceHorse =
    async () => {

      if (
        !id ||
        !raceStarted ||
        !player ||
        player.finished ||
        pressing ||
        raceEvent === "banana"
      ) {
        return;
      }


      try {

        setPressing(true);


        await updateDoc(
          doc(
            db,
            "players",
            id
          ),
          {
            score:
              increment(1),
          }
        );


      } catch (error) {

        console.error(
          "ムチ処理エラー",
          error
        );

      } finally {

        setPressing(false);

      }

    };


  /*
   * バナナ
   */

  const hitBanana =
    async () => {

      if (
        !id ||
        !raceStarted ||
        !player ||
        player.finished ||
        pressing ||
        raceEvent !== "banana"
      ) {
        return;
      }


      try {

        setPressing(true);


        await updateDoc(
          doc(
            db,
            "players",
            id
          ),
          {
            score:
              increment(-30),
          }
        );


        /*
         * バナナを踏んだ後は
         * 自分の画面だけ通常画面へ戻す
         */

        setRaceEvent(
          "none"
        );


      } catch (error) {

        console.error(
          "バナナ処理エラー",
          error
        );

      } finally {

        setPressing(false);

      }

    };


  /*
   * 参加者情報読み込み中
   */

  if (!player) {

    return (

      <div
        className="derby-container"
      >

        <div
          className="card"
          style={{
            textAlign:
              "center",
          }}
        >

          <h2>
            参加者情報を読み込んでいます…
          </h2>

        </div>

      </div>

    );

  }


  /*
   * ゴール後
   */

  if (player.finished) {

    return (

      <div
        className="derby-container"
        style={{
          minHeight:
            "100vh",
          display:
            "flex",
          alignItems:
            "center",
          justifyContent:
            "center",
          padding:
            "20px",
          boxSizing:
            "border-box",
        }}
      >

        <div
          className="card"
          style={{
            width:
              "100%",
            maxWidth:
              "600px",
            textAlign:
              "center",
          }}
        >

          <div
            style={{
              fontSize:
                "90px",
            }}
          >
            🏁
          </div>


          <h1>
            GOAL!!
          </h1>


          <h2>
            🐎 {player.horseName}
          </h2>


          <p
            style={{
              fontSize:
                "20px",
              fontWeight:
                700,
            }}
          >
            お疲れさまでした！
          </p>


          <p
            style={{
              color:
                "#777",
            }}
          >
            レースは終了しました。
          </p>

        </div>

      </div>

    );

  }


  return (

    <div
      className="derby-container"
      style={{
        minHeight:
          "100vh",
        display:
          "flex",
        alignItems:
          "center",
        justifyContent:
          "center",
        padding:
          "20px",
        boxSizing:
          "border-box",
      }}
    >

      <div
        className="card"
        style={{
          width:
            "100%",
          maxWidth:
            "600px",
          textAlign:
            "center",
        }}
      >

        <div
          style={{
            fontSize:
              "70px",
          }}
        >
          🐎
        </div>


        <h1>
          {player.horseName}
        </h1>


        <h2>
          👤 {player.playerName}
        </h2>


        {
          /*
           * 現在ポイント
           */

          raceStarted &&

          <div
            style={{
              margin:
                "20px 0",
              padding:
                "12px",
              borderRadius:
                "15px",
              background:
                "#f3f3f3",
            }}
          >

            <div
              style={{
                fontSize:
                  "15px",
                color:
                  "#777",
              }}
            >
              現在ポイント
            </div>


            <div
              style={{
                fontSize:
                  "48px",
                fontWeight:
                  900,
              }}
            >
              {player.score}
            </div>

          </div>

        }


        {
          !raceStarted &&

          <div>

            <h2>
              🟢 レース待機中
            </h2>

            <p>
              管理者がレースを開始するまで
              <br />
              お待ちください。
            </p>

          </div>

        }


        {
          raceStarted &&

          <div>

            {
              raceEvent === "banana"

              ?

              /*
               * 🍌 バナナ
               */

              <div>

                <h2>
                  🍌 バナナ出現！
                </h2>


                <p
                  style={{
                    fontSize:
                      "20px",
                    fontWeight:
                      700,
                  }}
                >
                  踏まないように注意！
                </p>


                <button
                  onClick={
                    hitBanana
                  }
                  disabled={
                    pressing
                  }
                  style={{
                    width:
                      "100%",
                    minHeight:
                      "240px",
                    fontSize:
                      "100px",
                    fontWeight:
                      900,
                    borderRadius:
                      "30px",
                    cursor:
                      pressing
                        ? "default"
                        : "pointer",
                    touchAction:
                      "manipulation",
                  }}
                >

                  🍌

                  <br />

                  <span
                    style={{
                      fontSize:
                        "28px",
                    }}
                  >
                    踏むと -30！
                  </span>

                </button>


                <p
                  style={{
                    marginTop:
                      "15px",
                    fontSize:
                      "16px",
                    color:
                      "#777",
                  }}
                >
                  ⚠️ バナナを避けて！
                </p>

              </div>

              :

              /*
               * 通常レース
               */

              <div>

                <h2>
                  🏇 レース開催中！
                </h2>


                <button
                  onClick={
                    advanceHorse
                  }
                  disabled={
                    pressing
                  }
                  style={{
                    width:
                      "100%",
                    minHeight:
                      "200px",
                    fontSize:
                      "32px",
                    fontWeight:
                      900,
                    borderRadius:
                      "25px",
                    cursor:
                      pressing
                        ? "default"
                        : "pointer",
                    touchAction:
                      "manipulation",
                  }}
                >

                  🐎
                  <br />

                  {
                    pressing
                      ? "進んでいます！"
                      : "ムチを入れる！"
                  }

                </button>


                <p
                  style={{
                    marginTop:
                      "20px",
                    fontSize:
                      "15px",
                    color:
                      "#777",
                  }}
                >
                  ムチを入れて
                  <br />
                  あなたの馬を加速させよう！
                </p>

              </div>

            }

          </div>

        }

      </div>

    </div>

  );

}


export default PlayPage;