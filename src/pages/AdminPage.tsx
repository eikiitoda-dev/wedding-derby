import {
  useEffect,
  useMemo,
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


  const tableGroups =
    useMemo(
      () => {

        const groups =
          new Map<
            number,
            Player[]
          >();


        players.forEach(
          player => {

            const table =
              Number(
                player.tableNumber
              );


            const current =
              groups.get(
                table
              ) ?? [];


            current.push(
              player
            );


            groups.set(
              table,
              current
            );

          }
        );


        return Array.from(
          groups.entries()
        ).sort(
          (a, b) =>
            a[0] -
            b[0]
        );

      },
      [players]
    );


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


      navigate(
        "/game"
      );


    } catch (error) {

      console.error(
        error
      );


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

      setResetting(
        true
      );


      await resetGame();


      alert(
        "ゲームをリセットしました。"
      );


    } catch (error) {

      console.error(
        error
      );


      alert(
        "リセットに失敗しました。"
      );


    } finally {

      setResetting(
        false
      );

    }

  }


  return (

    <div
      style={{
        minHeight:
          "100dvh",
        boxSizing:
          "border-box",
        padding:
          "30px 18px 42px",
        background:
          "radial-gradient(circle at top, #fff8e8 0%, #f6efe4 40%, #ece4d8 100%)",
        color:
          "#2f2923",
        fontFamily:
          '"Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif',
      }}
    >

      <div
        style={{
          width:
            "min(100%, 1080px)",
          margin:
            "0 auto",
        }}
      >

        <div
          style={{
            textAlign:
              "center",
            marginBottom:
              "24px",
          }}
        >

          <div
            style={{
              display:
                "inline-flex",
              alignItems:
                "center",
              gap:
                "8px",
              marginBottom:
                "10px",
              padding:
                "7px 14px",
              border:
                "1px solid rgba(153,116,51,0.26)",
              borderRadius:
                "999px",
              background:
                "rgba(255,255,255,0.72)",
              color:
                "#8b6b34",
              fontSize:
                "12px",
              fontWeight:
                900,
              letterSpacing:
                "0.12em",
            }}
          >
            💍 WEDDING DERBY
          </div>


          <h1
            style={{
              margin:
                0,
              color:
                "#30281f",
              fontSize:
                "clamp(32px, 5vw, 52px)",
              lineHeight:
                1.05,
              fontWeight:
                900,
              letterSpacing:
                "-0.03em",
            }}
          >
            管理画面
          </h1>


          <p
            style={{
              margin:
                "10px 0 0",
              color:
                "#746a61",
              fontSize:
                "14px",
              fontWeight:
                650,
            }}
          >
            参加状況を確認して、レースを開始します
          </p>

        </div>


        <div
          style={{
            display:
              "grid",
            gridTemplateColumns:
              "minmax(0, 1fr)",
            gap:
              "18px",
          }}
        >

          <div
            style={{
              padding:
                "24px",
              border:
                "1px solid rgba(128,98,50,0.15)",
              borderRadius:
                "26px",
              background:
                "rgba(255,255,255,0.94)",
              boxShadow:
                "0 18px 52px rgba(85,65,42,0.13)",
            }}
          >

            <div
              style={{
                display:
                  "flex",
                justifyContent:
                  "space-between",
                gap:
                  "16px",
                alignItems:
                  "center",
                flexWrap:
                  "wrap",
                marginBottom:
                  "18px",
              }}
            >

              <div>

                <div
                  style={{
                    color:
                      "#9b7635",
                    fontSize:
                      "11px",
                    fontWeight:
                      900,
                    letterSpacing:
                      "0.13em",
                  }}
                >
                  ENTRY STATUS
                </div>

                <h2
                  style={{
                    margin:
                      "3px 0 0",
                    color:
                      "#332c25",
                    fontSize:
                      "24px",
                    fontWeight:
                      900,
                  }}
                >
                  🏇 出走馬一覧
                </h2>

              </div>


              <div
                style={{
                  minWidth:
                    "130px",
                  padding:
                    "10px 14px",
                  borderRadius:
                    "16px",
                  background:
                    "#f7efdd",
                  border:
                    "1px solid #e5d2a5",
                  textAlign:
                    "center",
                }}
              >

                <div
                  style={{
                    color:
                      "#7a6e61",
                    fontSize:
                      "10px",
                    fontWeight:
                      900,
                  }}
                >
                  PARTICIPANTS
                </div>

                <div
                  style={{
                    marginTop:
                      "2px",
                    color:
                      "#6f5022",
                    fontSize:
                      "28px",
                    lineHeight:
                      1,
                    fontWeight:
                      900,
                  }}
                >
                  {players.length}
                  <span
                    style={{
                      marginLeft:
                        "3px",
                      fontSize:
                        "13px",
                    }}
                  >
                    名
                  </span>
                </div>

              </div>

            </div>


            {
              players.length === 0
                ? (

                  <div
                    style={{
                      padding:
                        "34px 20px",
                      borderRadius:
                        "20px",
                      background:
                        "#faf7f2",
                      border:
                        "1px dashed #d6c7b2",
                      textAlign:
                        "center",
                      color:
                        "#7c7268",
                    }}
                  >

                    <div
                      style={{
                        fontSize:
                          "44px",
                        lineHeight:
                          1,
                        marginBottom:
                          "10px",
                      }}
                    >
                      🐎
                    </div>

                    <div
                      style={{
                        fontSize:
                          "18px",
                        fontWeight:
                          900,
                        color:
                          "#4d453e",
                      }}
                    >
                      参加者はいません
                    </div>

                    <div
                      style={{
                        marginTop:
                          "5px",
                        fontSize:
                          "13px",
                      }}
                    >
                      ゲストが参加登録すると、ここに表示されます
                    </div>

                  </div>

                )
                : (

                  <div
                    style={{
                      display:
                        "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(230px, 1fr))",
                      gap:
                        "12px",
                    }}
                  >

                    {
                      tableGroups.map(
                        (
                          [
                            tableNumber,
                            tablePlayers,
                          ]
                        ) => {

                          const horseName =
                            tablePlayers[0]
                              ?.horseName ??
                            `テスト馬${tableNumber}`;

                          const totalScore =
                            tablePlayers.reduce(
                              (
                                sum,
                                player
                              ) =>
                                sum +
                                Number(
                                  player.score ??
                                  0
                                ),
                              0
                            );


                          return (

                            <div
                              key={
                                tableNumber
                              }
                              style={{
                                padding:
                                  "15px",
                                border:
                                  "1px solid rgba(128,98,50,0.13)",
                                borderRadius:
                                  "17px",
                                background:
                                  "linear-gradient(135deg, #fffdf9, #fbf6ee)",
                              }}
                            >

                              <div
                                style={{
                                  display:
                                    "flex",
                                  alignItems:
                                    "center",
                                  justifyContent:
                                    "space-between",
                                  gap:
                                    "8px",
                                  marginBottom:
                                    "10px",
                                }}
                              >

                                <div
                                  style={{
                                    color:
                                      "#8a6a34",
                                    fontSize:
                                      "12px",
                                    fontWeight:
                                      900,
                                  }}
                                >
                                  {tableNumber}卓
                                </div>

                                <div
                                  style={{
                                    padding:
                                      "4px 8px",
                                    borderRadius:
                                      "999px",
                                    background:
                                      "#f0e5d0",
                                    color:
                                      "#6f6254",
                                    fontSize:
                                      "11px",
                                    fontWeight:
                                      900,
                                  }}
                                >
                                  {tablePlayers.length}名
                                </div>

                              </div>


                              <div
                                style={{
                                  color:
                                    "#2f2923",
                                  fontSize:
                                    "18px",
                                  lineHeight:
                                    1.25,
                                  fontWeight:
                                    900,
                                  wordBreak:
                                    "break-word",
                                }}
                              >
                                🐎 {horseName}
                              </div>


                              <div
                                style={{
                                  marginTop:
                                    "8px",
                                  color:
                                    "#746a61",
                                  fontSize:
                                    "12px",
                                  lineHeight:
                                    1.6,
                                }}
                              >
                                {tablePlayers
                                  .map(
                                    player =>
                                      player.playerName
                                  )
                                  .join(
                                    " / "
                                  )}
                              </div>


                              <div
                                style={{
                                  marginTop:
                                    "10px",
                                  paddingTop:
                                    "9px",
                                  borderTop:
                                    "1px solid rgba(128,98,50,0.10)",
                                  color:
                                    "#6d5b40",
                                  fontSize:
                                    "12px",
                                  fontWeight:
                                    800,
                                }}
                              >
                                合計ポイント：
                                {totalScore}
                              </div>

                            </div>

                          );

                        }
                      )
                    }

                  </div>

                )
            }

          </div>


          <div
            style={{
              display:
                "grid",
              gridTemplateColumns:
                "minmax(0, 1fr)",
              gap:
                "12px",
            }}
          >

            <button
              type="button"
              disabled={
                players.length === 0
              }
              onClick={
                handleStartRace
              }
              style={{
                width:
                  "100%",
                minHeight:
                  "62px",
                border:
                  "none",
                borderRadius:
                  "18px",
                background:
                  players.length > 0
                    ? "linear-gradient(135deg, #9c742f, #c7a65c)"
                    : "#d7d0c6",
                color:
                  players.length > 0
                    ? "#ffffff"
                    : "#80776e",
                fontSize:
                  "18px",
                fontWeight:
                  900,
                boxShadow:
                  players.length > 0
                    ? "0 12px 26px rgba(137,101,43,0.26)"
                    : "none",
                cursor:
                  players.length > 0
                    ? "pointer"
                    : "default",
              }}
            >
              🏁 レース開始
            </button>


            <div
              style={{
                marginTop:
                  "8px",
                padding:
                  "18px",
                border:
                  "1px solid rgba(132,78,78,0.12)",
                borderRadius:
                  "18px",
                background:
                  "rgba(255,248,246,0.90)",
              }}
            >

              <div
                style={{
                  marginBottom:
                    "9px",
                  color:
                    "#9a5d57",
                  fontSize:
                    "11px",
                  fontWeight:
                    900,
                  letterSpacing:
                    "0.12em",
                }}
              >
                DANGER ZONE
              </div>

              <button
                type="button"
                onClick={
                  handleResetGame
                }
                disabled={
                  resetting
                }
                style={{
                  width:
                    "100%",
                  minHeight:
                    "50px",
                  border:
                    "1px solid #cfa4a0",
                  borderRadius:
                    "14px",
                  background:
                    resetting
                      ? "#ddd5d3"
                      : "#fff4f2",
                  color:
                    "#87413a",
                  fontSize:
                    "15px",
                  fontWeight:
                    900,
                  cursor:
                    resetting
                      ? "default"
                      : "pointer",
                }}
              >
                {
                  resetting
                    ? "リセット中..."
                    : "🔄 ゲームリセット"
                }
              </button>

              <p
                style={{
                  margin:
                    "9px 0 0",
                  color:
                    "#8b7773",
                  fontSize:
                    "11px",
                  lineHeight:
                    1.5,
                  textAlign:
                    "center",
                }}
              >
                参加者・ポイント・レース状態をすべて削除します
              </p>

            </div>

          </div>

        </div>

      </div>

    </div>

  );

}


export default AdminPage;