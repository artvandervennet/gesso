// Colour maths shared by the build scripts: OKLCH → sRGB, hex and WCAG contrast.

export function oklchToSrgb(str) {
  const [L, C, H] = str.match(/oklch\(([\d.]+)%\s+([\d.]+)\s+([\d.]+)/).slice(1).map(Number);
  const l = L / 100, a = C * Math.cos((H * Math.PI) / 180), b = C * Math.sin((H * Math.PI) / 180);
  const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const lin = [
    4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
    -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
    -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
  ].map((x) => Math.min(1, Math.max(0, x)));
  return lin; // linear sRGB, clipped
}
const lum = (lin) => 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
export const contrast = (a, b) => {
  const [x, y] = [lum(oklchToSrgb(a)), lum(oklchToSrgb(b))].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};


/** OKLCH string → #rrggbb (gamut-clipped). */
export function oklchToHex(str) {
  const enc = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
  return '#' + oklchToSrgb(str).map((c) => Math.round(enc(c) * 255).toString(16).padStart(2, '0')).join('');
}
