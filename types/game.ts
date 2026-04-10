export type ColorType = { id: string; name: string; hex: string };
export type BubbleData = { id: string; color: ColorType; x: number; isSpecial: boolean; speedOffset: number };
export type ParticleData = { id: string; x: number; y: number; color: string };
export type FloatingTextData = { id: string; x: number; y: number; text: string; color: string };
export type Difficulty = "Lento" | "Normal" | "Rápido";
export type Size = "Mediano" | "Grande" | "Gigante";
export type Frequency = "Pocas" | "Intermedio" | "Muchas";

// ¡COLORES PUROS AL 100% DE SATURACIÓN PARA MÁXIMO CONTRASTE!
export const COLORS: ColorType[] = [
  { id: "amarillo", name: "Amarillas", hex: "#FFFF00" }, // Amarillo Puro (Láser)
  { id: "rosa", name: "Rosas", hex: "#FF00FF" },       // Magenta Puro (Fucsia Neón)
  { id: "verde", name: "Verdes", hex: "#00FF00" },     // Verde Puro (Lima Reactivo)
  { id: "celeste", name: "Celestes", hex: "#00FFFF" }, // Cian Puro (Celeste Eléctrico)
];

export const SIZES: Record<Size, number> = { Mediano: 120, Grande: 180, Gigante: 250 };
export const FREQUENCIES: Record<Frequency, number> = { Pocas: 2000, Intermedio: 1200, Muchas: 700 };
export const DIFFICULTIES: Record<Difficulty, number> = { Lento: 15, Normal: 10, Rápido: 6 };