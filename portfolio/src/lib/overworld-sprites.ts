import spriteData from "@/data/overworld-sprites.json";
import { animationFrame } from "./pokemon-overworld";

export type Animation = { src: string; w: number; h: number; rows: number; durations: number[]; bounds: number[][] };
export type Sprite = { flying: boolean; flightTempo: number; scale: number; feet: number[]; animations: Record<string, Animation> };
export const SPRITES: Record<string, Sprite> = spriteData;

const sheets = new Map<string, { image: HTMLImageElement; ready: boolean; promise: Promise<void> }>();
/** Keep decoded sheets resident; changing CSS to an undecoded image blanks a frame. */
export function preloadSpriteSheet(src: string) {
  const cached = sheets.get(src);
  if (cached) return cached.promise;
  const image = new Image();
  const entry = { image, ready: false, promise: Promise.resolve() };
  entry.promise = new Promise<void>((resolve, reject) => {
    image.onload = () => {
      image.decode().then(() => { entry.ready = true; resolve(); }).catch(error => { sheets.delete(src); reject(error); });
    };
    image.onerror = () => { sheets.delete(src); reject(new Error(`Sprite could not load: ${src}`)); };
    image.src = src;
  });
  sheets.set(src, entry);
  return entry.promise;
}
const pendingPaint = new WeakMap<HTMLElement, () => void>();

/** Preserve PMD's shared origin for actions; plant resting poses on their own feet. */
export function paintSprite(el: HTMLElement, sprite: Sprite, name: string, elapsed: number, direction: number, x: number, y: number, scaleFactor = 1, footOffset?: number) {
  const anim = sprite.animations[name] ?? sprite.animations.Walk;
  if (!sheets.get(anim.src)?.ready) {
    // Retain the complete previous pose (including geometry) until the new sheet
    // can be painted. Also redraw event-only / reduced-motion residents on load.
    pendingPaint.set(el, () => paintSprite(el, sprite, name, elapsed, direction, x, y, scaleFactor, footOffset));
    void preloadSpriteSheet(anim.src).then(() => {
      if (!el.isConnected) return;
      const paint = pendingPaint.get(el); pendingPaint.delete(el); paint?.();
    }).catch(() => {});
    return;
  }
  pendingPaint.delete(el);
  const row = anim.rows === 1 ? 0 : direction;
  const loop = !["Attack", "Shoot", "Hurt", "RearUp", "Double", "Hop", "Special0"].includes(name);
  const frame = animationFrame(anim.durations, elapsed / (sprite.flying && name === "Walk" ? sprite.flightTempo : 1), loop);
  const scale = sprite.scale * scaleFactor;
  el.style.width = `${anim.w * scale}px`;
  el.style.height = `${anim.h * scale}px`;
  el.style.backgroundImage = `url("${anim.src}")`;
  el.style.backgroundSize = `${anim.w * anim.durations.length * scale}px ${anim.h * anim.rows * scale}px`;
  el.style.backgroundPosition = `${-frame * anim.w * scale}px ${-row * anim.h * scale}px`;
  const foot = footOffset !== undefined ? anim.h / 2 + footOffset : ["Sleep", "Idle", "Special2"].includes(name) ? anim.bounds[row][3] : anim.h / 2 + sprite.feet[row];
  el.style.transform = `translate3d(${Math.round(x - anim.w / 2 * scale)}px,${Math.round(y - foot * scale)}px,0)`;
  el.dataset.animation = name;
  el.dataset.frame = String(frame);
  el.dataset.direction = String(row);
}
