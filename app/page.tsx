"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Settings, Play } from "lucide-react";

import { ColorType, COLORS, Difficulty, Size, Frequency, SIZES, FREQUENCIES, DIFFICULTIES } from "../types/game";
import { playSound } from "../utils/audio";
import SettingsPanel from "../components/SettingsPanel";

const CUSTOM_CURSOR = `url('data:image/svg+xml;utf8,<svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><circle cx="36" cy="36" r="8" fill="%23FF00FF" stroke="white" stroke-width="3"/><line x1="30" y1="30" x2="4" y2="4" stroke="white" stroke-width="6" stroke-linecap="round"/><line x1="30" y1="30" x2="4" y2="4" stroke="%2300FFFF" stroke-width="3" stroke-linecap="round"/></svg>') 4 4, crosshair`;

interface CanvasBubble { id: number; x: number; y: number; radius: number; color: ColorType; isSpecial: boolean; speed: number; wobbleOffset: number; }
interface CanvasParticle { x: number; y: number; vx: number; vy: number; radius: number; color: string; life: number; maxLife: number; }
interface CanvasText { x: number; y: number; text: string; color: string; life: number; }

export default function CanvasNeonBubbles() {
  const [gameStarted, setGameStarted] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>("Normal");
  const [bubbleSize, setBubbleSize] = useState<Size>("Grande");
  const [frequency, setFrequency] = useState<Frequency>("Intermedio");
  const [showSettings, setShowSettings] = useState(false);

  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [targetColor, setTargetColor] = useState<ColorType>(COLORS[0]);
  const [isShaking, setIsShaking] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const gameState = useRef({
    score: 0,
    level: 1,
    target: COLORS[0],
    bubbles: [] as CanvasBubble[],
    particles: [] as CanvasParticle[],
    texts: [] as CanvasText[],
    lastSpawn: 0,
    bubbleIdCounter: 0,
    width: 0,
    height: 0
  });

  const pickNewTarget = useCallback(() => {
    const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    setTargetColor(randomColor);
    gameState.current.target = randomColor;
  }, []);

  // SOLUCIÓN 1: Le damos un nombre interno "loop" a la función para que pueda llamarse a sí misma sin error
  const gameLoop = useCallback(function loop(time: number) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const state = gameState.current;

    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    ctx.fillRect(0, 0, state.width, state.height);

    const spawnRate = Math.max(300, FREQUENCIES[frequency] - (state.level * 80));
    if (time - state.lastSpawn > spawnRate && state.bubbles.length < 15 + state.level * 2) {
      const radius = SIZES[bubbleSize] / 2;
      const isSpecial = Math.random() > 0.85;
      const color = Math.random() > 0.3 ? state.target : COLORS[Math.floor(Math.random() * COLORS.length)];
      
      state.bubbles.push({
        id: state.bubbleIdCounter++,
        x: radius + Math.random() * (state.width - radius * 2),
        y: state.height + radius + 100,
        radius, color, isSpecial,
        speed: (DIFFICULTIES[difficulty] * 0.5) + (state.level * 0.2) + Math.random() * 2,
        wobbleOffset: Math.random() * Math.PI * 2
      });
      state.lastSpawn = time;
    }

    for (let i = state.bubbles.length - 1; i >= 0; i--) {
      const b = state.bubbles[i];
      b.y -= b.speed;
      b.x += Math.sin(time * 0.002 + b.wobbleOffset) * 1.5;

      if (b.y < -b.radius) {
        state.bubbles.splice(i, 1);
        continue;
      }

      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fillStyle = `${b.color.hex}25`;
      ctx.fill();

      ctx.lineWidth = 10;
      ctx.strokeStyle = b.color.hex;
      ctx.shadowBlur = 30;
      ctx.shadowColor = b.color.hex;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(b.x - b.radius * 0.3, b.y - b.radius * 0.3, b.radius * 0.3, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
      ctx.shadowBlur = 10;
      ctx.shadowColor = "white";
      ctx.fill();

      if (b.isSpecial) {
        ctx.fillStyle = "white";
        ctx.font = "bold 40px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("x3", b.x, b.y);
      }
    }

    ctx.shadowBlur = 15;
    for (let i = state.particles.length - 1; i >= 0; i--) {
      const p = state.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.3;
      p.life--;

      if (p.life <= 0) {
        state.particles.splice(i, 1);
        continue;
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(0.1, p.radius * (p.life / p.maxLife)), 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.fill();
    }

    ctx.shadowBlur = 0;
    for (let i = state.texts.length - 1; i >= 0; i--) {
      const t = state.texts[i];
      t.y -= 2;
      t.life--;

      if (t.life <= 0) {
        state.texts.splice(i, 1);
        continue;
      }

      ctx.fillStyle = t.color;
      ctx.font = "900 60px Arial";
      ctx.textAlign = "center";
      ctx.globalAlpha = Math.max(0, t.life / 60);
      ctx.fillText(t.text, t.x, t.y);
      ctx.strokeStyle = "white";
      ctx.lineWidth = 2;
      ctx.strokeText(t.text, t.x, t.y);
      ctx.globalAlpha = 1;
    }

    // Usamos el nombre interno de la función para el frame siguiente
    requestRef.current = requestAnimationFrame(loop);
  }, [frequency, difficulty, bubbleSize]);

  const handleCanvasInteraction = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    
    const dpr = window.devicePixelRatio || 1;
    const x = (clientX - rect.left) * (canvas.width / rect.width / dpr);
    const y = (clientY - rect.top) * (canvas.height / rect.height / dpr);

    const state = gameState.current;
    
    for (let i = state.bubbles.length - 1; i >= 0; i--) {
      const b = state.bubbles[i];
      const dist = Math.hypot(b.x - x, b.y - y);
      
      if (dist < b.radius + 20) {
        state.bubbles.splice(i, 1);

        for (let j = 0; j < 60; j++) {
          const angle = Math.random() * Math.PI * 2;
          const power = Math.random() * 15;
          state.particles.push({
            x: b.x, y: b.y,
            vx: Math.cos(angle) * power, vy: Math.sin(angle) * power,
            radius: Math.random() * 8 + 4, color: b.color.hex,
            life: 60 + Math.random() * 20, maxLife: 80
          });
        }

        if (b.color.id === state.target.id) {
          const points = b.isSpecial ? 30 : 10;
          state.score += points;
          setScore(state.score);
          
          state.texts.push({ x: b.x, y: b.y, text: `+${points}`, color: b.color.hex, life: 60 });
          playSound(b.isSpecial ? "special" : "correct");

          // AQUÍ ES DONDE CAMBIAS LOS PUNTOS PARA SUBIR DE NIVEL (Actualmente en 100)
          const expectedLevel = Math.floor(state.score / 300) + 1;
          
          if (expectedLevel > state.level) {
            state.level = expectedLevel;
            setLevel(expectedLevel);
            pickNewTarget();
            setShowLevelUp(true);
            playSound("levelup");
            setTimeout(() => setShowLevelUp(false), 2500);
          }
        } else {
          state.score = Math.max(0, state.score - 10);
          setScore(state.score);
          playSound("error");
          state.texts.push({ x: b.x, y: b.y, text: "-10", color: "#FF0000", life: 60 });
          
          setIsShaking(true);
          setIsFlashing(true);
          setTimeout(() => { setIsShaking(false); setIsFlashing(false); }, 300);
        }
        break;
      }
    }
  };

  useEffect(() => {
    if (!gameStarted) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      gameState.current.width = canvas.width;
      gameState.current.height = canvas.height;
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.scale(dpr, dpr);
    };

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    requestRef.current = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(requestRef.current);
    };
  }, [gameStarted, gameLoop]);

  const handleStartGame = async () => {
    const isMobile = typeof window !== "undefined" && (window.innerWidth <= 1024 || navigator.maxTouchPoints > 0);
    if (isMobile) {
      try {
        const el = document.documentElement;
        if (el.requestFullscreen) await el.requestFullscreen();
        
        // SOLUCIÓN 2: Apagamos el error de TypeScript para la API experimental de rotación
        // ts-expect-error - La API lock es experimental y falla en algunas versiones de TypeScript
        if (screen.orientation && screen.orientation.lock) {
          // ts-expect-error - Apagamos el error en el método también
          await screen.orientation.lock("landscape").catch(() => console.log("Rotación manual requerida"));
        }
      } catch { console.log("No se pudo forzar pantalla completa."); }
    }
    
    gameState.current = { score: 0, level: 1, target: COLORS[0], bubbles: [], particles: [], texts: [], lastSpawn: performance.now(), bubbleIdCounter: 0, width: window.innerWidth, height: window.innerHeight };
    setScore(0); setLevel(1); setGameStarted(true);
  };

  const handleExitGame = async () => {
    setGameStarted(false);
    try { if (document.fullscreenElement) await document.exitFullscreen(); } catch { console.log("Error al salir"); }
  };

  if (!gameStarted) {
    return (
      <div className="w-screen h-screen bg-black flex flex-col items-center justify-center space-y-12 select-none">
        <style dangerouslySetInnerHTML={{__html: `body { cursor: ${CUSTOM_CURSOR}; } button { cursor: ${CUSTOM_CURSOR} !important; }`}} />
        <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-pink-500 to-yellow-400 animate-pulse text-center px-4">
          BURBUJAS NEÓN
        </h1>
        <p className="text-white text-xl md:text-2xl text-center px-4">
          Motor Gráfico de Alta Velocidad Integrado.
        </p>
        <button onClick={handleStartGame} className="flex items-center gap-4 bg-white/10 hover:bg-white/20 border-4 border-green-400 text-green-400 text-4xl md:text-5xl font-bold py-6 px-12 rounded-[3rem] shadow-[0_0_40px_rgba(74,222,128,0.5)] transition-all transform hover:scale-110 active:scale-95">
          <Play size={48} /> JUGAR
        </button>
      </div>
    );
  }

  return (
    <div className={`relative w-screen h-screen overflow-hidden select-none ${isShaking ? "animate-[shake_0.3s_ease-in-out]" : ""} ${isFlashing ? "bg-red-950" : "bg-black"} transition-colors duration-100`} style={{ touchAction: "none" }}>
      
      <style dangerouslySetInnerHTML={{__html: `
        body { cursor: ${CUSTOM_CURSOR}; overflow: hidden; margin: 0; padding: 0; }
        button { cursor: ${CUSTOM_CURSOR} !important; }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-15px); } 50% { transform: translateX(15px); } 75% { transform: translateX(-15px); } }
      `}} />

      <canvas 
        ref={canvasRef} 
        className="absolute top-0 left-0 w-full h-full z-0 pointer-events-auto"
        onPointerDown={(e) => handleCanvasInteraction(e.clientX, e.clientY)}
      />

      <header className="absolute top-0 left-0 w-full p-4 md:p-6 flex justify-between items-start z-50 pointer-events-none">
        <button onClick={handleExitGame} className="pointer-events-auto text-white flex items-center gap-2 text-xl md:text-2xl font-bold bg-white/10 p-3 md:p-4 rounded-3xl backdrop-blur-md border border-white/20 hover:bg-white/20 transition">
          <ArrowLeft size={32} /> <span className="hidden md:inline">Atrás</span>
        </button>

        <div className="flex flex-col items-center pointer-events-auto bg-black/50 p-3 md:p-4 rounded-3xl border-2 shadow-2xl transition-all duration-300" style={{ borderColor: targetColor.hex, boxShadow: `0 0 30px ${targetColor.hex}40` }}>
          <span className="text-white text-xl md:text-3xl font-bold">Nivel {level}</span>
          <h1 className="text-3xl md:text-6xl font-extrabold uppercase tracking-widest mt-1 md:mt-2 transition-all duration-300" style={{ color: targetColor.hex, textShadow: `0 0 20px ${targetColor.hex}` }}>
            Toca las {targetColor.name}
          </h1>
        </div>

        <div className="pointer-events-auto bg-black/50 p-3 md:p-4 rounded-3xl border-2 border-[#FACC15] flex flex-col items-center min-w-[100px] md:min-w-[150px]" style={{ boxShadow: "0 0 30px rgba(250, 204, 21, 0.3)" }}>
          <span className="text-[#FACC15] text-sm md:text-xl font-bold uppercase">Puntos</span>
          <span className="text-4xl md:text-6xl font-black text-[#FACC15] transition-all" style={{ textShadow: "0 0 20px #FACC15" }}>{score}</span>
        </div>
      </header>

      <AnimatePresence>
        {showLevelUp && (
          <motion.div 
            initial={{ scale: 0, opacity: 0, rotate: -10 }} animate={{ scale: 1, opacity: 1, rotate: 0 }} exit={{ scale: 2, opacity: 0 }} transition={{ type: "spring", bounce: 0.5, duration: 0.8 }}
            className="absolute inset-0 flex flex-col items-center justify-center z-[80] bg-black/60 backdrop-blur-sm pointer-events-none"
          >
            <h2 className="text-7xl md:text-[10rem] font-black text-white drop-shadow-[0_0_30px_#FFF] uppercase tracking-tighter text-center">¡NIVEL {level}!</h2>
            <p className="text-3xl md:text-4xl text-yellow-400 font-bold mt-4 animate-pulse">¡Más rápido!</p>
          </motion.div>
        )}
      </AnimatePresence>

      <button onClick={() => setShowSettings(true)} className="absolute bottom-6 right-6 z-50 bg-white/10 p-4 rounded-full text-white backdrop-blur-md border border-white/20 hover:bg-white/30 transition shadow-xl">
        <Settings size={40} />
      </button>
      
      <AnimatePresence>
        {showSettings && (
          <SettingsPanel difficulty={difficulty} setDifficulty={setDifficulty} bubbleSize={bubbleSize} setBubbleSize={setBubbleSize} frequency={frequency} setFrequency={setFrequency} onClose={() => setShowSettings(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}