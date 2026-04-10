"use client";
import { motion } from "framer-motion";

interface FloatingTextProps {
  x: number;
  y: number;
  text: string;
  color: string;
}

export default function FloatingText({ x, y, text, color }: FloatingTextProps) {
  return (
    <motion.div
      initial={{ x, y, opacity: 1, scale: 0.5 }}
      animate={{ y: y - 100, opacity: 0, scale: 1.5 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="absolute z-50 font-black text-5xl pointer-events-none drop-shadow-[0_0_10px_rgba(0,0,0,0.8)]"
      style={{ color, textShadow: `0 0 20px ${color}` }}
    >
      {text}
    </motion.div>
  );
}