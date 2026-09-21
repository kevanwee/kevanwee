import spriteData from "@/data/overworld-sprites.json";
import { animationFrame } from "./pokemon-overworld";

export type Animation = { src: string; w: number; h: number; rows: number; durations: number[]; bounds: number[][] };
export type Sprite = { flying: boolean; flightTempo: number; scale: number; feet: number[]; animations: Record<string, Animation> };
export const SPRITES: Record<string, Sprite> = spriteData;

/** Preserve PMD's shared origin for actions; plant resting poses on their own feet. */
export function paintSprite(el: HTMLElement, sprite: Sprite, name: string, elapsed: number, direction: number, x: number, y: number, scaleFactor = 1, footOffset?: number) {
  const anim = sprite.animations[name] ?? sprite.animations.Walk;
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
