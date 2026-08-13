import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom"

import HomePage from "./pages/HomePage"
import GamePage from "./pages/GamePage"
import AdminPage from "./pages/AdminPage"
import PlayPage from "./pages/PlayPage"

import {
  GameProvider,
} from "./context/GameContext"


function App() {

  return (
    <GameProvider>

      <BrowserRouter>

        <Routes>

          <Route
            path="/"
            element={<HomePage />}
          />

          <Route
            path="/game"
            element={<GamePage />}
          />

          <Route
            path="/admin"
            element={<AdminPage />}
          />

          <Route
            path="/play/:id"
            element={<PlayPage />}
          />

        </Routes>

      </BrowserRouter>

    </GameProvider>
  )
}


export default App