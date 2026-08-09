import {
  useEffect,
  useState,
} from "react"

import {
  useGame,
} from "../context/GameContext"

import {
  subscribePlayers,
  subscribeRaceStarted,
  type Player,
} from "../firebase/gameService"

import "../styles/derby.css"


function GamePage() {

  const {
    eventInfo,
  } = useGame()


  const [
    players,
    setPlayers,
  ] = useState<Player[]>([])


  const [
    raceStarted,
    setRaceStarted,
  ] = useState(false)


  const [
    positions,
    setPositions,
  ] = useState<number[]>([])


  const [
    ranking,
    setRanking,
  ] = useState<number[]>([])


  const [
    count,
    setCount,
  ] = useState(3)


  useEffect(() => {

    return subscribePlayers(
      setPlayers
    )

  }, [])


  useEffect(() => {

    return subscribeRaceStarted(
      setRaceStarted
    )

  }, [])


  useEffect(() => {

    if (!raceStarted) {

      setPositions(
        players.map(() => 0)
      )

      setRanking([])

      setCount(3)

      return

    }


    setPositions(
      players.map(() => 0)
    )

    setRanking([])

    setCount(3)


    const timer =
      setInterval(() => {

        setCount(prev => {

          if (prev <= 1) {

            clearInterval(timer)

            return 0

          }

          return prev - 1

        })

      }, 1000)


    return () =>
      clearInterval(timer)

  }, [
    raceStarted,
    players,
  ])


  useEffect(() => {

    if (
      !raceStarted ||
      count !== 0 ||
      players.length === 0
    ) {

      return

    }


    const raceTimer =
      setInterval(() => {

        setPositions(prev => {

          const next =
            prev.map(value => {

              const speed =
                Math.floor(
                  Math.random() * 8
                ) + 3

              return Math.min(
                value + speed,
                100
              )

            })


          setRanking(current => {

            const updated = [
              ...current
            ]


            next.forEach(
              (value, index) => {

                if (
                  value >= 100 &&
                  !updated.includes(index)
                ) {

                  updated.push(index)

                }

              }
            )


            return updated

          })


          return next

        })

      }, 180)


    return () =>
      clearInterval(raceTimer)

  }, [
    raceStarted,
    count,
    players.length,
  ])


  const getHorseTop = (
    index: number
  ) => {

    if (players.length <= 1) {
      return 45
    }

    return (
      8 +
      (
        index /
        (players.length - 1)
      ) *
      78
    )

  }


  return (

    <div
      className="derby-container"
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(#8ed0ff 0%, #c9edff 32%, #77b84d 33%, #4d8d32 100%)",
        padding: "20px",
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >


      <div
        style={{
          textAlign: "center",
          marginBottom: "12px",
        }}
      >

        <div
          style={{
            fontSize: "clamp(24px, 4vw, 48px)",
            fontWeight: "bold",
            color: "#ffffff",
            textShadow:
              "3px 3px 6px rgba(0,0,0,0.6)",
          }}
        >
          💍 {eventInfo.title}
        </div>


        <div
          style={{
            fontSize: "clamp(14px, 2vw, 24px)",
            fontWeight: "bold",
            color: "#ffffff",
            textShadow:
              "2px 2px 4px rgba(0,0,0,0.6)",
          }}
        >
          {eventInfo.groom}
          {" × "}
          {eventInfo.bride}
        </div>

      </div>


      {
        !raceStarted &&

        <div
          style={{
            position: "fixed",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background:
              "rgba(0,0,0,0.45)",
            zIndex: 100,
          }}
        >

          <div
            style={{
              background: "#ffffff",
              borderRadius: "24px",
              padding: "40px",
              textAlign: "center",
              boxShadow:
                "0 10px 40px rgba(0,0,0,0.4)",
              maxWidth: "600px",
              width: "80%",
            }}
          >

            <div
              style={{
                fontSize: "clamp(32px, 6vw, 64px)",
              }}
            >
              🏇
            </div>

            <h1>
              レース待機中
            </h1>

            <p
              style={{
                fontSize: "clamp(18px, 3vw, 32px)",
              }}
            >
              管理画面から
              <br />
              レースを開始してください
            </p>

          </div>

        </div>

      }


      {
        raceStarted &&
        count > 0 &&

        <div
          style={{
            position: "fixed",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background:
              "rgba(0,0,0,0.35)",
            zIndex: 100,
          }}
        >

          <div
            style={{
              fontSize:
                "clamp(120px, 25vw, 300px)",
              fontWeight: "900",
              color: "#ffffff",
              textShadow:
                "8px 8px 0 #222",
            }}
          >
            {count}
          </div>

        </div>

      }


      {
        raceStarted &&
        count === 0 &&
        ranking.length < players.length &&

        <div
          style={{
            textAlign: "center",
            margin:
              "8px 0 14px",
          }}
        >

          <span
            style={{
              display: "inline-block",
              background: "#d71920",
              color: "#ffffff",
              fontSize:
                "clamp(18px, 3vw, 34px)",
              fontWeight: "900",
              padding:
                "6px 24px",
              borderRadius: "999px",
              boxShadow:
                "0 4px 12px rgba(0,0,0,0.35)",
            }}
          >
            🏁 RACE START!
          </span>

        </div>

      }


      <div
        style={{
          display: "flex",
          gap: "16px",
          width: "100%",
          maxWidth: "1600px",
          margin: "0 auto",
          alignItems: "stretch",
        }}
      >


        <div
          style={{
            position: "relative",
            flex: 1,
            minWidth: 0,
            height:
              "clamp(420px, 70vh, 760px)",
            background:
              "linear-gradient(#6eaa45 0%, #4e8630 100%)",
            border:
              "8px solid #ffffff",
            borderRadius: "18px",
            overflow: "hidden",
            boxShadow:
              "0 8px 25px rgba(0,0,0,0.35)",
          }}
        >


          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 0,
              height: "100%",
              backgroundImage:
                "repeating-linear-gradient(0deg, rgba(255,255,255,0.12) 0px, rgba(255,255,255,0.12) 2px, transparent 2px, transparent 55px)",
            }}
          />


          <div
            style={{
              position: "absolute",
              right: "4%",
              top: 0,
              bottom: 0,
              width: "8px",
              background: "#ffffff",
              boxShadow:
                "0 0 0 3px #222",
            }}
          >

            <div
              style={{
                position: "absolute",
                top: "50%",
                right: "12px",
                transform:
                  "translateY(-50%)",
                fontSize:
                  "clamp(30px, 5vw, 70px)",
              }}
            >
              🏁
            </div>

          </div>


          {
            players.map(
              (player, index) => {

                const position =
                  positions[index] || 0

                const top =
                  getHorseTop(index)


                return (

                  <div
                    key={index}
                    style={{
                      position: "absolute",
                      left:
                        `calc(${Math.min(position, 96)}% - 40px)`,
                      top:
                        `calc(${top}% - 30px)`,
                      width: "90px",
                      textAlign: "center",
                      transition:
                        "left 0.18s linear",
                      zIndex: 10 + index,
                    }}
                  >

                    <div
                      style={{
                        background:
                          "#ffffff",
                        color: "#111111",
                        borderRadius: "8px",
                        padding:
                          "3px 6px",
                        fontSize:
                          "clamp(9px, 1.1vw, 15px)",
                        fontWeight: "bold",
                        whiteSpace:
                          "nowrap",
                        overflow:
                          "hidden",
                        textOverflow:
                          "ellipsis",
                        boxShadow:
                          "0 2px 5px rgba(0,0,0,0.35)",
                      }}
                    >
                      {index + 1}卓
                      {" "}
                      {player.horseName}
                    </div>


                    <div
                      style={{
                        fontSize:
                          "clamp(32px, 5vw, 62px)",
                        lineHeight: 1,
                        filter:
                          "drop-shadow(3px 5px 2px rgba(0,0,0,0.35))",
                        transform:
                          "scaleX(-1)",
                      }}
                    >
                      🐎
                    </div>


                    <div
                      style={{
                        fontSize:
                          "12px",
                        color: "#ffffff",
                        fontWeight: "bold",
                        textShadow:
                          "1px 1px 3px #000",
                      }}
                    >
                      {Math.floor(
                        position
                      )}%
                    </div>

                  </div>

                )

              }
            )
          }


        </div>


        <div
          style={{
            width:
              "clamp(150px, 20vw, 280px)",
            background:
              "rgba(255,255,255,0.96)",
            borderRadius: "18px",
            padding: "14px",
            boxSizing: "border-box",
            boxShadow:
              "0 8px 25px rgba(0,0,0,0.3)",
            overflow: "hidden",
          }}
        >

          <h2
            style={{
              margin:
                "0 0 10px",
              textAlign: "center",
              fontSize:
                "clamp(18px, 2.5vw, 30px)",
            }}
          >
            🏆 順位
          </h2>


          {
            ranking.map(
              (horseIndex, rank) => (

                <div
                  key={horseIndex}
                  style={{
                    display: "flex",
                    alignItems:
                      "center",
                    gap: "6px",
                    padding:
                      "7px 4px",
                    borderBottom:
                      "1px solid #ddd",
                    fontWeight:
                      rank === 0
                        ? "900"
                        : "600",
                    fontSize:
                      "clamp(12px, 1.5vw, 18px)",
                  }}
                >

                  <span>
                    {rank === 0
                      ? "🥇"
                      : rank === 1
                        ? "🥈"
                        : rank === 2
                          ? "🥉"
                          : `${rank + 1}位`
                    }
                  </span>

                  <span
                    style={{
                      overflow: "hidden",
                      whiteSpace:
                        "nowrap",
                      textOverflow:
                        "ellipsis",
                    }}
                  >
                    {players[
                      horseIndex
                    ]?.horseName}
                  </span>

                </div>

              )
            )
          }


          {
            ranking.length === 0 &&

            <p
              style={{
                textAlign: "center",
                color: "#777",
              }}
            >
              レース開始を
              <br />
              待っています
            </p>
          }


        </div>

      </div>


      {
        ranking.length === players.length &&
        players.length > 0 &&

        <div
          style={{
            position: "fixed",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background:
              "rgba(0,0,0,0.65)",
            zIndex: 200,
          }}
        >

          <div
            style={{
              background:
                "linear-gradient(135deg, #fff8d5, #ffffff)",
              borderRadius: "30px",
              padding:
                "40px 60px",
              textAlign: "center",
              boxShadow:
                "0 15px 60px rgba(0,0,0,0.5)",
              maxWidth: "800px",
              width: "80%",
            }}
          >

            <div
              style={{
                fontSize:
                  "clamp(40px, 8vw, 100px)",
              }}
            >
              🏆
            </div>


            <h1
              style={{
                fontSize:
                  "clamp(30px, 6vw, 70px)",
                margin:
                  "10px 0",
              }}
            >
              優勝！
            </h1>


            <div
              style={{
                fontSize:
                  "clamp(28px, 5vw, 60px)",
                fontWeight:
                  "900",
              }}
            >
              🐎{" "}
              {
                players[
                  ranking[0]
                ]?.horseName
              }
            </div>


            <div
              style={{
                marginTop: "20px",
                fontSize:
                  "clamp(16px, 2.5vw, 28px)",
              }}
            >
              1着
              {"　"}
              {
                players[
                  ranking[0]
                ]?.playerName
              }
              さん
            </div>


            <hr
              style={{
                margin:
                  "25px 0",
              }}
            />


            <div
              style={{
                display:
                  "grid",
                gridTemplateColumns:
                  "1fr 1fr",
                gap:
                  "8px 30px",
                textAlign:
                  "left",
                fontSize:
                  "clamp(13px, 1.8vw, 20px)",
              }}
            >

              {
                ranking.map(
                  (horseIndex, rank) => (

                    <div
                      key={horseIndex}
                    >
                      {rank + 1}位
                      {" "}
                      {
                        players[
                          horseIndex
                        ]?.horseName
                      }
                    </div>

                  )
                )
              }

            </div>

          </div>

        </div>

      }

    </div>

  )

}


export default GamePage