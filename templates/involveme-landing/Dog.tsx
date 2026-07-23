"use client";

import React, { useState, useEffect } from "react";

interface RobotProps {
  expression: "idle" | "listening" | "speaking" | "thinking";
  mouthShape?: number; // 0-1, where 0 is closed, 1 is wide open
  scale?: number;
}

export const Robot: React.FC<RobotProps> = ({ expression, mouthShape = 0, scale = 1 }) => {
  const [blink, setBlink] = useState(false);

  // Blink animation
  useEffect(() => {
    if (expression === "idle") {
      const blinkInterval = setInterval(() => {
        setBlink((prev) => !prev);
      }, 3000 + Math.random() * 2000);
      const resetTimeout = setTimeout(() => setBlink(false), 100);
      return () => {
        clearInterval(blinkInterval);
        clearTimeout(resetTimeout);
      };
    }
  }, [expression]);

  const eyeOpacity = blink ? 0 : 1;
  const antennaRotation = expression === "listening" ? -10 : expression === "speaking" ? 5 : 0;

  // Mouth opening
  const mouthY = 85 + mouthShape * 6;

  return (
    <svg
      viewBox="0 0 120 160"
      width={80 * scale}
      height={110 * scale}
      style={{
        filter: expression === "thinking" ? "drop-shadow(0 0 10px rgba(77,255,77,0.4))" : "none",
        transition: "all 0.3s ease",
      }}
    >
      {/* Left antenna */}
      <g transform={`translate(40, 15) rotate(${antennaRotation})`}>
        <line x1="0" y1="0" x2="0" y2="-20" stroke="#4dff4d" strokeWidth="2" strokeLinecap="round" />
        <circle cx="0" cy="-22" r="3" fill="#4dff4d" />
      </g>

      {/* Right antenna */}
      <g transform={`translate(80, 15) rotate(${-antennaRotation})`}>
        <line x1="0" y1="0" x2="0" y2="-20" stroke="#4dff4d" strokeWidth="2" strokeLinecap="round" />
        <circle cx="0" cy="-22" r="3" fill="#4dff4d" />
      </g>

      {/* Head */}
      <rect x="30" y="20" width="60" height="65" rx="6" fill="#0a0f0a" stroke="#4dff4d" strokeWidth="2" />

      {/* Left eye */}
      <g opacity={eyeOpacity} style={{ transition: "opacity 0.1s" }}>
        <rect x="40" y="35" width="12" height="12" rx="2" fill="none" stroke="#4dff4d" strokeWidth="1.5" />
        <circle cx="46" cy="41" r="4" fill="#4dff4d" />
      </g>

      {/* Right eye */}
      <g opacity={eyeOpacity} style={{ transition: "opacity 0.1s" }}>
        <rect x="68" y="35" width="12" height="12" rx="2" fill="none" stroke="#4dff4d" strokeWidth="1.5" />
        <circle cx="74" cy="41" r="4" fill="#4dff4d" />
      </g>

      {/* Mouth */}
      <line x1="42" y1={mouthY} x2="78" y2={mouthY} stroke="#4dff4d" strokeWidth="2" strokeLinecap="round" />

      {/* Mouth opening indicator */}
      {mouthShape > 0.2 && (
        <rect x="50" y={mouthY} width="20" height={mouthShape * 4} fill="#4dff4d" opacity={mouthShape * 0.3} rx="1" />
      )}

      {/* Body */}
      <rect x="28" y="90" width="64" height="55" rx="6" fill="#0a0f0a" stroke="#4dff4d" strokeWidth="2" />

      {/* Chest panel */}
      <rect x="40" y="100" width="40" height="30" fill="none" stroke="#4dff4d" strokeWidth="1" opacity="0.5" rx="3" />

      {/* Left arm */}
      <g style={{ animation: expression === "speaking" ? "armWave 0.6s ease-in-out infinite" : "none" }}>
        <rect x="15" y="105" width="13" height="25" rx="6" fill="#0a0f0a" stroke="#4dff4d" strokeWidth="2" />
        <circle cx="21.5" cy="135" r="5" fill="#4dff4d" opacity="0.6" />
      </g>

      {/* Right arm */}
      <g style={{ animation: expression === "speaking" ? "armWave 0.6s ease-in-out 0.2s infinite" : "none" }}>
        <rect x="92" y="105" width="13" height="25" rx="6" fill="#0a0f0a" stroke="#4dff4d" strokeWidth="2" />
        <circle cx="98.5" cy="135" r="5" fill="#4dff4d" opacity="0.6" />
      </g>

      {/* Left leg */}
      <rect x="38" y="148" width="10" height="20" rx="5" fill="#0a0f0a" stroke="#4dff4d" strokeWidth="1.5" />

      {/* Right leg */}
      <rect x="72" y="148" width="10" height="20" rx="5" fill="#0a0f0a" stroke="#4dff4d" strokeWidth="1.5" />

      {/* Thinking indicator (pulses) */}
      {expression === "thinking" && (
        <g>
          <circle cx="105" cy="50" r="2" fill="#4dff4d" style={{ animation: "pulse 1s ease-in-out infinite" }} />
          <circle cx="110" cy="65" r="1.5" fill="#4dff4d" style={{ animation: "pulse 1s ease-in-out 0.3s infinite" }} />
          <circle cx="107" cy="78" r="1.2" fill="#4dff4d" style={{ animation: "pulse 1s ease-in-out 0.6s infinite" }} />
        </g>
      )}

      <style>{`
        @keyframes armWave {
          0%, 100% { transform: translateY(0) rotateZ(0deg); }
          50% { transform: translateY(-8px) rotateZ(-15deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.3; r: 2px; }
          50% { opacity: 0.8; r: 3px; }
        }
      `}</style>
    </svg>
  );
};
