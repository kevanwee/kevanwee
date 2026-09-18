"use client";

import { useRef, useState, useEffect } from "react";

export default function MusicPlayer() {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0.5;
    audio.play().then(() => setPlaying(true)).catch(() => {/* blocked by browser — user must click */});
  }, []);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
    } else {
      audio.play();
    }
    setPlaying((p) => !p);
  };

  return (
    <>
      <audio ref={audioRef} src="/littleroot-town.mp3" loop preload="auto" />
      <button
        onClick={toggle}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full text-warm-300 transition-all duration-200 hover:-translate-y-px hover:bg-cream-100 hover:text-sage-600"
        aria-label={playing ? "Pause music" : "Play Littleroot Town"}
        title={playing ? "Pause · Littleroot Town" : "Play · Littleroot Town ♪"}
      >
        {playing ? <PauseIcon /> : <MusicIcon />}
      </button>
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
