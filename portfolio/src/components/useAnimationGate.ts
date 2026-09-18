"use client";

import { useEffect, useRef, useState } from "react";
import { usePokemonCursor } from "@/components/PokemonCursorContext";

export function useAnimationGate<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);
  const [tabVisible, setTabVisible] = useState(true);
  const { paused, modalCount } = usePokemonCursor();
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    if (ref.current) observer.observe(ref.current);
    const update = () => setTabVisible(!document.hidden);
    update();
    document.addEventListener("visibilitychange", update);
    return () => { observer.disconnect(); document.removeEventListener("visibilitychange", update); };
  }, []);
  return { ref, active: visible && tabVisible && !paused && modalCount === 0 };
}
