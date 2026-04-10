"use client";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { Difficulty, Size, Frequency } from "../types/game";

interface SettingsPanelProps {
  difficulty: Difficulty; setDifficulty: (d: Difficulty) => void;
  bubbleSize: Size; setBubbleSize: (s: Size) => void;
  frequency: Frequency; setFrequency: (f: Frequency) => void;
  onClose: () => void;
}

export default function SettingsPanel({ difficulty, setDifficulty, bubbleSize, setBubbleSize, frequency, setFrequency, onClose }: SettingsPanelProps) {
  return (
    <motion.div 
      initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
      className="absolute bottom-0 left-0 w-full bg-neutral-900 border-t-4 border-white/20 p-8 rounded-t-[3rem] z-[100] shadow-[0_-10px_50px_rgba(0,0,0,0.8)]"
    >
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-4xl font-bold text-white">Ajustes Visuales</h2>
        <button onClick={onClose} className="p-3 bg-red-500 rounded-full text-white hover:bg-red-400">
          <X size={32} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Velocidad */}
        <div className="bg-black/50 p-6 rounded-3xl border border-white/10">
          <h3 className="text-2xl text-white font-bold mb-4">Velocidad</h3>
          <div className="flex gap-2">
            {(["Lento", "Normal", "Rápido"] as Difficulty[]).map(d => (
              <button key={d} onClick={() => setDifficulty(d)} className={`flex-1 py-4 rounded-2xl text-xl font-bold transition ${difficulty === d ? 'bg-cyan-500 text-black shadow-[0_0_20px_#22D3EE]' : 'bg-neutral-800 text-white'}`}>{d}</button>
            ))}
          </div>
        </div>

        {/* Tamaño */}
        <div className="bg-black/50 p-6 rounded-3xl border border-white/10">
          <h3 className="text-2xl text-white font-bold mb-4">Tamaño</h3>
          <div className="flex gap-2">
            {(["Mediano", "Grande", "Gigante"] as Size[]).map(s => (
              <button key={s} onClick={() => setBubbleSize(s)} className={`flex-1 py-4 rounded-2xl text-xl font-bold transition ${bubbleSize === s ? 'bg-pink-500 text-black shadow-[0_0_20px_#F472B6]' : 'bg-neutral-800 text-white'}`}>{s}</button>
            ))}
          </div>
        </div>

        {/* Cantidad */}
        <div className="bg-black/50 p-6 rounded-3xl border border-white/10">
          <h3 className="text-2xl text-white font-bold mb-4">Cantidad</h3>
          <div className="flex gap-2">
            {(["Pocas", "Intermedio", "Muchas"] as Frequency[]).map(f => (
              <button key={f} onClick={() => setFrequency(f)} className={`flex-1 py-4 rounded-2xl text-xl font-bold transition ${frequency === f ? 'bg-green-500 text-black shadow-[0_0_20px_#4ADE80]' : 'bg-neutral-800 text-white'}`}>{f}</button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}