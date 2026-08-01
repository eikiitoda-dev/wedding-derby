import { Link } from "react-router-dom"

function HomePage() {
  return (
    <div>
      <h1>🏇 Wedding Derby</h1>

      <p>
        結婚式レースゲーム
      </p>

      <Link to="/game">
        <button>
          ゲーム開始
        </button>
      </Link>
    </div>
  )
}

export default HomePage