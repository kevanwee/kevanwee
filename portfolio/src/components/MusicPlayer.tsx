"use client";

import { useRef, useState } from "react";

export default function MusicPlayer() {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const [error, setError] = useState("");
  const toggle = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!audio.paused) { audio.pause(); return; }
    if (!audio.getAttribute("src")) audio.src = "/littleroot-town.mp3";
    audio.volume = 0.35;
    try { await audio.play(); setError(""); }
    catch { setError("Music could not play. Try again."); }
  };

  return (
    <>
      <audio ref={audioRef} loop preload="none" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} />
      <button
        onClick={toggle}
        className="inline-flex min-h-11 gap-2 px-3 items-center justify-center rounded-full text-warm-600 transition-all duration-200 hover:-translate-y-px hover:bg-cream-100 hover:text-sage-600"
        aria-label={playing ? "Pause music" : "Play Littleroot Town"}
        title={playing ? "Pause · Littleroot Town" : "Play · Littleroot Town ♪"}
      >
        {playing ? <PauseIcon /> : <MusicIcon />}
        <span className="text-xs">Music {playing ? "on" : "off"}</span>
      </button>
      <span role="status" className="text-xs text-warm-700">{error}</span>
    </>
  );
}

function MusicIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"
      className="h-[18px] w-[18px]" aria-hidden="true">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"
      className="h-[18px] w-[18px]" aria-hidden="true">
      <rect x="6" y="4" width="4" height="16" />
      <rect x="14" y="4" width="4" height="16" />
    </svg>
  );
}
