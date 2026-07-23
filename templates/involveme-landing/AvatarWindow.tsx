"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Robot } from "./Dog";

interface AvatarWindowProps {
  autoOpen?: boolean;
  demoText?: string;
}

export const AvatarWindow: React.FC<AvatarWindowProps> = ({
  autoOpen = true,
  demoText = "Hey there! I'm the Bedrock.fit strength assistant. Input your stats and I'll help you discover your athletic potential. Click the button to start!",
}) => {
  const [isOpen, setIsOpen] = useState(autoOpen);
  const [position, setPosition] = useState(() => ({
    x: typeof window === "undefined" ? 0 : window.innerWidth - 380,
    y: 100,
  }));
  useEffect(() => {
    // position off-screen-safe after mount (SSR renders with x=0)
    setPosition((p) => (p.x === 0 ? { x: window.innerWidth - 380, y: 100 } : p));
  }, []);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [expression, setExpression] = useState<"idle" | "listening" | "speaking" | "thinking">("idle");
  const [mouthShape, setMouthShape] = useState(0);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [userVisible, setUserVisible] = useState(true);
  const [useCameraDetection, setUseCameraDetection] = useState(false);

  const windowRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Load position from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("avatarWindowPos");
    if (saved) {
      try {
        setPosition(JSON.parse(saved));
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  // Save position to localStorage
  const savePosition = useCallback((pos: { x: number; y: number }) => {
    localStorage.setItem("avatarWindowPos", JSON.stringify(pos));
  }, []);

  // Handle dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("[data-no-drag]")) return;
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newPos = {
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      };
      setPosition(newPos);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      savePosition(position);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragOffset, position, savePosition]);

  // Initialize camera for face detection
  const initCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraEnabled(true);
        setUseCameraDetection(true);
      }
    } catch (err) {
      console.log("Camera permission denied or not available");
      setCameraEnabled(false);
    }
  }, []);

  // Simple face detection using canvas pixel analysis
  // (lightweight alternative to TensorFlow for MVP)
  const detectFace = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !cameraEnabled) return true;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return true;

    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    ctx.drawImage(videoRef.current, 0, 0);

    // Simple face detection: check for skin tone distribution
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    let skinPixels = 0;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Simple skin tone detection
      if (r > 95 && g > 40 && b > 20 && r > b && r > g && Math.abs(r - g) > 15) {
        skinPixels++;
      }
    }

    const faceThreshold = (canvas.width * canvas.height * data.length / 4) * 0.1;
    return skinPixels > faceThreshold;
  }, [cameraEnabled]);

  // Pause/resume TTS based on camera detection
  useEffect(() => {
    if (!useCameraDetection) return;

    const checkInterval = setInterval(() => {
      const faceDetected = detectFace();
      setUserVisible(faceDetected);

      if (utteranceRef.current && isSpeaking) {
        if (!faceDetected && !speechSynthesis.paused) {
          speechSynthesis.pause();
        } else if (faceDetected && speechSynthesis.paused) {
          speechSynthesis.resume();
        }
      }
    }, 500);

    return () => clearInterval(checkInterval);
  }, [isSpeaking, useCameraDetection, detectFace]);

  // Speak text
  const speak = (text: string) => {
    if (isSpeaking) {
      speechSynthesis.cancel();
    }

    setExpression("thinking");
    setMouthShape(0);

    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1;
      utterance.pitch = 1.2;

      utterance.onstart = () => {
        setExpression("speaking");
        setIsSpeaking(true);
      };

      utterance.onend = () => {
        setExpression("idle");
        setMouthShape(0);
        setIsSpeaking(false);
      };

      utteranceRef.current = utterance;
      speechSynthesis.speak(utterance);
    }, 500);
  };

  const handlePlayClick = () => {
    speak(demoText);
  };

  const toggleCamera = () => {
    if (cameraEnabled) {
      const stream = videoRef.current?.srcObject as MediaStream;
      stream?.getTracks().forEach((track) => track.stop());
      setCameraEnabled(false);
      setUseCameraDetection(false);
    } else {
      initCamera();
    }
  };

  const toggleWindow = () => {
    setIsOpen(!isOpen);
  };

  const closeWindow = () => {
    setIsOpen(false);
    if (isSpeaking) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={toggleWindow}
        style={{
          position: "fixed",
          bottom: 20,
          right: 20,
          width: 60,
          height: 60,
          borderRadius: "50%",
          border: "2px solid #4dff4d",
          background: "#0a0f0a",
          color: "#4dff4d",
          fontSize: 28,
          cursor: "pointer",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: "bold",
          boxShadow: "0 0 12px rgba(77,255,77,0.3)",
          transition: "all 0.3s ease",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.boxShadow = "0 0 20px rgba(77,255,77,0.6)";
          (e.currentTarget as HTMLElement).style.transform = "scale(1.1)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.boxShadow = "0 0 12px rgba(77,255,77,0.3)";
          (e.currentTarget as HTMLElement).style.transform = "scale(1)";
        }}
      >
        🐕
      </button>
    );
  }

  return (
    <>
      {/* Floating Window */}
      <div
        ref={windowRef}
        onMouseDown={handleMouseDown}
        style={{
          position: "fixed",
          left: `${position.x}px`,
          top: `${position.y}px`,
          width: 360,
          borderRadius: 16,
          background: "#050705",
          border: "1.5px solid #4dff4d",
          boxShadow: "0 8px 32px rgba(77,255,77,0.15), 0 0 20px rgba(77,255,77,0.1)",
          zIndex: 10000,
          fontFamily: "var(--font-archivo), sans-serif",
          color: "#e6f4e6",
          userSelect: "none",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 16px",
            borderBottom: "1px solid rgba(77,255,77,0.2)",
            background: "rgba(10,15,10,0.8)",
            borderTopLeftRadius: 14,
            borderTopRightRadius: 14,
            cursor: "grab",
          }}
          data-no-drag={false}
        >
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".08em", color: "#4dff4d", textTransform: "uppercase" }}>
            Strength Bot
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleCamera();
              }}
              style={{
                background: useCameraDetection ? "#4dff4d" : "transparent",
                color: useCameraDetection ? "#04120b" : "#4dff4d",
                border: `1px solid #4dff4d`,
                borderRadius: 6,
                padding: "4px 8px",
                fontSize: 11,
                cursor: "pointer",
                fontWeight: 700,
              }}
              data-no-drag={true}
            >
              📹
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                closeWindow();
              }}
              style={{
                background: "transparent",
                color: "#4dff4d",
                border: "1px solid rgba(77,255,77,0.4)",
                borderRadius: 6,
                padding: "4px 8px",
                fontSize: 11,
                cursor: "pointer",
                fontWeight: 700,
              }}
              data-no-drag={true}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div
          style={{
            padding: "20px",
            textAlign: "center",
          }}
          data-no-drag={true}
        >
          {/* Avatar */}
          <div style={{ marginBottom: 16 }}>
            <Robot expression={expression} mouthShape={mouthShape} scale={1.2} />
          </div>

          {/* Status */}
          <div style={{ fontSize: 12, color: "#9bb69b", marginBottom: 12, minHeight: 16 }}>
            {!cameraEnabled && !useCameraDetection && "Camera off"}
            {useCameraDetection && userVisible && "👁️ Looking..."}
            {useCameraDetection && !userVisible && "⏸️ Away from camera"}
            {isSpeaking && "🗣️ Speaking"}
          </div>

          {/* Play Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePlayClick();
            }}
            style={{
              width: "100%",
              background: "#4dff4d",
              color: "#04120b",
              border: "none",
              borderRadius: 10,
              padding: "12px 16px",
              fontSize: 13,
              fontWeight: 900,
              cursor: "pointer",
              letterSpacing: ".05em",
              textTransform: "uppercase",
              transition: "all 0.2s ease",
              marginTop: 8,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow = "0 0 16px rgba(77,255,77,0.4)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow = "none";
            }}
            data-no-drag={true}
          >
            {isSpeaking ? "Playing..." : "Play Audio"}
          </button>
        </div>
      </div>

      {/* Hidden video for face detection */}
      {useCameraDetection && (
        <>
          <video ref={videoRef} style={{ display: "none" }} autoPlay muted playsInline />
          <canvas ref={canvasRef} style={{ display: "none" }} />
        </>
      )}
    </>
  );
};
