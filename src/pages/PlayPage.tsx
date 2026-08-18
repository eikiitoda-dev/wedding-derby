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

  const pageStyle = {
    minHeight: "100dvh",
    boxSizing: "border-box" as const,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "18px 14px",
    background:
      "radial-gradient(circle at top, #fff8e8 0%, #f6efe4 42%, #ece4d8 100%)",
    color: "#2f2923",
    fontFamily:
      '"Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif',
  };


  const cardStyle = {
    width: "min(100%, 520px)",
    boxSizing: "border-box" as const,
    padding: "22px 18px",
    border: "1px solid rgba(128,98,50,0.16)",
    borderRadius: "28px",
    background: "rgba(255,255,255,0.94)",
    boxShadow: "0 18px 52px rgba(85,65,42,0.15)",
    textAlign: "center" as const,
  };


  if (!player) {

    return (

      <div style={pageStyle}>

        <div style={cardStyle}>

          <div
            style={{
              fontSize: "42px",
              marginBottom: "12px",
            }}
          >
            🐎
          </div>

          <h2
            style={{
              margin: 0,
              fontSize: "21px",
              color: "#332c25",
            }}
          >
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

      <div style={pageStyle}>

        <div style={cardStyle}>

          <div
            style={{
              display: "inline-block",
              marginBottom: "12px",
              padding: "6px 13px",
              borderRadius: "999px",
              background: "#f6eddb",
              color: "#8b6b34",
              fontSize: "12px",
              fontWeight: 900,
              letterSpacing: "0.12em",
            }}
          >
            RACE FINISHED
          </div>


          <div
            style={{
              fontSize: "72px",
              lineHeight: 1,
              margin: "6px 0 12px",
            }}
          >
            🏁
          </div>


          <h1
            style={{
              margin: "0 0 6px",
              color: "#30281f",
              fontSize: "36px",
              fontWeight: 900,
            }}
          >
            GOAL!
          </h1>


          <div
            style={{
              color: "#8b6b34",
              fontSize: "12px",
              fontWeight: 900,
              letterSpacing: "0.12em",
              marginTop: "18px",
            }}
          >
            YOUR HORSE
          </div>


          <h2
            style={{
              margin: "4px 0 16px",
              color: "#30281f",
              fontSize: "25px",
              fontWeight: 900,
              wordBreak: "break-word",
            }}
          >
            🐎 {player.horseName}
          </h2>


          <div
            style={{
              margin: "0 auto 18px",
              padding: "16px",
              border: "1px solid rgba(161,122,52,0.22)",
              borderRadius: "18px",
              background: "linear-gradient(135deg, #fff8df, #fffdf7)",
            }}
          >

            <div
              style={{
                color: "#776d63",
                fontSize: "13px",
                fontWeight: 800,
              }}
            >
              最終ポイント
            </div>

            <div
              style={{
                marginTop: "2px",
                color: "#2c261f",
                fontSize: "48px",
                lineHeight: 1.1,
                fontWeight: 900,
              }}
            >
              {player.score}
            </div>

          </div>


          <p
            style={{
              margin: "0 0 5px",
              color: "#3e3731",
              fontSize: "18px",
              fontWeight: 900,
            }}
          >
            お疲れさまでした！
          </p>

          <p
            style={{
              margin: 0,
              color: "#81786f",
              fontSize: "13px",
            }}
          >
            結果は会場スクリーンをご覧ください
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

    <div style={pageStyle}>

      <div style={cardStyle}>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "10px",
            marginBottom: "14px",
          }}
        >

          <div
            style={{
              minWidth: 0,
              textAlign: "left",
            }}
          >

            <div
              style={{
                color: "#9b7635",
                fontSize: "11px",
                fontWeight: 900,
                letterSpacing: "0.13em",
              }}
            >
              YOUR HORSE
            </div>

            <div
              style={{
                marginTop: "2px",
                color: "#30281f",
                fontSize: "23px",
                lineHeight: 1.2,
                fontWeight: 900,
                wordBreak: "break-word",
              }}
            >
              🐎 {player.horseName}
            </div>

            <div
              style={{
                marginTop: "4px",
                color: "#766c62",
                fontSize: "13px",
                fontWeight: 700,
              }}
            >
              👤 {player.playerName}
            </div>

          </div>


          <div
            style={{
              flex: "0 0 auto",
              minWidth: "78px",
              padding: "9px 10px",
              borderRadius: "15px",
              background: raceStarted
                ? "#f7efdd"
                : "#eef3ea",
              border: raceStarted
                ? "1px solid #e5d2a5"
                : "1px solid #d5e2d0",
            }}
          >

            <div
              style={{
                color: "#776d63",
                fontSize: "10px",
                fontWeight: 900,
              }}
            >
              {raceStarted ? "POINT" : "STATUS"}
            </div>

            <div
              style={{
                marginTop: "2px",
                color: raceStarted
                  ? "#6f5022"
                  : "#41633d",
                fontSize: raceStarted
                  ? "28px"
                  : "13px",
                lineHeight: 1,
                fontWeight: 900,
              }}
            >
              {raceStarted
                ? player.score
                : "WAIT"}
            </div>

          </div>

        </div>


        {
          bananaMessage === "hit" &&

          <div
            style={{
              margin: "0 0 14px",
              padding: "12px",
              borderRadius: "14px",
              background: "#fff0df",
              color: "#9c3d00",
              fontSize: "17px",
              fontWeight: 900,
            }}
          >
            🍌 踏んだ！ -{BANANA_PENALTY}ポイント
          </div>
        }


        {
          bananaMessage === "avoided" &&

          <div
            style={{
              margin: "0 0 14px",
              padding: "12px",
              borderRadius: "14px",
              background: "#eaf7e9",
              color: "#26752e",
              fontSize: "17px",
              fontWeight: 900,
            }}
          >
            ✅ バナナ回避！
          </div>
        }


        {
          !raceStarted &&

          <div
            style={{
              padding: "26px 12px 20px",
              borderRadius: "20px",
              background:
                "linear-gradient(135deg, #fbf7ef, #f5eee3)",
              border:
                "1px solid rgba(128,98,50,0.12)",
            }}
          >

            <div
              style={{
                fontSize: "54px",
                lineHeight: 1,
                marginBottom: "14px",
              }}
            >
              🏇
            </div>

            <h2
              style={{
                margin: "0 0 8px",
                color: "#332c25",
                fontSize: "23px",
                fontWeight: 900,
              }}
            >
              レース待機中
            </h2>

            <p
              style={{
                margin: 0,
                color: "#766d64",
                fontSize: "14px",
                lineHeight: 1.7,
                fontWeight: 650,
              }}
            >
              まもなくレースが始まります。
              <br />
              この画面のままお待ちください。
            </p>

          </div>
        }


        {
          raceStarted &&

          <div>

            {
              raceEvent.type === "banana"

              ?

              <div>

                <div
                  style={{
                    marginBottom: "10px",
                  }}
                >
                  <div
                    style={{
                      color: "#bd5300",
                      fontSize: "12px",
                      fontWeight: 900,
                      letterSpacing: "0.12em",
                    }}
                  >
                    CAUTION!
                  </div>

                  <h2
                    style={{
                      margin: "3px 0 0",
                      color: "#8d3d00",
                      fontSize: "25px",
                      fontWeight: 900,
                    }}
                  >
                    🍌 押さないで！
                  </h2>
                </div>


                <button
                  type="button"
                  onClick={hitBanana}
                  disabled={pressing}
                  style={{
                    width: "100%",
                    minHeight: "230px",
                    border: "5px solid #e1a900",
                    borderRadius: "24px",
                    background:
                      "linear-gradient(180deg, #fff8b9, #ffd34d)",
                    color: "#6e4200",
                    boxShadow:
                      "0 12px 28px rgba(131,85,0,0.24)",
                    cursor: pressing
                      ? "default"
                      : "pointer",
                    touchAction: "manipulation",
                    WebkitTapHighlightColor: "transparent",
                  }}
                >

                  <div
                    style={{
                      fontSize: "92px",
                      lineHeight: 1,
                    }}
                  >
                    🍌
                  </div>

                  <div
                    style={{
                      marginTop: "10px",
                      fontSize: "22px",
                      fontWeight: 900,
                    }}
                  >
                    触ると -{BANANA_PENALTY}
                  </div>

                </button>


                <div
                  style={{
                    marginTop: "13px",
                    padding: "10px 12px",
                    borderRadius: "13px",
                    background: "#fff7e8",
                    color: "#75501b",
                    fontSize: "14px",
                    lineHeight: 1.55,
                    fontWeight: 800,
                  }}
                >
                  あと <strong>{bananaSeconds}秒</strong>
                  <br />
                  何も押さずに待てば回避成功！
                </div>

              </div>

              :

              <div>

                <div
                  style={{
                    marginBottom: "10px",
                  }}
                >
                  <div
                    style={{
                      color: "#9b7635",
                      fontSize: "12px",
                      fontWeight: 900,
                      letterSpacing: "0.12em",
                    }}
                  >
                    RACE ON
                  </div>

                  <h2
                    style={{
                      margin: "3px 0 0",
                      color: "#332c25",
                      fontSize: "23px",
                      fontWeight: 900,
                    }}
                  >
                    🏇 ムチで応援！
                  </h2>
                </div>


                <button
                  type="button"
                  onClick={advanceHorse}
                  disabled={pressing}
                  style={{
                    width: "100%",
                    minHeight: "230px",
                    border: "4px solid #7f1d18",
                    borderRadius: "24px",
                    background:
                      pressing
                        ? "linear-gradient(180deg, #ad3932, #84201b)"
                        : "linear-gradient(180deg, #c84339, #95231d)",
                    color: "#ffffff",
                    boxShadow:
                      "0 12px 28px rgba(110,20,14,0.25)",
                    cursor: pressing
                      ? "default"
                      : "pointer",
                    touchAction: "manipulation",
                    WebkitTapHighlightColor: "transparent",
                  }}
                >

                  <div
                    style={{
                      fontSize: "68px",
                      lineHeight: 1,
                    }}
                  >
                    🏇
                  </div>

                  <div
                    style={{
                      marginTop: "13px",
                      fontSize: "29px",
                      lineHeight: 1.15,
                      fontWeight: 900,
                    }}
                  >
                    {pressing
                      ? "ムチ！"
                      : "ムチを入れる！"}
                  </div>

                  <div
                    style={{
                      marginTop: "8px",
                      fontSize: "13px",
                      fontWeight: 800,
                      opacity: 0.88,
                    }}
                  >
                    TAP!
                  </div>

                </button>


                <p
                  style={{
                    margin: "13px 0 0",
                    color: "#766d64",
                    fontSize: "13px",
                    lineHeight: 1.6,
                    fontWeight: 700,
                  }}
                >
                  1回 +{WHIP_POINT}ポイント
                  <br />
                  🍌 バナナに変わったら押さないで！
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