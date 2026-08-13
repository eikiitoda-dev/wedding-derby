import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { addDoc, collection } from "firebase/firestore";

import { db } from "../firebase";
import {
  defaultHorses,
} from "../firebase/horses";

import "../styles/derby.css";


function HomePage() {

  const navigate = useNavigate();


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


  const registerPlayer =
    async () => {

      if (
        !playerName.trim() ||
        !tableNumber
      ) {

        alert(
          "参加者名と卓番号を入力してください。"
        );

        return;

      }


      try {

        setLoading(true);


        const selectedTable =
          Number(tableNumber);


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

        console.error(error);

        alert(
          "登録に失敗しました。"
        );


      } finally {

        setLoading(false);

      }

    };


  const selectedHorse =
    defaultHorses.find(
      horse =>
        horse.tableNumber ===
        Number(tableNumber)
    );


  return (

    <div
      className="derby-container"
    >

      <h1 className="title">
        💍 Wedding Derby
      </h1>


      <div className="card">

        <h2>
          🏇 参加登録
        </h2>


        <input
          placeholder="参加者名"
          value={playerName}
          onChange={
            (e) =>
              setPlayerName(
                e.target.value
              )
          }
        />


        <select
          value={tableNumber}
          onChange={
            (e) =>
              setTableNumber(
                e.target.value
              )
          }
          style={{
            width: "100%",
            padding: "12px",
            marginBottom: "15px",
            fontSize: "16px",
            boxSizing: "border-box",
          }}
        >

          <option value="">
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
                  {"　"}
                  🐎{" "}
                  {horse.horseName}

                </option>

              )
            )
          }

        </select>


        {
          selectedHorse &&

          <p>

            🐎 あなたの馬：
            {" "}
            {selectedHorse.horseName}

          </p>

        }


        <button
          onClick={
            registerPlayer
          }
          disabled={loading}
        >

          {
            loading
              ? "登録中..."
              : "参加する"
          }

        </button>

      </div>

    </div>

  );

}


export default HomePage;