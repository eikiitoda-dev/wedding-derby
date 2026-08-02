import {
  useEffect,
  useState,
} from "react"

import {
  useGame,
} from "../context/GameContext"

import "../styles/derby.css"



function GamePage(){

const {
  players,
  raceStarted,
  eventInfo,
}=useGame()


const [positions,setPositions]=
useState<number[]>([])

const [ranking,setRanking]=
useState<number[]>([])

const [count,setCount]=
useState(3)



const laneColors = [
  "#ffd1dc",
  "#cde7ff",
  "#d8ffd1",
  "#fff0b3",
  "#e5d1ff",
  "#ffd9b8"
]



useEffect(()=>{

if(!raceStarted){
return
}


setPositions(
players.map(()=>0)
)

setRanking([])

setCount(3)


const timer=setInterval(()=>{

setCount(prev=>{

if(prev<=1){

clearInterval(timer)

return 0

}

return prev-1

})

},1000)


return()=>clearInterval(timer)

},[
raceStarted,
players
])





useEffect(()=>{

if(
!raceStarted ||
count!==0
){

return

}


const raceTimer=setInterval(()=>{


setPositions(prev=>{


const next =
prev.map(value=>{

return Math.min(
value +
Math.floor(
Math.random()*18
),
100
)

})



setRanking(current=>{

const updated=[
...current
]


next.forEach(
(value,index)=>{


if(
value===100 &&
!updated.includes(index)
){

updated.push(index)

}

})


return updated

})


return next


})


},400)



return()=>clearInterval(raceTimer)


},[
raceStarted,
count
])






return (

<div className="derby-container">


<h1 className="title">

{eventInfo.title}

</h1>


<h2>

💍 {eventInfo.groom}

×

{eventInfo.bride}

</h2>




{
!raceStarted &&

<div className="card">

<h2>
🏇 管理画面から
レース開始してください
</h2>

</div>

}





{
raceStarted &&
count>0 &&

<div className="card">

<h1>
{count}
</h1>

<h2>
まもなくスタート
</h2>

</div>

}




{
raceStarted &&
count===0 &&

<h1>
🏁 RACE START!!
</h1>

}






{
players.map(
(player,index)=>{


return (

<div
className="horse"
key={index}
>



<h2>

【{index+1}番】

🐎 {player.horseName}

</h2>




<div

className="track"

style={{

background:
laneColors[
index %
laneColors.length
]

}}

>



<div

className="runner"

style={{

left:
`${positions[index] || 0}%`

}}

>

🐎

</div>



<div className="goal">

🏁

</div>


</div>



<p>

{
Math.floor(
positions[index] || 0
)
}%

</p>



</div>


)

}

)

}





{
ranking.length===players.length &&

<div className="result">


<h1>

🏆 優勝 🏆

</h1>



<h1 className="winner">

🐎

{
players[
ranking[0]
]?.horseName

}

</h1>




<hr />



{
ranking.map(
(horse,index)=>(


<h2 key={horse}>

{index+1}位

　

🐎

{
players[horse]?.horseName

}

</h2>


)

)

}



</div>

}



</div>

)

}


export default GamePage