import {
  useState,
} from "react"

import {
  useNavigate,
} from "react-router-dom"

import {
  useGame,
} from "../context/GameContext"

import "../styles/derby.css"



function HomePage(){

  const navigate =
    useNavigate()


  const {
    addPlayer,
    eventInfo,
    updateEvent,
  } = useGame()



  const [playerName,setPlayerName] =
    useState("")


  const [horseName,setHorseName] =
    useState("")



  const changeEvent = (
    key:
    "title" |
    "groom" |
    "bride",

    value:string

  )=>{


    updateEvent({

      ...eventInfo,

      [key]:value

    })


  }




  const startGame = ()=>{


    addPlayer({

      playerName,

      horseName,

    })


    navigate("/game")


  }





  return (

    <div className="derby-container">


      <h1 className="title">

        {eventInfo.title}

      </h1>



      <div className="card">


        <h2>
          💍 イベント情報
        </h2>



        <input

          placeholder="イベントタイトル"

          value={
            eventInfo.title
          }

          onChange={
            e=>
            changeEvent(
              "title",
              e.target.value
            )
          }

        />



        <input

          placeholder="新郎名"

          value={
            eventInfo.groom
          }

          onChange={
            e=>
            changeEvent(
              "groom",
              e.target.value
            )
          }

        />



        <input

          placeholder="新婦名"

          value={
            eventInfo.bride
          }

          onChange={
            e=>
            changeEvent(
              "bride",
              e.target.value
            )
          }

        />


      </div>





      <div className="card">


        <h2>
          🏇 参加登録
        </h2>



        <input

          placeholder="参加者名"

          value={
            playerName
          }

          onChange={
            e=>
            setPlayerName(
              e.target.value
            )
          }

        />



        <input

          placeholder="馬の名前"

          value={
            horseName
          }

          onChange={
            e=>
            setHorseName(
              e.target.value
            )
          }

        />



        <button
          onClick={startGame}
        >

          🏟 会場へ

        </button>



      </div>


    </div>

  )

}


export default HomePage