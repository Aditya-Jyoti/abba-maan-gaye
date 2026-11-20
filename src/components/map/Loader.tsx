export function Loader({ visible = true }: { visible?: boolean }) {
  return (
    <div
      aria-hidden={!visible}
      role="status"
      style={{
        position: "fixed",
        inset: "0",
        zIndex: 300,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "22px",
        background: "oklch(0.74 0.075 192)",
        opacity: visible ? 1 : 0,
        visibility: visible ? "visible" : "hidden",
        transition: `opacity .7s ease,visibility 0s linear ${visible ? "0s" : ".7s"}`,
        pointerEvents: "none",
      }}
    >
      <div style={{ position: "relative", width: "120px", height: "120px" }}>
        <svg viewBox="-60 -60 120 120" width="120" height="120" style={{ position: "absolute", inset: "0" }}>
          <circle r="38" fill="#fffdf7" stroke="#3d2c22" strokeWidth="1.2" />
          <circle r="30" fill="none" stroke="#3d2c22" strokeWidth=".7" strokeDasharray="1.5 3" />
          <path d="M0,-28 L5,0 L0,28 L-5,0 Z" fill="#c4532f" stroke="#3d2c22" strokeWidth=".9" />
          <path d="M-28,0 L0,-5 L28,0 L0,5 Z" fill="#e9cf9a" stroke="#3d2c22" strokeWidth=".9" />
          <circle r="3.2" fill="#fffaf0" stroke="#3d2c22" strokeWidth=".9" />
          <circle
            r="52"
            fill="none"
            stroke="#ffffff"
            strokeOpacity=".6"
            strokeWidth="1.6"
            strokeDasharray="3 7"
          />
        </svg>
        <div style={{ position: "absolute", inset: "0", animation: "ghLoad 2.4s linear infinite" }}>
          <svg
            viewBox="-14 -14 28 28"
            width="26"
            height="26"
            style={{ position: "absolute", left: "47px", top: "-5px", rotate: "0deg" }}
          >
            <path
              d="M12,0 L-2,-1.8 L-7,-11 L-10,-11 L-6.5,-1.8 L-10,-1.8 L-12.5,-5.5 L-14,-5.5 L-12.5,0 L-14,5.5 L-12.5,5.5 L-10,1.8 L-6.5,1.8 L-10,11 L-7,11 L-2,1.8 Z"
              fill="#fffaf0"
              stroke="#3d2c22"
              strokeWidth="1"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
      <span
        style={{
          fontFamily: "'Baloo 2',sans-serif",
          fontWeight: "700",
          fontSize: "18px",
          letterSpacing: ".06em",
          color: "#fffaf0",
        }}
      >
        Packing the bags
      </span>
    </div>
  );
}
