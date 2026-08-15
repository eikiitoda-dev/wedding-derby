import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  doc,
  onSnapshot,
  runTransaction,
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
  lastBananaEventId?: number;
  eventType?: "none" | "banana";
  eventId?: number;
  eventExpiresAt?: number;
};


type RaceEvent = {
  type: "none" | "banana";
  eventId: number;
  expiresAt: number;
};


const WHIP_POINT = 1;
const BANANA_PENALTY = 30;


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
  ] = useState<RaceEvent>({
    type: "none",
    eventId: 0,
    expiresAt: 0,
  });


  const [
    bananaRemaining,
    setBananaRemaining,
  ] = useState(0);


  const [
    bananaMessage,
    setBananaMessage,
  ] = useState<
    "none" | "hit" | "avoided"
  >("none");


  /*
   * 同じバナナを連打して
   * 複数回ペナルティを受けるのを
   * 画面側でも即時に防ぐ。
   */
  const processedBananaRef =
    useRef<Set<number>>(
      new Set()
    );


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

          lastBananaEventId:
            data.lastBananaEventId ?? 0,

          eventType:
            data.eventType === "banana"
              ? "banana"
              : "none",

          eventId:
            Number(
              data.eventId ?? 0
            ),

          eventExpiresAt:
            Number(
              data.eventExpiresAt ?? 0
            ),

        });


        const personalEventType =
          data.eventType === "banana"
            ? "banana"
            : "none";

        const personalEventId =
          Number(
            data.eventId ?? 0
          );

        const personalExpiresAt =
          Number(
            data.eventExpiresAt ?? 0
          );


        if (
          personalEventType === "banana" &&
          personalEventId > 0 &&
          personalExpiresAt > Date.now()
        ) {
          setRaceEvent({
            type: "banana",
            eventId:
              personalEventId,
            expiresAt:
              personalExpiresAt,
          });

          setBananaMessage(
            "none"
          );
        } else {
          setRaceEvent({
            type: "none",
            eventId:
              personalEventId,
            expiresAt: 0,
          });
        }

      }
    );

  }, [id]);


  /*
   * レース開始状態を監視
   *
   * バナナはgame/statusではなく、
   * 自分自身のplayers/{id}を監視する。
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

      }
    );

  }, []);


  /*
   * バナナの残り時間
   *
   * Firestore側でイベント解除される前でも、
   * 有効期限を過ぎたら参加者画面では
   * 自動的に通常のムチ画面へ戻す。
   */

  useEffect(() => {

    if (
      raceEvent.type !== "banana"
    ) {

      setBananaRemaining(0);

      return;
    }


    const updateRemaining =
      () => {

        const remaining =
          Math.max(
            raceEvent.expiresAt -
            Date.now(),
            0
          );


        setBananaRemaining(
          remaining
        );


        if (
          remaining <= 0
        ) {

          if (
            !processedBananaRef.current.has(
              raceEvent.eventId
            )
          ) {

            setBananaMessage(
              "avoided"
            );

          }


          setRaceEvent(
            current => (
              current.eventId ===
              raceEvent.eventId
                ? {
                    type: "none",
                    eventId:
                      current.eventId,
                    expiresAt: 0,
                  }
                : current
            )
          );

        }

      };


    updateRemaining();


    const timer =
      window.setInterval(
        updateRemaining,
        100
      );


    return () => {

      window.clearInterval(
        timer
      );

    };

  }, [
    raceEvent.type,
    raceEvent.eventId,
    raceEvent.expiresAt,
  ]);


  /*
   * 「回避成功」「踏んだ」の表示は
   * 少しだけ出して自動で消す。
   */

  useEffect(() => {

    if (
      bananaMessage === "none"
    ) {
      return;
    }


    const timer =
      window.setTimeout(
        () => {
          setBananaMessage(
            "none"
          );
        },
        1400
      );


    return () => {

      window.clearTimeout(
        timer
      );

    };

  }, [bananaMessage]);


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
        raceEvent.type === "banana"
      ) {
        return;
      }


      try {

        setPressing(true);


        const playerRef =
          doc(
            db,
            "players",
            id
          );


        await runTransaction(
          db,
          async transaction => {

            const snapshot =
              await transaction.get(
                playerRef
              );


            if (
              !snapshot.exists()
            ) {
              return;
            }


            const data =
              snapshot.data();


            if (
              data.finished === true
            ) {
              return;
            }


            const currentScore =
              Number(
                data.score ?? 0
              );


            transaction.update(
              playerRef,
              {
                score:
                  currentScore +
                  WHIP_POINT,
              }
            );

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
   * 🍌 バナナ
   *
   * バナナ表示中に、
   * ムチを押す感覚でこのボタンを
   * 押してしまうと -30。
   *
   * lastBananaEventId を参加者データへ残すので、
   * 同じイベントを連打したり、
   * 同じ参加者画面を複数端末で開いても、
   * 1イベントにつき1回しか減点されない。
   */

  const hitBanana =
    async () => {

      if (
        !id ||
        !raceStarted ||
        !player ||
        player.finished ||
        pressing ||
        raceEvent.type !== "banana" ||
        raceEvent.eventId <= 0 ||
        raceEvent.expiresAt <=
          Date.now()
      ) {
        return;
      }


      const eventId =
        raceEvent.eventId;


      if (
        processedBananaRef.current.has(
          eventId
        )
      ) {
        return;
      }


      processedBananaRef.current.add(
        eventId
      );


      try {

        setPressing(true);


        const playerRef =
          doc(
            db,
            "players",
            id
          );


        await runTransaction(
          db,
          async transaction => {

            const snapshot =
              await transaction.get(
                playerRef
              );


            if (
              !snapshot.exists()
            ) {
              return;
            }


            const data =
              snapshot.data();


            if (
              data.finished === true
            ) {
              return;
            }


            if (
              Number(
                data.lastBananaEventId ??
                0
              ) === eventId
            ) {
              return;
            }


            const currentScore =
              Number(
                data.score ?? 0
              );


            transaction.update(
              playerRef,
              {
                score:
                  currentScore -
                  BANANA_PENALTY,

                lastBananaEventId:
                  eventId,

                eventType:
                  "none",

                eventExpiresAt:
                  0,
              }
            );

          }
        );


        setBananaMessage(
          "hit"
        );


        /*
         * 踏んだ本人だけは
         * すぐ通常画面へ戻す。
         * 他の参加者のバナナはそのまま残る。
         */
        setRaceEvent(
          current => (
            current.eventId ===
            eventId
              ? {
                  type: "none",
                  eventId,
                  expiresAt: 0,
                }
              : current
          )
        );


      } catch (error) {

        /*
         * 通信失敗時は、
         * もう一度押せるように戻す。
         */
        processedBananaRef.current.delete(
          eventId
        );


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
              lineHeight: 1,
            }}
          >
            🏁
          </div>


          <h1
            style={{
              marginBottom:
                "8px",
            }}
          >
            GOAL!!
          </h1>


          <h2>
            🐎 {player.horseName}
          </h2>


          <div
            style={{
              margin:
                "18px auto",
              padding:
                "12px 18px",
              maxWidth:
                "280px",
              borderRadius:
                "16px",
              background:
                "#f3f3f3",
            }}
          >

            <div
              style={{
                fontSize:
                  "14px",
                color:
                  "#777",
              }}
            >
              最終ポイント
            </div>


            <div
              style={{
                fontSize:
                  "42px",
                fontWeight:
                  900,
              }}
            >
              {player.score}
            </div>

          </div>


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
            ゴール後は操作できません。
          </p>

        </div>

      </div>

    );

  }


  const bananaSeconds =
    Math.max(
      bananaRemaining / 1000,
      0
    ).toFixed(1);


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
              "64px",
            lineHeight: 1,
          }}
        >
          🐎
        </div>


        <h1
          style={{
            marginBottom:
              "6px",
          }}
        >
          {player.horseName}
        </h1>


        <h2
          style={{
            marginTop:
              "6px",
          }}
        >
          👤 {player.playerName}
        </h2>


        {
          raceStarted &&

          <div
            style={{
              margin:
                "18px 0",
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
                lineHeight:
                  1.15,
                fontWeight:
                  900,
              }}
            >
              {player.score}
            </div>

          </div>

        }


        {
          bananaMessage === "hit" &&

          <div
            style={{
              margin:
                "10px 0 16px",
              padding:
                "12px",
              borderRadius:
                "14px",
              background:
                "#fff1df",
              color:
                "#9c3d00",
              fontSize:
                "20px",
              fontWeight:
                900,
            }}
          >
            🍌 踏んだ！ -{BANANA_PENALTY}ポイント
          </div>

        }


        {
          bananaMessage ===
            "avoided" &&

          <div
            style={{
              margin:
                "10px 0 16px",
              padding:
                "12px",
              borderRadius:
                "14px",
              background:
                "#e9f8e9",
              color:
                "#26752e",
              fontSize:
                "20px",
              fontWeight:
                900,
            }}
          >
            ✅ バナナ回避！
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
              raceEvent.type ===
                "banana"

              ?

              /*
               * 🍌 バナナ
               */

              <div>

                <h2
                  style={{
                    marginBottom:
                      "8px",
                  }}
                >
                  🍌 バナナ！
                </h2>


                <p
                  style={{
                    margin:
                      "0 0 12px",
                    fontSize:
                      "20px",
                    fontWeight:
                      900,
                    color:
                      "#bd5300",
                  }}
                >
                  押すな！！
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
                      "200px",
                    border:
                      "5px solid #e1a900",
                    background:
                      "linear-gradient(180deg, #fff7b5, #ffd34d)",
                    boxShadow:
                      "0 10px 26px rgba(131,85,0,0.28)",
                    fontSize:
                      "86px",
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
                    WebkitTapHighlightColor:
                      "transparent",
                  }}
                >

                  🍌

                  <br />

                  <span
                    style={{
                      display:
                        "inline-block",
                      marginTop:
                        "4px",
                      fontSize:
                        "25px",
                      color:
                        "#6e4200",
                    }}
                  >
                    踏むと -{BANANA_PENALTY}
                  </span>

                </button>


                <p
                  style={{
                    marginTop:
                      "12px",
                    marginBottom:
                      0,
                    fontSize:
                      "16px",
                    fontWeight:
                      700,
                    color:
                      "#777",
                  }}
                >
                  あと {bananaSeconds} 秒
                  <br />
                  何も押さずに耐えて！
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
                    border:
                      "4px solid #92231d",
                    background:
                      "linear-gradient(180deg, #c83b32, #9b211b)",
                    color:
                      "#ffffff",
                    boxShadow:
                      "0 10px 24px rgba(110,20,14,0.25)",
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
                    WebkitTapHighlightColor:
                      "transparent",
                  }}
                >

                  🏇
                  <br />

                  {
                    pressing
                      ? "ムチ！"
                      : "ムチを入れる！"
                  }

                </button>


                <p
                  style={{
                    marginTop:
                      "16px",
                    marginBottom:
                      0,
                    fontSize:
                      "15px",
                    color:
                      "#777",
                  }}
                >
                  1回 +{WHIP_POINT}ポイント
                  <br />
                  突然バナナに変わるので注意！
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