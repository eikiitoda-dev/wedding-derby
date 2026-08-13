import {
  useEffect,
  useRef,
  useState,
} from "react"

import {
  collection,
  doc,
  getDocs,
  updateDoc,
} from "firebase/firestore"

import {
  useGame,
} from "../context/GameContext"

import {
  subscribePlayers,
  subscribeRaceStarted,
  setRaceEvent,
  type Player,
} from "../firebase/gameService"

import {
  db,
} from "../firebase"

import "../styles/derby.css"


type TableHorse = {
  tableNumber: number
  horseName: string
  totalScore: number
  averageScore: number
  memberCount: number
}


type HorsePosition = {
  [tableNumber: number]: number
}


const SILK_COLORS = [
  "#e53935",
  "#1e88e5",
  "#fdd835",
  "#43a047",
  "#8e24aa",
  "#fb8c00",
  "#00acc1",
  "#d81b60",
]


function clamp(
  value: number,
  minimum: number,
  maximum: number
) {

  return Math.min(
    Math.max(
      value,
      minimum
    ),
    maximum
  )

}


function wrap(
  value: number,
  size: number
) {

  return (
    (
      value % size
    ) + size
  ) % size

}


/*
 * 競走馬＋騎手
 */

function RaceHorse({
  silkColor,
  finished,
  leader,
}: {
  silkColor: string
  finished: boolean
  leader: boolean
}) {

  return (

    <svg
      viewBox="0 0 180 120"
      width={
        leader
          ? 150
          : 138
      }
      height={
        leader
          ? 100
          : 92
      }
      style={{
        display: "block",
        overflow: "visible",
        filter:
          leader
            ? "drop-shadow(0 0 8px rgba(255,215,0,.8)) drop-shadow(0 7px 4px rgba(0,0,0,.38))"
            : "drop-shadow(0 7px 4px rgba(0,0,0,.38))",
      }}
    >

      {/*
       * 馬の尻尾
       */}

      <path
        d="M35 54 C11 49 7 63 17 72 C26 74 31 67 38 61"
        fill="none"
        stroke="#25160f"
        strokeWidth="7"
        strokeLinecap="round"
      />


      {/*
       * 胴体
       */}

      <ellipse
        cx="78"
        cy="59"
        rx="46"
        ry="28"
        fill="#704524"
      />


      {/*
       * 胸
       */}

      <ellipse
        cx="108"
        cy="55"
        rx="23"
        ry="24"
        fill="#744826"
      />


      {/*
       * 首
       */}

      <path
        d="M104 50 C112 34 117 20 131 13 C143 7 153 14 148 25 L127 56 Z"
        fill="#754827"
      />


      {/*
       * たてがみ
       */}

      <path
        d="M126 17 C116 23 112 34 108 47 L116 51 C121 39 126 27 137 19 Z"
        fill="#21130d"
      />


      {/*
       * 頭
       */}

      <path
        d="M132 12 C148 5 166 13 172 23 C164 31 151 32 139 26 L126 21 Z"
        fill="#79502c"
      />


      {/*
       * 耳
       */}

      <path
        d="M137 13 L133 1 L144 11 Z"
        fill="#4d2d19"
      />

      <path
        d="M149 12 L154 2 L158 15 Z"
        fill="#4d2d19"
      />


      {/*
       * 目
       */}

      <circle
        cx="158"
        cy="19"
        r="2.5"
        fill="#111"
      />


      {/*
       * 鼻
       */}

      <circle
        cx="169"
        cy="25"
        r="2"
        fill="#20130d"
      />


      {/*
       * 後脚1
       */}

      <g
        className={
          finished
            ? ""
            : "horse-leg-back-a"
        }
        style={{
          transformOrigin:
            "57px 72px",
        }}
      >

        <path
          d="M59 70 C52 81 44 92 34 103"
          fill="none"
          stroke="#5d381e"
          strokeWidth="10"
          strokeLinecap="round"
        />

        <path
          d="M34 103 L23 107"
          fill="none"
          stroke="#23150e"
          strokeWidth="6"
          strokeLinecap="round"
        />

      </g>


      {/*
       * 後脚2
       */}

      <g
        className={
          finished
            ? ""
            : "horse-leg-back-b"
        }
        style={{
          transformOrigin:
            "73px 73px",
        }}
      >

        <path
          d="M74 72 C70 85 67 96 68 108"
          fill="none"
          stroke="#684023"
          strokeWidth="10"
          strokeLinecap="round"
        />

        <path
          d="M68 108 L77 111"
          fill="none"
          stroke="#23150e"
          strokeWidth="6"
          strokeLinecap="round"
        />

      </g>


      {/*
       * 前脚1
       */}

      <g
        className={
          finished
            ? ""
            : "horse-leg-front-a"
        }
        style={{
          transformOrigin:
            "108px 70px",
        }}
      >

        <path
          d="M107 69 C114 82 122 94 135 103"
          fill="none"
          stroke="#654022"
          strokeWidth="9"
          strokeLinecap="round"
        />

        <path
          d="M135 103 L146 101"
          fill="none"
          stroke="#23150e"
          strokeWidth="6"
          strokeLinecap="round"
        />

      </g>


      {/*
       * 前脚2
       */}

      <g
        className={
          finished
            ? ""
            : "horse-leg-front-b"
        }
        style={{
          transformOrigin:
            "119px 67px",
        }}
      >

        <path
          d="M118 67 C119 82 116 95 111 108"
          fill="none"
          stroke="#754827"
          strokeWidth="9"
          strokeLinecap="round"
        />

        <path
          d="M111 108 L120 112"
          fill="none"
          stroke="#23150e"
          strokeWidth="6"
          strokeLinecap="round"
        />

      </g>


      {/*
       * 鞍
       */}

      <path
        d="M68 37 C82 30 102 32 111 43 L104 54 C91 47 78 47 66 51 Z"
        fill="#202020"
      />


      {/*
       * 騎手の脚
       */}

      <path
        d="M92 37 L105 59"
        fill="none"
        stroke="#f4f4f4"
        strokeWidth="7"
        strokeLinecap="round"
      />


      {/*
       * 騎手の胴
       */}

      <path
        d="M78 13 C92 11 102 18 105 30 L96 42 L80 35 Z"
        fill={silkColor}
      />


      {/*
       * 騎手の腕
       */}

      <path
        d="M96 22 L119 33"
        fill="none"
        stroke={silkColor}
        strokeWidth="7"
        strokeLinecap="round"
      />


      {/*
       * 騎手の頭
       */}

      <circle
        cx="78"
        cy="10"
        r="9"
        fill="#efc39c"
      />


      {/*
       * ヘルメット
       */}

      <path
        d="M68 8 C71 -3 85 -5 90 6 L90 10 L68 10 Z"
        fill={silkColor}
      />


      {/*
       * 手綱
       */}

      <path
        d="M117 32 C126 32 137 28 146 25"
        fill="none"
        stroke="#2a1910"
        strokeWidth="2"
      />

    </svg>

  )

}


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
    count,
    setCount,
  ] = useState(3)


  const [
    positions,
    setPositions,
  ] = useState<HorsePosition>({})


  const raceTimerRef =
    useRef<number | null>(null)


  const eventTimerRef =
    useRef<number | null>(null)


  const eventEndTimerRef =
    useRef<number | null>(null)


  const eventCountRef =
    useRef(0)


  const finishedTablesRef =
    useRef<Set<number>>(
      new Set()
    )


  /*
   * 参加者監視
   */

  useEffect(() => {

    return subscribePlayers(
      setPlayers
    )

  }, [])


  /*
   * レース状態監視
   */

  useEffect(() => {

    return subscribeRaceStarted(
      setRaceStarted
    )

  }, [])


  /*
   * 卓単位にまとめる
   */

  const tableMap =
    new Map<number, TableHorse>()


  players.forEach(
    player => {

      const tableNumber =
        player.tableNumber ?? 0


      if (!tableNumber) {
        return
      }


      const existing =
        tableMap.get(
          tableNumber
        )


      if (existing) {

        existing.totalScore +=
          player.score ?? 0

        existing.memberCount +=
          1

      } else {

        tableMap.set(
          tableNumber,
          {

            tableNumber,

            horseName:
              player.horseName,

            totalScore:
              player.score ?? 0,

            averageScore:
              player.score ?? 0,

            memberCount:
              1,

          }
        )

      }

    }
  )


  const tableHorses =
    Array.from(
      tableMap.values()
    ).map(
      horse => ({

        ...horse,

        averageScore:
          horse.memberCount > 0
            ? horse.totalScore /
              horse.memberCount
            : 0,

      })
    )


  /*
   * ゴールした卓の参加者をロック
   */

  const finishTable =
    async (
      tableNumber: number
    ) => {

      if (
        finishedTablesRef.current.has(
          tableNumber
        )
      ) {

        return

      }


      finishedTablesRef.current.add(
        tableNumber
      )


      try {

        const snapshot =
          await getDocs(
            collection(
              db,
              "players"
            )
          )


        const targets =
          snapshot.docs.filter(
            playerDocument => {

              const data =
                playerDocument.data()


              return (
                data.tableNumber ===
                tableNumber
              )

            }
          )


        await Promise.all(

          targets.map(
            playerDocument =>

              updateDoc(
                doc(
                  db,
                  "players",
                  playerDocument.id
                ),
                {
                  finished:
                    true,
                }
              )

          )

        )

      } catch (error) {

        console.error(
          "ゴールロックエラー",
          error
        )

      }

    }


  /*
   * レース開始
   */

  useEffect(() => {

    if (!raceStarted) {

      setCount(3)

      setPositions({})

      finishedTablesRef.current =
        new Set()

      return

    }


    setCount(3)

    setPositions({})

    finishedTablesRef.current =
      new Set()


    const timer =
      window.setInterval(() => {

        setCount(
          previous => {

            if (
              previous <= 1
            ) {

              window.clearInterval(
                timer
              )

              return 0

            }


            return (
              previous - 1
            )

          }
        )

      }, 1000)


    return () => {

      window.clearInterval(
        timer
      )

    }

  }, [
    raceStarted,
  ])


  /*
   * 自動走行
   *
   * 約90秒を基本に、
   * ポイントで速度差をつける。
   */

  useEffect(() => {

    if (
      !raceStarted ||
      count !== 0 ||
      tableHorses.length === 0
    ) {

      return

    }


    raceTimerRef.current =
      window.setInterval(() => {

        setPositions(
          previous => {

            const next = {
              ...previous,
            }


            tableHorses.forEach(
              horse => {

                const current =
                  next[
                    horse.tableNumber
                  ] ?? 0


                if (
                  current >= 100
                ) {

                  return

                }


                /*
                 * 何もしなくても進む
                 */

                const baseSpeed =
                  0.105


                /*
                 * ムチのポイントで加速。
                 *
                 * マイナス点なら
                 * 通常より遅くなる。
                 */

                const scoreEffect =
                  clamp(
                    horse.averageScore *
                      0.0003,
                    -0.025,
                    0.03
                  )


                const speed =
                  Math.max(
                    baseSpeed +
                    scoreEffect,
                    0.065
                  )


                const nextPosition =
                  Math.min(
                    current +
                    speed,
                    100
                  )


                next[
                  horse.tableNumber
                ] =
                  nextPosition


                if (
                  nextPosition >= 100
                ) {

                  void finishTable(
                    horse.tableNumber
                  )

                }

              }
            )


            return next

          }
        )

      }, 100)


    return () => {

      if (
        raceTimerRef.current !== null
      ) {

        window.clearInterval(
          raceTimerRef.current
        )

        raceTimerRef.current =
          null

      }

    }

  }, [
    raceStarted,
    count,
    players,
  ])


  /*
   * バナナイベント
   *
   * スクリーンには表示しない。
   * 参加者画面だけに送る。
   */

  useEffect(() => {

    if (!raceStarted) {

      if (
        eventTimerRef.current !== null
      ) {

        window.clearTimeout(
          eventTimerRef.current
        )

      }


      if (
        eventEndTimerRef.current !== null
      ) {

        window.clearTimeout(
          eventEndTimerRef.current
        )

      }


      eventTimerRef.current =
        null

      eventEndTimerRef.current =
        null

      eventCountRef.current =
        0


      return

    }


    if (
      count !== 0
    ) {

      return

    }


    let cancelled =
      false


    const scheduleNextEvent =
      () => {

        if (
          cancelled ||
          eventCountRef.current >= 4
        ) {

          return

        }


        const delay =
          7000 +
          Math.random() *
            9000


        eventTimerRef.current =
          window.setTimeout(
            async () => {

              if (cancelled) {
                return
              }


              eventCountRef.current +=
                1


              const eventId =
                Date.now()


              try {

                await setRaceEvent({

                  type:
                    "trap",

                  eventId,

                  expiresAt:
                    Date.now() +
                    5000,

                })

              } catch (error) {

                console.error(
                  "バナナ発生エラー",
                  error
                )

              }


              eventEndTimerRef.current =
                window.setTimeout(
                  async () => {

                    if (
                      cancelled
                    ) {

                      return

                    }


                    try {

                      await setRaceEvent({

                        type:
                          "none",

                        eventId,

                        expiresAt:
                          0,

                      })

                    } catch (error) {

                      console.error(
                        "バナナ終了エラー",
                        error
                      )

                    }


                    scheduleNextEvent()

                  },
                  5000
                )

            },
            delay
          )

      }


    scheduleNextEvent()


    return () => {

      cancelled =
        true


      if (
        eventTimerRef.current !== null
      ) {

        window.clearTimeout(
          eventTimerRef.current
        )

      }


      if (
        eventEndTimerRef.current !== null
      ) {

        window.clearTimeout(
          eventEndTimerRef.current
        )

      }

    }

  }, [
    raceStarted,
    count,
  ])


  /*
   * 待機
   */

  if (
    !raceStarted
  ) {

    return (

      <div
        style={{
          width:
            "100vw",
          height:
            "100vh",
          background:
            "linear-gradient(135deg,#06130b,#173b26)",
          color:
            "white",
          display:
            "flex",
          alignItems:
            "center",
          justifyContent:
            "center",
          textAlign:
            "center",
        }}
      >

        <div>

          <div
            style={{
              fontSize:
                "90px",
            }}
          >
            🏇
          </div>


          <h1
            style={{
              fontSize:
                "44px",
            }}
          >
            {eventInfo.title}
          </h1>


          <h2>
            {eventInfo.groom}
            {" × "}
            {eventInfo.bride}
          </h2>


          <p
            style={{
              fontSize:
                "21px",
              opacity:
                0.75,
            }}
          >
            レース開始をお待ちください
          </p>

        </div>

      </div>

    )

  }


  /*
   * カウントダウン
   */

  if (
    count > 0
  ) {

    return (

      <div
        style={{
          width:
            "100vw",
          height:
            "100vh",
          background:
            "radial-gradient(circle,#315d42,#051109)",
          color:
            "white",
          display:
            "flex",
          flexDirection:
            "column",
          alignItems:
            "center",
          justifyContent:
            "center",
        }}
      >

        <div
          style={{
            fontSize:
              "180px",
            fontWeight:
              900,
            lineHeight:
              1,
          }}
        >
          {count}
        </div>


        <h1>
          🏇 まもなくスタート
        </h1>

      </div>

    )

  }


  /*
   * 先頭位置＝カメラの基準
   */

  const leaderPosition =
    tableHorses.reduce(
      (
        maximum,
        horse
      ) => {

        return Math.max(
          maximum,
          positions[
            horse.tableNumber
          ] ?? 0
        )

      },
      0
    )


  /*
   * ゴール板の画面位置
   *
   * 終盤になると
   * 右から画面に入ってくる。
   */

  const finishScreenX =
    45 +
    (
      100 -
      leaderPosition
    ) * 4.6


  /*
   * 背景の流れ
   */

  const sceneryOffset =
    leaderPosition *
    2.6


  return (

    <div
      style={{
        width:
          "100vw",
        height:
          "100vh",
        overflow:
          "hidden",
        position:
          "relative",
        background:
          "#52a9dd",
        color:
          "white",
        fontFamily:
          "Arial, Helvetica, sans-serif",
      }}
    >

      {/*
       * =====================================
       * 空
       * =====================================
       */}

      <div
        style={{
          position:
            "absolute",
          inset:
            0,
          height:
            "45%",
          background:
            "linear-gradient(180deg,#42a6e1,#bce8fa)",
        }}
      />


      {/*
       * 山・遠景
       */}

      <div
        style={{
          position:
            "absolute",
          left:
            0,
          right:
            0,
          top:
            "24%",
          height:
            "20%",
          background:
            "linear-gradient(155deg,transparent 0 16%,#638c63 16% 27%,transparent 27% 34%,#487a51 34% 48%,transparent 48% 58%,#5b895b 58% 72%,transparent 72%)",
          opacity:
            0.72,
        }}
      />


      {/*
       * =====================================
       * 観客席
       * =====================================
       */}

      <div
        style={{
          position:
            "absolute",
          left:
            0,
          right:
            0,
          top:
            "36%",
          height:
            "15%",
          background:
            "linear-gradient(180deg,#d8d8d8 0%,#777 18%,#353535 25%,#202020 100%)",
          borderTop:
            "5px solid white",
          zIndex:
            2,
        }}
      >

        <div
          style={{
            position:
              "absolute",
            inset:
              "22px 0 0",
            backgroundPositionX:
              `${-sceneryOffset * 5}px`,
            backgroundImage:
              "radial-gradient(circle,#f4d0a5 0 2px,transparent 3px)",
            backgroundSize:
              "13px 10px",
            opacity:
              0.85,
          }}
        />

      </div>


      {/*
       * =====================================
       * 芝
       * =====================================
       */}

      <div
        style={{
          position:
            "absolute",
          left:
            0,
          right:
            0,
          top:
            "50%",
          bottom:
            0,
          background:
            "linear-gradient(180deg,#349a45,#16742d)",
        }}
      />


      <div
        style={{
          position:
            "absolute",
          left:
            0,
          right:
            0,
          top:
            "50%",
          bottom:
            0,
          opacity:
            0.16,
          backgroundPositionX:
            `${-sceneryOffset * 22}px`,
          backgroundImage:
            "linear-gradient(90deg,rgba(255,255,255,.22) 0 45px,transparent 45px 90px)",
          backgroundSize:
            "90px 100%",
        }}
      />


      {/*
       * =====================================
       * 外ラチ
       * =====================================
       */}

      <div
        style={{
          position:
            "absolute",
          left:
            0,
          right:
            0,
          top:
            "51%",
          height:
            "8px",
          background:
            "#f8f8f8",
          boxShadow:
            "0 4px 5px rgba(0,0,0,.35)",
          zIndex:
            8,
        }}
      />


      {/*
       * ラチの支柱を流す
       */}

      {
        Array.from(
          { length: 15 },
          (
            _,
            index
          ) => {

            const base =
              index * 9


            const x =
              wrap(
                base -
                sceneryOffset,
                125
              ) - 10


            return (

              <div
                key={
                  `rail-${index}`
                }
                style={{
                  position:
                    "absolute",
                  left:
                    `${x}%`,
                  top:
                    "51%",
                  width:
                    "6px",
                  height:
                    "80px",
                  background:
                    "#f0f0f0",
                  transform:
                    "skewX(-8deg)",
                  boxShadow:
                    "2px 3px 3px rgba(0,0,0,.2)",
                  zIndex:
                    7,
                }}
              />

            )

          }
        )
      }


      {/*
       * =====================================
       * トラック
       * =====================================
       */}

      <div
        style={{
          position:
            "absolute",
          left:
            "-4%",
          right:
            "-4%",
          top:
            "57%",
          height:
            "34%",
          background:
            "linear-gradient(180deg,#9a7959,#806044)",
          transform:
            "perspective(1000px) rotateX(4deg)",
          boxShadow:
            "0 15px 25px rgba(0,0,0,.25)",
          zIndex:
            3,
        }}
      />


      {/*
       * 砂の流れ
       */}

      <div
        style={{
          position:
            "absolute",
          left:
            "-5%",
          right:
            "-5%",
          top:
            "57%",
          height:
            "34%",
          opacity:
            0.16,
          backgroundPositionX:
            `${-sceneryOffset * 28}px`,
          backgroundImage:
            "linear-gradient(90deg,rgba(255,255,255,.16) 0 22px,transparent 22px 48px)",
          backgroundSize:
            "48px 100%",
          zIndex:
            4,
        }}
      />


      {/*
       * =====================================
       * 背景の距離標
       * =====================================
       */}

      {
        Array.from(
          { length: 9 },
          (
            _,
            index
          ) => {

            const base =
              10 +
              index * 15


            const x =
              wrap(
                base -
                sceneryOffset *
                1.2,
                145
              ) - 15


            return (

              <div
                key={
                  `marker-${index}`
                }
                style={{
                  position:
                    "absolute",
                  left:
                    `${x}%`,
                  top:
                    "45%",
                  width:
                    "12px",
                  height:
                    "60px",
                  background:
                    "#f8f8f8",
                  border:
                    "2px solid #666",
                  borderRadius:
                    "3px",
                  zIndex:
                    6,
                  boxShadow:
                    "2px 3px 4px rgba(0,0,0,.25)",
                }}
              />

            )

          }
        )
      }


      {/*
       * =====================================
       * 馬群
       * =====================================
       */}

      {
        tableHorses.map(
          (
            horse,
            index
          ) => {

            const position =
              positions[
                horse.tableNumber
              ] ?? 0


            /*
             * カメラは先頭馬を
             * 約45%地点で追う。
             */

            const rawX =
              45 +
              (
                position -
                leaderPosition
              ) * 4.6


            const x =
              clamp(
                rawX,
                6,
                89
              )


            /*
             * 馬群を縦方向に
             * 少しずつずらす。
             */

            const denominator =
              Math.max(
                tableHorses.length -
                1,
                1
              )


            const y =
              61 +
              (
                index /
                denominator
              ) * 22


            const isLeader =
              position ===
                leaderPosition &&
              leaderPosition > 0


            const isFinished =
              position >= 100


            const silkColor =
              SILK_COLORS[
                index %
                SILK_COLORS.length
              ]


            return (

              <div
                key={
                  horse.tableNumber
                }
                style={{
                  position:
                    "absolute",
                  left:
                    `${x}%`,
                  top:
                    `${y}%`,
                  transform:
                    "translate(-50%,-50%)",
                  transition:
                    "left .12s linear",
                  zIndex:
                    30 +
                    index,
                }}
              >

                {/*
                 * 馬の影
                 */}

                <div
                  style={{
                    position:
                      "absolute",
                    left:
                      "12px",
                    top:
                      "73px",
                    width:
                      "120px",
                    height:
                      "16px",
                    borderRadius:
                      "50%",
                    background:
                      "rgba(0,0,0,.3)",
                    filter:
                      "blur(5px)",
                  }}
                />


                <div
                  className={
                    isFinished
                      ? ""
                      : "horse-body-run"
                  }
                >

                  <RaceHorse
                    silkColor={
                      silkColor
                    }
                    finished={
                      isFinished
                    }
                    leader={
                      isLeader
                    }
                  />

                </div>


                {/*
                 * 馬名
                 */}

                <div
                  style={{
                    position:
                      "absolute",
                    left:
                      "50%",
                    bottom:
                      "88px",
                    transform:
                      "translateX(-50%)",
                    whiteSpace:
                      "nowrap",
                    background:
                      "rgba(0,0,0,.72)",
                    border:
                      isLeader
                        ? "2px solid #ffd54a"
                        : "1px solid rgba(255,255,255,.6)",
                    borderRadius:
                      "7px",
                    padding:
                      "4px 9px",
                    fontSize:
                      isLeader
                        ? "15px"
                        : "13px",
                    fontWeight:
                      900,
                    boxShadow:
                      "0 3px 7px rgba(0,0,0,.35)",
                  }}
                >

                  {
                    isLeader
                      ? "🥇 "
                      : ""
                  }

                  {horse.horseName}

                </div>


                {
                  isFinished &&

                  <div
                    style={{
                      position:
                        "absolute",
                      left:
                        "50%",
                      bottom:
                        "116px",
                      transform:
                        "translateX(-50%)",
                      fontSize:
                        "18px",
                      fontWeight:
                        900,
                      whiteSpace:
                        "nowrap",
                    }}
                  >
                    🏁 GOAL
                  </div>

                }

              </div>

            )

          }
        )
      }


      {/*
       * =====================================
       * ゴール板
       *
       * レース終盤だけ
       * 右側から入ってくる。
       * =====================================
       */}

      {
        finishScreenX <
          115 &&

        <div
          style={{
            position:
              "absolute",
            left:
              `${finishScreenX}%`,
            top:
              "45%",
            height:
              "48%",
            width:
              "18px",
            background:
              "#ffffff",
            borderLeft:
              "5px solid #222",
            borderRight:
              "5px solid #222",
            boxShadow:
              "0 0 15px rgba(0,0,0,.45)",
            transform:
              "translateX(-50%)",
            zIndex:
              45,
          }}
        >

          <div
            style={{
              position:
                "absolute",
              top:
                "-68px",
              left:
                "50%",
              transform:
                "translateX(-50%)",
              fontSize:
                "55px",
            }}
          >
            🏁
          </div>

        </div>

      }


      {/*
       * =====================================
       * 上部情報
       * =====================================
       */}

      <div
        style={{
          position:
            "absolute",
          top:
            "18px",
          left:
            "24px",
          zIndex:
            80,
          textShadow:
            "0 3px 8px rgba(0,0,0,.8)",
        }}
      >

        <div
          style={{
            fontSize:
              "29px",
            fontWeight:
              900,
          }}
        >
          {eventInfo.title}
        </div>


        <div
          style={{
            fontSize:
              "15px",
            fontWeight:
              700,
          }}
        >
          {eventInfo.groom}
          {" × "}
          {eventInfo.bride}
        </div>

      </div>


      {/*
       * =====================================
       * 下部バー
       * =====================================
       */}

      <div
        style={{
          position:
            "absolute",
          left:
            0,
          right:
            0,
          bottom:
            0,
          height:
            "48px",
          background:
            "linear-gradient(90deg,rgba(0,0,0,.9),rgba(20,20,20,.65),rgba(0,0,0,.9))",
          borderTop:
            "1px solid rgba(255,255,255,.3)",
          display:
            "flex",
          alignItems:
            "center",
          justifyContent:
            "center",
          zIndex:
            90,
        }}
      >

        <div
          style={{
            fontSize:
              "19px",
            fontWeight:
              900,
            letterSpacing:
              "5px",
          }}
        >
          WEDDING DERBY
        </div>

      </div>


      {/*
       * =====================================
       * アニメーション
       * =====================================
       */}

      <style>
        {`

          @keyframes horseBodyRun {

            0% {
              transform:
                translateY(0)
                rotate(-0.5deg);
            }

            50% {
              transform:
                translateY(-5px)
                rotate(0.7deg);
            }

            100% {
              transform:
                translateY(1px)
                rotate(-0.5deg);
            }

          }


          @keyframes frontLegA {

            0% {
              transform:
                rotate(38deg);
            }

            100% {
              transform:
                rotate(-35deg);
            }

          }


          @keyframes frontLegB {

            0% {
              transform:
                rotate(-32deg);
            }

            100% {
              transform:
                rotate(34deg);
            }

          }


          @keyframes backLegA {

            0% {
              transform:
                rotate(-35deg);
            }

            100% {
              transform:
                rotate(35deg);
            }

          }


          @keyframes backLegB {

            0% {
              transform:
                rotate(32deg);
            }

            100% {
              transform:
                rotate(-32deg);
            }

          }


          .horse-body-run {

            animation:
              horseBodyRun
              .22s
              infinite
              alternate
              ease-in-out;

          }


          .horse-leg-front-a {

            animation:
              frontLegA
              .22s
              infinite
              alternate
              ease-in-out;

          }


          .horse-leg-front-b {

            animation:
              frontLegB
              .22s
              infinite
              alternate
              ease-in-out;

          }


          .horse-leg-back-a {

            animation:
              backLegA
              .22s
              infinite
              alternate
              ease-in-out;

          }


          .horse-leg-back-b {

            animation:
              backLegB
              .22s
              infinite
              alternate
              ease-in-out;

          }

        `}
      </style>

    </div>

  )

}


export default GamePage