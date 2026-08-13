import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  collection,
  doc,
  getDocs,
  updateDoc,
} from "firebase/firestore";

import { useGame } from "../context/GameContext";

import {
  subscribePlayers,
  subscribeRaceStarted,
  type Player,
} from "../firebase/gameService";

import { db } from "../firebase";

type HorseData = {
  tableNumber: number;
  horseName: string;
  averageScore: number;
  playerCount: number;
};

type RaceMotion = {
  tableNumber: number;
  progress: number;
  finished: boolean;
  seed: number;
};

const BASE_SPEED = 100 / 90;

const JOCKEY_COLORS = [
  "#f4f4f4",
  "#222222",
  "#d92d2d",
  "#2468c7",
  "#f1c52a",
  "#43a556",
  "#ec812d",
  "#e86cae",
  "#7856c5",
  "#28a8a2",
  "#b66d38",
];

const DEPTH_Y = [0.57, 0.705, 0.845];
const DEPTH_SCALE = [0.94, 1.13, 1.34];

function clamp(
  value: number,
  min: number,
  max: number
) {
  return Math.max(min, Math.min(max, value));
}

function getColor(tableNumber: number) {
  return JOCKEY_COLORS[
    (tableNumber - 1) %
      JOCKEY_COLORS.length
  ];
}

async function setAllPlayersFinished(
  finished: boolean
) {
  try {
    const snapshot = await getDocs(
      collection(db, "players")
    );

    await Promise.all(
      snapshot.docs.map((playerDoc) =>
        updateDoc(
          doc(
            db,
            "players",
            playerDoc.id
          ),
          { finished }
        )
      )
    );
  } catch (error) {
    console.error(
      "finished初期化エラー",
      error
    );
  }
}

async function finishTable(
  tableNumber: number
) {
  try {
    const snapshot = await getDocs(
      collection(db, "players")
    );

    const targets =
      snapshot.docs.filter(
        (playerDoc) =>
          Number(
            playerDoc.data()
              .tableNumber ?? 0
          ) === tableNumber
      );

    await Promise.all(
      targets.map((playerDoc) =>
        updateDoc(
          doc(
            db,
            "players",
            playerDoc.id
          ),
          { finished: true }
        )
      )
    );
  } catch (error) {
    console.error(
      "ゴール処理エラー",
      error
    );
  }
}

