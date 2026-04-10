"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface ParticleExplosionProps {
  x: number;
  y: number;
  color: string;
}

export default function ParticleExplosion({ x, y, color }: ParticleExplosionProps) {
  // Calculamos TODO lo aleatorio aquí adentro para que React no se queje
  const [particles] = useState(() => {
    return Array.from({ length: 15 }).map(() => {
      const angle = Math.random() * 360;
      const velocity = 80 + Math.random() * 150;
      const size = 15 + Math.random() * 25;
      const duration = 0.5 + Math.random() * 0.4; // <--- Ahora se calcula aquí
      return {
        x: Math.cos((angle * Math.PI) / 180) * velocity,
        y: Math.sin((angle * Math.PI) / 180) * velocity,
        size,
        duration // Guardamos la duración para usarla abajo
      };
    });
  });

  return (
    <div 
      className="absolute top-0 left-0 pointer-events-none z-20" 
      style={{ transform: `translate(${x}px, ${y}px)` }}
    >
      {/* ONDA EXPANSIVA (Anillo de choque) */}
      <motion.div
        initial={{ scale: 0.2, opacity: 1, borderWidth: "20px" }}
        animate={{ scale: 3, opacity: 0, borderWidth: "2px" }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="absolute top-[-50px] left-[-50px] rounded-full border-solid"
        style={{ 
          width: 100, 
          height: 100, 
          borderColor: color, 
          boxShadow: `0 0 30px ${color}, inset 0 0 20px ${color}` 
        }}
      />

      {/* CHISPAS / PEDACITOS DE BURBUJA */}
      {particles.map((p, i) => (
        <motion.div
          key={i}
          initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
          animate={{ 
            x: p.x, 
            y: p.y + 60, // Simula un poquito de gravedad cayendo al final
            scale: 0, 
            opacity: 0 
          }}
          transition={{ 
            duration: p.duration, // <--- Usamos el valor guardado
            ease: "easeOut" 
          }}
          className="absolute rounded-full"
          style={{ 
            width: p.size, 
            height: p.size, 
            backgroundColor: color, 
            boxShadow: `0 0 20px ${color}`,
            marginTop: -(p.size / 2),
            marginLeft: -(p.size / 2)
          }}
        />
      ))}
    </div>
  );
}