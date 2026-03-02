import { useState, useEffect, useRef, useCallback } from "react";
import { f1api } from "../api/index";

// ─── Types ───────────────────────────────────────────────
interface Frame {
  driver__code: string;
  driver__team_color: string;
  timestamp_ms: number;
  x: number;
  y: number;
  speed: number;
  gear: number;
  throttle: number;
  brake: boolean;
  drs: number;
  lap_number: number;
  compound: string;
}

interface DriverState {
  code: string;
  color: string;
  x: number;
  y: number;
  speed: number;
  gear: number;
  throttle: number;
  brake: boolean;
  lap_number: number;
  compound: string;
}

// ─── Main Component ───────────────────────────────────────
export default function RaceSimulation() {
  // Selectors
  const [seasons, setSeasons] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<number | null>(null);
  const [selectedSession, setSelectedSession] = useState<number | null>(null);

  // Simulation state
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [currentMs, setCurrentMs] = useState(0);
  const [minMs, setMinMs] = useState(0);
  const [maxMs, setMaxMs] = useState(0);
  const [driverStates, setDriverStates] = useState<DriverState[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);

  // Track map
  const [trackX, setTrackX] = useState<number[]>([]);
  const [trackY, setTrackY] = useState<number[]>([]);

  // All frames loaded into memory
  const allFrames = useRef<Frame[]>([]);
  const animRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // ─── Data loading ─────────────────────────────────────
  useEffect(() => {
    f1api.getSeasons().then(r => setSeasons(r.data));
  }, []);

  useEffect(() => {
    if (selectedYear) f1api.getEvents(selectedYear).then(r => setEvents(r.data));
  }, [selectedYear]);

  useEffect(() => {
    if (selectedEvent) f1api.getSessions(selectedEvent).then(r => setSessions(r.data));
  }, [selectedEvent]);

  const loadSimulation = async () => {
    if (!selectedSession) return;
    setIsLoaded(false);
    allFrames.current = [];

    const [trackRes, durationRes] = await Promise.all([
      f1api.getTrackMap(selectedSession),
      f1api.getSessionDuration(selectedSession),
    ]);

    setTrackX(trackRes.data.x);
    setTrackY(trackRes.data.y);

    const { min_ms, max_ms } = durationRes.data;
    setMinMs(min_ms);
    setMaxMs(max_ms);
    setCurrentMs(min_ms);

    // Load all frames in chunks
    const CHUNK = 30000; // 30 seconds per request
    for (let t = min_ms; t < max_ms; t += CHUNK) {
      const res = await f1api.getFrames(selectedSession, t, Math.min(t + CHUNK, max_ms));
      allFrames.current.push(...res.data);
    }

    setIsLoaded(true);
  };

  // ─── Animation loop ───────────────────────────────────
  const getDriverStatesAt = useCallback((ms: number): DriverState[] => {
    const frames = allFrames.current;
    if (!frames.length) return [];

    // Group by driver, find closest frame <= ms
    const byDriver: { [key: string]: Frame } = {};
    for (const f of frames) {
      if (f.timestamp_ms <= ms) {
        if (!byDriver[f.driver__code] || f.timestamp_ms > byDriver[f.driver__code].timestamp_ms) {
          byDriver[f.driver__code] = f;
        }
      }
    }

    return Object.values(byDriver).map(f => ({
      code: f.driver__code,
      color: f.driver__team_color,
      x: f.x,
      y: f.y,
      speed: f.speed,
      gear: f.gear,
      throttle: f.throttle,
      brake: f.brake,
      lap_number: f.lap_number,
      compound: f.compound,
    }));
  }, []);

  const tick = useCallback((now: number) => {
    if (!lastTickRef.current) lastTickRef.current = now;
    const delta = (now - lastTickRef.current) * speed;
    lastTickRef.current = now;

    setCurrentMs(prev => {
      const next = prev + delta;
      if (next >= maxMs) {
        setIsPlaying(false);
        return maxMs;
      }
      return next;
    });

    animRef.current = requestAnimationFrame(tick);
  }, [speed, maxMs]);

  useEffect(() => {
    if (isPlaying) {
      lastTickRef.current = 0;
      animRef.current = requestAnimationFrame(tick);
    } else {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    }
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [isPlaying, tick]);

  // Update driver states + draw canvas when currentMs changes
  useEffect(() => {
    if (!isLoaded) return;
    const states = getDriverStatesAt(currentMs);
    setDriverStates(states);
    drawCanvas(states);
  }, [currentMs, isLoaded]);

  // ─── Canvas drawing ───────────────────────────────────
  const drawCanvas = (states: DriverState[]) => {
    const canvas = canvasRef.current;
    if (!canvas || !trackX.length) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Normalize track coordinates to canvas
    const allX = [...trackX, ...states.map(s => s.x)];
    const allY = [...trackY, ...states.map(s => s.y)];
    const minX = Math.min(...allX), maxX = Math.max(...allX);
    const minY = Math.min(...allY), maxY = Math.max(...allY);
    const PAD = 40;
    const scaleX = (v: number) => PAD + ((v - minX) / (maxX - minX)) * (W - PAD * 2);
    const scaleY = (v: number) => PAD + ((v - minY) / (maxY - minY)) * (H - PAD * 2);

    // Draw track
    ctx.beginPath();
    ctx.strokeStyle = "#444";
    ctx.lineWidth = 12;
    ctx.lineCap = "round";
    trackX.forEach((x, i) => {
      const cx = scaleX(x), cy = scaleY(trackY[i]);
      i === 0 ? ctx.moveTo(cx, cy) : ctx.lineTo(cx, cy);
    });
    ctx.stroke();

    // Draw track centerline
    ctx.beginPath();
    ctx.strokeStyle = "#666";
    ctx.lineWidth = 2;
    trackX.forEach((x, i) => {
      const cx = scaleX(x), cy = scaleY(trackY[i]);
      i === 0 ? ctx.moveTo(cx, cy) : ctx.lineTo(cx, cy);
    });
    ctx.stroke();

    // Draw drivers
    states.forEach(d => {
      const cx = scaleX(d.x), cy = scaleY(d.y);
      const isSelected = d.code === selectedDriver;

      ctx.beginPath();
      ctx.arc(cx, cy, isSelected ? 10 : 7, 0, Math.PI * 2);
      ctx.fillStyle = d.color || "#FFFFFF";
      ctx.fill();
      ctx.strokeStyle = isSelected ? "#FFF" : "rgba(0,0,0,0.5)";
      ctx.lineWidth = isSelected ? 2 : 1;
      ctx.stroke();

      // Driver label
      ctx.fillStyle = "#FFF";
      ctx.font = `${isSelected ? "bold " : ""}10px monospace`;
      ctx.fillText(d.code, cx + 12, cy + 4);
    });
  };

  // Redraw when selectedDriver changes
  useEffect(() => {
    if (driverStates.length) drawCanvas(driverStates);
  }, [selectedDriver]);

  // ─── Helpers ──────────────────────────────────────────
  const formatTime = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const progress = maxMs > minMs ? ((currentMs - minMs) / (maxMs - minMs)) * 100 : 0;

  const selectedDriverState = driverStates.find(d => d.code === selectedDriver);

  // ─── Render ───────────────────────────────────────────
  return (
    <div style={{ display: "flex", height: "100vh", background: "#0a0a0a", color: "#fff", fontFamily: "monospace" }}>

      {/* ── Sidebar ── */}
      <div style={{ width: 260, padding: 20, borderRight: "1px solid #222", overflowY: "auto", background: "#111" }}>
        <h2 style={{ color: "#e10600", marginBottom: 20 }}>🏎 Race Simulation</h2>

        {/* Selectors */}
        <label style={{ fontSize: 11, color: "#888" }}>SEASON</label>
        <select style={selectStyle} onChange={e => { setSelectedYear(Number(e.target.value)); setSelectedEvent(null); setSessions([]); setIsLoaded(false); }}>
          <option value="">Select year</option>
          {seasons.map(s => <option key={s.id} value={s.year}>{s.year}</option>)}
        </select>

        <label style={{ fontSize: 11, color: "#888" }}>GRAND PRIX</label>
        <select style={selectStyle} disabled={!selectedYear} onChange={e => { setSelectedEvent(Number(e.target.value)); setIsLoaded(false); }}>
          <option value="">Select event</option>
          {events.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>

        <label style={{ fontSize: 11, color: "#888" }}>SESSION</label>
        <select style={selectStyle} disabled={!selectedEvent} onChange={e => setSelectedSession(Number(e.target.value))}>
          <option value="">Select session</option>
          {sessions.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>

        <button style={btnStyle} onClick={loadSimulation} disabled={!selectedSession}>
          LOAD SESSION
        </button>

        {/* Driver list */}
        {isLoaded && (
          <>
            <div style={{ marginTop: 24, fontSize: 11, color: "#888", marginBottom: 8 }}>DRIVERS</div>
            {driverStates.sort((a, b) => a.code.localeCompare(b.code)).map(d => (
              <div
                key={d.code}
                onClick={() => setSelectedDriver(prev => prev === d.code ? null : d.code)}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "6px 8px", marginBottom: 4, borderRadius: 4,
                  cursor: "pointer",
                  background: selectedDriver === d.code ? "#222" : "transparent",
                  border: `1px solid ${selectedDriver === d.code ? d.color : "transparent"}`,
                }}
              >
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: d.color }} />
                <span style={{ fontSize: 12 }}>{d.code}</span>
                <span style={{ fontSize: 10, color: "#555", marginLeft: "auto" }}>L{d.lap_number}</span>
              </div>
            ))}
          </>
        )}
      </div>

      {/* ── Main Area ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>

        {/* Track Canvas */}
        <div style={{ flex: 1, position: "relative" }}>
          {!isLoaded ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#444" }}>
              {selectedSession ? "Click LOAD SESSION to begin" : "Select a session to start"}
            </div>
          ) : (
            <canvas
              ref={canvasRef}
              width={900}
              height={600}
              style={{ width: "100%", height: "100%" }}
              onClick={e => {
                // Click on canvas to deselect
                setSelectedDriver(null);
              }}
            />
          )}
        </div>

        {/* ── Controls Bar ── */}
        {isLoaded && (
          <div style={{ padding: "12px 20px", borderTop: "1px solid #222", background: "#111" }}>
            {/* Progress bar */}
            <div
              style={{ height: 4, background: "#333", borderRadius: 2, marginBottom: 12, cursor: "pointer" }}
              onClick={e => {
                const rect = (e.target as HTMLElement).getBoundingClientRect();
                const ratio = (e.clientX - rect.left) / rect.width;
                setCurrentMs(minMs + ratio * (maxMs - minMs));
              }}
            >
              <div style={{ height: "100%", width: `${progress}%`, background: "#e10600", borderRadius: 2, transition: "width 0.1s" }} />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <button style={ctrlBtn} onClick={() => setCurrentMs(minMs)}>⏮</button>
              <button style={{ ...ctrlBtn, background: "#e10600" }} onClick={() => setIsPlaying(p => !p)}>
                {isPlaying ? "⏸" : "▶"}
              </button>
              <button style={ctrlBtn} onClick={() => setCurrentMs(prev => Math.min(prev + 30000, maxMs))}>⏭</button>

              <div style={{ display: "flex", gap: 4 }}>
                {[0.5, 1, 2, 4].map(s => (
                  <button key={s} style={{ ...ctrlBtn, background: speed === s ? "#333" : "transparent", fontSize: 11 }} onClick={() => setSpeed(s)}>
                    {s}x
                  </button>
                ))}
              </div>

              <span style={{ marginLeft: "auto", color: "#666", fontSize: 13 }}>
                {formatTime(currentMs - minMs)} / {formatTime(maxMs - minMs)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── Telemetry Panel (selected driver) ── */}
      {selectedDriverState && (
        <div style={{ width: 200, padding: 20, borderLeft: "1px solid #222", background: "#111" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: selectedDriverState.color }} />
            <span style={{ fontWeight: "bold", fontSize: 14 }}>{selectedDriverState.code}</span>
          </div>

          <TelemetryRow label="SPEED" value={`${Math.round(selectedDriverState.speed)} km/h`} />
          <TelemetryRow label="GEAR" value={String(selectedDriverState.gear)} />
          <TelemetryRow label="THROTTLE" value={`${Math.round(selectedDriverState.throttle)}%`} />
          <TelemetryRow label="BRAKE" value={selectedDriverState.brake ? "ON" : "OFF"} color={selectedDriverState.brake ? "#e10600" : "#0f0"} />
          <TelemetryRow label="DRS" value={selectedDriverState.drs >= 10 ? "OPEN" : "CLOSED"} color={selectedDriverState.drs >= 10 ? "#0f0" : "#888"} />
          <TelemetryRow label="LAP" value={String(selectedDriverState.lap_number)} />
          <TelemetryRow label="TYRE" value={selectedDriverState.compound} color={
            { SOFT: "#FF3333", MEDIUM: "#FFD700", HARD: "#FFF", INTERMEDIATE: "#39B54A", WET: "#0067FF" }[selectedDriverState.compound] || "#FFF"
          } />

          {/* Throttle bar */}
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 10, color: "#555", marginBottom: 4 }}>THROTTLE</div>
            <div style={{ height: 6, background: "#222", borderRadius: 3 }}>
              <div style={{ height: "100%", width: `${selectedDriverState.throttle}%`, background: "#0f0", borderRadius: 3 }} />
            </div>
          </div>

          {/* Speed bar */}
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 10, color: "#555", marginBottom: 4 }}>SPEED</div>
            <div style={{ height: 6, background: "#222", borderRadius: 3 }}>
              <div style={{ height: "100%", width: `${Math.min(selectedDriverState.speed / 350 * 100, 100)}%`, background: "#e10600", borderRadius: 3 }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Small helpers ─────────────────────────────────────
function TelemetryRow({ label, value, color = "#FFF" }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 10, color: "#555" }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: "bold", color }}>{value}</div>
    </div>
  );
}

const selectStyle: React.CSSProperties = {
  width: "100%", marginBottom: 12, marginTop: 4,
  background: "#1a1a1a", border: "1px solid #333",
  color: "#fff", padding: "8px", borderRadius: 4, fontSize: 13,
};

const btnStyle: React.CSSProperties = {
  width: "100%", padding: "10px", marginTop: 8,
  background: "#e10600", color: "#fff",
  border: "none", borderRadius: 4,
  cursor: "pointer", fontWeight: "bold", fontSize: 13,
};

const ctrlBtn: React.CSSProperties = {
  padding: "6px 12px", background: "transparent",
  border: "1px solid #333", color: "#fff",
  borderRadius: 4, cursor: "pointer", fontSize: 14,
};