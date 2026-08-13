import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom"

import HomePage from "./pages/HomePage"
import GamePage from "./pages/GamePage"
import AdminPage from "./pages/AdminPage"
import PlayPage from "./pages/PlayPage"
import Race3DPage from "./pages/Race3DPage"
import Race2DTestPage from "./pages/Race2DTestPage"

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

          <Route
            path="/race-test"
            element={<Race3DPage />}
          />

          <Route
            path="/race-2d-test"
            element={<Race2DTestPage />}
          />

        </Routes>

      </BrowserRouter>

    </GameProvider>
  )
}


export default App