import { useEffect, useRef } from 'react'

/** Real-time level bars from the microphone stream (AnalyserNode). Decorative; the recorder is elsewhere. */
export default function Waveform({ stream, width = 96, height = 22, color = '#a8815b' }) {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas || !stream) return
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx()
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 128
    analyser.smoothingTimeConstant = 0.7
    const source = ctx.createMediaStreamSource(stream)
    source.connect(analyser)
    const data = new Uint8Array(analyser.frequencyBinCount)
    const g = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    canvas.width = width * dpr
    canvas.height = height * dpr
    g.scale(dpr, dpr)
    let raf

    const draw = () => {
      analyser.getByteFrequencyData(data)
      g.clearRect(0, 0, width, height)
      const bars = 24
      const gap = 1.5
      const bw = (width - gap * (bars - 1)) / bars
      for (let i = 0; i < bars; i++) {
        const v = data[Math.floor((i / bars) * data.length * 0.6)] / 255
        const h = Math.max(2, v * height)
        g.fillStyle = color
        g.globalAlpha = 0.35 + v * 0.65
        g.fillRect(i * (bw + gap), (height - h) / 2, bw, h)
      }
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => {
      cancelAnimationFrame(raf)
      source.disconnect()
      ctx.close().catch(() => {})
    }
  }, [stream, width, height, color])

  return <canvas ref={ref} style={{ width, height }} aria-hidden="true" />
}
