import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import F1CarModel from '../../../components/F1CarModel';
import { router } from '@inertiajs/react'


export default function LandingPage() {
  return (
    <>
      <style>{`
        @font-face {
          font-family: 'Formula1';
          src: url('/fonts/F1FontBold.ttf') format('truetype');
          font-weight: normal;
        }

        @font-face {
          font-family: 'Formula1';
          src: url('/fonts/F1FontWide.ttf') format('truetype');
          font-weight: bold;
        }
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
rgb(115, 0, 0),
rgb(204, 10, 10),
rgb(240, 164, 164),
rgb(255, 197, 197),
rgb(255, 230, 230),
rgb(255, 255, 255),
rgb(242, 189, 139)
          );
          background-size: 300% 300%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: gradientShift 4s ease infinite;
          margin: 0 0 24px 0;
          padding-top: 48px;
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

        .hero-section {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;

          width: 100vw;
          height: 100vh;

          background: #000;
          overflow: hidden;
        }

        .canvas-container {
          width: 100%;
          flex: 1;
          min-height: 0;
        }

        .hero-footer {
          padding: 32px 0 48px;
          display: flex;
          justify-content: center;
        }
      `}</style>

      <div className="hero-section">
        <h1 className="landing-heading">
          Welcome to F1 Platform by Lansdownian
        </h1>

        <div className="canvas-container">
          <Canvas
            camera={{ position: [0, 2.5, 6], fov: 45 }}
            style={{ width: '100%', height: '100%', background: 'transparent' }}
          >
            <ambientLight intensity={0.6} />
            <directionalLight position={[5, 5, 5]} intensity={1.2} />

            <Suspense fallback={null}>
              <F1CarModel />
            </Suspense>

            <OrbitControls
              enableZoom={false}
              enablePan={false}
              minPolarAngle={Math.PI / 3}
              maxPolarAngle={(Math.PI / 2) + 0.2}
            />
          </Canvas>
        </div>

        <div className="hero-footer">
          <div className="rhombus-btn"
          onClick={() => {
            console.log("Navigating to dashboard...");
            router.visit('/dashboard/');
          }}
          >
            <span>Let's Go</span>
          </div>
        </div>
      </div>
    </>
  );
}
