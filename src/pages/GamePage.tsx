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

import {
  useGame,
} from "../context/GameContext";

import {
  subscribePlayers,
  subscribeRaceStarted,
  type Player,
} from "../firebase/gameService";

import {
  db,
} from "../firebase";

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

const HORSE_COLORS = [
  "#f7f7f7",
  "#222222",
  "#d92d2d",
  "#2767c7",
  "#f0c629",
  "#41a45b",
  "#e8812e",
  "#e96cae",
  "#7b59c7",
  "#2aa7a1",
  "#b46b37",
];

const BASE_SPEED = 100 / 90;

function clamp(
  value: number,
  min: number,
  max: number
) {
  return Math.max(
    min,
    Math.min(max, value)
  );
}

async function setAllPlayersFinished(
  finished: boolean
) {
  try {
    const snapshot =
      await getDocs(
        collection(
          db,
          "players"
        )
      );

    await Promise.all(
      snapshot.docs.map(
        playerDoc =>
          updateDoc(
            doc(
              db,
              "players",
              playerDoc.id
            ),
            {
              finished,
            }
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
    const snapshot =
      await getDocs(
        collection(
          db,
          "players"
        )
      );

    const targets =
      snapshot.docs.filter(
        playerDoc =>
          (
            playerDoc.data()
              .tableNumber ?? 0
          ) === tableNumber
      );

    await Promise.all(
      targets.map(
        playerDoc =>
          updateDoc(
            doc(
              db,
              "players",
              playerDoc.id
            ),
            {
              finished: true,
            }
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
  const {
    eventInfo,
  } = useGame();

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

  const horses =
    useMemo(() => {
      const grouped =
        new Map<
          number,
          {
            horseName: string;
            totalScore: number;
            playerCount: number;
          }
        >();

      players.forEach(
        player => {
          const tableNumber =
            Number(
              player.tableNumber ?? 0
            );

          if (
            !Number.isFinite(
              tableNumber
            ) ||
            tableNumber <= 0
          ) {
            return;
          }

          const existing =
            grouped.get(
              tableNumber
            );

          if (existing) {
            existing.totalScore +=
              Number(
                player.score ?? 0
              );

            existing.playerCount += 1;

            if (
              !existing.horseName &&
              player.horseName
            ) {
              existing.horseName =
                player.horseName;
            }
          } else {
            grouped.set(
              tableNumber,
              {
                horseName:
                  player.horseName ||
                  `${tableNumber}卓`,
                totalScore:
                  Number(
                    player.score ?? 0
                  ),
                playerCount: 1,
              }
            );
          }
        }
      );

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
              data.horseName,
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
    horsesRef.current =
      horses;
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
        setRaceStarted(
          started
        );

        setRaceId(
          newRaceId
        );
      }
    );
  }, []);

  useEffect(() => {
    if (!raceStarted) {
      setCount(3);
      setRanking([]);

      motionsRef.current =
        [];

      finishedSentRef.current =
        new Set();

      elapsedRef.current = 0;
      lastTimeRef.current =
        null;

      return;
    }

    setCount(3);
    setRanking([]);

    motionsRef.current =
      [];

    finishedSentRef.current =
      new Set();

    elapsedRef.current = 0;
    lastTimeRef.current =
      null;

    setAllPlayersFinished(
      false
    );

    let current = 3;

    const timer =
      window.setInterval(
        () => {
          current -= 1;

          setCount(
            Math.max(
              current,
              0
            )
          );

          if (current <= 0) {
            window.clearInterval(
              timer
            );
          }
        },
        1000
      );

    return () => {
      window.clearInterval(
        timer
      );
    };
  }, [
    raceStarted,
    raceId,
  ]);

  useEffect(() => {
    if (
      !raceStarted ||
      count !== 0 ||
      horses.length === 0
    ) {
      return;
    }

    if (
      motionsRef.current
        .length === 0
    ) {
      motionsRef.current =
        horses.map(
          horse => ({
            tableNumber:
              horse.tableNumber,
            progress: 0,
            finished: false,
            seed:
              horse.tableNumber *
              1.731,
          })
        );
    }

    lastTimeRef.current =
      performance.now();

    elapsedRef.current = 0;

    return () => {
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
    horses.length,
  ]);

  useEffect(() => {
    const canvas =
      canvasRef.current;

    if (!canvas) {
      return;
    }

    const context =
      canvas.getContext(
        "2d"
      );

    if (!context) {
      return;
    }

    let disposed = false;

    function resizeCanvas() {
      const rect =
        canvas.getBoundingClientRect();

      const dpr =
        Math.min(
          window.devicePixelRatio ||
            1,
          2
        );

      const targetWidth =
        Math.max(
          1,
          Math.floor(
            rect.width * dpr
          )
        );

      const targetHeight =
        Math.max(
          1,
          Math.floor(
            rect.height * dpr
          )
        );

      if (
        canvas.width !==
          targetWidth ||
        canvas.height !==
          targetHeight
      ) {
        canvas.width =
          targetWidth;

        canvas.height =
          targetHeight;
      }

      context.setTransform(
        dpr,
        0,
        0,
        dpr,
        0,
        0
      );
    }

    function roundRect(
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      width: number,
      height: number,
      radius: number
    ) {
      const r =
        Math.min(
          radius,
          width / 2,
          height / 2
        );

      ctx.beginPath();

      ctx.moveTo(
        x + r,
        y
      );

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

      ctx.lineTo(
        x,
        y + r
      );

      ctx.quadraticCurveTo(
        x,
        y,
        x + r,
        y
      );

      ctx.closePath();
    }

    function drawBackground(
      ctx: CanvasRenderingContext2D,
      width: number,
      height: number,
      cameraWorld: number
    ) {
      const skyBottom =
        height * 0.33;

      const sky =
        ctx.createLinearGradient(
          0,
          0,
          0,
          skyBottom
        );

      sky.addColorStop(
        0,
        "#75c8f4"
      );

      sky.addColorStop(
        1,
        "#d9f1fb"
      );

      ctx.fillStyle = sky;

      ctx.fillRect(
        0,
        0,
        width,
        skyBottom
      );

      ctx.fillStyle =
        "rgba(255,255,255,0.75)";

      for (
        let i = -1;
        i < 6;
        i += 1
      ) {
        const cloudX =
          (
            i * 310 -
            cameraWorld * 8
          ) %
            (width + 500) -
          100;

        const cloudY =
          55 +
          (i % 3) * 35;

        ctx.beginPath();

        ctx.arc(
          cloudX,
          cloudY,
          28,
          0,
          Math.PI * 2
        );

        ctx.arc(
          cloudX + 32,
          cloudY - 9,
          38,
          0,
          Math.PI * 2
        );

        ctx.arc(
          cloudX + 72,
          cloudY,
          28,
          0,
          Math.PI * 2
        );

        ctx.fill();
      }

      const standTop =
        height * 0.18;

      const standBottom =
        height * 0.39;

      ctx.fillStyle =
        "#dde3e8";

      ctx.fillRect(
        0,
        standTop,
        width,
        standBottom -
          standTop
      );

      ctx.fillStyle =
        "#4c5964";

      ctx.fillRect(
        0,
        standTop,
        width,
        13
      );

      for (
        let row = 0;
        row < 5;
        row += 1
      ) {
        const y =
          standTop +
          35 +
          row * 24;

        ctx.fillStyle =
          row % 2 === 0
            ? "#758391"
            : "#8997a3";

        ctx.fillRect(
          0,
          y,
          width,
          11
        );
      }

      const crowdOffset =
        -(
          cameraWorld * 12
        ) % 36;

      for (
        let x = crowdOffset;
        x < width + 36;
        x += 18
      ) {
        for (
          let row = 0;
          row < 4;
          row += 1
        ) {
          const y =
            standTop +
            48 +
            row * 25;

          ctx.fillStyle =
            [
              "#d9544f",
              "#3367aa",
              "#f0b737",
              "#397b4d",
              "#6e4f8e",
            ][
              (
                Math.floor(
                  x / 18
                ) +
                row
              ) %
                5
            ];

          ctx.beginPath();

          ctx.arc(
            x +
              (row % 2) * 7,
            y,
            4,
            0,
            Math.PI * 2
          );

          ctx.fill();
        }
      }

      const turfTop =
        height * 0.38;

      const grass =
        ctx.createLinearGradient(
          0,
          turfTop,
          0,
          height
        );

      grass.addColorStop(
        0,
        "#4d9e43"
      );

      grass.addColorStop(
        1,
        "#1e672d"
      );

      ctx.fillStyle =
        grass;

      ctx.fillRect(
        0,
        turfTop,
        width,
        height - turfTop
      );

      const stripeWidth =
        Math.max(
          80,
          width * 0.08
        );

      const stripeOffset =
        -(
          cameraWorld *
          width *
          0.012
        ) %
        (
          stripeWidth * 2
        );

      ctx.globalAlpha =
        0.09;

      ctx.fillStyle =
        "#ffffff";

      for (
        let x =
          stripeOffset -
          stripeWidth * 2;
        x <
        width +
          stripeWidth * 2;
        x +=
          stripeWidth * 2
      ) {
        ctx.fillRect(
          x,
          turfTop,
          stripeWidth,
          height -
            turfTop
        );
      }

      ctx.globalAlpha = 1;

      const railY =
        height * 0.43;

      ctx.strokeStyle =
        "#ffffff";

      ctx.lineWidth = 7;

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
        "#d6d6d6";

      ctx.lineWidth = 3;

      const postOffset =
        -(
          cameraWorld * 18
        ) % 95;

      for (
        let x =
          postOffset - 95;
        x < width + 95;
        x += 95
      ) {
        ctx.beginPath();

        ctx.moveTo(
          x,
          railY - 5
        );

        ctx.lineTo(
          x - 15,
          railY + 55
        );

        ctx.stroke();
      }

      ctx.strokeStyle =
        "rgba(255,255,255,0.17)";

      ctx.lineWidth = 2;

      for (
        let i = 1;
        i <= 4;
        i += 1
      ) {
        const y =
          turfTop +
          (
            (height -
              turfTop) /
            5
          ) *
            i;

        ctx.beginPath();

        ctx.moveTo(
          0,
          y
        );

        ctx.lineTo(
          width,
          y
        );

        ctx.stroke();
      }
    }

    function drawFinish(
      ctx: CanvasRenderingContext2D,
      x: number,
      height: number
    ) {
      if (
        x < -100 ||
        x >
          ctx.canvas
            .getBoundingClientRect()
            .width +
            100
      ) {
        return;
      }

      const top =
        height * 0.33;

      const bottom =
        height * 0.94;

      ctx.fillStyle =
        "rgba(0,0,0,0.16)";

      ctx.fillRect(
        x + 8,
        top,
        13,
        bottom - top
      );

      ctx.fillStyle =
        "#ffffff";

      ctx.fillRect(
        x - 4,
        top,
        8,
        bottom - top
      );

      const block = 12;

      for (
        let y = top;
        y < bottom;
        y += block
      ) {
        ctx.fillStyle =
          Math.floor(
            (
              y -
              top
            ) /
              block
          ) %
            2 ===
          0
            ? "#111111"
            : "#ffffff";

        ctx.fillRect(
          x - 16,
          y,
          12,
          block
        );

        ctx.fillStyle =
          Math.floor(
            (
              y -
              top
            ) /
              block
          ) %
            2 ===
          0
            ? "#ffffff"
            : "#111111";

        ctx.fillRect(
          x - 28,
          y,
          12,
          block
        );
      }

      ctx.save();

      ctx.translate(
        x - 50,
        top - 10
      );

      ctx.fillStyle =
        "#111";

      ctx.font =
        "900 18px sans-serif";

      ctx.textAlign =
        "center";

      ctx.fillText(
        "GOAL",
        20,
        0
      );

      ctx.restore();
    }

    function drawHorse(
      ctx: CanvasRenderingContext2D,
      horse: HorseData,
      motion: RaceMotion,
      x: number,
      y: number,
      scale: number,
      time: number,
      color: string
    ) {
      const speedPhase =
        time * 0.012 +
        motion.seed;

      const legSwing =
        Math.sin(
          speedPhase
        );

      const legSwing2 =
        Math.sin(
          speedPhase +
            Math.PI
        );

      ctx.save();

      ctx.translate(
        x,
        y
      );

      ctx.scale(
        scale,
        scale
      );

      ctx.globalAlpha =
        0.22;

      ctx.fillStyle =
        "#102411";

      ctx.beginPath();

      ctx.ellipse(
        -2,
        28,
        48,
        10,
        0,
        0,
        Math.PI * 2
      );

      ctx.fill();

      ctx.globalAlpha = 1;

      const bodyColor =
        "#6f3e23";

      const darkBody =
        "#4e2817";

      ctx.fillStyle =
        bodyColor;

      ctx.beginPath();

      ctx.ellipse(
        0,
        0,
        42,
        21,
        -0.08,
        0,
        Math.PI * 2
      );

      ctx.fill();

      ctx.fillStyle =
        darkBody;

      ctx.beginPath();

      ctx.moveTo(
        27,
        -8
      );

      ctx.lineTo(
        47,
        -40
      );

      ctx.lineTo(
        59,
        -35
      );

      ctx.lineTo(
        38,
        2
      );

      ctx.closePath();

      ctx.fill();

      ctx.fillStyle =
        bodyColor;

      ctx.beginPath();

      ctx.ellipse(
        58,
        -39,
        17,
        10,
        -0.08,
        0,
        Math.PI * 2
      );

      ctx.fill();

      ctx.beginPath();

      ctx.moveTo(
        58,
        -48
      );

      ctx.lineTo(
        63,
        -62
      );

      ctx.lineTo(
        68,
        -46
      );

      ctx.fill();

      ctx.strokeStyle =
        "#2b170d";

      ctx.lineWidth = 5;

      ctx.lineCap =
        "round";

      const drawLeg = (
        hipX: number,
        hipY: number,
        swing: number,
        reverse: boolean
      ) => {
        const direction =
          reverse
            ? -1
            : 1;

        const kneeX =
          hipX +
          swing *
            16 *
            direction;

        const kneeY =
          hipY + 20;

        const hoofX =
          kneeX +
          swing *
            20 *
            direction;

        const hoofY =
          hipY + 43;

        ctx.beginPath();

        ctx.moveTo(
          hipX,
          hipY
        );

        ctx.lineTo(
          kneeX,
          kneeY
        );

        ctx.lineTo(
          hoofX,
          hoofY
        );

        ctx.stroke();
      };

      drawLeg(
        -25,
        10,
        legSwing,
        false
      );

      drawLeg(
        -10,
        12,
        legSwing2,
        true
      );

      drawLeg(
        19,
        10,
        legSwing2,
        false
      );

      drawLeg(
        29,
        7,
        legSwing,
        true
      );

      ctx.strokeStyle =
        "#2d1b12";

      ctx.lineWidth = 6;

      ctx.beginPath();

      ctx.moveTo(
        -38,
        -8
      );

      ctx.quadraticCurveTo(
        -62,
        -5 +
          legSwing * 5,
        -72,
        -21 +
          legSwing * 7
      );

      ctx.stroke();

      ctx.fillStyle =
        color;

      ctx.fillRect(
        -12,
        -20,
        30,
        21
      );

      ctx.strokeStyle =
        "#111";

      ctx.lineWidth = 2;

      ctx.strokeRect(
        -12,
        -20,
        30,
        21
      );

      ctx.fillStyle =
        color === "#222222"
          ? "#ffffff"
          : "#111111";

      ctx.font =
        "900 13px sans-serif";

      ctx.textAlign =
        "center";

      ctx.textBaseline =
        "middle";

      ctx.fillText(
        String(
          horse.tableNumber
        ),
        3,
        -9
      );

      ctx.save();

      ctx.rotate(
        -0.22
      );

      ctx.fillStyle =
        color;

      ctx.beginPath();

      ctx.moveTo(
        2,
        -43
      );

      ctx.lineTo(
        28,
        -37
      );

      ctx.lineTo(
        20,
        -14
      );

      ctx.lineTo(
        -5,
        -23
      );

      ctx.closePath();

      ctx.fill();

      ctx.fillStyle =
        "#f2bd8d";

      ctx.beginPath();

      ctx.arc(
        17,
        -51,
        8,
        0,
        Math.PI * 2
      );

      ctx.fill();

      ctx.fillStyle =
        color;

      ctx.beginPath();

      ctx.arc(
        16,
        -56,
        9,
        Math.PI,
        Math.PI * 2
      );

      ctx.fill();

      ctx.strokeStyle =
        "#202020";

      ctx.lineWidth = 3;

      ctx.beginPath();

      ctx.moveTo(
        6,
        -23
      );

      ctx.lineTo(
        37,
        -10
      );

      ctx.stroke();

      ctx.restore();

      ctx.restore();

      const labelWidth =
        clamp(
          118 * scale,
          86,
          135
        );

      const labelHeight =
        clamp(
          30 * scale,
          23,
          31
        );

      const labelX =
        x -
        labelWidth / 2;

      const labelY =
        y -
        77 * scale;

      roundRect(
        ctx,
        labelX,
        labelY,
        labelWidth,
        labelHeight,
        7
      );

      ctx.fillStyle =
        "rgba(255,255,255,0.94)";

      ctx.fill();

      ctx.strokeStyle =
        color;

      ctx.lineWidth = 3;

      ctx.stroke();

      ctx.fillStyle =
        "#151515";

      ctx.font =
        `800 ${clamp(
          13 * scale,
          10,
          14
        )}px sans-serif`;

      ctx.textAlign =
        "center";

      ctx.textBaseline =
        "middle";

      let name =
        horse.horseName ||
        `${horse.tableNumber}卓`;

      if (
        name.length > 10
      ) {
        name =
          `${name.slice(
            0,
            9
          )}…`;
      }

      ctx.fillText(
        `${horse.tableNumber} ${name}`,
        x,
        labelY +
          labelHeight / 2
      );
    }

    function drawRaceInfo(
      ctx: CanvasRenderingContext2D,
      width: number,
      height: number,
      motions: RaceMotion[],
      horseData: HorseData[]
    ) {
      if (
        motions.length === 0
      ) {
        return;
      }

      const ordered =
        [...motions].sort(
          (a, b) =>
            b.progress -
            a.progress
        );

      const panelWidth =
        clamp(
          width * 0.18,
          170,
          255
        );

      const panelX =
        width -
        panelWidth -
        18;

      const panelY = 18;

      const rows =
        Math.min(
          ordered.length,
          5
        );

      const panelHeight =
        49 +
        rows * 34;

      roundRect(
        ctx,
        panelX,
        panelY,
        panelWidth,
        panelHeight,
        12
      );

      ctx.fillStyle =
        "rgba(5,16,12,0.78)";

      ctx.fill();

      ctx.fillStyle =
        "#ffffff";

      ctx.textAlign =
        "left";

      ctx.textBaseline =
        "middle";

      ctx.font =
        "900 17px sans-serif";

      ctx.fillText(
        "CURRENT ORDER",
        panelX + 14,
        panelY + 22
      );

      ordered
        .slice(
          0,
          rows
        )
        .forEach(
          (
            motion,
            index
          ) => {
            const horse =
              horseData.find(
                item =>
                  item.tableNumber ===
                  motion.tableNumber
              );

            if (!horse) {
              return;
            }

            const y =
              panelY +
              51 +
              index * 34;

            const color =
              HORSE_COLORS[
                (
                  horse.tableNumber -
                  1
                ) %
                  HORSE_COLORS.length
              ];

            ctx.fillStyle =
              color;

            ctx.beginPath();

            ctx.arc(
              panelX + 19,
              y,
              10,
              0,
              Math.PI * 2
            );

            ctx.fill();

            ctx.fillStyle =
              color ===
              "#222222"
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
              panelX + 19,
              y
            );

            ctx.fillStyle =
              "#ffffff";

            ctx.font =
              "700 14px sans-serif";

            ctx.textAlign =
              "left";

            let name =
              horse.horseName;

            if (
              name.length > 11
            ) {
              name =
                `${name.slice(
                  0,
                  10
                )}…`;
            }

            ctx.fillText(
              `${index + 1}. ${name}`,
              panelX + 38,
              y
            );
          }
        );

      ctx.fillStyle =
        "rgba(0,0,0,0.68)";

      roundRect(
        ctx,
        18,
        18,
        180,
        55,
        10
      );

      ctx.fill();

      ctx.fillStyle =
        "#ffffff";

      ctx.textAlign =
        "left";

      ctx.font =
        "900 17px sans-serif";

      ctx.fillText(
        "WEDDING DERBY",
        31,
        39
      );

      ctx.font =
        "700 13px sans-serif";

      ctx.fillStyle =
        "#e4e4e4";

      ctx.fillText(
        "芝 1600m",
        31,
        59
      );

      void height;
    }

    function drawFrame(
      now: number
    ) {
      if (
        disposed ||
        !canvasRef.current
      ) {
        return;
      }

      resizeCanvas();

      const rect =
        canvas.getBoundingClientRect();

      const width =
        rect.width;

      const height =
        rect.height;

      const activeHorses =
        horsesRef.current;

      const motions =
        motionsRef.current;

      if (
        raceStarted &&
        count === 0 &&
        motions.length > 0
      ) {
        if (
          lastTimeRef.current ===
          null
        ) {
          lastTimeRef.current =
            now;
        }

        const deltaSeconds =
          clamp(
            (
              now -
              lastTimeRef.current
            ) /
              1000,
            0,
            0.05
          );

        lastTimeRef.current =
          now;

        elapsedRef.current +=
          deltaSeconds;

        const scoreValues =
          activeHorses.map(
            horse =>
              horse.averageScore
          );

        const fieldAverage =
          scoreValues.length > 0
            ? scoreValues.reduce(
                (
                  total,
                  value
                ) =>
                  total +
                  value,
                0
              ) /
              scoreValues.length
            : 0;

        const newlyFinished:
          number[] = [];

        motions.forEach(
          motion => {
            if (
              motion.finished
            ) {
              return;
            }

            const horse =
              activeHorses.find(
                item =>
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
                scoreDifference /
                  18
              ) * 0.065;

            const raceProgress =
              motion.progress /
              100;

            if (
              raceProgress >
              0.84
            ) {
              scoreEffect *=
                1.35;
            }

            const naturalWave =
              (
                Math.sin(
                  elapsedRef.current *
                    0.57 +
                    motion.seed
                ) *
                  0.022 +
                Math.sin(
                  elapsedRef.current *
                    1.13 +
                    motion.seed *
                      2
                ) *
                  0.012
              ) *
              (
                raceProgress >
                0.84
                  ? 0.45
                  : 1
              );

            const idealProgress =
              Math.min(
                99,
                (
                  elapsedRef.current /
                  90
                ) *
                  100
              );

            const paceCorrection =
              clamp(
                (
                  idealProgress -
                  motion.progress
                ) *
                  0.006,
                -0.05,
                0.07
              );

            const multiplier =
              clamp(
                1 +
                  scoreEffect +
                  naturalWave +
                  paceCorrection,
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
              motion.progress <
                92
            ) {
              motion.progress +=
                BASE_SPEED *
                0.08 *
                deltaSeconds;
            }

            if (
              motion.progress >=
              100
            ) {
              motion.progress =
                100;

              motion.finished =
                true;

              newlyFinished.push(
                motion.tableNumber
              );
            }
          }
        );

        if (
          newlyFinished.length >
          0
        ) {
          newlyFinished.sort(
            (a, b) => {
              const ma =
                motions.find(
                  item =>
                    item.tableNumber ===
                    a
                );

              const mb =
                motions.find(
                  item =>
                    item.tableNumber ===
                    b
                );

              return (
                (
                  mb?.progress ??
                  0
                ) -
                (
                  ma?.progress ??
                  0
                )
              );
            }
          );

          newlyFinished.forEach(
            tableNumber => {
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
                previous =>
                  previous.includes(
                    tableNumber
                  )
                    ? previous
                    : [
                        ...previous,
                        tableNumber,
                      ]
              );

              finishTable(
                tableNumber
              );
            }
          );
        }
      }

      const leader =
        motionsRef.current
          .length > 0
          ? Math.max(
              ...motionsRef.current.map(
                motion =>
                  motion.progress
              )
            )
          : 0;

      const cameraWorld =
        leader < 42
          ? 0
          : clamp(
              leader - 42,
              0,
              52
            );

      drawBackground(
        context,
        width,
        height,
        cameraWorld
      );

      const worldScale =
        width / 70;

      const leftMargin =
        width * 0.075;

      const finishX =
        leftMargin +
        (
          100 -
          cameraWorld
        ) *
          worldScale;

      drawFinish(
        context,
        finishX,
        height
      );

      const horseCount =
        Math.max(
          motionsRef.current
            .length,
          1
        );

      const trackTop =
        height * 0.49;

      const trackBottom =
        height * 0.91;

      const trackHeight =
        trackBottom -
        trackTop;

      const drawable =
        motionsRef.current
          .map(
            (
              motion,
              index
            ) => {
              const horse =
                horsesRef.current.find(
                  item =>
                    item.tableNumber ===
                    motion.tableNumber
                );

              if (!horse) {
                return null;
              }

              const slot =
                horseCount <= 1
                  ? 0.5
                  : index /
                    (
                      horseCount -
                      1
                    );

              const y =
                trackTop +
                slot *
                  trackHeight;

              const scale =
                0.62 +
                slot * 0.34;

              const x =
                leftMargin +
                (
                  motion.progress -
                  cameraWorld
                ) *
                  worldScale;

              return {
                horse,
                motion,
                x,
                y,
                scale,
              };
            }
          )
          .filter(
            (
              item
            ): item is NonNullable<
              typeof item
            > =>
              item !== null
          )
          .sort(
            (a, b) =>
              a.y - b.y
          );

      drawable.forEach(
        item => {
          const color =
            HORSE_COLORS[
              (
                item.horse
                  .tableNumber -
                1
              ) %
                HORSE_COLORS.length
            ];

          drawHorse(
            context,
            item.horse,
            item.motion,
            item.x,
            item.y,
            item.scale,
            now,
            color
          );
        }
      );

      drawRaceInfo(
        context,
        width,
        height,
        motionsRef.current,
        horsesRef.current
      );

      animationRef.current =
        requestAnimationFrame(
          drawFrame
        );
    }

    animationRef.current =
      requestAnimationFrame(
        drawFrame
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
      }
    };
  }, [
    raceStarted,
    count,
  ]);

  const winner =
    ranking.length > 0
      ? horses.find(
          horse =>
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
        width: "100vw",
        height: "100vh",
        margin: 0,
        padding: 0,
        overflow: "hidden",
        background: "#07130c",
        position: "relative",
        fontFamily:
          '"Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: "block",
          width: "100%",
          height: "100%",
        }}
      />

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "18px",
          transform:
            "translateX(-50%)",
          zIndex: 15,
          color: "#ffffff",
          textAlign: "center",
          pointerEvents: "none",
          textShadow:
            "0 2px 6px rgba(0,0,0,0.9)",
        }}
      >
        <div
          style={{
            fontSize:
              "clamp(20px, 2.4vw, 38px)",
            fontWeight: 900,
          }}
        >
          {eventInfo.title}
        </div>

        <div
          style={{
            fontSize:
              "clamp(12px, 1.3vw, 19px)",
            fontWeight: 700,
            marginTop: "2px",
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
            background:
              "rgba(0,0,0,0.48)",
            zIndex: 30,
          }}
        >
          <div
            style={{
              background:
                "rgba(255,255,255,0.96)",
              borderRadius:
                "24px",
              padding:
                "34px 56px",
              textAlign:
                "center",
              boxShadow:
                "0 16px 60px rgba(0,0,0,0.45)",
            }}
          >
            <div
              style={{
                fontSize:
                  "72px",
              }}
            >
              🏇
            </div>

            <h1
              style={{
                margin:
                  "8px 0 12px",
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
                "rgba(0,0,0,0.32)",
            }}
          >
            <div
              style={{
                fontSize:
                  "clamp(150px, 25vw, 330px)",
                lineHeight: 1,
                fontWeight: 900,
                color: "#ffffff",
                WebkitTextStroke:
                  "6px #111111",
                textShadow:
                  "0 12px 30px rgba(0,0,0,0.6)",
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
              background:
                "rgba(150,0,0,0.88)",
              color: "#ffffff",
              border:
                "2px solid rgba(255,255,255,0.8)",
              borderRadius:
                "999px",
              padding:
                "7px 24px",
              fontWeight: 900,
              fontSize:
                "clamp(14px, 1.6vw, 22px)",
              letterSpacing:
                "0.08em",
              zIndex: 12,
              boxShadow:
                "0 4px 14px rgba(0,0,0,0.35)",
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
              display: "flex",
              alignItems:
                "center",
              justifyContent:
                "center",
              background:
                "rgba(0,0,0,0.72)",
              zIndex: 50,
            }}
          >
            <div
              style={{
                width:
                  "min(860px, 86vw)",
                maxHeight:
                  "86vh",
                overflow:
                  "auto",
                background:
                  "linear-gradient(135deg, #fff6c9, #ffffff)",
                border:
                  "5px solid #d7b44a",
                borderRadius:
                  "28px",
                padding:
                  "28px 42px",
                boxSizing:
                  "border-box",
                textAlign:
                  "center",
                boxShadow:
                  "0 18px 70px rgba(0,0,0,0.65)",
              }}
          >
            <div
              style={{
                fontSize:
                  "72px",
                lineHeight: 1,
              }}
            >
              🏆
            </div>

            <div
              style={{
                fontSize:
                  "clamp(22px, 3vw, 38px)",
                fontWeight: 900,
                marginTop:
                  "10px",
              }}
            >
              WINNER
            </div>

            <div
              style={{
                margin:
                  "8px 0 20px",
                fontSize:
                  "clamp(34px, 5vw, 64px)",
                fontWeight: 900,
              }}
            >
              {winner.tableNumber}
              卓{" "}
              {winner.horseName}
            </div>

            <div
              style={{
                display:
                  "grid",
                gridTemplateColumns:
                  "repeat(2, minmax(0, 1fr))",
                gap:
                  "7px 24px",
                borderTop:
                  "1px solid #d4c58f",
                paddingTop:
                  "18px",
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
                      item =>
                        item.tableNumber ===
                        tableNumber
                    );

                  return (
                    <div
                      key={
                        tableNumber
                      }
                      style={{
                        fontSize:
                          "clamp(14px, 1.5vw, 19px)",
                        fontWeight:
                          index <
                          3
                            ? 900
                            : 700,
                        padding:
                          "5px 8px",
                      }}
                    >
                      {index ===
                      0
                        ? "🥇"
                        : index ===
                            1
                          ? "🥈"
                          : index ===
                              2
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