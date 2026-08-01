import {
  createContext,
  useContext,
  useState,
  ReactNode,
} from "react"


type Player = {
  playerName: string
  horseName: string
}


type GameContextType = {
  players: Player[]
  addPlayer: (player: Player) => void
  clearPlayers: () => void
}


const GameContext =
  createContext<GameContextType | null>(null)


export function GameProvider({
  children,
}: {
  children: ReactNode
}) {


  const [players, setPlayers] =
    useState<Player[]>(() => {

      const saved =
        localStorage.getItem(
          "wedding-derby-players"
        )

      return saved
        ? JSON.parse(saved)
        : []

    })


  const addPlayer = (
    player: Player
  ) => {

    setPlayers((prev) => {

      const updated = [
        ...prev,
        player,
      ]


      localStorage.setItem(
        "wedding-derby-players",
        JSON.stringify(updated)
      )


      return updated

    })

  }


  const clearPlayers = () => {

    setPlayers([])

    localStorage.removeItem(
      "wedding-derby-players"
    )

  }


  return (
    <GameContext.Provider
      value={{
        players,
        addPlayer,
        clearPlayers,
      }}
    >
      {children}
    </GameContext.Provider>
  )
}


export function useGame() {

  const context =
    useContext(GameContext)


  if (!context) {
    throw new Error(
      "GameProviderがありません"
    )
  }


  return context
}