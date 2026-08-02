import {
  createContext,
  useContext,
  useState,
} from "react"

import type {
  ReactNode,
} from "react"

import type {
  EventInfo,
} from "../types/event"



export type Player = {

  playerName:string

  horseName:string

}



type GameContextType = {

  players:Player[]

  addPlayer:
  (player:Player)=>void

  clearPlayers:
  ()=>void

  raceStarted:boolean

  startRace:
  ()=>void

  eventInfo:EventInfo

  updateEvent:
  (info:EventInfo)=>void

}



const GameContext =
createContext<GameContextType | null>(null)




const defaultEvent:EventInfo = {

  title:"💍 Wedding Derby",

  groom:"",

  bride:""

}




export function GameProvider({

children

}:{
children:ReactNode

}) {



const [players,setPlayers] =
useState<Player[]>(()=>{


const data =
localStorage.getItem(
"players"
)


return data
?
JSON.parse(data)
:
[]

})





const [eventInfo,setEventInfo] =
useState<EventInfo>(()=>{


const data =
localStorage.getItem(
"eventInfo"
)


console.log(
"読み込みイベント:",
data
)


if(data){

return JSON.parse(data)

}


return defaultEvent


})






const [raceStarted,setRaceStarted] =
useState(false)






const addPlayer =
(player:Player)=>{


setPlayers(prev=>{


const next =
[
...prev,
player
]


localStorage.setItem(
"players",
JSON.stringify(next)
)


return next


})


}






const updateEvent =
(info:EventInfo)=>{


console.log(
"イベント保存:",
info
)


setEventInfo(info)


localStorage.setItem(
"eventInfo",
JSON.stringify(info)
)


}






const clearPlayers = ()=>{


setPlayers([])


localStorage.removeItem(
"players"
)


}






const startRace = ()=>{


setRaceStarted(true)


}






return (

<GameContext.Provider

value={{

players,

addPlayer,

clearPlayers,

raceStarted,

startRace,

eventInfo,

updateEvent,

}}

>

{children}

</GameContext.Provider>

)

}





export function useGame(){


const context =
useContext(GameContext)


if(!context){

throw new Error(
"GameProviderがありません"
)

}


return context


}