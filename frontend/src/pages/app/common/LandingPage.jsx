export default function LandingPage() {
  return (
    <>
      <style>{`
              * {
          box-sizing: border-box;
        }

        html, body, #root {
          margin: 0;
          padding: 0;
          height: 100%;
          width: 100%;
        }
        @keyframes gradientShift {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .landing-heading {
          font-family: 'Orbitron', sans-serif;
          font-weight: 900;
          font-size: clamp(1.8rem, 4vw, 3.5rem);
          text-align: center;
          letter-spacing: 0.05em;
          background: linear-gradient(
            135deg,
            #064e3b,
            #059669,
            #34d399,
            #6ee7b7,
            #34d399,
            #059669,
            #064e3b
          );
          background-size: 300% 300%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: gradientShift 4s ease infinite;
          margin-bottom: 70px;
        }

        .rhombus-btn {
          position: relative;
          width: 220px;
          height: 80px;
          transform: skewX(-25deg);
          border: 2px solid #34d399;
          background: rgba(0,0,0,0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.35s ease;
          box-shadow:
            0 0 10px #34d399,
            0 0 25px rgba(52,211,153,0.6),
            inset 0 0 12px rgba(52,211,153,0.3);
        }

        .rhombus-btn span {
          transform: skewX(25deg);
          font-family: 'Orbitron', sans-serif;
          font-weight: 700;
          letter-spacing: 0.15em;
          font-size: 1.2rem;
          color: #6ee7b7;
          text-transform: uppercase;
        }

        .rhombus-btn:hover {
          transform: skewX(-25deg) translateY(-5px) scale(1.05);
          border-color: #38bdf8;
          box-shadow:
            0 0 12px #38bdf8,
            0 0 30px #38bdf8,
            0 0 50px rgba(56,189,248,0.8),
            inset 0 0 14px rgba(56,189,248,0.4);
        }

        .rhombus-btn:hover span {
          color: #7dd3fc;
        }

        .rhombus-btn:active {
          transform: skewX(-25deg) translateY(1px) scale(0.98);
        }
      `}</style>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          background: "#0a0a0a",
        }}
      >
        <h1 className="landing-heading">
          Welcome to F1 Platform by Lansdownian
        </h1>

        <div className="rhombus-btn">
          <span>Let's Go</span>
        </div>
      </div>
    </>
  );
}
