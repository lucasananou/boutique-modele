export function colorHexForName(colorName: string, explicitHex?: string) {
  if (explicitHex) return explicitHex;

  const normalized = colorName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\?/g, "e")
    .toLowerCase();

  if (normalized.includes("noir")) return "#171717";
  if (normalized.includes("marine")) return "#111A2E";
  if (normalized.includes("bordeaux")) return "#6D1F2B";
  if (normalized.includes("choco")) return "#5B3A2E";
  if (normalized.includes("marron")) return "#6B4635";
  if (normalized.includes("taupe")) return "#8B7A6A";
  if (normalized.includes("kaki")) return "#6F7652";
  if (normalized.includes("bleu jean")) return "#536F8E";
  if (normalized.includes("bleu")) return "#2F5FA8";
  if (normalized.includes("ecru")) return "#E8DFCF";
  if (normalized.includes("beige")) return "#D8C4A8";
  if (normalized.includes("moutarde")) return "#B8872E";
  if (normalized.includes("orange")) return "#C96D2D";
  if (normalized.includes("corail")) return "#D96B5F";
  if (normalized.includes("vert")) return "#7FA889";
  return "#8B6F74";
}

export function isLightColor(hex: string) {
  const value = hex.replace("#", "");
  if (value.length !== 6) return false;
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 190;
}
