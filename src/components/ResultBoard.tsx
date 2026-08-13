import type { Player } from "../firebase/gameService";

type Props = {
  players: Player[];
  ranking: number[];
};

function ResultBoard({
  players,
  ranking,
}: Props) {
  if (ranking.length !== players.length) {
    return null;
  }

  return (
    <div className="result">
      <h1>🏆 優勝 🏆</h1>

      <h1 className="winner">
        🐎 {players[ranking[0]]?.horseName}
      </h1>

      <hr />

      {ranking.map((playerIndex, index) => (
        <h2 key={playerIndex}>
          {index + 1}位　🐎{" "}
          {players[playerIndex]?.horseName}
        </h2>
      ))}
    </div>
  );
}

export default ResultBoard;