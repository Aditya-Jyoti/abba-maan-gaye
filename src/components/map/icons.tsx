import type { ReactNode } from "react";
import type { IconType } from "@/lib/map";

// Landmark illustrations from the design, drawn around (0, 0) at the icon's base.
export const ICONS: Record<IconType, ReactNode> = {
  taj: (
    <>
      <rect x="-15" y="-4" width="30" height="4" fill="#f3e4c8" stroke="#6b4a35" strokeWidth=".8" />
      <rect x="-10" y="-12" width="20" height="8" fill="#fffaf0" stroke="#6b4a35" strokeWidth=".8" />
      <path d="M-2.5,-4 V-8 Q0,-11 2.5,-8 V-4 Z" fill="#6b4a35" />
      <path d="M-6,-12 Q-7,-21 0,-25 Q7,-21 6,-12 Z" fill="#fffaf0" stroke="#6b4a35" strokeWidth=".8" />
      <line x1="0" y1="-25" x2="0" y2="-29" stroke="#6b4a35" strokeWidth=".8" />
      <rect x="-14.5" y="-17" width="2.4" height="13" fill="#fffaf0" stroke="#6b4a35" strokeWidth=".7" />
      <rect x="12.1" y="-17" width="2.4" height="13" fill="#fffaf0" stroke="#6b4a35" strokeWidth=".7" />
      <circle cx="-13.3" cy="-18" r="1.6" fill="#fffaf0" stroke="#6b4a35" strokeWidth=".7" />
      <circle cx="13.3" cy="-18" r="1.6" fill="#fffaf0" stroke="#6b4a35" strokeWidth=".7" />
    </>
  ),
  qutub: (
    <>
      <path d="M-3.4,0 L3.4,0 L1.5,-24 L-1.5,-24 Z" fill="#d98a5e" stroke="#6b4a35" strokeWidth=".8" />
      <line x1="-3" y1="-6" x2="3" y2="-6" stroke="#fffaf0" strokeWidth="1" />
      <line x1="-2.5" y1="-12" x2="2.5" y2="-12" stroke="#fffaf0" strokeWidth="1" />
      <line x1="-2" y1="-18" x2="2" y2="-18" stroke="#fffaf0" strokeWidth="1" />
      <rect x="-1" y="-27" width="2" height="3" fill="#d98a5e" stroke="#6b4a35" strokeWidth=".6" />
    </>
  ),
  konark: (
    <>
      <path d="M-9,0 L9,0 L5.5,-13 L-5.5,-13 Z" fill="#e0a96d" stroke="#6b4a35" strokeWidth=".8" />
      <path d="M-3.5,-13 L3.5,-13 L0,-20 Z" fill="#e0a96d" stroke="#6b4a35" strokeWidth=".8" />
      <line x1="-7.5" y1="-5" x2="7.5" y2="-5" stroke="#6b4a35" strokeWidth=".6" />
      <line x1="-6.5" y1="-9" x2="6.5" y2="-9" stroke="#6b4a35" strokeWidth=".6" />
      <circle cx="-11" cy="-4" r="4" fill="#fffaf0" stroke="#6b4a35" strokeWidth=".9" />
      <line x1="-15" y1="-4" x2="-7" y2="-4" stroke="#6b4a35" strokeWidth=".6" />
      <line x1="-11" y1="-8" x2="-11" y2="0" stroke="#6b4a35" strokeWidth=".6" />
    </>
  ),
  hawa: (
    <>
      <path
        d="M-10,0 L10,0 L10,-10 L7,-10 L7,-15 L4,-15 L4,-20 L-4,-20 L-4,-15 L-7,-15 L-7,-10 L-10,-10 Z"
        fill="#e88a7a"
        stroke="#6b4a35"
        strokeWidth=".8"
      />
      <circle cx="-6" cy="-5" r="1" fill="#fffaf0" />
      <circle cx="-2" cy="-5" r="1" fill="#fffaf0" />
      <circle cx="2" cy="-5" r="1" fill="#fffaf0" />
      <circle cx="6" cy="-5" r="1" fill="#fffaf0" />
      <circle cx="-4" cy="-11" r="1" fill="#fffaf0" />
      <circle cx="0" cy="-11" r="1" fill="#fffaf0" />
      <circle cx="4" cy="-11" r="1" fill="#fffaf0" />
      <circle cx="0" cy="-16.5" r="1" fill="#fffaf0" />
    </>
  ),
  gateway: (
    <>
      <rect x="-11" y="-14" width="22" height="14" fill="#e9cf9a" stroke="#6b4a35" strokeWidth=".8" />
      <path d="M-4,0 V-7 Q0,-11.5 4,-7 V0 Z" fill="#6b4a35" />
      <circle cx="-8.5" cy="-15" r="2" fill="#e9cf9a" stroke="#6b4a35" strokeWidth=".7" />
      <circle cx="8.5" cy="-15" r="2" fill="#e9cf9a" stroke="#6b4a35" strokeWidth=".7" />
      <circle cx="-3" cy="-15.5" r="1.6" fill="#e9cf9a" stroke="#6b4a35" strokeWidth=".7" />
      <circle cx="3" cy="-15.5" r="1.6" fill="#e9cf9a" stroke="#6b4a35" strokeWidth=".7" />
    </>
  ),
  golden: (
    <>
      <rect x="-14" y="0" width="28" height="3" rx="1.5" fill="#7fbfb5" />
      <rect x="-10" y="-6" width="20" height="6" fill="#e8b84a" stroke="#6b4a35" strokeWidth=".8" />
      <path d="M-6,-6 Q-6.5,-14 0,-17 Q6.5,-14 6,-6 Z" fill="#f0c75a" stroke="#6b4a35" strokeWidth=".8" />
      <line x1="0" y1="-17" x2="0" y2="-20" stroke="#6b4a35" strokeWidth=".8" />
    </>
  ),
  charminar: (
    <>
      <rect x="-8" y="-11" width="16" height="11" fill="#f3e4c8" stroke="#6b4a35" strokeWidth=".8" />
      <path d="M-3.5,0 V-5 Q0,-9 3.5,-5 V0 Z" fill="#6b4a35" />
      <rect x="-10.5" y="-21" width="2.6" height="21" fill="#f3e4c8" stroke="#6b4a35" strokeWidth=".7" />
      <rect x="7.9" y="-21" width="2.6" height="21" fill="#f3e4c8" stroke="#6b4a35" strokeWidth=".7" />
      <circle cx="-9.2" cy="-22" r="1.7" fill="#f3e4c8" stroke="#6b4a35" strokeWidth=".7" />
      <circle cx="9.2" cy="-22" r="1.7" fill="#f3e4c8" stroke="#6b4a35" strokeWidth=".7" />
    </>
  ),
  victoria: (
    <>
      <rect x="-12" y="-6" width="24" height="6" fill="#fffaf0" stroke="#6b4a35" strokeWidth=".8" />
      <path d="M-5,-6 Q-5.5,-15 0,-17 Q5.5,-15 5,-6 Z" fill="#fffaf0" stroke="#6b4a35" strokeWidth=".8" />
      <circle cx="-9.5" cy="-7" r="2" fill="#fffaf0" stroke="#6b4a35" strokeWidth=".7" />
      <circle cx="9.5" cy="-7" r="2" fill="#fffaf0" stroke="#6b4a35" strokeWidth=".7" />
      <line x1="0" y1="-17" x2="0" y2="-20.5" stroke="#6b4a35" strokeWidth=".8" />
    </>
  ),
  gopuram: (
    <>
      <path d="M-8,0 L8,0 L5,-21 L-5,-21 Z" fill="#e6a24f" stroke="#6b4a35" strokeWidth=".8" />
      <line x1="-7.2" y1="-5" x2="7.2" y2="-5" stroke="#6b4a35" strokeWidth=".6" />
      <line x1="-6.5" y1="-10" x2="6.5" y2="-10" stroke="#6b4a35" strokeWidth=".6" />
      <line x1="-5.8" y1="-15" x2="5.8" y2="-15" stroke="#6b4a35" strokeWidth=".6" />
      <rect
        x="-5.5"
        y="-24"
        width="11"
        height="3"
        rx="1.5"
        fill="#e6a24f"
        stroke="#6b4a35"
        strokeWidth=".7"
      />
      <rect x="-2" y="-4.5" width="4" height="4.5" fill="#6b4a35" />
    </>
  ),
  boat: (
    <>
      <path d="M-13,-3 Q0,2 13,-3 L10,1 L-10,1 Z" fill="#8a5a3a" stroke="#6b4a35" strokeWidth=".7" />
      <path d="M-8,-3 Q0,-12 8,-3 Z" fill="#e0a64a" stroke="#6b4a35" strokeWidth=".8" />
    </>
  ),
  stupa: (
    <>
      <rect x="-12" y="-2" width="24" height="2" fill="#d9b98a" stroke="#6b4a35" strokeWidth=".7" />
      <path d="M-10,-2 A10,9 0 0 1 10,-2 Z" fill="#f3e4c8" stroke="#6b4a35" strokeWidth=".8" />
      <rect x="-2.2" y="-13" width="4.4" height="2.4" fill="#d9b98a" stroke="#6b4a35" strokeWidth=".6" />
      <line x1="0" y1="-13" x2="0" y2="-18" stroke="#6b4a35" strokeWidth=".8" />
      <line x1="-3" y1="-16.5" x2="3" y2="-16.5" stroke="#6b4a35" strokeWidth=".8" />
    </>
  ),
  mountain: (
    <>
      <path d="M-16,0 L-5,-16 L1,-7 L6,-12 L16,0 Z" fill="#a9bfc7" stroke="#6b4a35" strokeWidth=".8" />
      <path d="M-8.2,-11.4 L-5,-16 L-1.6,-11 L-4,-12.2 Z" fill="#fffaf0" />
      <path d="M3.7,-9.6 L6,-12 L8.6,-8.8 Z" fill="#fffaf0" />
    </>
  ),
  palm: (
    <>
      <path d="M0,0 Q2.5,-8 1,-15" fill="none" stroke="#8a5a3a" strokeWidth="1.6" strokeLinecap="round" />
      <ellipse cx="-4" cy="-15" rx="5" ry="1.8" transform="rotate(20 -4 -15)" fill="#5f9e66" />
      <ellipse cx="5" cy="-15" rx="5" ry="1.8" transform="rotate(-20 5 -15)" fill="#5f9e66" />
      <ellipse cx="1" cy="-17.5" rx="1.8" ry="4.5" fill="#5f9e66" />
    </>
  ),
  pine: (
    <>
      <path d="M-11,0 L-5.5,-14 L0,0 Z" fill="#4f9a6a" stroke="#3d6b48" strokeWidth=".7" />
      <path d="M-3,0 L3,-19 L9,0 Z" fill="#5aa874" stroke="#3d6b48" strokeWidth=".7" />
      <path d="M5,0 L9.5,-11 L14,0 Z" fill="#4f9a6a" stroke="#3d6b48" strokeWidth=".7" />
    </>
  ),
  temple: (
    <>
      <rect x="-9" y="-5" width="18" height="5" fill="#f0d6ae" stroke="#6b4a35" strokeWidth=".8" />
      <path d="M-6,-5 Q-6.5,-15 0,-23 Q6.5,-15 6,-5 Z" fill="#e8a46a" stroke="#6b4a35" strokeWidth=".8" />
      <line x1="-3.6" y1="-10" x2="3.6" y2="-10" stroke="#6b4a35" strokeWidth=".6" />
      <line x1="0" y1="-23" x2="0" y2="-28" stroke="#6b4a35" strokeWidth=".8" />
      <path d="M0,-28 L5,-26.6 L0,-25.2 Z" fill="#c4532f" />
    </>
  ),
  camel: (
    <>
      <path
        d="M-13,-7 Q-9,-16 -5,-9 Q-1,-16 3,-9 L7,-9 L9,-15 L13,-15 L13.5,-12.5 L11,-12 L9,-5 L-11,-5 Q-14,-5 -13,-7 Z"
        fill="#d9a865"
        stroke="#6b4a35"
        strokeWidth=".8"
        strokeLinejoin="round"
      />
      <path
        d="M-9,-5 V0 M-5,-5 V0 M3,-5 V0 M7,-5 V0"
        stroke="#6b4a35"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </>
  ),
  statue: (
    <>
      <rect x="-7" y="-3" width="14" height="3" fill="#d9b98a" stroke="#6b4a35" strokeWidth=".7" />
      <path d="M-3.2,-3 L-2.6,-19 L2.6,-19 L3.2,-3 Z" fill="#9a8f7c" stroke="#6b4a35" strokeWidth=".8" />
      <path d="M-2.6,-17 L-5,-11 M2.6,-17 L5,-11" stroke="#6b4a35" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="0" cy="-21.5" r="2.6" fill="#9a8f7c" stroke="#6b4a35" strokeWidth=".8" />
    </>
  ),
  palace: (
    <>
      <rect x="-12" y="-9" width="24" height="9" fill="#f3dca0" stroke="#6b4a35" strokeWidth=".8" />
      <path d="M-5,-9 Q-5.5,-17 0,-20 Q5.5,-17 5,-9 Z" fill="#e07a5f" stroke="#6b4a35" strokeWidth=".8" />
      <rect x="-14" y="-14" width="4.5" height="5" fill="#f3dca0" stroke="#6b4a35" strokeWidth=".7" />
      <path d="M-14,-14 Q-11.75,-19 -9.5,-14 Z" fill="#e07a5f" stroke="#6b4a35" strokeWidth=".7" />
      <rect x="9.5" y="-14" width="4.5" height="5" fill="#f3dca0" stroke="#6b4a35" strokeWidth=".7" />
      <path d="M9.5,-14 Q11.75,-19 14,-14 Z" fill="#e07a5f" stroke="#6b4a35" strokeWidth=".7" />
      <path d="M-2.5,0 V-4 Q0,-7 2.5,-4 V0 Z" fill="#6b4a35" />
    </>
  ),
  waterfall: (
    <>
      <path d="M-12,0 L-12,-15 L-3,-18 L-3,0 Z" fill="#a8957c" stroke="#6b4a35" strokeWidth=".8" />
      <path d="M3,-18 L12,-15 L12,0 L3,0 Z" fill="#a8957c" stroke="#6b4a35" strokeWidth=".8" />
      <rect x="-3" y="-18" width="6" height="18" fill="#cdeef5" stroke="#6b4a35" strokeWidth=".6" />
      <path d="M-1,-16 V-3 M1.5,-14 V-2" stroke="#ffffff" strokeWidth=".8" />
      <ellipse cx="0" cy="0" rx="8" ry="2.2" fill="#ffffff" />
    </>
  ),
  hills: (
    <>
      <path d="M-16,0 Q-8,-15 0,0 Z" fill="#86bf8e" stroke="#4f7f58" strokeWidth=".8" />
      <path d="M-5,0 Q5,-20 15,0 Z" fill="#6faa79" stroke="#4f7f58" strokeWidth=".8" />
      <path d="M1,-6 Q5,-10 9,-6" fill="none" stroke="#ffffff" strokeWidth=".8" strokeOpacity=".7" />
    </>
  ),
  tea: (
    <>
      <path d="M-15,0 Q0,-17 15,0 Z" fill="#6fae74" stroke="#4f7f58" strokeWidth=".8" />
      <path
        d="M-11,-3 Q0,-10 11,-3 M-7,-7 Q0,-12 7,-7"
        fill="none"
        stroke="#3f7a48"
        strokeWidth="1"
        strokeDasharray="2 1.5"
      />
    </>
  ),
  tree: (
    <>
      <line x1="0" y1="0" x2="0" y2="-8" stroke="#8a5a3a" strokeWidth="1.6" />
      <circle cx="0" cy="-12" r="6" fill="#6faa79" stroke="#4f7f58" strokeWidth=".8" />
      <circle cx="-6" cy="-6" r="4" fill="#86bf8e" stroke="#4f7f58" strokeWidth=".8" />
    </>
  ),
};
