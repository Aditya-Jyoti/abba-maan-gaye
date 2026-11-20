// Decorative sea around the map: shipping lanes, compass, whale, boats, planes and clouds.

const BOATS: [number, number, string, number][] = [
  [58, 500, "#c4532f", 1],
  [96, 610, "#e0a64a", 0.85],
  [34, 650, "#3f8f86", 0.9],
  [66, 724, "#c4532f", 0.8],
  [160, 768, "#3f8f86", 0.9],
  [442, 552, "#e0a64a", 1],
  [356, 690, "#c4532f", 0.85],
  [520, 520, "#3f8f86", 0.9],
  [560, 600, "#c4532f", 0.8],
  [-130, 420, "#e0a64a", 1.1],
  [-70, 640, "#3f8f86", 1],
  [760, 470, "#c4532f", 1.05],
  [790, 300, "#e0a64a", 0.9],
];

export function Sea({ opacity = 1 }: { opacity?: number }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: "0",
        pointerEvents: "none",
        opacity,
        transition: "opacity .6s ease",
      }}
    >
      <svg
        viewBox="0 0 700 800"
        width="700"
        height="800"
        style={{ position: "absolute", inset: "0", overflow: "visible" }}
      >
        <path
          d="M -300 760 C -200 640 -120 540 -50 430 S 10 190 -90 40"
          fill="none"
          stroke="#ffffff"
          strokeOpacity=".6"
          strokeWidth="1.6"
          strokeDasharray="3 7"
          strokeLinecap="round"
        />
        <path
          d="M 1010 170 C 880 270 780 400 712 520 S 560 690 420 840"
          fill="none"
          stroke="#ffffff"
          strokeOpacity=".6"
          strokeWidth="1.6"
          strokeDasharray="3 7"
          strokeLinecap="round"
        />
        <path
          d="M -260 40 C 0 -60 420 -70 980 60"
          fill="none"
          stroke="#ffffff"
          strokeOpacity=".6"
          strokeWidth="1.6"
          strokeDasharray="3 7"
          strokeLinecap="round"
        />
        <path
          d="M -240 850 C 100 880 520 880 980 740"
          fill="none"
          stroke="#ffffff"
          strokeOpacity=".6"
          strokeWidth="1.6"
          strokeDasharray="3 7"
          strokeLinecap="round"
        />
        <path
          d="M -130 330 C -40 430 20 520 46 610 S 96 770 240 830"
          fill="none"
          stroke="#ffffff"
          strokeOpacity=".45"
          strokeWidth="2.5"
          strokeDasharray="1 9"
          strokeLinecap="round"
        />
        <path
          d="M 830 730 C 710 670 600 610 490 552"
          fill="none"
          stroke="#ffffff"
          strokeOpacity=".45"
          strokeWidth="2.5"
          strokeDasharray="1 9"
          strokeLinecap="round"
        />
        <g transform="translate(650,736)">
          <circle r="34" fill="rgba(255,253,247,.9)" stroke="#3d2c22" strokeWidth="1" />
          <circle r="27" fill="none" stroke="#3d2c22" strokeWidth=".6" strokeDasharray="1.5 2.5" />
          <path d="M0,-26 L5,0 L0,26 L-5,0 Z" fill="#c4532f" stroke="#3d2c22" strokeWidth=".8" />
          <path d="M-26,0 L0,-5 L26,0 L0,5 Z" fill="#e9cf9a" stroke="#3d2c22" strokeWidth=".8" />
          <path d="M0,-26 L5,0 L0,0 Z" fill="#a63f22" />
          <circle r="3" fill="#fffaf0" stroke="#3d2c22" strokeWidth=".8" />
          <text
            y="-39"
            fontFamily="'Baloo 2',sans-serif"
            fontWeight="800"
            fontSize="13px"
            textAnchor="middle"
            fill="#fffaf0"
          >
            N
          </text>
        </g>
        <g transform="translate(418,748)">
          <path
            d="M-30,0 Q-28,-16 -6,-17 Q16,-18 24,-6 Q30,0 22,4 L-26,4 Q-31,3 -30,0 Z"
            fill="#3f6f86"
            stroke="#2a4a5a"
            strokeWidth="1"
          />
          <path
            d="M22,-4 Q30,-14 38,-16 Q34,-8 36,-2 Q30,-6 22,0 Z"
            fill="#3f6f86"
            stroke="#2a4a5a"
            strokeWidth="1"
          />
          <path d="M-26,0 Q-4,6 22,0" fill="none" stroke="#cfe6ea" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="-20" cy="-8" r="1.6" fill="#fffaf0" />
          <path
            d="M-18,4 Q0,10 22,4"
            fill="none"
            stroke="#ffffff"
            strokeOpacity=".7"
            strokeWidth="1.4"
            strokeDasharray="3 4"
          />
        </g>
      </svg>
      <div
        style={{
          position: "absolute",
          left: "396px",
          top: "712px",
          width: "16px",
          height: "14px",
          transformOrigin: "50% 100%",
          animation: "ghSpout 4s ease-in-out infinite",
        }}
      >
        <svg viewBox="-8 -14 16 14" width="16" height="14" style={{ display: "block" }}>
          <path
            d="M0,0 Q-1,-6 -6,-10 M0,0 Q0,-7 0,-13 M0,0 Q1,-6 6,-10"
            fill="none"
            stroke="#ffffff"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </div>
      {BOATS.map(([x, y, color, size], i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: x,
            top: y,
            width: 28,
            height: 24,
            margin: "-20px 0 0 -14px",
            transform: `scale(${size})`,
            animation: `ghBoat ${3 + (i % 4) * 0.4}s ${((i * 0.37) % 2).toFixed(2)}s ease-in-out infinite`,
            willChange: "translate,rotate",
          }}
        >
          <svg
            viewBox="-14 -20 28 24"
            width="28"
            height="24"
            style={{ display: "block", overflow: "visible" }}
          >
            <path
              d="M-18,4 Q-12,1 -6,4 T6,4 T18,4"
              fill="none"
              stroke="#ffffff"
              strokeOpacity=".75"
              strokeWidth="1.3"
              strokeLinecap="round"
            />
            <path
              d="M-12,-2 L12,-2 L8,3 L-8,3 Z"
              fill={color}
              stroke="#3d2c22"
              strokeWidth=".8"
              strokeLinejoin="round"
            />
            <line x1="0" y1="-2" x2="0" y2="-19" stroke="#3d2c22" strokeWidth="1" />
            <path d="M1,-18 L10,-4 L1,-4 Z" fill="#fffaf0" stroke="#3d2c22" strokeWidth=".7" />
            <path d="M-1,-14 L-8,-4 L-1,-4 Z" fill="#f4d9a8" stroke="#3d2c22" strokeWidth=".7" />
          </svg>
        </div>
      ))}
      <div
        style={{
          position: "absolute",
          left: "0",
          top: "0",
          width: "28px",
          height: "28px",
          margin: "-14px 0 0 -14px",
          offsetPath: "path('M -300 760 C -200 640 -120 540 -50 430 S 10 190 -90 40')",
          offsetRotate: "auto",
          animation: "ghSail 16s linear infinite",
          willChange: "offset-distance,opacity",
        }}
      >
        <svg viewBox="-14 -14 28 28" width="28" height="28" style={{ display: "block" }}>
          <path
            d="M12,0 L-2,-1.8 L-7,-11 L-10,-11 L-6.5,-1.8 L-10,-1.8 L-12.5,-5.5 L-14,-5.5 L-12.5,0 L-14,5.5 L-12.5,5.5 L-10,1.8 L-6.5,1.8 L-10,11 L-7,11 L-2,1.8 Z"
            fill="#fffaf0"
            stroke="#3d2c22"
            strokeWidth="1"
            strokeLinejoin="round"
          />
          <circle cx="6" cy="0" r="1.2" fill="#c4532f" />
        </svg>
      </div>
      <div
        style={{
          position: "absolute",
          left: "0",
          top: "0",
          width: "24px",
          height: "24px",
          margin: "-12px 0 0 -12px",
          offsetPath: "path('M 1010 170 C 880 270 780 400 712 520 S 560 690 420 840')",
          offsetRotate: "auto",
          animation: "ghSail 19s 4s linear infinite both",
          willChange: "offset-distance,opacity",
        }}
      >
        <svg viewBox="-14 -14 28 28" width="24" height="24" style={{ display: "block" }}>
          <path
            d="M12,0 L-2,-1.8 L-7,-11 L-10,-11 L-6.5,-1.8 L-10,-1.8 L-12.5,-5.5 L-14,-5.5 L-12.5,0 L-14,5.5 L-12.5,5.5 L-10,1.8 L-6.5,1.8 L-10,11 L-7,11 L-2,1.8 Z"
            fill="#fffaf0"
            stroke="#3d2c22"
            strokeWidth="1"
            strokeLinejoin="round"
          />
          <circle cx="6" cy="0" r="1.2" fill="#3f8f86" />
        </svg>
      </div>
      <div
        style={{
          position: "absolute",
          left: "0",
          top: "0",
          width: "22px",
          height: "22px",
          margin: "-11px 0 0 -11px",
          offsetPath: "path('M -260 40 C 0 -60 420 -70 980 60')",
          offsetRotate: "auto",
          animation: "ghSail 21s 2s linear infinite both",
          willChange: "offset-distance,opacity",
        }}
      >
        <svg viewBox="-14 -14 28 28" width="22" height="22" style={{ display: "block" }}>
          <path
            d="M12,0 L-2,-1.8 L-7,-11 L-10,-11 L-6.5,-1.8 L-10,-1.8 L-12.5,-5.5 L-14,-5.5 L-12.5,0 L-14,5.5 L-12.5,5.5 L-10,1.8 L-6.5,1.8 L-10,11 L-7,11 L-2,1.8 Z"
            fill="#fffaf0"
            stroke="#3d2c22"
            strokeWidth="1"
            strokeLinejoin="round"
          />
          <circle cx="6" cy="0" r="1.2" fill="#e0a64a" />
        </svg>
      </div>
      <div
        style={{
          position: "absolute",
          left: "0",
          top: "0",
          width: "26px",
          height: "26px",
          margin: "-13px 0 0 -13px",
          offsetPath: "path('M -240 850 C 100 880 520 880 980 740')",
          offsetRotate: "auto",
          animation: "ghSail 24s 9s linear infinite both",
          willChange: "offset-distance,opacity",
        }}
      >
        <svg viewBox="-14 -14 28 28" width="26" height="26" style={{ display: "block" }}>
          <path
            d="M12,0 L-2,-1.8 L-7,-11 L-10,-11 L-6.5,-1.8 L-10,-1.8 L-12.5,-5.5 L-14,-5.5 L-12.5,0 L-14,5.5 L-12.5,5.5 L-10,1.8 L-6.5,1.8 L-10,11 L-7,11 L-2,1.8 Z"
            fill="#fffaf0"
            stroke="#3d2c22"
            strokeWidth="1"
            strokeLinejoin="round"
          />
          <circle cx="6" cy="0" r="1.2" fill="#c4532f" />
        </svg>
      </div>
      <div
        style={{
          position: "absolute",
          left: "0",
          top: "0",
          width: "40px",
          height: "26px",
          margin: "-20px 0 0 -20px",
          offsetPath: "path('M -130 330 C -40 430 20 520 46 610 S 96 770 240 830')",
          offsetRotate: "0deg",
          animation: "ghSail 42s 0s linear infinite both",
          willChange: "offset-distance,opacity",
        }}
      >
        <svg
          viewBox="-20 -20 40 26"
          width="40"
          height="26"
          style={{ display: "block", overflow: "visible", transform: "scaleX(1)" }}
        >
          <path
            d="M-22,5 Q-14,2 -6,5 T10,5 T26,5"
            fill="none"
            stroke="#ffffff"
            strokeOpacity=".8"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
          <path
            d="M-18,-4 L18,-4 L14,3 L-15,3 Z"
            fill="#c4532f"
            stroke="#3d2c22"
            strokeWidth=".9"
            strokeLinejoin="round"
          />
          <rect x="-12" y="-11" width="9" height="7" fill="#e0a64a" stroke="#3d2c22" strokeWidth=".7" />
          <rect x="-2" y="-10" width="9" height="6" fill="#3f8f86" stroke="#3d2c22" strokeWidth=".7" />
          <rect x="8" y="-13" width="7" height="9" fill="#fffaf0" stroke="#3d2c22" strokeWidth=".7" />
          <rect x="10" y="-17" width="3" height="4" fill="#c4532f" stroke="#3d2c22" strokeWidth=".6" />
          <circle cx="-8" cy="-1" r=".9" fill="#fffaf0" />
          <circle cx="-3" cy="-1" r=".9" fill="#fffaf0" />
          <circle cx="2" cy="-1" r=".9" fill="#fffaf0" />
        </svg>
      </div>
      <div
        style={{
          position: "absolute",
          left: "0",
          top: "0",
          width: "40px",
          height: "26px",
          margin: "-20px 0 0 -20px",
          offsetPath: "path('M 830 730 C 710 670 600 610 490 552')",
          offsetRotate: "0deg",
          animation: "ghSail 34s 6s linear infinite both",
          willChange: "offset-distance,opacity",
        }}
      >
        <svg
          viewBox="-20 -20 40 26"
          width="40"
          height="26"
          style={{ display: "block", overflow: "visible", transform: "scaleX(-1)" }}
        >
          <path
            d="M-22,5 Q-14,2 -6,5 T10,5 T26,5"
            fill="none"
            stroke="#ffffff"
            strokeOpacity=".8"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
          <path
            d="M-18,-4 L18,-4 L14,3 L-15,3 Z"
            fill="#3d6f86"
            stroke="#3d2c22"
            strokeWidth=".9"
            strokeLinejoin="round"
          />
          <rect x="-12" y="-11" width="9" height="7" fill="#e0a64a" stroke="#3d2c22" strokeWidth=".7" />
          <rect x="-2" y="-10" width="9" height="6" fill="#3f8f86" stroke="#3d2c22" strokeWidth=".7" />
          <rect x="8" y="-13" width="7" height="9" fill="#fffaf0" stroke="#3d2c22" strokeWidth=".7" />
          <rect x="10" y="-17" width="3" height="4" fill="#c4532f" stroke="#3d2c22" strokeWidth=".6" />
          <circle cx="-8" cy="-1" r=".9" fill="#fffaf0" />
          <circle cx="-3" cy="-1" r=".9" fill="#fffaf0" />
          <circle cx="2" cy="-1" r=".9" fill="#fffaf0" />
        </svg>
      </div>
      <div
        style={{
          position: "absolute",
          left: "-230px",
          top: "150px",
          animation: "ghDrift 9s ease-in-out infinite alternate",
        }}
      >
        <svg viewBox="0 0 120 50" width="120" height="50" style={{ display: "block" }}>
          <path
            d="M14,44 Q0,44 4,32 Q8,22 22,26 Q24,10 42,12 Q52,0 68,8 Q84,2 90,18 Q108,16 110,30 Q116,44 98,44 Z"
            fill="#fffdf7"
            fillOpacity=".92"
            stroke="#ffffff"
            strokeWidth="1"
          />
        </svg>
      </div>
      <div
        style={{
          position: "absolute",
          left: "600px",
          top: "96px",
          animation: "ghDrift 11s 1s ease-in-out infinite alternate-reverse",
        }}
      >
        <svg viewBox="0 0 120 50" width="96" height="40" style={{ display: "block" }}>
          <path
            d="M14,44 Q0,44 4,32 Q8,22 22,26 Q24,10 42,12 Q52,0 68,8 Q84,2 90,18 Q108,16 110,30 Q116,44 98,44 Z"
            fill="#fffdf7"
            fillOpacity=".92"
          />
        </svg>
      </div>
      <span
        style={{
          position: "absolute",
          left: "18px",
          top: "556px",
          fontFamily: "'Baloo 2',sans-serif",
          fontWeight: "700",
          fontSize: "15px",
          lineHeight: 1.3,
          letterSpacing: ".4em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,.85)",
        }}
      >
        Arabian
        <br />
        Sea
      </span>
      <span
        style={{
          position: "absolute",
          left: "440px",
          top: "590px",
          fontFamily: "'Baloo 2',sans-serif",
          fontWeight: "700",
          fontSize: "15px",
          lineHeight: 1.3,
          letterSpacing: ".4em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,.85)",
        }}
      >
        Bay of
        <br />
        Bengal
      </span>
      <span
        style={{
          position: "absolute",
          left: "190px",
          top: "772px",
          fontFamily: "'Baloo 2',sans-serif",
          fontWeight: "700",
          fontSize: "13px",
          letterSpacing: ".42em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,.7)",
        }}
      >
        Indian Ocean
      </span>
    </div>
  );
}
