"use client";
import { useRef } from "react";
import { motion } from "framer-motion";
import { BubbleData } from "../types/game";

interface BubbleProps {
  data: BubbleData;
  size: number;
  baseSpeed: number;
  levelSpeed: number;
  onInteract: (data: BubbleData, rect: DOMRect) => void;
  onComplete: () => void;
}

export default function Bubble({ data, size, baseSpeed, levelSpeed, onInteract, onComplete }: BubbleProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const duration = Math.max(3, baseSpeed - (levelSpeed * 0.5) + data.speedOffset);

  const handleClick = () => {
    if (buttonRef.current) onInteract(data, buttonRef.current.getBoundingClientRect());
  };

  return (
    <motion.button
      ref={buttonRef}
      data-bubble="true"
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
      // CORRECCIÓN: Quitamos el "opacity: 0" del initial. Ahora nacen 100% visibles.
      initial={{ y: "110vh", x: `${data.x}vw` }}
      animate={{ y: "-20vh" }}
      // El exit sí tiene opacidad para que desaparezcan suave si no las tocas
      exit={{ scale: 0, opacity: 0, transition: { duration: 0.2 } }}
      transition={{ duration, ease: "linear" }}
      onAnimationComplete={onComplete}
      className={`absolute rounded-full border-[10px] focus:outline-none focus:ring-8 focus:ring-white z-10 ${data.isSpecial ? "animate-pulse" : ""}`}
      style={{
        width: size, 
        height: size, 
        borderColor: data.color.hex,
        backgroundColor: `${data.color.hex}25`, 
        boxShadow: `
          inset 0 0 ${size/3}px ${data.color.hex}, 
          0 0 ${size/4}px ${data.color.hex},
          0 0 ${size/2}px ${data.color.hex}80,
          0 0 ${size}px ${data.color.hex}40
        `, 
      }}
      aria-label={`Burbuja ${data.color.name}`}
    >
      <div className="absolute top-[10%] left-[10%] w-[35%] h-[35%] bg-white/70 rounded-full blur-[4px]" />
      
      {data.isSpecial && (
        <div className="absolute inset-0 flex items-center justify-center text-white">
          <span className="text-5xl font-black drop-shadow-[0_0_15px_white]">+3</span>
        </div>
      )}
    </motion.button>
  );
}