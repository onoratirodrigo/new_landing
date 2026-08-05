export type Stat = {
  value: string;
  label: string;
  suffix?: string;
};

export const stats: Stat[] = [
  { value: "65", suffix: "+", label: "Años de trayectoria" },
  { value: "24.000", suffix: " m²", label: "De almacenamiento" },
  { value: "7", label: "Puntos logísticos en el país" },
  { value: "50", suffix: "+", label: "Marcas líderes" },
];
