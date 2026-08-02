import {
  useNavigate,
} from "react-router-dom"

import {
  useGame,
} from "../context/GameContext"

import "../styles/derby.css"



function AdminPage(){


const navigate =
useNavigate()



const {

players,

startRace,

clearPlayers,

eventInfo,

raceStarted,

}=useGame()





const resetPlayers = ()=>{


const result =
window.confirm(

"参加者情報を削除しますか？"

)


if(result){

clearPlayers()

}


}






return (

<div className="derby-container">


<h1 className="title">

💍 管理画面

</h1>



<div className="card">


<h2>

{eventInfo.title}

</h2>



<p>

新郎：

{eventInfo.groom}

</p>


<p>

新婦：

{eventInfo.bride}

</p>



<h3>

{

raceStarted

?

"🔴 レース開催中"

:

"🟢 レース待機中"

}

</h3>



</div>





<div className="card">


<h2>

🏇 出走馬一覧

</h2>



{

players.length===0 &&

<p>

参加者はいません

</p>

}




{

players.map(

(player,index)=>(


<div

className="horse"

key={index}

>


<h3>

【{index+1}番】

</h3>


<p>

👤 {player.playerName}

</p>


<p>

🐎 {player.horseName}

</p>



</div>


)

)

}



</div>







<button

disabled={
players.length===0 ||
raceStarted
}

onClick={()=>{


startRace()


navigate("/game")


}}

>

🏁 レース開始

</button>





<br />





<button

onClick={resetPlayers}

>

🔄 参加者リセット

</button>




</div>


)

}


export default AdminPage