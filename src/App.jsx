import React, { useEffect, useState, useRef } from 'react'

function getAngles(date) {
  const ms = date.getMilliseconds()
  const seconds = date.getSeconds() + ms / 1000
  const minutes = date.getMinutes() + seconds / 60
  const hours = date.getHours() % 12 + minutes / 60

  return {
    secondsAngle: seconds * 6, // 360 / 60
    minutesAngle: minutes * 6, // 360 / 60
    hoursAngle: hours * 30, // 360 / 12
  }
}

export default function App() {
  // store a timestamp so we can derive smooth angles and still only update state once per second
  const [now, setNow] = useState(() => new Date())
  const rafRef = useRef(null)
  const tickRef = useRef(null)
  const dialRef = useRef(null)

  useEffect(() => {
    // Align updates to the system second boundary so the second hand ticks exactly on the second
    const runTick = () => {
      setNow(new Date())
      // schedule next tick aligned to the next full second
      const ms = Date.now() % 1000
      tickRef.current = setTimeout(runTick, 1000 - ms)
    }

    runTick()

    return () => {
      if (tickRef.current) clearTimeout(tickRef.current)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  // For smooth transition between tick updates we also run a lightweight RAF loop that
  // forces a re-render at animation frame rate for the transforms to animate smoothly.
  // It only updates a ref (not state) so lint-staged / eslint won't complain, but we
  // use setNow at most once per second above to keep React updates cheap.
  useEffect(() => {
    let running = true
    const loop = () => {
      if (!running) return
      // trigger a small style update by toggling a ref; we don't set state here to keep perf
      // but React needs to re-render for CSS transitions to take effect; we rely on the
      // main setNow tick to update the actual angles once per second.
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => {
      running = false
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  const angles = getAngles(now)

  const formatDigital = (d) => d.toLocaleTimeString()

  return (
    <div className="app">
      <header>
        <h1>Analog clock — learn time!</h1>
        <p>Touch the clock, watch the hands: the thin red hand is seconds, the long hand is minutes, and the short hand is hours.</p>
      </header>

      <main>
        <section className="clock-container">
          <div className="clock" role="img" aria-label={`Analog clock showing ${formatDigital(now)}`}>
            <div className="dial" ref={(el) => { if (el && !dialRef.current) dialRef.current = el }}>
              {/* SVG overlay for numerals - scales with the dial and keeps labels upright */}
              <svg className="dial-svg" viewBox="0 0 260 260" preserveAspectRatio="xMidYMid meet" aria-hidden>
                {
                  (() => {
                    const size = 260
                    const cx = size / 2
                    const cy = size / 2
                    const hourRadius = cx - 36
                    const minuteRadius = cx - 20
                    const hours = [...Array(12)].map((_, i) => {
                      const angle = (i * 30) * (Math.PI / 180)
                      const x = cx + Math.sin(angle) * hourRadius
                      const y = cy - Math.cos(angle) * hourRadius
                      const label = i === 0 ? 12 : i
                      return (
                        <text key={`h-${i}`} x={x} y={y} textAnchor="middle" dominantBaseline="middle" className="svg-num">
                          {label}
                        </text>
                      )
                    })

                    // minute numbers 1..60 placed slightly closer to center; smaller font
                    const currentSecond = (new Date()).getSeconds() === 0 ? 60 : (new Date()).getSeconds();
                    const currentMinute = (new Date()).getMinutes() === 0 ? 60 : (new Date()).getMinutes();
                    const currentHour = (new Date()).getHours() % 12 === 0 ? 12 : (new Date()).getHours() % 12;
                    const minutes = [...Array(60)].map((_, idx) => {
                      const i = idx + 1
                      const angle = (i * 6) * (Math.PI / 180)
                      const x = cx + Math.sin(angle) * minuteRadius
                      const y = cy - Math.cos(angle) * minuteRadius
                      const isActive = i === currentSecond
                      const isActiveMinute = i === currentMinute
                      const isActiveHour = i === currentHour
                      const classNames = isActive ? 'svg-minute active-second' : isActiveMinute ? 'svg-minute active-minute' : isActiveHour ? 'svg-minute active-hour' : 'svg-minute';
                      return (
                        <text
                          key={`m-${i}`}
                          x={x}
                          y={y}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          className={classNames}
                        >
                          {i}
                        </text>
                      )
                    })

                    return [...minutes, ...hours]
                  })()
                }
              </svg>

              <div className="hand hour" style={{ transform: `translate(-50%, -100%) rotate(${angles.hoursAngle}deg)` }} />
              <div className="hand minute" style={{ transform: `translate(-50%, -100%) rotate(${angles.minutesAngle}deg)` }} />
              <div className="hand second" style={{ transform: `translate(-50%, -100%) rotate(${angles.secondsAngle}deg)` }} />

              <div className="center" />
            </div>
          </div>

          <div className="info">
            <div className="digital">{formatDigital(now)}</div>
            <ul className="legend">
              <li><span className="legend-dot second"/> Seconds (thin)</li>
              <li><span className="legend-dot minute"/> Minutes (long)</li>
              <li><span className="legend-dot hour"/> Hours (short)</li>
            </ul>
          </div>
        </section>

        <section className="explain">
          <h2>How it works (for curious kids)</h2>
          <ol>
            <li>The short hand shows the hour (1–12).</li>
            <li>The long hand shows minutes — every full turn is 60 minutes.</li>
            <li>The thin red hand shows seconds — it moves once every second.</li>
          </ol>
        </section>
      </main>
    </div>
  )
}
