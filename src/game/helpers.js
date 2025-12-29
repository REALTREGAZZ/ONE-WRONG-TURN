export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function smoothstep(t) {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
}

export function randRange(min, max) {
  return min + Math.random() * (max - min);
}

export function randSigned() {
  return Math.random() < 0.5 ? -1 : 1;
}

export function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function difficulty01(distance, maxDistance) {
  return clamp(distance / maxDistance, 0, 1);
}
