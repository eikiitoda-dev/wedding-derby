import type { Player } from "../firebase/gameService";

type Props = {
  player: Player;
  lane: number;
  position: number;
};

const laneColors = [
  "#ffd1dc",
  "#cde7ff",
  "#d8ffd1",
  "#fff0b3",
  "#e5d1ff",
  "#ffd9b8",
];

function RaceTrack({
  player,
  lane,
  position,
}: Props) {
  return (
    <div className="horse">
      <h2>
        【{lane}番】
        🐎 {player.horseName}
      </h2>

      <div
        className="track"
        style={{
          background:
            laneColors[
              (lane - 1) %
                laneColors.length
            ],
        }}
      >
        <div
          className="runner"
          style={{
            left: `${position}%`,
          }}
        >
          🐎
        </div>

        <div className="goal">
          🏁
        </div>
      </div>

      <p>{Math.floor(position)}%</p>
    </div>
  );
}

export default RaceTrack;