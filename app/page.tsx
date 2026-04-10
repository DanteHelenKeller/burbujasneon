"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Settings, Play } from "lucide-react";

import { ColorType, BubbleData, ParticleData, FloatingTextData, Difficulty, Size, Frequency, COLORS, SIZES, FREQUENCIES, DIFFICULTIES } from "../types/game";
import { playSound } from "../utils/audio";
import Bubble from "../components/Bubble";
import ParticleExplosion from "../components/Particle";
import SettingsPanel from "../components/SettingsPanel";
import FloatingText from "../components/FloatingText";

const CUSTOM_CURSOR = `url('data:image/svg+xml;utf8,<svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><circle cx="36" cy="36" r="8" fill="%23FF00FF" stroke="white" stroke-width="3"/><line x1="30" y1="30" x2="4" y2="4" stroke="white" stroke-width="6" stroke-linecap="round"/><line x1="30" y1="30" x2="4" y2="4" stroke="%2300FFFF" stroke-width="3" stroke-linecap="round"/></svg>') 4 4, crosshair`;

export default function NeonBubblesGame() {
  const [gameStarted, setGameStarted] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>("Normal");
  const [bubbleSize, setBubbleSize] = useState<Size>("Grande");
  const [frequency, setFrequency] = useState<Frequency>("Intermedio");
  const [showSettings, setShowSettings] = useState(false);

  // Estados visuales (Lo que ve el jugador)
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [showLevelUp, setShowLevelUp] = useState(false);
  
  // Memoria instantánea (Lo que usa la lógica para no equivocarse)
  const scoreRef = useRef(0);
  const levelRef = useRef(1);

  const [targetColor, setTargetColor] = useState<ColorType>(COLORS[0]);
  const [bubbles, setBubbles] = useState<BubbleData[]>([]);
  const [explosions, setExplosions] = useState<ParticleData[]>([]);
  const [floatingTexts, setFloatingTexts] = useState<FloatingTextData[]>([]);
  
  const [isShaking, setIsShaking] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);

  const handleStartGame = async () => {
    const isMobile = typeof window !== "undefined" && (window.innerWidth <= 1024 || navigator.maxTouchPoints > 0);
    if (isMobile) {
      try {
        const el = document.documentElement;
        if (el.requestFullscreen) await el.requestFullscreen();
        if (screen.orientation && screen.orientation.lock) {
          await screen.orientation.lock("landscape").catch(() => console.log("Rotación manual requerida"));
        }
      } catch (error) {
        console.log("No se pudo forzar pantalla completa.");
      }
    }
    
    // Reiniciamos memoria matemática y visual
    scoreRef.current = 0;
    levelRef.current = 1;
    setScore(0);
    setLevel(1);
    setBubbles([]);
    setGameStarted(true);
  };

  const handleExitGame = async () => {
    setGameStarted(false);
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
    } catch (error) {
      console.log("Error al salir de pantalla completa");
    }
  };

  const pickNewTarget = useCallback(() => {
    const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    setTargetColor(randomColor);
  }, []);

  // --- GENERADOR DE BURBUJAS ---
  useEffect(() => {
    if (showSettings || !gameStarted || showLevelUp) return;
    
    const spawnRate = Math.max(400, FREQUENCIES[frequency] - (level * 100));
    const maxBubbles = 10 + level * 2;

    const interval = setInterval(() => {
      setBubbles((prev) => {
        if (prev.length > maxBubbles) return prev;
        const color = Math.random() > 0.3 ? targetColor : COLORS[Math.floor(Math.random() * COLORS.length)];
        return [...prev, {
          id: Math.random().toString(36).substring(2, 9),
          color, x: Math.random() * 80 + 10,
          isSpecial: Math.random() > 0.85,
          speedOffset: Math.random() * 2 - 1,
        }];
      });
    }, spawnRate);
    return () => clearInterval(interval);
  }, [targetColor, frequency, level, showSettings, gameStarted, showLevelUp]);

  // --- LÓGICA DE INTERACCIÓN (Ahora usa Refs para máxima velocidad y precisión) ---
  const handleInteraction = (bubble: BubbleData, rect: DOMRect) => {
    setBubbles(p => p.filter(b => b.id !== bubble.id));

    const x = rect.left + rect.width / 2 - 20;
    const y = rect.top + rect.height / 2;
    const effectId = Math.random().toString(36).substring(2, 10);

    if (bubble.color.id === targetColor.id) {
      const points = bubble.isSpecial ? 30 : 10;
      
      // 1. Sumamos a la memoria instantánea
      scoreRef.current += points;
      // 2. Le avisamos a React que dibuje el nuevo puntaje
      setScore(scoreRef.current);
      
      // Calculamos el nivel matemáticamente en el mismo instante
      const expectedLevel = Math.floor(scoreRef.current / 100) + 1;
      
      if (expectedLevel > levelRef.current) {
        // ¡SUBIÓ DE NIVEL! Actualizamos memoria y pantalla sin errores.
        levelRef.current = expectedLevel;
        setLevel(expectedLevel);
        pickNewTarget();
        setShowLevelUp(true);
        playSound("levelup");
        setTimeout(() => setShowLevelUp(false), 2500);
      } else {
        playSound(bubble.isSpecial ? "special" : "correct");
      }

      setFloatingTexts(p => [...p, { id: effectId, x, y, text: `+${points}`, color: bubble.color.hex }]);
      setExplosions(p => [...p, { id: effectId, x, y, color: bubble.color.hex }]);
      
      setTimeout(() => {
        setExplosions(p => p.filter(e => e.id !== effectId));
        setFloatingTexts(p => p.filter(t => t.id !== effectId));
      }, 1000);

    } else {
      // Restamos puntos asegurando que no baje de 0
      scoreRef.current = Math.max(0, scoreRef.current - 10);
      setScore(scoreRef.current);
      playSound("error");
      
      setFloatingTexts(p => [...p, { id: effectId, x, y, text: "-10", color: "#EF4444" }]);
      setIsShaking(true); 
      setIsFlashing(true);
      
      setTimeout(() => { setIsShaking(false); setIsFlashing(false); }, 300);
      setTimeout(() => setFloatingTexts(p => p.filter(t => t.id !== effectId)), 800);
    }
  };

  if (!gameStarted) {
    return (
      <div className="w-screen h-screen bg-black flex flex-col items-center justify-center space-y-12 select-none">
        <style dangerouslySetInnerHTML={{__html: `body { cursor: ${CUSTOM_CURSOR}; } button { cursor: ${CUSTOM_CURSOR} !important; }`}} />
        
        <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-pink-500 to-yellow-400 animate-pulse text-center px-4">
          BURBUJAS NEÓN
        </h1>
        <p className="text-white text-xl md:text-2xl text-center px-4">
          Estimulación visual de alto contraste.
        </p>
        <button 
          onClick={handleStartGame}
          className="flex items-center gap-4 bg-white/10 hover:bg-white/20 border-4 border-green-400 text-green-400 text-4xl md:text-5xl font-bold py-6 px-12 rounded-[3rem] shadow-[0_0_40px_rgba(74,222,128,0.5)] transition-all transform hover:scale-110 active:scale-95"
        >
          <Play size={48} /> JUGAR
        </button>
      </div>
    );
  }

  return (
    <div className={`relative w-screen h-screen overflow-hidden bg-black select-none ${isShaking ? "animate-[shake_0.3s_ease-in-out]" : ""} ${isFlashing ? "bg-red-950" : "bg-black"} transition-colors duration-100`} style={{ touchAction: "none" }}>
      
      <style dangerouslySetInnerHTML={{__html: `
        body { cursor: ${CUSTOM_CURSOR}; }
        button { cursor: ${CUSTOM_CURSOR} !important; }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-15px); } 50% { transform: translateX(15px); } 75% { transform: translateX(-15px); } }
      `}} />

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
            initial={{ scale: 0, opacity: 0, rotate: -10 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 2, opacity: 0 }}
            transition={{ type: "spring", bounce: 0.5, duration: 0.8 }}
            className="absolute inset-0 flex flex-col items-center justify-center z-[80] bg-black/60 backdrop-blur-sm pointer-events-none"
          >
            <h2 className="text-7xl md:text-[10rem] font-black text-white drop-shadow-[0_0_30px_#FFF] uppercase tracking-tighter text-center">
              ¡NIVEL {level}!
            </h2>
            <p className="text-3xl md:text-4xl text-yellow-400 font-bold mt-4 animate-pulse">¡Más rápido!</p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {bubbles.map((bubble) => (
          <Bubble key={bubble.id} data={bubble} size={SIZES[bubbleSize]} baseSpeed={DIFFICULTIES[difficulty]} levelSpeed={level} onInteract={handleInteraction} onComplete={() => setBubbles((p) => p.filter((b) => b.id !== bubble.id))} />
        ))}
      </AnimatePresence>
      
      {explosions.map((exp) => <ParticleExplosion key={exp.id} x={exp.x} y={exp.y} color={exp.color} />)}
      {floatingTexts.map((ft) => <FloatingText key={ft.id} x={ft.x} y={ft.y} text={ft.text} color={ft.color} />)}

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