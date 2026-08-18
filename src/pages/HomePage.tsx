import {
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  addDoc,
  collection,
} from "firebase/firestore";

import {
  db,
} from "../firebase";

import {
  defaultHorses,
} from "../firebase/horses";

import "../styles/derby.css";


function HomePage() {

  const navigate =
    useNavigate();


  const [
    playerName,
    setPlayerName,
  ] = useState("");


  const [
    tableNumber,
    setTableNumber,
  ] = useState("");


  const [
    loading,
    setLoading,
  ] = useState(false);


  const selectedHorse =
    useMemo(
      () =>
        defaultHorses.find(
          horse =>
            horse.tableNumber ===
            Number(
              tableNumber
            )
        ),
      [tableNumber]
    );


  const registerPlayer =
    async () => {

      if (
        !playerName.trim() ||
        !tableNumber
      ) {

        alert(
          "お名前と卓番号を入力してください。"
        );

        return;

      }


      try {

        setLoading(
          true
        );


        const selectedTable =
          Number(
            tableNumber
          );


        const horse =
          defaultHorses.find(
            item =>
              item.tableNumber ===
              selectedTable
          );


        if (!horse) {

          alert(
            "この卓の馬が設定されていません。"
          );

          return;

        }


        const playerRef =
          await addDoc(
            collection(
              db,
              "players"
            ),
            {

              playerName:
                playerName.trim(),

              horseName:
                horse.horseName,

              tableNumber:
                selectedTable,

              score: 0,

              createdAt:
                new Date(),

            }
          );


        navigate(
          `/play/${playerRef.id}`
        );


      } catch (error) {

        console.error(
          error
        );

        alert(
          "登録に失敗しました。通信状況を確認して、もう一度お試しください。"
        );


      } finally {

        setLoading(
          false
        );

      }

    };


  const canSubmit =
    Boolean(
      playerName.trim() &&
      tableNumber &&
      !loading
    );


  return (

    <div
      style={{
        minHeight:
          "100dvh",
        boxSizing:
          "border-box",
        display:
          "flex",
        alignItems:
          "center",
        justifyContent:
          "center",
        padding:
          "24px 16px",
        background:
          "radial-gradient(circle at top, #fff8e8 0%, #f6efe4 38%, #ece4d8 100%)",
        color:
          "#2f2923",
        fontFamily:
          '"Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif',
      }}
    >

      <div
        style={{
          width:
            "min(100%, 520px)",
        }}
      >

        <div
          style={{
            marginBottom:
              "18px",
            textAlign:
              "center",
          }}
        >

          <div
            style={{
              display:
                "inline-flex",
              alignItems:
                "center",
              justifyContent:
                "center",
              gap:
                "8px",
              marginBottom:
                "10px",
              padding:
                "7px 14px",
              border:
                "1px solid rgba(153, 116, 51, 0.28)",
              borderRadius:
                "999px",
              background:
                "rgba(255,255,255,0.68)",
              color:
                "#8b6b34",
              fontSize:
                "12px",
              fontWeight:
                800,
              letterSpacing:
                "0.12em",
            }}
          >
            💍 WEDDING EVENT
          </div>


          <h1
            style={{
              margin:
                "0",
              color:
                "#30281f",
              fontSize:
                "clamp(34px, 10vw, 52px)",
              lineHeight:
                1.05,
              fontWeight:
                900,
              letterSpacing:
                "-0.035em",
              textShadow:
                "0 2px 0 rgba(255,255,255,0.7)",
            }}
          >
            Wedding Derby
          </h1>


          <p
            style={{
              margin:
                "12px auto 0",
              maxWidth:
                "420px",
              color:
                "#6c6258",
              fontSize:
                "15px",
              lineHeight:
                1.7,
              fontWeight:
                650,
            }}
          >
            あなたの卓の馬を応援して、
            <br />
            みんなでレースを盛り上げよう！
          </p>

        </div>


        <div
          style={{
            position:
              "relative",
            overflow:
              "hidden",
            padding:
              "26px 22px 22px",
            border:
              "1px solid rgba(128, 98, 50, 0.16)",
            borderRadius:
              "28px",
            background:
              "rgba(255,255,255,0.92)",
            boxShadow:
              "0 20px 60px rgba(85, 65, 42, 0.16)",
            backdropFilter:
              "blur(12px)",
          }}
        >

          <div
            style={{
              position:
                "absolute",
              top:
                "-44px",
              right:
                "-34px",
              width:
                "130px",
              height:
                "130px",
              borderRadius:
                "50%",
              background:
                "radial-gradient(circle, rgba(218,185,105,0.25), rgba(218,185,105,0))",
              pointerEvents:
                "none",
            }}
          />


          <div
            style={{
              position:
                "relative",
              zIndex:
                1,
            }}
          >

            <div
              style={{
                marginBottom:
                  "20px",
                textAlign:
                  "center",
              }}
            >

              <div
                style={{
                  marginBottom:
                    "5px",
                  color:
                    "#9b7635",
                  fontSize:
                    "13px",
                  fontWeight:
                    900,
                  letterSpacing:
                    "0.16em",
                }}
              >
                ENTRY
              </div>


              <h2
                style={{
                  margin:
                    "0",
                  color:
                    "#332c25",
                  fontSize:
                    "24px",
                  lineHeight:
                    1.3,
                  fontWeight:
                    900,
                }}
              >
                🏇 参加登録
              </h2>


              <p
                style={{
                  margin:
                    "7px 0 0",
                  color:
                    "#776d63",
                  fontSize:
                    "13px",
                  lineHeight:
                    1.6,
                }}
              >
                お名前と卓番号を入力してください
              </p>

            </div>


            <label
              style={{
                display:
                  "block",
                marginBottom:
                  "18px",
              }}
            >

              <div
                style={{
                  marginBottom:
                    "7px",
                  color:
                    "#4b433c",
                  fontSize:
                    "14px",
                  fontWeight:
                    900,
                }}
              >
                お名前
              </div>


              <input
                aria-label="お名前"
                autoComplete="name"
                placeholder="例：山田 太郎"
                value={
                  playerName
                }
                onChange={
                  (e) =>
                    setPlayerName(
                      e.target.value
                    )
                }
                style={{
                  width:
                    "100%",
                  height:
                    "54px",
                  boxSizing:
                    "border-box",
                  padding:
                    "0 16px",
                  border:
                    "2px solid #ddd2c3",
                  borderRadius:
                    "14px",
                  outline:
                    "none",
                  background:
                    "#fffdf9",
                  color:
                    "#26211d",
                  fontSize:
                    "16px",
                  fontWeight:
                    700,
                  WebkitTextFillColor:
                    "#26211d",
                  boxShadow:
                    "inset 0 1px 0 rgba(255,255,255,0.8)",
                }}
              />

            </label>


            <label
              style={{
                display:
                  "block",
                marginBottom:
                  "18px",
              }}
            >

              <div
                style={{
                  marginBottom:
                    "7px",
                  color:
                    "#4b433c",
                  fontSize:
                    "14px",
                  fontWeight:
                    900,
                }}
              >
                卓番号
              </div>


              <select
                aria-label="卓番号"
                value={
                  tableNumber
                }
                onChange={
                  (e) =>
                    setTableNumber(
                      e.target.value
                    )
                }
                style={{
                  width:
                    "100%",
                  height:
                    "54px",
                  boxSizing:
                    "border-box",
                  padding:
                    "0 42px 0 16px",
                  border:
                    "2px solid #ddd2c3",
                  borderRadius:
                    "14px",
                  outline:
                    "none",
                  background:
                    "#fffdf9",
                  color:
                    tableNumber
                      ? "#26211d"
                      : "#665d54",
                  fontSize:
                    "16px",
                  fontWeight:
                    800,
                  WebkitTextFillColor:
                    tableNumber
                      ? "#26211d"
                      : "#665d54",
                }}
              >

                <option
                  value=""
                >
                  卓番号を選択してください
                </option>


                {
                  defaultHorses.map(
                    horse => (

                      <option
                        key={
                          horse.tableNumber
                        }
                        value={
                          horse.tableNumber
                        }
                      >
                        {horse.tableNumber}卓
                        　🐎{" "}
                        {horse.horseName}
                      </option>

                    )
                  )
                }

              </select>

            </label>


            {
              selectedHorse &&

              <div
                style={{
                  display:
                    "grid",
                  gridTemplateColumns:
                    "44px 1fr",
                  gap:
                    "12px",
                  alignItems:
                    "center",
                  margin:
                    "2px 0 20px",
                  padding:
                    "13px 15px",
                  border:
                    "1px solid rgba(161,122,52,0.22)",
                  borderRadius:
                    "16px",
                  background:
                    "linear-gradient(135deg, #fff8df, #fffdf7)",
                }}
              >

                <div
                  style={{
                    display:
                      "flex",
                    alignItems:
                      "center",
                    justifyContent:
                      "center",
                    width:
                      "44px",
                    height:
                      "44px",
                    borderRadius:
                      "50%",
                    background:
                      "#f1dfaa",
                    fontSize:
                      "23px",
                  }}
                >
                  🐎
                </div>


                <div>

                  <div
                    style={{
                      marginBottom:
                        "2px",
                      color:
                        "#8a6a34",
                      fontSize:
                        "11px",
                      fontWeight:
                        900,
                      letterSpacing:
                        "0.12em",
                    }}
                  >
                    YOUR HORSE
                  </div>


                  <div
                    style={{
                      color:
                        "#2c261f",
                      fontSize:
                        "18px",
                      fontWeight:
                        900,
                      lineHeight:
                        1.35,
                      wordBreak:
                        "break-word",
                    }}
                  >
                    {selectedHorse.horseName}
                  </div>

                </div>

              </div>
            }


            <button
              type="button"
              onClick={
                registerPlayer
              }
              disabled={
                !canSubmit
              }
              style={{
                width:
                  "100%",
                minHeight:
                  "56px",
                border:
                  "none",
                borderRadius:
                  "16px",
                background:
                  canSubmit
                    ? "linear-gradient(135deg, #9c742f, #c7a65c)"
                    : "#d6cec2",
                color:
                  canSubmit
                    ? "#ffffff"
                    : "#756f67",
                fontSize:
                  "17px",
                fontWeight:
                  900,
                letterSpacing:
                  "0.04em",
                boxShadow:
                  canSubmit
                    ? "0 10px 24px rgba(137,101,43,0.28)"
                    : "none",
                cursor:
                  canSubmit
                    ? "pointer"
                    : "default",
                opacity:
                  1,
              }}
            >

              {
                loading
                  ? "登録中..."
                  : "参加する"
              }

            </button>


            <p
              style={{
                margin:
                  "14px 0 0",
                color:
                  "#8a8178",
                fontSize:
                  "11px",
                lineHeight:
                  1.6,
                textAlign:
                  "center",
              }}
            >
              登録後、そのままレース応援画面へ進みます
            </p>

          </div>

        </div>

      </div>

    </div>

  );

}


export default HomePage;