import { useState } from 'react';
import { Link } from '@inertiajs/react';

const F1_RED = '#e10600';
const BG_DEEP = '#000000';
const BG_PANEL = '#15151e';
const TEAL_TOP = '#2dd4bf';
const TEAL_MID = '#0d9488';
const TEAL_DEEP = '#042f2e';

function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function formatRaceDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function podiumGradient(position) {
  if (position === 1) {
    return `linear-gradient(165deg, ${TEAL_TOP} 0%, ${TEAL_MID} 45%, ${TEAL_DEEP} 100%)`;
  }
  if (position === 2) {
    return `linear-gradient(165deg, #14b8a6 0%, #0f766e 50%, #022c2c 100%)`;
  }
  if (position === 3) {
    return `linear-gradient(165deg, #dc2626 0%, #991b1b 55%, #450a0a 100%)`;
  }
  return `linear-gradient(180deg, #1e1e2a 0%, ${BG_PANEL} 100%)`;
}

export default function Dashboard({ race, results, fastest_lap }) {
  const [activeTab, setActiveTab] = useState('highlights');
  const sorted = [...(results || [])].sort((a, b) => a.position - b.position);
  const topThree = sorted.filter((r) => r.position <= 3);
  const rest = sorted.filter((r) => r.position > 3);
  const seasonYear = race?.date ? new Date(race.date).getFullYear() : new Date().getFullYear();

  return (
    <>
      <style>{`
        @font-face {
          font-family: 'Formula1';
          src: url('/fonts/F1FontBold.ttf') format('truetype');
          font-weight: 700;
        }
        @font-face {
          font-family: 'Formula1';
          src: url('/fonts/F1FontWide.ttf') format('truetype');
          font-weight: 900;
        }

        .dash-root {
          --f1-red: ${F1_RED};
          --bg: ${BG_DEEP};
          --panel: ${BG_PANEL};
          --text: #ffffff;
          --muted: #9ca3af;
          width: 100%;
          min-height: 100vh;
          background: var(--bg);
          color: var(--text);
          font-family: 'Orbitron', system-ui, sans-serif;
        }

        .dash-root * {
          box-sizing: border-box;
        }

        .dash-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 24px;
          background: var(--panel);
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }

        .dash-logo {
          font-family: 'Formula1', 'Orbitron', sans-serif;
          font-weight: 900;
          font-size: 1.35rem;
          letter-spacing: 0.02em;
          color: var(--f1-red);
        }

        .dash-topbar a {
          color: var(--muted);
          text-decoration: none;
          font-size: 0.75rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          transition: color 0.2s;
        }
        .dash-topbar a:hover {
          color: #fff;
        }

        .dash-subbar {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 12px 24px;
          background: rgba(21, 21, 30, 0.95);
          font-size: 0.8rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--muted);
        }

        .dash-subbar strong {
          color: #fff;
          font-weight: 700;
        }

        .dash-hero {
          padding: 32px 24px 24px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .dash-season {
          font-size: clamp(0.75rem, 1.5vw, 0.85rem);
          letter-spacing: 0.35em;
          color: var(--muted);
          margin: 0 0 8px 0;
        }

        .dash-title {
          font-family: 'Formula1', 'Orbitron', sans-serif;
          font-weight: 900;
          font-size: clamp(2rem, 5vw, 3.25rem);
          line-height: 1.05;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          margin: 0 0 20px 0;
        }

        .dash-rule {
          height: 4px;
          width: 100%;
          max-width: 120px;
          background: var(--f1-red);
          margin-bottom: 28px;
        }

        .dash-tabs {
          display: flex;
          gap: 32px;
          border-bottom: 1px solid rgba(255,255,255,0.1);
          padding-bottom: 0;
          margin-bottom: 32px;
        }

        .dash-tab {
          font-family: inherit;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 0.8rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--muted);
          padding: 0 0 12px 0;
          border-bottom: 3px solid transparent;
          margin-bottom: -1px;
        }

        .dash-tab:hover {
          color: #e5e7eb;
        }

        .dash-tab-active {
          color: #fff;
          border-bottom-color: var(--f1-red);
        }

        .dash-fastest {
          max-width: 1400px;
          margin: 0 auto 36px;
          padding: 0 24px;
        }

        .dash-fastest-inner {
          position: relative;
          overflow: hidden;
          border-radius: 12px;
          padding: 24px 28px;
          background: linear-gradient(135deg, #0c4a6e 0%, ${BG_PANEL} 55%, #0f172a 100%);
          border: 1px solid rgba(45, 212, 191, 0.35);
          box-shadow:
            0 0 0 1px rgba(0,0,0,0.4),
            0 20px 50px rgba(0,0,0,0.45),
            inset 0 1px 0 rgba(255,255,255,0.06);
        }

        .dash-fastest-inner::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px);
          background-size: 14px 14px;
          opacity: 0.4;
          pointer-events: none;
        }

        .dash-fastest-label {
          font-size: 0.7rem;
          letter-spacing: 0.28em;
          color: ${TEAL_TOP};
          margin: 0 0 8px 0;
          position: relative;
        }

        .dash-fastest-row {
          display: flex;
          flex-wrap: wrap;
          align-items: baseline;
          gap: 16px 28px;
          position: relative;
        }

        .dash-fastest-driver {
          font-family: 'Formula1', 'Orbitron', sans-serif;
          font-weight: 900;
          font-size: clamp(1.5rem, 3vw, 2rem);
          letter-spacing: 0.06em;
        }

        .dash-fastest-time {
          font-variant-numeric: tabular-nums;
          font-size: clamp(1.25rem, 2.5vw, 1.75rem);
          color: #e5e7eb;
          letter-spacing: 0.12em;
        }

        .dash-podium {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          max-width: 1400px;
          margin: 0 auto 28px;
          padding: 0 24px;
        }

        @media (max-width: 900px) {
          .dash-podium {
            grid-template-columns: 1fr;
          }
        }

        .dash-card {
          position: relative;
          border-radius: 12px;
          padding: 22px 20px 26px;
          min-height: 160px;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.08);
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }

        .dash-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 16px 40px rgba(0,0,0,0.5);
        }

        .dash-card::after {
          content: '';
          position: absolute;
          inset: 0;
          background-image: radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px);
          background-size: 10px 10px;
          pointer-events: none;
        }

        .dash-card-rank {
          font-family: 'Formula1', 'Orbitron', sans-serif;
          font-weight: 900;
          font-size: 1.75rem;
          margin: 0 0 12px 0;
          position: relative;
          z-index: 1;
        }

        .dash-card-driver {
          font-weight: 800;
          font-size: 1.15rem;
          letter-spacing: 0.04em;
          margin: 0 0 4px 0;
          position: relative;
          z-index: 1;
        }

        .dash-card-team {
          font-size: 0.8rem;
          color: rgba(255,255,255,0.75);
          margin: 0 0 16px 0;
          position: relative;
          z-index: 1;
        }

        .dash-card-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 14px 20px;
          font-size: 0.7rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.85);
          position: relative;
          z-index: 1;
        }

        .dash-card-meta span {
          color: rgba(255,255,255,0.55);
        }

        .dash-section-title {
          max-width: 1400px;
          margin: 0 auto 16px;
          padding: 0 24px;
          font-size: 0.75rem;
          letter-spacing: 0.28em;
          color: var(--muted);
          text-transform: uppercase;
        }

        .dash-table-wrap {
          max-width: 1400px;
          margin: 0 auto 48px;
          padding: 0 24px;
        }

        .dash-table {
          width: 100%;
          border-collapse: collapse;
          border-radius: 12px;
          overflow: hidden;
          background: var(--panel);
          border: 1px solid rgba(255,255,255,0.06);
        }

        .dash-table thead {
          background: rgba(0,0,0,0.35);
        }

        .dash-table th {
          text-align: left;
          font-size: 0.65rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--muted);
          padding: 14px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }

        .dash-table td {
          padding: 14px 16px;
          font-size: 0.85rem;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }

        .dash-table tbody tr {
          transition: background 0.15s;
        }

        .dash-table tbody tr:hover {
          background: rgba(225, 6, 0, 0.06);
        }

        .dash-pos {
          font-variant-numeric: tabular-nums;
          font-weight: 800;
          color: var(--f1-red);
          width: 52px;
        }

        .dash-driver-cell {
          font-weight: 700;
          letter-spacing: 0.06em;
        }

        .dash-team-cell {
          color: var(--muted);
          font-size: 0.8rem;
        }

        .dash-status {
          font-size: 0.75rem;
          letter-spacing: 0.06em;
          color: #d1d5db;
        }

        .dash-empty {
          padding: 48px 24px;
          text-align: center;
          color: var(--muted);
        }
      `}</style>

      <div className="dash-root">
        <header className="dash-topbar">
          <span className="dash-logo">F1 Platform</span>
          <Link href="/">Home</Link>
        </header>

        <div className="dash-subbar">
          <span>
            <strong>{race?.location || '—'}</strong>
            {race?.name ? ` · ${race.name}` : ''}
          </span>
          <span>{formatRaceDate(race?.date)}</span>
        </div>

        <section className="dash-hero">
          <p className="dash-season">{seasonYear} SEASON · RACE</p>
          <h1 className="dash-title">{race?.name || 'Grand Prix'}</h1>
          <div className="dash-rule" aria-hidden />
          <div className="dash-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'highlights'}
              className={`dash-tab${activeTab === 'highlights' ? ' dash-tab-active' : ''}`}
              onClick={() => setActiveTab('highlights')}
            >
              Highlights
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'classification'}
              className={`dash-tab${activeTab === 'classification' ? ' dash-tab-active' : ''}`}
              onClick={() => setActiveTab('classification')}
            >
              Classification
            </button>
          </div>
        </section>

        {sorted.length === 0 ? (
          <p className="dash-empty">No race results available yet.</p>
        ) : activeTab === 'highlights' ? (
          <>
            {fastest_lap && (
              <section className="dash-fastest" aria-label="Fastest lap">
                <div className="dash-fastest-inner">
                  <p className="dash-fastest-label">Fastest lap</p>
                  <div className="dash-fastest-row">
                    <span className="dash-fastest-driver">{fastest_lap.driver}</span>
                    <span className="dash-fastest-time">{fastest_lap.time}</span>
                  </div>
                </div>
              </section>
            )}

            <h2 className="dash-section-title">Podium</h2>
            <div className="dash-podium">
              {[1, 2, 3].map((pos) => {
                const row = topThree.find((r) => r.position === pos);
                if (!row) return null;
                return (
                  <article
                    key={pos}
                    className="dash-card"
                    style={{ background: podiumGradient(pos) }}
                  >
                    <p className="dash-card-rank">{ordinal(pos)}</p>
                    <p className="dash-card-driver">{row.driver}</p>
                    <p className="dash-card-team">{row.team}</p>
                    <div className="dash-card-meta">
                      <div>
                        Grid <span>{row.grid}</span>
                      </div>
                      <div>
                        Status <span>{row.status}</span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {rest.length > 0 && (
              <p className="dash-section-title" style={{ letterSpacing: '0.12em', fontSize: '0.7rem' }}>
                Positions 4–{sorted.length} on the Classification tab
              </p>
            )}
          </>
        ) : (
          <div className="dash-table-wrap">
            {fastest_lap && (
              <div
                className="dash-fastest-inner"
                style={{ marginBottom: 20, padding: '16px 20px' }}
              >
                <p className="dash-fastest-label" style={{ marginBottom: 4 }}>
                  Fastest lap
                </p>
                <div className="dash-fastest-row" style={{ gap: 12 }}>
                  <span className="dash-fastest-driver" style={{ fontSize: '1.1rem' }}>
                    {fastest_lap.driver}
                  </span>
                  <span className="dash-fastest-time" style={{ fontSize: '1rem' }}>
                    {fastest_lap.time}
                  </span>
                </div>
              </div>
            )}
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Pos</th>
                  <th>Driver</th>
                  <th>Team</th>
                  <th>Grid</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((r) => (
                  <tr key={`${r.position}-${r.driver}`}>
                    <td className="dash-pos">{r.position}</td>
                    <td className="dash-driver-cell">{r.driver}</td>
                    <td className="dash-team-cell">{r.team}</td>
                    <td>{r.grid}</td>
                    <td className="dash-status">{r.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
