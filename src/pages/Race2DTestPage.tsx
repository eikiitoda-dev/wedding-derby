import { useEffect, useRef } from "react"

type Horse = {
  number: number
  name: string
  progress: number
  baseSpeed: number
  phase: number
  row: number
  image: HTMLImageElement
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
    let disposed = false

    const createHorseImage = (number: number) => {
      const image = new Image()
      image.src = `/horses/horse-${String(number).padStart(2, "0")}.png`
      return image
    }

    const horses: Horse[] = HORSE_NAMES.map((name, index) => ({
      number: index + 1,
      name,
      progress: index * -0.32,
      baseSpeed: 0.92 + ((index * 37) % 17) / 100,
      phase: index * 1.37,
      row: index % 3,
      image: createHorseImage(index + 1),
    }))

    const racecourseImage = new Image()
    racecourseImage.src = "/racecourse-stand.jpg"

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
      // 上半分はリアルな競馬場背景画像を使用。
      // 画像は少し横に動かして、固定写真っぽく見えないようにする。
      const scenicHeight = height * 0.47

      if (
        racecourseImage.complete &&
        racecourseImage.naturalWidth > 0
      ) {
        const sourceW = racecourseImage.naturalWidth
        const sourceH = racecourseImage.naturalHeight

        const extra = Math.min(sourceW * 0.08, 130)
        const maxShift = Math.max(0, sourceW - extra)
        const shift =
          ((cameraProgress * 3.5) % Math.max(maxShift, 1))

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
        )
      } else {
        const sky = ctx.createLinearGradient(0, 0, 0, scenicHeight)
        sky.addColorStop(0, "#5aaad9")
        sky.addColorStop(1, "#d9eef7")
        ctx.fillStyle = sky
        ctx.fillRect(0, 0, width, scenicHeight)
      }

      // 背景画像と芝の境界を馴染ませる。
      const blend = ctx.createLinearGradient(
        0,
        scenicHeight - 55,
        0,
        scenicHeight + 65
      )

      blend.addColorStop(0, "rgba(78,116,58,0)")
      blend.addColorStop(1, "rgba(71,113,53,0.96)")

      ctx.fillStyle = blend
      ctx.fillRect(
        0,
        scenicHeight - 55,
        width,
        120
      )

      // 手前の芝はCanvasで動かし、リアル寄りの芝目・色ムラ・遠近感を出す。
      const grassTop = height * 0.40
      const grass = ctx.createLinearGradient(
        0,
        grassTop,
        0,
        height
      )

      grass.addColorStop(0, "rgba(112,151,82,0.84)")
      grass.addColorStop(0.22, "#73995c")
      grass.addColorStop(0.52, "#5f884b")
      grass.addColorStop(0.78, "#4c773f")
      grass.addColorStop(1, "#355f35")

      ctx.fillStyle = grass
      ctx.fillRect(
        0,
        grassTop,
        width,
        height - grassTop
      )

      // 大きな縦縞ではなく、細かな芝刈り模様を複数レイヤーで重ねる。
      const broadStripe = Math.max(88, width * 0.055)
      const broadOffset =
        -(cameraProgress * width * 0.020) % (broadStripe * 2)

      ctx.globalAlpha = 0.045

      for (
        let x = broadOffset - broadStripe * 2;
        x < width + broadStripe * 2;
        x += broadStripe * 2
      ) {
        ctx.fillStyle = "#ffffff"
        ctx.fillRect(
          x,
          grassTop,
          broadStripe,
          height - grassTop
        )
      }

      // 芝の細い走行方向テクスチャ
      ctx.globalAlpha = 0.10
      const textureOffset = -(cameraProgress * 48) % 160

      for (
        let x = textureOffset - 160;
        x < width + 160;
        x += 160
      ) {
        for (let band = 0; band < 5; band += 1) {
          const y =
            grassTop +
            (height - grassTop) *
              (0.10 + band * 0.18)

          const length =
            45 + ((band * 19 + Math.abs(Math.floor(x))) % 70)

          ctx.strokeStyle =
            band % 2 === 0
              ? "rgba(255,255,255,0.32)"
              : "rgba(30,70,34,0.32)"

          ctx.lineWidth = band < 2 ? 1 : 1.4
          ctx.beginPath()
          ctx.moveTo(x, y)
          ctx.lineTo(x + length, y)
          ctx.stroke()
        }
      }

      // 細かな芝の粒。手前ほど大きく、遠くほど小さく。
      ctx.globalAlpha = 0.18

      for (let row = 0; row < 8; row += 1) {
        const depth = row / 7
        const y =
          grassTop +
          (height - grassTop) *
            (0.07 + depth * 0.88)

        const spacing = 26 - depth * 10
        const bladeOffset =
          -(cameraProgress * (10 + depth * 32)) % spacing

        for (
          let x = bladeOffset - spacing;
          x < width + spacing;
          x += spacing
        ) {
          const jitter =
            ((Math.floor(x / spacing) + row * 7) % 5) - 2

          ctx.strokeStyle =
            row % 2 === 0
              ? "rgba(245,255,232,0.38)"
              : "rgba(35,83,37,0.40)"

          ctx.lineWidth = depth < 0.45 ? 0.7 : 1
          ctx.beginPath()
          ctx.moveTo(x, y)
          ctx.lineTo(
            x + 3 + jitter,
            y - (2 + depth * 3)
          )
          ctx.stroke()
        }
      }

      // 競走馬が走るゾーンに薄い踏み跡・色ムラを入れる。
      ctx.globalAlpha = 0.08

      for (let band = 0; band < 3; band += 1) {
        const y =
          height *
          [0.59, 0.73, 0.87][band]

        const trackOffset =
          -(cameraProgress * (34 + band * 9)) % 260

        for (
          let x = trackOffset - 260;
          x < width + 260;
          x += 260
        ) {
          ctx.fillStyle = "rgba(37,72,35,0.55)"
          ctx.beginPath()
          ctx.ellipse(
            x,
            y,
            58 + band * 12,
            4 + band,
            -0.03,
            0,
            Math.PI * 2
          )
          ctx.fill()
        }
      }

      ctx.globalAlpha = 1

      // 遠側ラチ。太すぎないようにして実写背景に馴染ませる。
      const railY = height * 0.445

      ctx.strokeStyle = "rgba(250,250,250,0.92)"
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.moveTo(0, railY)
      ctx.lineTo(width, railY)
      ctx.stroke()

      const railOffset = -(cameraProgress * 28) % 96

      ctx.strokeStyle = "rgba(225,225,225,0.86)"
      ctx.lineWidth = 2

      for (
        let x = railOffset - 96;
        x < width + 96;
        x += 96
      ) {
        ctx.beginPath()
        ctx.moveTo(x, railY)
        ctx.lineTo(x - 15, railY + 48)
        ctx.stroke()
      }

      // 疾走感のための水平ブラー線。
      ctx.globalAlpha = 0.10
      const speedOffset = -(cameraProgress * 62) % 230

      for (
        let x = speedOffset - 230;
        x < width + 230;
        x += 230
      ) {
        const band =
          Math.abs(Math.floor(x / 230)) % 5

        const y =
          height *
          [0.53, 0.61, 0.70, 0.80, 0.90][band]

        const length =
          85 + band * 24

        const gradient =
          ctx.createLinearGradient(
            x,
            y,
            x + length,
            y
          )

        gradient.addColorStop(0, "rgba(255,255,255,0)")
        gradient.addColorStop(0.35, "rgba(255,255,255,0.55)")
        gradient.addColorStop(1, "rgba(255,255,255,0)")

        ctx.strokeStyle = gradient
        ctx.lineWidth = band < 2 ? 1 : 1.8

        ctx.beginPath()
        ctx.moveTo(x, y)
        ctx.lineTo(x + length, y)
        ctx.stroke()
      }

      ctx.globalAlpha = 1
    }

    const drawHorse = (
      horse: Horse,
      x: number,
      y: number,
      scale: number,
      time: number,
      rank: number
    ) => {
      const bob = Math.sin(time * 0.014 + horse.phase) * 3.2
      const image = horse.image

      const drawWidth = 255 * scale
      const drawHeight = 166 * scale
      const drawX = x - drawWidth / 2
      const drawY = y - drawHeight / 2 + bob

      ctx.save()

      if (image.complete && image.naturalWidth > 0) {
        ctx.drawImage(
          image,
          drawX,
          drawY,
          drawWidth,
          drawHeight
        )
      } else {
        ctx.fillStyle = "#ffffff"
        ctx.font = `900 ${18 * scale}px sans-serif`
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillText(
          `#${horse.number}`,
          x,
          y
        )
      }

      ctx.restore()

      const color = COLORS[horse.number - 1]
      const labelWidth = Math.max(108, 128 * scale)
      const labelHeight = Math.max(26, 30 * scale)
      const labelY = y - 98 * scale

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
      ctx.font = `900 ${Math.max(12, 13 * scale)}px sans-serif`
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
      height: number,
      sorted: Horse[]
    ) => {
      const panelWidth = Math.min(245, width * 0.18)
      const panelX = width - panelWidth - 18
      const panelY = 18
      const rowHeight = Math.max(24, Math.min(29, height * 0.032))
      const headerHeight = 46
      const panelHeight = headerHeight + rowHeight * 11 + 14

      roundedRect(
        panelX,
        panelY,
        panelWidth,
        panelHeight,
        14
      )

      ctx.fillStyle = "rgba(7,18,13,0.88)"
      ctx.fill()

      ctx.strokeStyle = "rgba(255,255,255,0.16)"
      ctx.lineWidth = 1
      ctx.stroke()

      ctx.fillStyle = "#ffffff"
      ctx.font = "900 17px sans-serif"
      ctx.textAlign = "left"
      ctx.textBaseline = "middle"

      ctx.fillText(
        "CURRENT ORDER",
        panelX + 15,
        panelY + 22
      )

      sorted.slice(0, 11).forEach((horse, index) => {
        const y =
          panelY +
          headerHeight +
          index * rowHeight +
          rowHeight / 2

        const color = COLORS[horse.number - 1]

        if (index < 3) {
          roundedRect(
            panelX + 8,
            y - rowHeight / 2 + 2,
            panelWidth - 16,
            rowHeight - 4,
            6
          )

          ctx.fillStyle =
            index === 0
              ? "rgba(214,169,0,0.18)"
              : index === 1
                ? "rgba(169,173,178,0.15)"
                : "rgba(181,107,54,0.15)"

          ctx.fill()
        }

        ctx.fillStyle =
          index === 0
            ? "#f6cc34"
            : index === 1
              ? "#d8dde2"
              : index === 2
                ? "#d68b50"
                : "#ffffff"

        ctx.font = "900 13px sans-serif"
        ctx.textAlign = "right"

        ctx.fillText(
          String(index + 1),
          panelX + 29,
          y
        )

        ctx.fillStyle = color

        roundedRect(
          panelX + 38,
          y - 10,
          24,
          20,
          5
        )

        ctx.fill()

        ctx.fillStyle =
          color === "#202020"
            ? "#ffffff"
            : "#111111"

        ctx.font = "900 10px sans-serif"
        ctx.textAlign = "center"

        ctx.fillText(
          String(horse.number),
          panelX + 50,
          y
        )

        ctx.fillStyle = "#ffffff"
        ctx.font = "800 13px sans-serif"
        ctx.textAlign = "left"

        ctx.fillText(
          horse.name,
          panelX + 70,
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
      if (disposed) return

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
        width * 0.69 +
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
        height * 0.57,
        height * 0.72,
        height * 0.865,
      ]

      const rowScale = [
        0.78,
        0.94,
        1.08,
      ]

      const drawable = horses
        .map((horse) => {
          const rank = rankMap.get(horse.number) ?? 11
          const distanceBehind =
            leader - horse.progress

          const x =
            width * 0.66 -
            distanceBehind *
              pixelsPerProgress *
              1.2

          const groupIndex = Math.floor(
            (horse.number - 1) / 3
          )

          const offsetPattern = [
            0,
            -11,
            11,
            -6,
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
        height,
        sorted
      )

      roundedRect(
        18,
        18,
        220,
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

      ctx.fillStyle = "#ffffff"
      ctx.font = "900 28px sans-serif"
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
      disposed = true
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