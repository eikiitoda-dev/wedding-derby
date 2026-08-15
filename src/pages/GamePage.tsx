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

const DEPTH_Y = [0.57, 0.72, 0.865];
const DEPTH_SCALE = [0.78, 0.94, 1.08];

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

  const [
    raceProgress,
    setRaceProgress,
  ] = useState(0);

  const lastProgressUiUpdateRef =
    useRef(0);

  /*
   * scoreはムチのたびに更新されるため、
   * players配列そのものをバナナタイマーの依存にすると
   * 毎クリックでタイマーが作り直されてしまう。
   *
   * 参加者IDだけを安定したキーにして、
   * 登録人数が変わった時だけ予定を組み直す。
   */
  const playerIdKey =
    useMemo(
      () =>
        players
          .map(
            player =>
              player.id
          )
          .filter(Boolean)
          .sort()
          .join("|"),
      [players]
    );


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
      setRaceProgress(0);

      motionsRef.current = [];

      finishedSentRef.current =
        new Set();

      elapsedRef.current = 0;
      lastTimeRef.current = null;

      return;
    }

    setCount(3);
    setRanking([]);
    setRaceProgress(0);

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


  // 🍌 参加者ごとの個別バナナ
  //
  // 全員一斉ではなく、各参加者に3回ずつ、
  // それぞれ別のタイミングで発生させる。
  // タイミングは raceId と参加者IDから決めるため、
  // GamePageが再描画されても同じレース中に予定が変わらない。
  useEffect(() => {
    if (
      !raceStarted ||
      count !== 0 ||
      !raceId ||
      players.length === 0
    ) {
      return;
    }

    const bananaDuration =
      5_000;

    const windows = [
      [15_000, 30_000],
      [38_000, 55_000],
      [63_000, 78_000],
    ] as const;

    const timers:
      number[] = [];

    const hashText =
      (text: string) => {
        let hash = 2166136261;

        for (
          let index = 0;
          index < text.length;
          index += 1
        ) {
          hash ^= text.charCodeAt(index);
          hash = Math.imul(
            hash,
            16777619
          );
        }

        return hash >>> 0;
      };

    const playerIds =
      playerIdKey
        .split("|")
        .filter(Boolean);

    playerIds.forEach(
      playerId => {
        windows.forEach(
          (
            [windowStart, windowEnd],
            eventIndex
          ) => {
            const hash =
              hashText(
                `${raceId}:${playerId}:${eventIndex}`
              );

            const span =
              windowEnd -
              windowStart;

            const delay =
              windowStart +
              (hash % Math.max(span, 1));

            const eventId =
              Number(
                `${String(raceId).slice(-8)}${eventIndex + 1}${hash % 1000}`
              );

            const startTimer =
              window.setTimeout(
                async () => {
                  try {
                    await updateDoc(
                      doc(
                        db,
                        "players",
                        playerId
                      ),
                      {
                        eventType:
                          "banana",
                        eventId,
                        eventExpiresAt:
                          Date.now() +
                          bananaDuration,
                      }
                    );
                  } catch (error) {
                    console.error(
                      "個別バナナ開始エラー",
                      error
                    );
                  }

                  const endTimer =
                    window.setTimeout(
                      async () => {
                        try {
                          await updateDoc(
                            doc(
                              db,
                              "players",
                              playerId
                            ),
                            {
                              eventType:
                                "none",
                              eventExpiresAt:
                                0,
                            }
                          );
                        } catch (error) {
                          console.error(
                            "個別バナナ終了エラー",
                            error
                          );
                        }
                      },
                      bananaDuration
                    );

                  timers.push(
                    endTimer
                  );
                },
                delay
              );

            timers.push(
              startTimer
            );
          }
        );
      }
    );

    return () => {
      timers.forEach(
        timer => {
          window.clearTimeout(
            timer
          );
        }
      );
    };
  }, [
    raceStarted,
    count,
    raceId,
    playerIdKey,
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

    const horseImages = Array.from({ length: 11 }, (_, index) => {
      const image = new Image();
      image.src = `/horses/horse-${String(index + 1).padStart(2, "0")}.png`;
      return image;
    });

    const racecourseImage = new Image();
    racecourseImage.src = "/racecourse-stand.jpg";

    function drawBackground(
      width: number,
      height: number,
      cameraProgress: number
    ) {
      const scenicHeight = height * 0.47;

      if (
        racecourseImage.complete &&
        racecourseImage.naturalWidth > 0
      ) {
        const sourceW = racecourseImage.naturalWidth;
        const sourceH = racecourseImage.naturalHeight;
        const shift = (cameraProgress * 8.5) % Math.max(sourceW * 0.12, 1);

        ctx.drawImage(
          racecourseImage,
          Math.min(shift, sourceW - 1),
          0,
          Math.max(1, sourceW - Math.min(shift, sourceW - 1)),
          sourceH,
          0,
          0,
          width,
          scenicHeight
        );
      } else {
        const sky = ctx.createLinearGradient(0, 0, 0, scenicHeight);
        sky.addColorStop(0, "#5aaad9");
        sky.addColorStop(1, "#d9eef7");
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, width, scenicHeight);
      }

      const blend = ctx.createLinearGradient(
        0,
        scenicHeight - 55,
        0,
        scenicHeight + 65
      );
      blend.addColorStop(0, "rgba(74,105,61,0)");
      blend.addColorStop(1, "rgba(66,103,57,0.96)");
      ctx.fillStyle = blend;
      ctx.fillRect(0, scenicHeight - 55, width, 120);

      const grassTop = height * 0.40;
      const grass = ctx.createLinearGradient(0, grassTop, 0, height);
      grass.addColorStop(0, "rgba(103,137,82,0.84)");
      grass.addColorStop(0.22, "#6d8f5d");
      grass.addColorStop(0.52, "#5b7d50");
      grass.addColorStop(0.78, "#4b7048");
      grass.addColorStop(1, "#395f3d");
      ctx.fillStyle = grass;
      ctx.fillRect(0, grassTop, width, height - grassTop);

      const broadStripe = Math.max(88, width * 0.055);
      const broadOffset =
        -(cameraProgress * width * 0.028) % (broadStripe * 2);

      ctx.globalAlpha = 0.045;
      for (
        let x = broadOffset - broadStripe * 2;
        x < width + broadStripe * 2;
        x += broadStripe * 2
      ) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(x, grassTop, broadStripe, height - grassTop);
      }

      ctx.globalAlpha = 0.10;
      const textureOffset = -(cameraProgress * 72) % 160;
      for (let x = textureOffset - 160; x < width + 160; x += 160) {
        for (let band = 0; band < 5; band += 1) {
          const y =
            grassTop +
            (height - grassTop) * (0.10 + band * 0.18);
          const length = 45 + ((band * 19 + Math.abs(Math.floor(x))) % 70);
          ctx.strokeStyle =
            band % 2 === 0
              ? "rgba(255,255,255,0.32)"
              : "rgba(37,67,39,0.30)";
          ctx.lineWidth = band < 2 ? 1 : 1.4;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + length, y);
          ctx.stroke();
        }
      }

      ctx.globalAlpha = 0.18;
      for (let row = 0; row < 8; row += 1) {
        const depth = row / 7;
        const y =
          grassTop +
          (height - grassTop) * (0.07 + depth * 0.88);
        const spacing = 26 - depth * 10;
        const bladeOffset =
          -(cameraProgress * (10 + depth * 32)) % spacing;

        for (
          let x = bladeOffset - spacing;
          x < width + spacing;
          x += spacing
        ) {
          const jitter =
            ((Math.floor(x / spacing) + row * 7) % 5) - 2;
          ctx.strokeStyle =
            row % 2 === 0
              ? "rgba(239,247,226,0.32)"
              : "rgba(43,77,44,0.36)";
          ctx.lineWidth = depth < 0.45 ? 0.7 : 1;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + 3 + jitter, y - (2 + depth * 3));
          ctx.stroke();
        }
      }

      ctx.globalAlpha = 0.08;
      for (let band = 0; band < 3; band += 1) {
        const y = height * [0.59, 0.73, 0.87][band];
        const trackOffset =
          -(cameraProgress * (34 + band * 9)) % 260;

        for (
          let x = trackOffset - 260;
          x < width + 260;
          x += 260
        ) {
          ctx.fillStyle = "rgba(44,69,42,0.50)";
          ctx.beginPath();
          ctx.ellipse(x, y, 58 + band * 12, 4 + band, -0.03, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.globalAlpha = 1;

      const railY = height * 0.445;
      ctx.strokeStyle = "rgba(250,250,250,0.92)";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, railY);
      ctx.lineTo(width, railY);
      ctx.stroke();

      const railOffset = -(cameraProgress * 28) % 96;
      ctx.strokeStyle = "rgba(225,225,225,0.86)";
      ctx.lineWidth = 2;
      for (let x = railOffset - 96; x < width + 96; x += 96) {
        ctx.beginPath();
        ctx.moveTo(x, railY);
        ctx.lineTo(x - 15, railY + 48);
        ctx.stroke();
      }

      ctx.globalAlpha = 0.10;
      const speedOffset = -(cameraProgress * 62) % 230;
      for (let x = speedOffset - 230; x < width + 230; x += 230) {
        const band = Math.abs(Math.floor(x / 230)) % 5;
        const y = height * [0.53, 0.61, 0.70, 0.80, 0.90][band];
        const length = 85 + band * 24;
        const gradient = ctx.createLinearGradient(x, y, x + length, y);
        gradient.addColorStop(0, "rgba(255,255,255,0)");
        gradient.addColorStop(0.35, "rgba(255,255,255,0.55)");
        gradient.addColorStop(1, "rgba(255,255,255,0)");
        ctx.strokeStyle = gradient;
        ctx.lineWidth = band < 2 ? 1 : 1.8;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + length, y);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    function drawFinish(
      x: number,
      width: number,
      height: number
    ) {
      if (x < -150 || x > width + 150) {
        return;
      }

      const top = height * 0.36;
      const bottom = height * 0.97;

      ctx.fillStyle = "rgba(0,0,0,0.22)";
      ctx.fillRect(x + 10, top, 14, bottom - top);

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(x - 5, top, 10, bottom - top);

      const block = 15;

      for (let y = top; y < bottom; y += block) {
        const index = Math.floor((y - top) / block);

        ctx.fillStyle = index % 2 === 0 ? "#111111" : "#ffffff";
        ctx.fillRect(x - 35, y, 15, block);

        ctx.fillStyle = index % 2 === 0 ? "#ffffff" : "#111111";
        ctx.fillRect(x - 20, y, 15, block);
      }

      ctx.save();
      ctx.translate(x - 58, top - 16);
      ctx.fillStyle = "#111111";
      ctx.font = "900 22px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("GOAL", 18, 0);
      ctx.restore();
    }

    function drawHorse(
      horse: HorseData,
      motion: RaceMotion,
      x: number,
      y: number,
      scale: number,
      time: number,
      rank: number
    ) {
      const image =
        horseImages[(horse.tableNumber - 1) % horseImages.length];

      /*
       * 1枚PNGでも「走っている」ように見せるため、
       * 上下だけではなく前後・傾き・伸縮を
       * 小さく組み合わせる。
       *
       * 各馬はseedで周期をずらし、
       * 全頭が同じタイミングで跳ねないようにする。
       */
      const running =
        raceStarted &&
        count === 0 &&
        !motion.finished;

      const phase =
        time * 0.018 +
        motion.seed * 1.7;

      const gait =
        running ? 1 : 0;

      const bob =
        Math.sin(phase * 2) *
        2.0 *
        gait;

      const surge =
        (
          Math.sin(phase) * 2.8 +
          Math.sin(
            phase * 0.53 +
            motion.seed
          ) * 1.2
        ) *
        gait;

      const tilt =
        Math.sin(
          phase * 2 +
          0.7
        ) *
        0.012 *
        gait;

      const stretchX =
        1 +
        Math.sin(phase * 2) *
        0.018 *
        gait;

      const stretchY =
        1 -
        Math.sin(phase * 2) *
        0.012 *
        gait;

      const baseWidth = 255;
      const baseHeight = 166;

      ctx.save();

      ctx.translate(
        x + surge * scale,
        y + bob * scale
      );

      ctx.rotate(
        tilt
      );

      ctx.scale(
        scale * stretchX,
        scale * stretchY
      );

      if (
        image.complete &&
        image.naturalWidth > 0
      ) {
        ctx.drawImage(
          image,
          -baseWidth / 2,
          -baseHeight / 2,
          baseWidth,
          baseHeight
        );
      } else {
        ctx.fillStyle = "#ffffff";
        ctx.font = "900 18px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(
          `#${horse.tableNumber}`,
          0,
          0
        );
      }

      ctx.restore();

      /*
       * ラベルは馬の揺れに追従させすぎず、
       * 大型スクリーンで読みやすさを優先する。
       */
      const color =
        getColor(
          horse.tableNumber
        );

      const labelWidth =
        Math.max(
          158,
          188 * scale
        );

      const labelHeight =
        Math.max(
          28,
          32 * scale
        );

      const labelY =
        y -
        98 * scale;

      roundedRect(
        x - labelWidth / 2,
        labelY,
        labelWidth,
        labelHeight,
        8
      );

      ctx.fillStyle =
        rank <= 3
          ? "rgba(255,248,211,0.98)"
          : "rgba(255,255,255,0.95)";

      ctx.fill();

      ctx.strokeStyle =
        rank === 1
          ? "#d6a900"
          : rank === 2
            ? "#a9adb2"
            : rank === 3
              ? "#b56b36"
              : color;

      ctx.lineWidth =
        rank <= 3
          ? 5
          : 3;

      ctx.stroke();

      const rankText =
        rank === 1
          ? "1位"
          : rank === 2
            ? "2位"
            : rank === 3
              ? "3位"
              : `${rank}位`;

      const fontSize =
        Math.max(
          12,
          13 * scale
        );

      ctx.fillStyle =
        "#151515";

      ctx.font =
        `900 ${fontSize}px sans-serif`;

      ctx.textAlign =
        "center";

      ctx.textBaseline =
        "middle";

      const prefix =
        `${rankText}  ${horse.tableNumber} `;

      const originalName =
        horse.horseName ||
        `${horse.tableNumber}卓`;

      const maxTextWidth =
        labelWidth - 18;

      let fittedName =
        originalName;

      while (
        fittedName.length > 1 &&
        ctx.measureText(
          `${prefix}${fittedName}`
        ).width >
          maxTextWidth
      ) {
        fittedName =
          fittedName.slice(
            0,
            -1
          );
      }

      if (
        fittedName !==
        originalName
      ) {
        fittedName =
          `${fittedName.slice(
            0,
            Math.max(
              fittedName.length - 1,
              1
            )
          )}…`;
      }

      ctx.save();

      ctx.beginPath();

      ctx.rect(
        x -
          labelWidth / 2 +
          6,
        labelY + 2,
        labelWidth - 12,
        labelHeight - 4
      );

      ctx.clip();

      ctx.fillText(
        `${prefix}${fittedName}`,
        x,
        labelY +
          labelHeight / 2
      );

      ctx.restore();
    }

    function drawRaceProgress(
      width: number,
      height: number,
      leaderProgress: number
    ) {
      /*
       * 大スクリーンでは距離標識より、
       * 「あとどれくらい」が一目で分かる横ゲージを優先。
       *
       * 右上の順位表と干渉しないよう画面下中央に配置する。
       */
      const progress =
        clamp(
          leaderProgress,
          0,
          100
        );

      const barWidth =
        Math.min(
          width * 0.62,
          920
        );

      const barHeight =
        Math.max(
          22,
          Math.min(
            30,
            height * 0.032
          )
        );

      const x =
        (width - barWidth) / 2;

      const y =
        height -
        barHeight -
        34;

      const labelY =
        y - 18;

      ctx.save();

      ctx.textBaseline =
        "middle";

      ctx.shadowColor =
        "rgba(0,0,0,0.78)";

      ctx.shadowBlur = 7;

      ctx.fillStyle =
        "#ffffff";

      ctx.font =
        `900 ${Math.max(
          15,
          Math.min(
            21,
            width * 0.014
          )
        )}px sans-serif`;

      ctx.textAlign =
        "left";

      ctx.fillText(
        "START",
        x,
        labelY
      );

      ctx.textAlign =
        "right";

      ctx.fillText(
        "🏁 GOAL",
        x + barWidth,
        labelY
      );

      ctx.shadowBlur = 0;

      roundedRect(
        x - 5,
        y - 5,
        barWidth + 10,
        barHeight + 10,
        (barHeight + 10) / 2
      );

      ctx.fillStyle =
        "rgba(5,14,10,0.82)";

      ctx.fill();

      roundedRect(
        x,
        y,
        barWidth,
        barHeight,
        barHeight / 2
      );

      ctx.fillStyle =
        "rgba(255,255,255,0.20)";

      ctx.fill();

      const fillWidth =
        barWidth *
        (progress / 100);

      if (
        fillWidth > 1
      ) {
        const gradient =
          ctx.createLinearGradient(
            x,
            y,
            x + barWidth,
            y
          );

        gradient.addColorStop(
          0,
          "#e4bd42"
        );

        gradient.addColorStop(
          0.72,
          "#f0d76b"
        );

        gradient.addColorStop(
          1,
          "#fff0a2"
        );

        roundedRect(
          x,
          y,
          Math.max(
            fillWidth,
            barHeight
          ),
          barHeight,
          barHeight / 2
        );

        ctx.fillStyle =
          gradient;

        ctx.fill();
      }

      /*
       * 先頭馬の現在地を大きなマーカーで表示。
       */
      const markerX =
        x +
        barWidth *
          (progress / 100);

      ctx.beginPath();

      ctx.arc(
        markerX,
        y + barHeight / 2,
        Math.max(
          12,
          barHeight * 0.62
        ),
        0,
        Math.PI * 2
      );

      ctx.fillStyle =
        "#ffffff";

      ctx.fill();

      ctx.strokeStyle =
        "#9d7715";

      ctx.lineWidth = 3;

      ctx.stroke();

      ctx.fillStyle =
        "#171717";

      ctx.font =
        `900 ${Math.max(
          11,
          barHeight * 0.42
        )}px sans-serif`;

      ctx.textAlign =
        "center";

      ctx.textBaseline =
        "middle";

      ctx.fillText(
        "🐎",
        markerX,
        y + barHeight / 2 + 1
      );

      /*
       * 残り距離は「1600mレース換算」の目安表示。
       * 厳密な競馬距離ではなく、観客が残り感を掴むためのUI。
       */
      const remainingMeters =
        Math.max(
          0,
          Math.round(
            (1600 *
              (1 - progress / 100)) /
              50
          ) * 50
        );

      const statusText =
        progress >= 100
          ? "GOAL!"
          : progress >= 87.5
            ? "LAST SPURT!"
            : `残り 約${remainingMeters}m`;

      ctx.shadowColor =
        "rgba(0,0,0,0.82)";

      ctx.shadowBlur = 6;

      ctx.fillStyle =
        "#ffffff";

      ctx.font =
        `900 ${Math.max(
          17,
          Math.min(
            25,
            width * 0.016
          )
        )}px sans-serif`;

      ctx.textAlign =
        "center";

      ctx.fillText(
        statusText,
        width / 2,
        y +
          barHeight +
          27
      );

      ctx.restore();
    }


    function drawRankingPanel(
      width: number,
      height: number,
      motions: RaceMotion[],
      horseData: HorseData[]
    ) {
      if (motions.length === 0) {
        return;
      }

      const sorted = [...motions].sort(
        (a, b) => b.progress - a.progress
      );

      const panelWidth = Math.min(245, width * 0.18);
      const panelX = width - panelWidth - 18;
      const panelY = 18;
      const rowHeight = Math.max(24, Math.min(29, height * 0.032));
      const headerHeight = 46;
      const shown = sorted.slice(0, Math.min(11, sorted.length));
      const panelHeight = headerHeight + rowHeight * shown.length + 14;

      roundedRect(
        panelX,
        panelY,
        panelWidth,
        panelHeight,
        14
      );

      ctx.fillStyle = "rgba(7,18,13,0.88)";
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.16)";
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = "#ffffff";
      ctx.font = "900 17px sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText("CURRENT ORDER", panelX + 15, panelY + 22);

      shown.forEach((motion, index) => {
        const horse = horseData.find(
          (item) => item.tableNumber === motion.tableNumber
        );
        if (!horse) return;

        const y =
          panelY +
          headerHeight +
          index * rowHeight +
          rowHeight / 2;
        const color = getColor(horse.tableNumber);

        if (index < 3) {
          roundedRect(
            panelX + 8,
            y - rowHeight / 2 + 2,
            panelWidth - 16,
            rowHeight - 4,
            6
          );
          ctx.fillStyle =
            index === 0
              ? "rgba(214,169,0,0.18)"
              : index === 1
                ? "rgba(169,173,178,0.15)"
                : "rgba(181,107,54,0.15)";
          ctx.fill();
        }

        ctx.fillStyle =
          index === 0
            ? "#f6cc34"
            : index === 1
              ? "#d8dde2"
              : index === 2
                ? "#d68b50"
                : "#ffffff";
        ctx.font = "900 13px sans-serif";
        ctx.textAlign = "right";
        ctx.fillText(String(index + 1), panelX + 29, y);

        ctx.fillStyle = color;
        roundedRect(panelX + 38, y - 10, 24, 20, 5);
        ctx.fill();

        ctx.fillStyle = color === "#222222" ? "#ffffff" : "#111111";
        ctx.font = "900 10px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(String(horse.tableNumber), panelX + 50, y);

        const originalHorseName =
          horse.horseName ||
          `${horse.tableNumber}卓`;

        ctx.fillStyle =
          "#ffffff";

        ctx.font =
          "800 13px sans-serif";

        ctx.textAlign =
          "left";

        const maxNameWidth =
          Math.max(
            50,
            panelWidth - 84
          );

        let horseName =
          originalHorseName;

        while (
          horseName.length > 1 &&
          ctx.measureText(
            horseName
          ).width >
            maxNameWidth
        ) {
          horseName =
            horseName.slice(
              0,
              -1
            );
        }

        if (
          horseName !==
          originalHorseName
        ) {
          horseName =
            `${horseName.slice(
              0,
              Math.max(
                horseName.length - 1,
                1
              )
            )}…`;
        }

        ctx.save();

        ctx.beginPath();

        ctx.rect(
          panelX + 68,
          y -
            rowHeight / 2,
          panelWidth - 76,
          rowHeight
        );

        ctx.clip();

        ctx.fillText(
          horseName,
          panelX + 70,
          y
        );

        ctx.restore();
      });
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

      const scoreValues =
        horseData.map(
          horse =>
            horse.averageScore
        );

      const maxScore =
        Math.max(
          ...scoreValues
        );

      const minScore =
        Math.min(
          ...scoreValues
        );

      const fieldAverage =
        scoreValues.reduce(
          (sum, value) =>
            sum + value,
          0
        ) /
        scoreValues.length;

      const scoreRange =
        Math.max(
          maxScore - minScore,
          1
        );

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
            horseData.find(
              item =>
                item.tableNumber ===
                motion.tableNumber
            );

          if (!horse) {
            return;
          }

          /*
           * ポイントは速度へ自然に反映。
           *
           * 順位そのものへ強制的に寄せないので、
           * ゴール前にワープしたような逆転は起こさない。
           */
          const centeredScore =
            (
              horse.averageScore -
              fieldAverage
            ) /
            scoreRange;

          const scoreEffect =
            clamp(
              centeredScore *
                0.13,
              -0.075,
              0.075
            );

          /*
           * 馬ごとの調子の波。
           * ポイントが同じでも完全な横並びにならず、
           * 追い抜き・差し返しが自然に起きる。
           */
          const naturalWave =
            Math.sin(
              elapsedRef.current *
                0.57 +
                motion.seed
            ) *
              0.018 +
            Math.sin(
              elapsedRef.current *
                1.19 +
                motion.seed *
                  1.83
            ) *
              0.010;

          /*
           * 全体を約90秒へ寄せる補正。
           * これは順位補正ではなく、
           * レース時間だけを安定させるためのもの。
           */
          const targetProgress =
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
                targetProgress -
                motion.progress
              ) *
                0.0052,
              -0.045,
              0.060
            );

          /*
           * 終盤でもポイント効果は残すが、
           * 強制的な順位入れ替えはしない。
           * 最新ポイントの逆転は、
           * あくまで速度差として画面へ現れる。
           */
          const lateRaceFactor =
            motion.progress > 72
              ? 1.12
              : 1;

          const multiplier =
            clamp(
              1 +
                scoreEffect *
                  lateRaceFactor +
                naturalWave +
                paceCorrection,
              0.82,
              1.18
            );

          motion.progress +=
            BASE_SPEED *
            multiplier *
            deltaSeconds;

          /*
           * 90秒を大幅に超えないための最低限の補助。
           * 全頭同じ補正なので順位は操作しない。
           */
          if (
            elapsedRef.current >
              87 &&
            motion.progress <
              94
          ) {
            motion.progress +=
              BASE_SPEED *
              0.09 *
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

      /*
       * 同一フレームで複数頭がゴールした場合だけ、
       * 画面上の進行度を優先。
       * 完全同着ならポイントが高い方を上位にする。
       */
      newlyFinished.sort(
        (a, b) => {

          const motionA =
            motions.find(
              item =>
                item.tableNumber === a
            );

          const motionB =
            motions.find(
              item =>
                item.tableNumber === b
            );

          const progressA =
            motionA?.progress ?? 0;

          const progressB =
            motionB?.progress ?? 0;

          if (
            progressB !==
            progressA
          ) {
            return (
              progressB -
              progressA
            );
          }

          const horseA =
            horseData.find(
              item =>
                item.tableNumber === a
            );

          const horseB =
            horseData.find(
              item =>
                item.tableNumber === b
            );

          return (
            (
              horseB?.averageScore ??
              0
            ) -
            (
              horseA?.averageScore ??
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

      if (
        now -
          lastProgressUiUpdateRef.current >=
        180
      ) {
        lastProgressUiUpdateRef.current =
          now;

        setRaceProgress(
          clamp(
            leader,
            0,
            100
          )
        );
      }

      // レース序盤は馬そのものが左から右へ進む。
      // 先頭がある程度進んでからカメラが追従する。
      // これにより「その場でバウンドしているだけ」に見えるのを防ぐ。
      const leftMargin = width * 0.10;
      const pixelsPerProgress = width / 52;
      const cameraFollowStart = 27;
      const camera = Math.max(
        0,
        leader - cameraFollowStart
      );

      drawBackground(
        width,
        height,
        camera
      );

      const finishX =
        leftMargin +
        (100 - camera) *
          pixelsPerProgress;

      drawFinish(
        finishX,
        width,
        height
      );

      const horseData = horsesRef.current;
      const rankMap = new Map<number, number>();

      [...motions]
        .sort((a, b) => b.progress - a.progress)
        .forEach((motion, index) => {
          rankMap.set(motion.tableNumber, index + 1);
        });

      const drawable = motions
        .map((motion, index) => {
          const horse = horseData.find(
            (item) => item.tableNumber === motion.tableNumber
          );

          if (!horse) {
            return null;
          }

          const depth = index % 3;
          const groupIndex = Math.floor(index / 3);

          const x =
            leftMargin +
            (motion.progress - camera) *
              pixelsPerProgress;

          const offsetPattern = [0, -11, 11, -6];
          const y =
            height * DEPTH_Y[depth] +
            offsetPattern[groupIndex % offsetPattern.length];

          return {
            horse,
            motion,
            depth,
            x,
            y,
            scale: DEPTH_SCALE[depth],
            rank: rankMap.get(horse.tableNumber) ?? horseData.length,
          };
        })
        .filter(
          (value): value is NonNullable<typeof value> =>
            value !== null
        )
        .sort((a, b) => {
          if (a.depth !== b.depth) {
            return a.depth - b.depth;
          }
          return a.x - b.x;
        });

      drawable.forEach((item) => {
        drawHorse(
          item.horse,
          item.motion,
          item.x,
          item.y,
          item.scale,
          now,
          item.rank
        );
      });

      drawRankingPanel(
        width,
        height,
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

  const remainingMeters =
    Math.max(
      0,
      Math.round(
        (
          1600 *
          (1 - raceProgress / 100)
        ) /
          50
      ) *
        50
    );

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


      {raceStarted &&
        count === 0 &&
        !raceFinished && (
          <div
            style={{
              position:
                "absolute",
              left:
                "50%",
              bottom:
                "72px",
              transform:
                "translateX(-50%)",
              width:
                "min(68vw, 980px)",
              zIndex: 25,
              pointerEvents:
                "none",
              color:
                "#ffffff",
              textShadow:
                "0 3px 9px rgba(0,0,0,0.9)",
            }}
          >
            <div
              style={{
                display:
                  "flex",
                justifyContent:
                  "space-between",
                alignItems:
                  "center",
                marginBottom:
                  "8px",
                fontSize:
                  "clamp(15px, 1.4vw, 22px)",
                fontWeight:
                  900,
              }}
            >
              <span>
                START
              </span>

              <span
                style={{
                  fontSize:
                    "clamp(18px, 1.8vw, 27px)",
                }}
              >
                {raceProgress >= 87.5
                  ? "🔥 LAST SPURT!"
                  : `残り 約${remainingMeters}m`}
              </span>

              <span>
                🏁 GOAL
              </span>
            </div>

            <div
              style={{
                position:
                  "relative",
                height:
                  "30px",
                border:
                  "4px solid rgba(255,255,255,0.96)",
                borderRadius:
                  "999px",
                background:
                  "rgba(5,14,10,0.82)",
                boxShadow:
                  "0 5px 18px rgba(0,0,0,0.5)",
                overflow:
                  "visible",
              }}
            >
              <div
                style={{
                  width:
                    `${raceProgress}%`,
                  height:
                    "100%",
                  borderRadius:
                    "999px",
                  background:
                    "linear-gradient(90deg, #d5aa2f, #f1d561, #fff1a2)",
                  transition:
                    "width 180ms linear",
                }}
              />

              <div
                style={{
                  position:
                    "absolute",
                  left:
                    `${raceProgress}%`,
                  top:
                    "50%",
                  transform:
                    "translate(-50%, -50%)",
                  width:
                    "42px",
                  height:
                    "42px",
                  display:
                    "flex",
                  alignItems:
                    "center",
                  justifyContent:
                    "center",
                  borderRadius:
                    "50%",
                  border:
                    "3px solid #9b7616",
                  background:
                    "#ffffff",
                  boxShadow:
                    "0 4px 12px rgba(0,0,0,0.35)",
                  fontSize:
                    "24px",
                  transition:
                    "left 180ms linear",
                }}
              >
                🐎
              </div>
            </div>

            <div
              style={{
                position:
                  "relative",
                height:
                  "34px",
                marginTop:
                  "6px",
                color:
                  "rgba(255,255,255,0.94)",
                fontSize:
                  "clamp(11px, 1vw, 15px)",
                fontWeight:
                  800,
              }}
            >
              {[
                ["1600m", 0],
                ["1200m", 25],
                ["800m", 50],
                ["400m", 75],
                ["200m", 87.5],
              ].map(
                ([
                  label,
                  percent,
                ]) => (
                  <div
                    key={
                      label
                    }
                    style={{
                      position:
                        "absolute",
                      left:
                        `${percent}%`,
                      transform:
                        percent === 0
                          ? "translateX(0)"
                          : "translateX(-50%)",
                      top: 0,
                      textAlign:
                        "center",
                      textShadow:
                        "0 2px 6px rgba(0,0,0,0.9)",
                    }}
                  >
                    <div
                      style={{
                        width:
                          "1px",
                        height:
                          "9px",
                        margin:
                          "0 auto 2px",
                        background:
                          "rgba(255,255,255,0.75)",
                      }}
                    />
                    {label}
                  </div>
                )
              )}
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
              top:
                "18px",
              left:
                "18px",
              zIndex:
                18,
              padding:
                "12px 18px",
              borderRadius:
                "16px",
              border:
                "1px solid rgba(255,255,255,0.28)",
              background:
                "rgba(5,14,10,0.82)",
              boxShadow:
                "0 6px 18px rgba(0,0,0,0.35)",
              color:
                "#ffffff",
              pointerEvents:
                "none",
            }}
          >
            <div
              style={{
                fontSize:
                  "clamp(15px, 1.4vw, 21px)",
                fontWeight:
                  900,
              }}
            >
              📣 レース中
            </div>

            <div
              style={{
                marginTop:
                  "3px",
                fontSize:
                  "clamp(11px, 1vw, 15px)",
                fontWeight:
                  700,
                opacity:
                  0.94,
              }}
            >
              みんなでムチを送って応援！
            </div>
          </div>
        )}

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

        {(eventInfo.groom ||
          eventInfo.bride) && (
          <div
            style={{
              marginTop:
                "2px",
              fontSize:
                "clamp(12px, 1.3vw, 20px)",
              fontWeight:
                800,
            }}
          >
            {eventInfo.groom}
            {eventInfo.groom &&
              eventInfo.bride
              ? " × "
              : ""}
            {eventInfo.bride}
          </div>
        )}
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
            📣 スマホからムチで応援！
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
                    "58px",
                  lineHeight: 1,
                  marginBottom:
                    "8px",
                }}
              >
                🏆
              </div>

              <div
                style={{
                  fontSize:
                    "clamp(18px, 2vw, 30px)",
                  lineHeight:
                    1.1,
                  fontWeight:
                    900,
                  letterSpacing:
                    "0.14em",
                  color:
                    "#7a5a00",
                }}
              >
                WINNER
              </div>

              <div
                style={{
                  margin:
                    "14px auto 20px",
                  padding:
                    "14px 24px",
                  maxWidth:
                    "760px",
                  borderRadius:
                    "18px",
                  border:
                    "2px solid rgba(188,145,31,0.35)",
                  background:
                    "rgba(255,255,255,0.82)",
                  boxShadow:
                    "0 7px 20px rgba(110,80,10,0.10)",
                }}
              >
                <div
                  style={{
                    fontSize:
                      "clamp(34px, 4.5vw, 58px)",
                    lineHeight:
                      1.12,
                    fontWeight:
                      900,
                    wordBreak:
                      "break-word",
                  }}
                >
                  {winner.tableNumber}
                  卓{" "}
                  {winner.horseName}
                </div>
              </div>

              <div
                style={{
                  margin:
                    "0 auto 16px",
                  fontSize:
                    "clamp(14px, 1.4vw, 19px)",
                  fontWeight:
                    800,
                  color:
                    "#6f6450",
                }}
              >
                FINAL RESULT
              </div>

              <div
                style={{
                  display:
                    "grid",
                  gridTemplateColumns:
                    ranking.length <= 6
                      ? "1fr"
                      : "repeat(2, minmax(0, 1fr))",
                  gap:
                    "8px 18px",
                  maxHeight:
                    "34vh",
                  overflowY:
                    "auto",
                  padding:
                    "14px 6px 2px",
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

                    const medal =
                      index === 0
                        ? "🥇"
                        : index === 1
                          ? "🥈"
                          : index === 2
                            ? "🥉"
                            : `${index + 1}位`;

                    return (
                      <div
                        key={
                          tableNumber
                        }
                        style={{
                          display:
                            "flex",
                          alignItems:
                            "center",
                          gap:
                            "10px",
                          minHeight:
                            "38px",
                          padding:
                            "7px 12px",
                          borderRadius:
                            "12px",
                          background:
                            index === 0
                              ? "rgba(230,190,62,0.16)"
                              : index === 1
                                ? "rgba(160,167,176,0.12)"
                                : index === 2
                                  ? "rgba(181,107,54,0.11)"
                                  : "rgba(255,255,255,0.40)",
                          fontSize:
                            "clamp(14px, 1.35vw, 19px)",
                          fontWeight:
                            index < 3
                              ? 900
                              : 700,
                        }}
                      >
                        <span
                          style={{
                            flex:
                              "0 0 52px",
                            textAlign:
                              "center",
                          }}
                        >
                          {medal}
                        </span>

                        <span
                          style={{
                            minWidth: 0,
                            overflow:
                              "hidden",
                            textOverflow:
                              "ellipsis",
                            whiteSpace:
                              "nowrap",
                          }}
                        >
                          {tableNumber}
                          卓{" "}
                          {
                            horse?.horseName
                          }
                        </span>
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