function GamePage() {
  const { eventInfo } = useGame();

  const canvasRef =
    useRef<HTMLCanvasElement | null>(
      null
    );

  const horsesRef =
    useRef<HorseData[]>([]);

  const motionsRef =
    useRef<RaceMotion[]>([]);

  const animationRef =
    useRef<number | null>(null);

  const lastTimeRef =
    useRef<number | null>(null);

  const elapsedRef =
    useRef(0);

  const finishedSentRef =
    useRef<Set<number>>(
      new Set()
    );

  const [
    players,
    setPlayers,
  ] = useState<Player[]>([]);

  const [
    raceStarted,
    setRaceStarted,
  ] = useState(false);

  const [
    raceId,
    setRaceId,
  ] = useState(0);

  const [
    count,
    setCount,
  ] = useState(3);

  const [
    ranking,
    setRanking,
  ] = useState<number[]>([]);

  const horses = useMemo(() => {
    const grouped = new Map<
      number,
      {
        horseName: string;
        totalScore: number;
        playerCount: number;
      }
    >();

    players.forEach((player) => {
      const tableNumber = Number(
        player.tableNumber ?? 0
      );

      if (
        !Number.isFinite(tableNumber) ||
        tableNumber <= 0
      ) {
        return;
      }

      const score = Number(
        player.score ?? 0
      );

      const current =
        grouped.get(tableNumber);

      if (current) {
        current.totalScore += score;
        current.playerCount += 1;

        if (
          !current.horseName &&
          player.horseName
        ) {
          current.horseName =
            player.horseName;
        }
      } else {
        grouped.set(
          tableNumber,
          {
            horseName:
              player.horseName ||
              `${tableNumber}卓`,
            totalScore: score,
            playerCount: 1,
          }
        );
      }
    });

    return Array.from(
      grouped.entries()
    )
      .map(
        ([
          tableNumber,
          data,
        ]) => ({
          tableNumber,
          horseName:
            data.horseName ||
            `${tableNumber}卓`,
          averageScore:
            data.playerCount > 0
              ? data.totalScore /
                data.playerCount
              : 0,
          playerCount:
            data.playerCount,
        })
      )
      .sort(
        (a, b) =>
          a.tableNumber -
          b.tableNumber
      );
  }, [players]);

  useEffect(() => {
    horsesRef.current = horses;
  }, [horses]);

  useEffect(() => {
    return subscribePlayers(
      setPlayers
    );
  }, []);

  useEffect(() => {
    return subscribeRaceStarted(
      (
        started,
        newRaceId
      ) => {
        setRaceStarted(started);
        setRaceId(newRaceId);
      }
    );
  }, []);

  // 重要：
  // レース開始処理は raceStarted / raceId が
  // 変わったときだけ実行する。
  // ムチでplayersやhorsesが更新されても
  // カウントダウンを再実行しない。
  useEffect(() => {
    if (!raceStarted) {
      setCount(3);
      setRanking([]);

      motionsRef.current = [];

      finishedSentRef.current =
        new Set();

      elapsedRef.current = 0;
      lastTimeRef.current = null;

      return;
    }

    setCount(3);
    setRanking([]);

    motionsRef.current =
      horsesRef.current.map(
        (horse) => ({
          tableNumber:
            horse.tableNumber,
          progress: 0,
          finished: false,
          seed:
            horse.tableNumber *
            1.731,
        })
      );

    finishedSentRef.current =
      new Set();

    elapsedRef.current = 0;
    lastTimeRef.current = null;

    void setAllPlayersFinished(
      false
    );

    let current = 3;

    const timer =
      window.setInterval(() => {
        current -= 1;

        setCount(
          Math.max(current, 0)
        );

        if (current <= 0) {
          window.clearInterval(
            timer
          );
        }
      }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [
    raceStarted,
    raceId,
  ]);

  useEffect(() => {
    const canvas =
      canvasRef.current;

    if (!canvas) {
      return;
    }

    const ctx =
      canvas.getContext("2d");

    if (!ctx) {
      return;
    }

    let disposed = false;

    function resizeCanvas() {
      const rect =
        canvas.getBoundingClientRect();

      const dpr = Math.min(
        window.devicePixelRatio || 1,
        2
      );

      const width = Math.max(
        1,
        Math.floor(
          rect.width * dpr
        )
      );

      const height = Math.max(
        1,
        Math.floor(
          rect.height * dpr
        )
      );

      if (
        canvas.width !== width ||
        canvas.height !== height
      ) {
        canvas.width = width;
        canvas.height = height;
      }

      ctx.setTransform(
        dpr,
        0,
        0,
        dpr,
        0,
        0
      );
    }

    function roundedRect(
      x: number,
      y: number,
      width: number,
      height: number,
      radius: number
    ) {
      const r = Math.min(
        radius,
        width / 2,
        height / 2
      );

      ctx.beginPath();
      ctx.moveTo(x + r, y);

      ctx.lineTo(
        x + width - r,
        y
      );

      ctx.quadraticCurveTo(
        x + width,
        y,
        x + width,
        y + r
      );

      ctx.lineTo(
        x + width,
        y + height - r
      );

      ctx.quadraticCurveTo(
        x + width,
        y + height,
        x + width - r,
        y + height
      );

      ctx.lineTo(
        x + r,
        y + height
      );

      ctx.quadraticCurveTo(
        x,
        y + height,
        x,
        y + height - r
      );

      ctx.lineTo(x, y + r);

      ctx.quadraticCurveTo(
        x,
        y,
        x + r,
        y
      );

      ctx.closePath();
    }

    function drawSky(
      width: number,
      height: number,
      camera: number
    ) {
      const skyBottom =
        height * 0.31;

      const gradient =
        ctx.createLinearGradient(
          0,
          0,
          0,
          skyBottom
        );

      gradient.addColorStop(
        0,
        "#54b7ec"
      );

      gradient.addColorStop(
        1,
        "#ccecf9"
      );

      ctx.fillStyle = gradient;

      ctx.fillRect(
        0,
        0,
        width,
        skyBottom
      );

      ctx.fillStyle =
        "rgba(255,255,255,0.82)";

      for (
        let i = -1;
        i < 6;
        i += 1
      ) {
        const cycle =
          width + 500;

        let x =
          i * 340 -
          camera * 8;

        x =
          ((x % cycle) +
            cycle) %
            cycle -
          150;

        const y =
          60 +
          (i % 3) * 42;

        ctx.beginPath();

        ctx.arc(
          x,
          y,
          28,
          0,
          Math.PI * 2
        );

        ctx.arc(
          x + 35,
          y - 12,
          39,
          0,
          Math.PI * 2
        );

        ctx.arc(
          x + 78,
          y,
          30,
          0,
          Math.PI * 2
        );

        ctx.fill();
      }
    }

    function drawGrandstand(
      width: number,
      height: number,
      camera: number
    ) {
      const top =
        height * 0.17;

      const bottom =
        height * 0.39;

      ctx.fillStyle =
        "#e4e8eb";

      ctx.fillRect(
        0,
        top,
        width,
        bottom - top
      );

      ctx.fillStyle =
        "#46545e";

      ctx.fillRect(
        0,
        top,
        width,
        14
      );

      for (
        let row = 0;
        row < 5;
        row += 1
      ) {
        const y =
          top +
          42 +
          row * 25;

        ctx.fillStyle =
          row % 2 === 0
            ? "#78858e"
            : "#909aa1";

        ctx.fillRect(
          0,
          y,
          width,
          10
        );
      }

      const offset =
        -(camera * 11) % 38;

      const crowdColors = [
        "#c84343",
        "#2864a8",
        "#e6ae29",
        "#3c824e",
        "#754e93",
        "#e87931",
      ];

      for (
        let x = offset - 40;
        x < width + 40;
        x += 19
      ) {
        for (
          let row = 0;
          row < 4;
          row += 1
        ) {
          ctx.fillStyle =
            crowdColors[
              (
                Math.abs(
                  Math.floor(
                    x / 19
                  )
                ) +
                row
              ) %
                crowdColors.length
            ];

          ctx.beginPath();

          ctx.arc(
            x +
              (row % 2) * 7,
            top +
              54 +
              row * 25,
            4,
            0,
            Math.PI * 2
          );

          ctx.fill();
        }
      }
    }

    function drawTrack(
      width: number,
      height: number,
      camera: number
    ) {
      const top =
        height * 0.38;

      const grass =
        ctx.createLinearGradient(
          0,
          top,
          0,
          height
        );

      grass.addColorStop(
        0,
        "#55a74b"
      );

      grass.addColorStop(
        0.55,
        "#32843d"
      );

      grass.addColorStop(
        1,
        "#176029"
      );

      ctx.fillStyle = grass;

      ctx.fillRect(
        0,
        top,
        width,
        height - top
      );

      const stripeWidth =
        Math.max(
          110,
          width * 0.09
        );

      const offset =
        -(
          camera *
          width *
          0.015
        ) %
        (stripeWidth * 2);

      ctx.globalAlpha =
        0.08;

      ctx.fillStyle =
        "#ffffff";

      for (
        let x =
          offset -
          stripeWidth * 2;
        x <
        width +
          stripeWidth * 2;
        x +=
          stripeWidth * 2
      ) {
        ctx.fillRect(
          x,
          top,
          stripeWidth,
          height - top
        );
      }

      ctx.globalAlpha = 1;

      const railY =
        height * 0.445;

      ctx.strokeStyle =
        "#ffffff";

      ctx.lineWidth = 8;

      ctx.beginPath();

      ctx.moveTo(
        0,
        railY
      );

      ctx.lineTo(
        width,
        railY
      );

      ctx.stroke();

      ctx.strokeStyle =
        "#dedede";

      ctx.lineWidth = 3;

      const railOffset =
        -(camera * 19) % 105;

      for (
        let x =
          railOffset - 105;
        x < width + 105;
        x += 105
      ) {
        ctx.beginPath();

        ctx.moveTo(
          x,
          railY - 4
        );

        ctx.lineTo(
          x - 18,
          railY + 70
        );

        ctx.stroke();
      }

      ctx.globalAlpha =
        0.12;

      ctx.strokeStyle =
        "#ffffff";

      ctx.lineWidth = 2;

      for (
        let i = 0;
        i < 3;
        i += 1
      ) {
        const y =
          height *
          DEPTH_Y[i];

        ctx.beginPath();

        ctx.moveTo(
          0,
          y + 37
        );

        ctx.lineTo(
          width,
          y + 37
        );

        ctx.stroke();
      }

      ctx.globalAlpha = 1;
    }

    function drawBackground(
      width: number,
      height: number,
      camera: number
    ) {
      drawSky(
        width,
        height,
        camera
      );

      drawGrandstand(
        width,
        height,
        camera
      );

      drawTrack(
        width,
        height,
        camera
      );
    }

    function drawFinish(
      x: number,
      width: number,
      height: number
    ) {
      if (
        x < -150 ||
        x > width + 150
      ) {
        return;
      }

      const top =
        height * 0.36;

      const bottom =
        height * 0.97;

      ctx.fillStyle =
        "rgba(0,0,0,0.22)";

      ctx.fillRect(
        x + 10,
        top,
        14,
        bottom - top
      );

      ctx.fillStyle =
        "#ffffff";

      ctx.fillRect(
        x - 5,
        top,
        10,
        bottom - top
      );

      const block = 15;

      for (
        let y = top;
        y < bottom;
        y += block
      ) {
        const index =
          Math.floor(
            (y - top) /
              block
          );

        ctx.fillStyle =
          index % 2 === 0
            ? "#111111"
            : "#ffffff";

        ctx.fillRect(
          x - 35,
          y,
          15,
          block
        );

        ctx.fillStyle =
          index % 2 === 0
            ? "#ffffff"
            : "#111111";

        ctx.fillRect(
          x - 20,
          y,
          15,
          block
        );
      }

      ctx.save();

      ctx.translate(
        x - 58,
        top - 16
      );

      ctx.fillStyle =
        "#111111";

      ctx.font =
        "900 22px sans-serif";

      ctx.textAlign =
        "center";

      ctx.fillText(
        "GOAL",
        18,
        0
      );

      ctx.restore();
    }

    function drawHorse(
      horse: HorseData,
      motion: RaceMotion,
      x: number,
      y: number,
      scale: number,
      time: number,
      color: string
    ) {
      const phase =
        time * 0.015 +
        motion.seed;

      const strideA =
        Math.sin(phase);

      const strideB =
        Math.sin(
          phase + Math.PI
        );

      const bob =
        Math.sin(
          phase * 2
        ) * 2.2;

      ctx.save();

      ctx.translate(
        x,
        y + bob * scale
      );

      ctx.scale(
        scale,
        scale
      );

      ctx.globalAlpha =
        0.24;

      ctx.fillStyle =
        "#0a2a12";

      ctx.beginPath();

      ctx.ellipse(
        0,
        34,
        64,
        12,
        0,
        0,
        Math.PI * 2
      );

      ctx.fill();

      ctx.globalAlpha = 1;

      const body =
        "#754225";

      const dark =
        "#432313";

      ctx.strokeStyle =
        dark;

      ctx.lineWidth = 6;

      ctx.lineCap =
        "round";

      function leg(
        startX: number,
        swing: number,
        direction: number
      ) {
        const kneeX =
          startX +
          swing *
            18 *
            direction;

        const hoofX =
          kneeX +
          swing *
            23 *
            direction;

        ctx.beginPath();

        ctx.moveTo(
          startX,
          10
        );

        ctx.lineTo(
          kneeX,
          31
        );

        ctx.lineTo(
          hoofX,
          56
        );

        ctx.stroke();
      }

      leg(
        -29,
        strideA,
        1
      );

      leg(
        -13,
        strideB,
        -1
      );

      leg(
        21,
        strideB,
        1
      );

      leg(
        34,
        strideA,
        -1
      );

      ctx.fillStyle = body;

      ctx.beginPath();

      ctx.ellipse(
        0,
        0,
        52,
        25,
        -0.05,
        0,
        Math.PI * 2
      );

      ctx.fill();

      ctx.fillStyle = dark;

      ctx.beginPath();

      ctx.moveTo(
        32,
        -10
      );

      ctx.lineTo(
        55,
        -48
      );

      ctx.lineTo(
        68,
        -42
      );

      ctx.lineTo(
        44,
        6
      );

      ctx.closePath();

      ctx.fill();

      ctx.fillStyle = body;

      ctx.beginPath();

      ctx.ellipse(
        69,
        -47,
        20,
        12,
        -0.08,
        0,
        Math.PI * 2
      );

      ctx.fill();

      ctx.beginPath();

      ctx.moveTo(
        69,
        -56
      );

      ctx.lineTo(
        76,
        -72
      );

      ctx.lineTo(
        82,
        -52
      );

      ctx.fill();

      ctx.strokeStyle = dark;
      ctx.lineWidth = 7;

      ctx.beginPath();

      ctx.moveTo(
        -46,
        -5
      );

      ctx.quadraticCurveTo(
        -72,
        -3 + strideA * 5,
        -85,
        -23 + strideA * 8
      );

      ctx.stroke();

      ctx.fillStyle = color;

      ctx.fillRect(
        -15,
        -23,
        36,
        25
      );

      ctx.strokeStyle =
        "#111111";

      ctx.lineWidth = 2;

      ctx.strokeRect(
        -15,
        -23,
        36,
        25
      );

      ctx.fillStyle =
        color === "#222222"
          ? "#ffffff"
          : "#111111";

      ctx.font =
        "900 15px sans-serif";

      ctx.textAlign =
        "center";

      ctx.textBaseline =
        "middle";

      ctx.fillText(
        String(
          horse.tableNumber
        ),
        3,
        -10
      );

      ctx.save();

      ctx.translate(
        8,
        -30
      );

      ctx.rotate(-0.23);

      ctx.fillStyle = color;

      ctx.beginPath();

      ctx.moveTo(
        -4,
        -11
      );

      ctx.lineTo(
        29,
        -5
      );

      ctx.lineTo(
        21,
        25
      );

      ctx.lineTo(
        -10,
        15
      );

      ctx.closePath();

      ctx.fill();

      ctx.fillStyle =
        "#f0bb88";

      ctx.beginPath();

      ctx.arc(
        20,
        -20,
        9,
        0,
        Math.PI * 2
      );

      ctx.fill();

      ctx.fillStyle = color;

      ctx.beginPath();

      ctx.arc(
        19,
        -25,
        10,
        Math.PI,
        Math.PI * 2
      );

      ctx.fill();

      ctx.strokeStyle =
        "#252525";

      ctx.lineWidth = 3;

      ctx.beginPath();

      ctx.moveTo(
        7,
        12
      );

      ctx.lineTo(
        47,
        27
      );

      ctx.stroke();

      ctx.restore();
      ctx.restore();

      const labelWidth =
        clamp(
          136 * scale,
          112,
          178
        );

      const labelHeight =
        clamp(
          31 * scale,
          27,
          39
        );

      const labelY =
        y -
        100 * scale;

      roundedRect(
        x - labelWidth / 2,
        labelY,
        labelWidth,
        labelHeight,
        8
      );

      ctx.fillStyle =
        "rgba(255,255,255,0.95)";

      ctx.fill();

      ctx.strokeStyle =
        color;

      ctx.lineWidth = 4;
      ctx.stroke();

      let name =
        horse.horseName ||
        `${horse.tableNumber}卓`;

      if (name.length > 9) {
        name =
          `${name.slice(
            0,
            8
          )}…`;
      }

      ctx.fillStyle =
        "#141414";

      ctx.font =
        `900 ${clamp(
          14 * scale,
          12,
          18
        )}px sans-serif`;

      ctx.textAlign =
        "center";

      ctx.textBaseline =
        "middle";

      ctx.fillText(
        `${horse.tableNumber} ${name}`,
        x,
        labelY +
          labelHeight / 2
      );
    }

    function drawRankingPanel(
      width: number,
      motions: RaceMotion[],
      horseData: HorseData[]
    ) {
      if (
        motions.length === 0
      ) {
        return;
      }

      const sorted =
        [...motions].sort(
          (a, b) =>
            b.progress -
            a.progress
        );

      const shown =
        sorted.slice(0, 5);

      const panelWidth =
        clamp(
          width * 0.18,
          190,
          270
        );

      const panelX =
        width -
        panelWidth -
        20;

      const panelY = 20;

      const panelHeight =
        52 +
        shown.length * 36;

      roundedRect(
        panelX,
        panelY,
        panelWidth,
        panelHeight,
        12
      );

      ctx.fillStyle =
        "rgba(5,14,11,0.82)";

      ctx.fill();

      ctx.fillStyle =
        "#ffffff";

      ctx.font =
        "900 17px sans-serif";

      ctx.textAlign =
        "left";

      ctx.textBaseline =
        "middle";

      ctx.fillText(
        "CURRENT ORDER",
        panelX + 15,
        panelY + 22
      );

      shown.forEach(
        (motion, index) => {
          const horse =
            horseData.find(
              (item) =>
                item.tableNumber ===
                motion.tableNumber
            );

          if (!horse) {
            return;
          }

          const y =
            panelY +
            55 +
            index * 36;

          const color =
            getColor(
              horse.tableNumber
            );

          ctx.fillStyle = color;

          ctx.beginPath();

          ctx.arc(
            panelX + 20,
            y,
            11,
            0,
            Math.PI * 2
          );

          ctx.fill();

          ctx.fillStyle =
            color === "#222222"
              ? "#ffffff"
              : "#111111";

          ctx.font =
            "900 11px sans-serif";

          ctx.textAlign =
            "center";

          ctx.fillText(
            String(
              horse.tableNumber
            ),
            panelX + 20,
            y
          );

          let horseName =
            horse.horseName;

          if (
            horseName.length >
            10
          ) {
            horseName =
              `${horseName.slice(
                0,
                9
              )}…`;
          }

          ctx.fillStyle =
            "#ffffff";

          ctx.font =
            "800 14px sans-serif";

          ctx.textAlign =
            "left";

          ctx.fillText(
            `${index + 1}. ${horseName}`,
            panelX + 42,
            y
          );
        }
      );
    }

    function updateRace(
      deltaSeconds: number
    ) {
      const horseData =
        horsesRef.current;

      const motions =
        motionsRef.current;

      if (
        !raceStarted ||
        count !== 0 ||
        horseData.length === 0 ||
        motions.length === 0
      ) {
        return;
      }

      elapsedRef.current +=
        deltaSeconds;

      const fieldAverage =
        horseData.reduce(
          (sum, horse) =>
            sum +
            horse.averageScore,
          0
        ) /
        horseData.length;

      const newlyFinished:
        number[] = [];

      motions.forEach(
        (motion) => {
          if (motion.finished) {
            return;
          }

          const horse =
            horseData.find(
              (item) =>
                item.tableNumber ===
                motion.tableNumber
            );

          if (!horse) {
            return;
          }

          const scoreDifference =
            horse.averageScore -
            fieldAverage;

          let scoreEffect =
            Math.tanh(
              scoreDifference / 18
            ) * 0.065;

          const raceRatio =
            motion.progress / 100;

          if (raceRatio > 0.82) {
            scoreEffect *= 1.3;
          }

          const wave =
            Math.sin(
              elapsedRef.current *
                0.58 +
                motion.seed
            ) *
              0.021 +
            Math.sin(
              elapsedRef.current *
                1.21 +
                motion.seed * 1.8
            ) *
              0.011;

          const target =
            Math.min(
              99,
              (elapsedRef.current /
                90) *
                100
            );

          const correction =
            clamp(
              (target -
                motion.progress) *
                0.006,
              -0.05,
              0.07
            );

          const multiplier =
            clamp(
              1 +
                scoreEffect +
                wave +
                correction,
              0.86,
              1.15
            );

          motion.progress +=
            BASE_SPEED *
            multiplier *
            deltaSeconds;

          if (
            elapsedRef.current >
              84 &&
            motion.progress < 93
          ) {
            motion.progress +=
              BASE_SPEED *
              0.07 *
              deltaSeconds;
          }

          if (
            motion.progress >=
            100
          ) {
            motion.progress = 100;
            motion.finished = true;

            newlyFinished.push(
              motion.tableNumber
            );
          }
        }
      );

      newlyFinished.forEach(
        (tableNumber) => {
          if (
            finishedSentRef.current.has(
              tableNumber
            )
          ) {
            return;
          }

          finishedSentRef.current.add(
            tableNumber
          );

          setRanking(
            (previous) =>
              previous.includes(
                tableNumber
              )
                ? previous
                : [
                    ...previous,
                    tableNumber,
                  ]
          );

          void finishTable(
            tableNumber
          );
        }
      );
    }

    function render(
      now: number
    ) {
      if (disposed) {
        return;
      }

      resizeCanvas();

      const rect =
        canvas.getBoundingClientRect();

      const width =
        rect.width;

      const height =
        rect.height;

      if (
        lastTimeRef.current ===
        null
      ) {
        lastTimeRef.current =
          now;
      }

      const deltaSeconds =
        clamp(
          (now -
            lastTimeRef.current) /
            1000,
          0,
          0.05
        );

      lastTimeRef.current = now;

      updateRace(
        deltaSeconds
      );

      const motions =
        motionsRef.current;

      const leader =
        motions.length > 0
          ? Math.max(
              ...motions.map(
                (motion) =>
                  motion.progress
              )
            )
          : 0;

      const camera =
        leader < 34
          ? 0
          : clamp(
              leader - 34,
              0,
              62
            );

      drawBackground(
        width,
        height,
        camera
      );

      const worldScale =
        width / 74;

      const leftMargin =
        width * 0.085;

      const finishX =
        leftMargin +
        (100 - camera) *
          worldScale;

      drawFinish(
        finishX,
        width,
        height
      );

      const horseData =
        horsesRef.current;

      const drawable =
        motions
          .map(
            (
              motion,
              index
            ) => {
              const horse =
                horseData.find(
                  (item) =>
                    item.tableNumber ===
                    motion.tableNumber
                );

              if (!horse) {
                return null;
              }

              const depth =
                index % 3;

              const groupIndex =
                Math.floor(
                  index / 3
                );

              const groupShift =
                [
                  0,
                  -12,
                  12,
                  -6,
                ][
                  groupIndex % 4
                ];

              const y =
                height *
                  DEPTH_Y[
                    depth
                  ] +
                groupShift;

              const visualOffset =
                [
                  0,
                  -9,
                  9,
                  -4,
                ][
                  groupIndex % 4
                ];

              const x =
                leftMargin +
                (
                  motion.progress -
                  camera
                ) *
                  worldScale +
                visualOffset;

              return {
                horse,
                motion,
                depth,
                x,
                y,
                scale:
                  DEPTH_SCALE[
                    depth
                  ],
              };
            }
          )
          .filter(
            (
              value
            ): value is NonNullable<
              typeof value
            > =>
              value !== null
          )
          .sort(
            (a, b) => {
              if (
                a.depth !==
                b.depth
              ) {
                return (
                  a.depth -
                  b.depth
                );
              }

              return (
                a.x - b.x
              );
            }
          );

      drawable.forEach(
        (item) => {
          drawHorse(
            item.horse,
            item.motion,
            item.x,
            item.y,
            item.scale,
            now,
            getColor(
              item.horse
                .tableNumber
            )
          );
        }
      );

      drawRankingPanel(
        width,
        motions,
        horseData
      );

      animationRef.current =
        requestAnimationFrame(
          render
        );
    }

    resizeCanvas();

    animationRef.current =
      requestAnimationFrame(
        render
      );

    window.addEventListener(
      "resize",
      resizeCanvas
    );

    return () => {
      disposed = true;

      window.removeEventListener(
        "resize",
        resizeCanvas
      );

      if (
        animationRef.current !==
        null
      ) {
        cancelAnimationFrame(
          animationRef.current
        );

        animationRef.current =
          null;
      }
    };
  }, [
    raceStarted,
    count,
  ]);

  const winner =
    ranking.length > 0
      ? horses.find(
          (horse) =>
            horse.tableNumber ===
            ranking[0]
        )
      : undefined;

  const raceFinished =
    horses.length > 0 &&
    ranking.length ===
      horses.length;

  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        margin: 0,
        padding: 0,
        overflow: "hidden",
        background: "#07130c",
        fontFamily:
          '"Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
        }}
      />

      <div
        style={{
          position: "absolute",
          top: "16px",
          left: "50%",
          transform:
            "translateX(-50%)",
          zIndex: 10,
          color: "#ffffff",
          textAlign: "center",
          textShadow:
            "0 3px 8px rgba(0,0,0,0.85)",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            fontSize:
              "clamp(21px, 2.5vw, 39px)",
            fontWeight: 900,
          }}
        >
          💍 {eventInfo.title}
        </div>

        <div
          style={{
            fontSize:
              "clamp(12px, 1.3vw, 20px)",
            fontWeight: 800,
          }}
        >
          {eventInfo.groom}
          {" × "}
          {eventInfo.bride}
        </div>
      </div>

      {!raceStarted && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent:
              "center",
            zIndex: 30,
            background:
              "rgba(0,0,0,0.48)",
          }}
        >
          <div
            style={{
              width:
                "min(560px, 80vw)",
              padding:
                "34px 44px",
              boxSizing:
                "border-box",
              textAlign: "center",
              borderRadius:
                "24px",
              background:
                "rgba(255,255,255,0.96)",
              boxShadow:
                "0 18px 60px rgba(0,0,0,0.48)",
            }}
          >
            <div
              style={{
                fontSize: "70px",
                lineHeight: 1,
              }}
            >
              🏇
            </div>

            <h1
              style={{
                margin:
                  "14px 0 8px",
              }}
            >
              レース待機中
            </h1>

            <div
              style={{
                fontSize:
                  "20px",
              }}
            >
              出走予定{" "}
              <strong>
                {horses.length}
              </strong>
              頭
            </div>
          </div>
        </div>
      )}

      {raceStarted &&
        count > 0 && (
          <div
            style={{
              position:
                "absolute",
              inset: 0,
              display: "flex",
              alignItems:
                "center",
              justifyContent:
                "center",
              zIndex: 40,
              background:
                "rgba(0,0,0,0.33)",
            }}
          >
            <div
              style={{
                fontSize:
                  "clamp(160px, 26vw, 340px)",
                lineHeight: 1,
                fontWeight: 900,
                color: "#ffffff",
                WebkitTextStroke:
                  "6px #111111",
                textShadow:
                  "0 14px 35px rgba(0,0,0,0.65)",
              }}
            >
              {count}
            </div>
          </div>
        )}

      {raceStarted &&
        count === 0 &&
        !raceFinished && (
          <div
            style={{
              position:
                "absolute",
              left: "50%",
              bottom: "18px",
              transform:
                "translateX(-50%)",
              zIndex: 20,
              padding:
                "8px 28px",
              borderRadius:
                "999px",
              border:
                "2px solid rgba(255,255,255,0.8)",
              background:
                "rgba(145,0,0,0.9)",
              color: "#ffffff",
              fontWeight: 900,
              fontSize:
                "clamp(15px, 1.6vw, 23px)",
              letterSpacing:
                "0.08em",
              boxShadow:
                "0 5px 16px rgba(0,0,0,0.4)",
              pointerEvents:
                "none",
            }}
          >
            WEDDING DERBY
          </div>
        )}

      {raceFinished &&
        winner && (
          <div
            style={{
              position:
                "absolute",
              inset: 0,
              zIndex: 50,
              display: "flex",
              alignItems:
                "center",
              justifyContent:
                "center",
              background:
                "rgba(0,0,0,0.73)",
            }}
          >
            <div
              style={{
                width:
                  "min(900px, 88vw)",
                maxHeight:
                  "86vh",
                overflow: "auto",
                boxSizing:
                  "border-box",
                padding:
                  "30px 44px",
                textAlign:
                  "center",
                borderRadius:
                  "30px",
                border:
                  "5px solid #d5b245",
                background:
                  "linear-gradient(135deg, #fff3bd, #ffffff)",
                boxShadow:
                  "0 20px 75px rgba(0,0,0,0.68)",
              }}
            >
              <div
                style={{
                  fontSize:
                    "76px",
                  lineHeight: 1,
                }}
              >
                🏆
              </div>

              <div
                style={{
                  marginTop:
                    "8px",
                  fontSize:
                    "clamp(23px, 3vw, 40px)",
                  fontWeight: 900,
                }}
              >
                WINNER
              </div>

              <div
                style={{
                  margin:
                    "8px 0 22px",
                  fontSize:
                    "clamp(36px, 5vw, 66px)",
                  fontWeight: 900,
                }}
              >
                {winner.tableNumber}
                卓{" "}
                {winner.horseName}
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(2, minmax(0, 1fr))",
                  gap:
                    "8px 24px",
                  paddingTop:
                    "18px",
                  borderTop:
                    "1px solid #cbbb81",
                  textAlign:
                    "left",
                }}
              >
                {ranking.map(
                  (
                    tableNumber,
                    index
                  ) => {
                    const horse =
                      horses.find(
                        (item) =>
                          item.tableNumber ===
                          tableNumber
                      );

                    return (
                      <div
                        key={
                          tableNumber
                        }
                        style={{
                          padding:
                            "6px 8px",
                          fontSize:
                            "clamp(14px, 1.5vw, 20px)",
                          fontWeight:
                            index < 3
                              ? 900
                              : 700,
                        }}
                      >
                        {index === 0
                          ? "🥇"
                          : index === 1
                            ? "🥈"
                            : index === 2
                              ? "🥉"
                              : `${index + 1}位`}
                        {"　"}
                        {tableNumber}
                        卓{" "}
                        {
                          horse?.horseName
                        }
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          </div>
        )}
    </div>
  );
}

export default GamePage;