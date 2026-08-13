import { useEffect, useRef } from "react"

type Horse = {
  number: number
  name: string
  progress: number
  baseSpeed: number
  phase: number
  row: number
}

const HORSE_NAMES = [
  "ハナヨメ",
  "ブーケ",
  "リング",
  "チャペル",
  "ハピネス",
  "キズナ",
  "スマイル",
  "ミライ",
  "ラブ",
  "エイエン",
  "ウェディング",
]

const COLORS = [
  "#ef3340",
  "#202020",
  "#f3c623",
  "#2469d8",
  "#40a65a",
  "#f28b2c",
  "#ec72ad",
  "#7857c8",
  "#1da6a0",
  "#9d6035",
  "#eeeeee",
]

function Race2DTestPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let frameId = 0
    let previousTime = performance.now()
    let elapsed = 0

    const horses: Horse[] = HORSE_NAMES.map((name, index) => ({
      number: index + 1,
      name,
      progress: index * -0.32,
      baseSpeed: 0.92 + ((index * 37) % 17) / 100,
      phase: index * 1.37,
      row: index % 3,
    }))

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const rect = canvas.getBoundingClientRect()

      canvas.width = Math.floor(rect.width * dpr)
      canvas.height = Math.floor(rect.height * dpr)

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const roundedRect = (
      x: number,
      y: number,
      width: number,
      height: number,
      radius: number
    ) => {
      const r = Math.min(radius, width / 2, height / 2)

      ctx.beginPath()
      ctx.moveTo(x + r, y)
      ctx.lineTo(x + width - r, y)
      ctx.quadraticCurveTo(x + width, y, x + width, y + r)
      ctx.lineTo(x + width, y + height - r)
      ctx.quadraticCurveTo(
        x + width,
        y + height,
        x + width - r,
        y + height
      )
      ctx.lineTo(x + r, y + height)
      ctx.quadraticCurveTo(x, y + height, x, y + height - r)
      ctx.lineTo(x, y + r)
      ctx.quadraticCurveTo(x, y, x + r, y)
      ctx.closePath()
    }

    const drawBackground = (
      width: number,
      height: number,
      cameraProgress: number
    ) => {
      const skyHeight = height * 0.28

      const sky = ctx.createLinearGradient(0, 0, 0, skyHeight)
      sky.addColorStop(0, "#69c5ef")
      sky.addColorStop(1, "#d7f1fb")

      ctx.fillStyle = sky
      ctx.fillRect(0, 0, width, skyHeight)

      // 雲
      ctx.fillStyle = "rgba(255,255,255,0.88)"

      for (let i = -1; i < 7; i += 1) {
        const cycle = width + 500
        let x = i * 310 - cameraProgress * 18
        x = ((x % cycle) + cycle) % cycle - 130

        const y = 70 + (i % 3) * 38

        ctx.beginPath()
        ctx.arc(x, y, 26, 0, Math.PI * 2)
        ctx.arc(x + 32, y - 12, 38, 0, Math.PI * 2)
        ctx.arc(x + 72, y, 28, 0, Math.PI * 2)
        ctx.fill()
      }

      // 観客席
      const standTop = height * 0.19
      const standBottom = height * 0.39

      ctx.fillStyle = "#d9dee1"
      ctx.fillRect(
        0,
        standTop,
        width,
        standBottom - standTop
      )

      ctx.fillStyle = "#49555e"
      ctx.fillRect(0, standTop, width, 13)

      const crowdColors = [
        "#d34848",
        "#2b68aa",
        "#e2b22c",
        "#438a53",
        "#80569a",
        "#e77f32",
      ]

      const crowdOffset = -(cameraProgress * 26) % 25

      for (let row = 0; row < 4; row += 1) {
        for (
          let x = crowdOffset - 30;
          x < width + 30;
          x += 25
        ) {
          ctx.fillStyle =
            crowdColors[
              (Math.abs(Math.floor(x / 25)) + row) %
                crowdColors.length
            ]

          ctx.beginPath()
          ctx.arc(
            x + (row % 2) * 8,
            standTop + 48 + row * 27,
            4,
            0,
            Math.PI * 2
          )
          ctx.fill()
        }
      }

      // 芝
      const grassTop = height * 0.39

      const grass = ctx.createLinearGradient(
        0,
        grassTop,
        0,
        height
      )

      grass.addColorStop(0, "#59aa4f")
      grass.addColorStop(0.5, "#328b42")
      grass.addColorStop(1, "#17652e")

      ctx.fillStyle = grass
      ctx.fillRect(
        0,
        grassTop,
        width,
        height - grassTop
      )

      const stripeWidth = Math.max(120, width * 0.09)
      const stripeOffset =
        -(cameraProgress * width * 0.035) % (stripeWidth * 2)

      ctx.globalAlpha = 0.08
      ctx.fillStyle = "#ffffff"

      for (
        let x = stripeOffset - stripeWidth * 2;
        x < width + stripeWidth * 2;
        x += stripeWidth * 2
      ) {
        ctx.fillRect(
          x,
          grassTop,
          stripeWidth,
          height - grassTop
        )
      }

      ctx.globalAlpha = 1

      // ラチ
      const railY = height * 0.445

      ctx.strokeStyle = "#ffffff"
      ctx.lineWidth = 7

      ctx.beginPath()
      ctx.moveTo(0, railY)
      ctx.lineTo(width, railY)
      ctx.stroke()

      const railOffset = -(cameraProgress * 35) % 110

      ctx.strokeStyle = "#dddddd"
      ctx.lineWidth = 3

      for (
        let x = railOffset - 110;
        x < width + 110;
        x += 110
      ) {
        ctx.beginPath()
        ctx.moveTo(x, railY)
        ctx.lineTo(x - 20, railY + 65)
        ctx.stroke()
      }
    }

    const drawHorse = (
      horse: Horse,
      x: number,
      y: number,
      scale: number,
      time: number,
      rank: number
    ) => {
      const phase = time * 0.015 + horse.phase
      const legA = Math.sin(phase)
      const legB = Math.sin(phase + Math.PI)
      const bob = Math.sin(phase * 2) * 2.5

      ctx.save()

      ctx.translate(x, y + bob * scale)
      ctx.scale(scale, scale)

      // 影
      ctx.globalAlpha = 0.22
      ctx.fillStyle = "#062b15"

      ctx.beginPath()
      ctx.ellipse(
        0,
        34,
        62,
        11,
        0,
        0,
        Math.PI * 2
      )
      ctx.fill()

      ctx.globalAlpha = 1

      const bodyColor =
        horse.number % 4 === 0
          ? "#4c2b1d"
          : horse.number % 3 === 0
            ? "#8a5030"
            : "#704126"

      const dark = "#3a2115"

      // 脚
      ctx.strokeStyle = dark
      ctx.lineWidth = 6
      ctx.lineCap = "round"

      const drawLeg = (
        startX: number,
        swing: number,
        direction: number
      ) => {
        const kneeX = startX + swing * 17 * direction
        const hoofX = kneeX + swing * 21 * direction

        ctx.beginPath()
        ctx.moveTo(startX, 10)
        ctx.lineTo(kneeX, 31)
        ctx.lineTo(hoofX, 54)
        ctx.stroke()
      }

      drawLeg(-28, legA, 1)
      drawLeg(-12, legB, -1)
      drawLeg(21, legB, 1)
      drawLeg(35, legA, -1)

      // 胴体
      ctx.fillStyle = bodyColor

      ctx.beginPath()
      ctx.ellipse(
        0,
        0,
        51,
        24,
        -0.04,
        0,
        Math.PI * 2
      )
      ctx.fill()

      // 首
      ctx.beginPath()
      ctx.moveTo(30, -11)
      ctx.lineTo(55, -50)
      ctx.lineTo(69, -42)
      ctx.lineTo(44, 7)
      ctx.closePath()
      ctx.fill()

      // 頭
      ctx.beginPath()
      ctx.ellipse(
        70,
        -48,
        20,
        12,
        -0.1,
        0,
        Math.PI * 2
      )
      ctx.fill()

      // 耳
      ctx.beginPath()
      ctx.moveTo(65, -57)
      ctx.lineTo(70, -72)
      ctx.lineTo(76, -55)
      ctx.fill()

      // 尻尾
      ctx.strokeStyle = dark
      ctx.lineWidth = 7

      ctx.beginPath()
      ctx.moveTo(-46, -5)
      ctx.quadraticCurveTo(
        -70,
        -5 + legA * 5,
        -84,
        -25 + legA * 7
      )
      ctx.stroke()

      // ゼッケン
      const color = COLORS[horse.number - 1]

      ctx.fillStyle = color
      ctx.fillRect(-16, -23, 36, 25)

      ctx.strokeStyle = "#111"
      ctx.lineWidth = 2
      ctx.strokeRect(-16, -23, 36, 25)

      ctx.fillStyle =
        color === "#202020" ? "#fff" : "#111"

      ctx.font = "900 15px sans-serif"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"

      ctx.fillText(
        String(horse.number),
        2,
        -10
      )

      // 騎手
      ctx.save()
      ctx.translate(8, -31)
      ctx.rotate(-0.25)

      ctx.fillStyle = color

      ctx.beginPath()
      ctx.moveTo(-4, -11)
      ctx.lineTo(29, -5)
      ctx.lineTo(21, 25)
      ctx.lineTo(-10, 15)
      ctx.closePath()
      ctx.fill()

      ctx.fillStyle = "#efbd8d"

      ctx.beginPath()
      ctx.arc(20, -20, 9, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = color

      ctx.beginPath()
      ctx.arc(
        19,
        -25,
        10,
        Math.PI,
        Math.PI * 2
      )
      ctx.fill()

      ctx.restore()
      ctx.restore()

      // 馬名ラベル
      const labelWidth = Math.max(115, 142 * scale)
      const labelHeight = Math.max(28, 32 * scale)
      const labelY = y - 99 * scale

      roundedRect(
        x - labelWidth / 2,
        labelY,
        labelWidth,
        labelHeight,
        8
      )

      ctx.fillStyle =
        rank <= 3
          ? "rgba(255,248,211,0.98)"
          : "rgba(255,255,255,0.95)"

      ctx.fill()

      ctx.strokeStyle =
        rank === 1
          ? "#d6a900"
          : rank === 2
            ? "#a9adb2"
            : rank === 3
              ? "#b56b36"
              : color

      ctx.lineWidth = rank <= 3 ? 5 : 3
      ctx.stroke()

      ctx.fillStyle = "#151515"
      ctx.font = `900 ${Math.max(12, 14 * scale)}px sans-serif`
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"

      const rankText =
        rank === 1
          ? "1位"
          : rank === 2
            ? "2位"
            : rank === 3
              ? "3位"
              : ""

      ctx.fillText(
        `${rankText ? `${rankText}  ` : ""}${horse.number} ${horse.name}`,
        x,
        labelY + labelHeight / 2
      )
    }

    const drawOrderPanel = (
      width: number,
      sorted: Horse[]
    ) => {
      const panelWidth = Math.min(255, width * 0.19)
      const panelX = width - panelWidth - 18
      const panelY = 18

      roundedRect(
        panelX,
        panelY,
        panelWidth,
        182,
        14
      )

      ctx.fillStyle = "rgba(7,18,13,0.84)"
      ctx.fill()

      ctx.fillStyle = "#ffffff"
      ctx.font = "900 17px sans-serif"
      ctx.textAlign = "left"
      ctx.textBaseline = "middle"

      ctx.fillText(
        "CURRENT ORDER",
        panelX + 15,
        panelY + 22
      )

      sorted.slice(0, 4).forEach((horse, index) => {
        const y = panelY + 57 + index * 31
        const color = COLORS[horse.number - 1]

        ctx.fillStyle = color

        ctx.beginPath()
        ctx.arc(
          panelX + 20,
          y,
          10,
          0,
          Math.PI * 2
        )
        ctx.fill()

        ctx.fillStyle =
          color === "#202020" ? "#fff" : "#111"

        ctx.font = "900 10px sans-serif"
        ctx.textAlign = "center"

        ctx.fillText(
          String(horse.number),
          panelX + 20,
          y
        )

        ctx.fillStyle = "#ffffff"
        ctx.font = "800 14px sans-serif"
        ctx.textAlign = "left"

        ctx.fillText(
          `${index + 1}. ${horse.name}`,
          panelX + 41,
          y
        )
      })
    }

    const drawFinish = (
      width: number,
      height: number,
      x: number
    ) => {
      if (x < -100 || x > width + 100) return

      const top = height * 0.37
      const bottom = height * 0.96

      ctx.fillStyle = "#ffffff"
      ctx.fillRect(x - 4, top, 8, bottom - top)

      const block = 14

      for (let y = top; y < bottom; y += block) {
        const row = Math.floor((y - top) / block)

        ctx.fillStyle =
          row % 2 === 0 ? "#111111" : "#ffffff"

        ctx.fillRect(x - 34, y, 15, block)

        ctx.fillStyle =
          row % 2 === 0 ? "#ffffff" : "#111111"

        ctx.fillRect(x - 19, y, 15, block)
      }

      ctx.fillStyle = "#111"
      ctx.font = "900 19px sans-serif"
      ctx.textAlign = "center"

      ctx.fillText(
        "GOAL",
        x - 20,
        top - 14
      )
    }

    const animate = (now: number) => {
      frameId = requestAnimationFrame(animate)

      const rect = canvas.getBoundingClientRect()
      const width = rect.width
      const height = rect.height

      const delta = Math.min(
        (now - previousTime) / 1000,
        0.05
      )

      previousTime = now
      elapsed += delta

      horses.forEach((horse) => {
        const naturalWave =
          Math.sin(elapsed * 0.7 + horse.phase) * 0.08 +
          Math.sin(elapsed * 0.27 + horse.phase * 2) * 0.05

        // 中盤・終盤で各馬に異なる追い上げを発生
        const middleSurge =
          elapsed > 12 && elapsed < 28
            ? Math.sin(horse.phase * 3.1) * 0.08
            : 0

        const finalSurge =
          elapsed > 32
            ? Math.cos(horse.phase * 2.3) * 0.11
            : 0

        const speed =
          horse.baseSpeed +
          naturalWave +
          middleSurge +
          finalSurge

        horse.progress += speed * delta * 1.45
      })

      const sorted = [...horses].sort(
        (a, b) => b.progress - a.progress
      )

      const leader = sorted[0]?.progress ?? 0

      // 先頭を画面右寄りに置き、
      // 後続との差が見えるカメラにする
      const cameraProgress = Math.max(
        0,
        leader - 33
      )

      drawBackground(
        width,
        height,
        cameraProgress
      )

      const pixelsPerProgress = width / 46

      const finishProgress = 105

      const finishX =
        width * 0.72 +
        (finishProgress - leader) *
          pixelsPerProgress

      drawFinish(
        width,
        height,
        finishX
      )

      const rankMap = new Map<number, number>()

      sorted.forEach((horse, index) => {
        rankMap.set(horse.number, index + 1)
      })

      const rowY = [
        height * 0.56,
        height * 0.71,
        height * 0.86,
      ]

      const rowScale = [
        0.82,
        1.0,
        1.17,
      ]

      const drawable = horses
        .map((horse) => {
          const rank = rankMap.get(horse.number) ?? 11

          // 順位差を横方向に明確化
          const distanceBehind =
            leader - horse.progress

          const x =
            width * 0.70 -
            distanceBehind *
              pixelsPerProgress *
              1.35

          // 同じ段にいる馬が完全に重ならないよう微調整
          const groupIndex = Math.floor(
            (horse.number - 1) / 3
          )

          const offsetPattern = [
            0,
            -13,
            13,
            -7,
          ]

          const y =
            rowY[horse.row] +
            offsetPattern[
              groupIndex %
                offsetPattern.length
            ]

          return {
            horse,
            x,
            y,
            scale: rowScale[horse.row],
            rank,
          }
        })
        .sort((a, b) => {
          if (a.horse.row !== b.horse.row) {
            return a.horse.row - b.horse.row
          }

          return a.x - b.x
        })

      drawable.forEach((item) => {
        drawHorse(
          item.horse,
          item.x,
          item.y,
          item.scale,
          now,
          item.rank
        )
      })

      drawOrderPanel(
        width,
        sorted
      )

      // 左上タイトル
      roundedRect(
        18,
        18,
        218,
        66,
        13
      )

      ctx.fillStyle = "rgba(7,18,13,0.83)"
      ctx.fill()

      ctx.fillStyle = "#ffffff"
      ctx.textAlign = "left"
      ctx.textBaseline = "middle"

      ctx.font = "900 20px sans-serif"
      ctx.fillText(
        "WEDDING DERBY",
        33,
        42
      )

      ctx.font = "800 14px sans-serif"
      ctx.fillText(
        "11 HORSES / 2.5D TEST",
        33,
        65
      )

      // 中央タイトル
      ctx.fillStyle = "#ffffff"
      ctx.font =
        "900 clamp(20px, 2vw, 32px) sans-serif"
      ctx.textAlign = "center"

      ctx.shadowColor = "rgba(0,0,0,0.7)"
      ctx.shadowBlur = 8

      ctx.fillText(
        "💍 WEDDING DERBY",
        width / 2,
        48
      )

      ctx.shadowBlur = 0
    }

    resize()

    window.addEventListener("resize", resize)

    frameId = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(frameId)
      window.removeEventListener("resize", resize)
    }
  }, [])

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        background: "#102719",
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
    </div>
  )
}

export default Race2DTestPage