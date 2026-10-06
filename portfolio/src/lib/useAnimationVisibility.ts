import { useEffect, useRef } from 'react';

/** Pause decorative CSS work outside the viewport without unmounting its content. */
export function useAnimationVisibility<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    let visible = !('IntersectionObserver' in window);
    const update = () => {
      const paused = String(!visible || document.hidden);
      if (node.dataset.animationPaused !== paused) node.dataset.animationPaused = paused;
    };
    const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting; update();
    }, { rootMargin: '80px' }) : undefined;
    observer?.observe(node); update();
    document.addEventListener('visibilitychange', update);
    return () => { observer?.disconnect(); document.removeEventListener('visibilitychange', update); };
  }, []);
  return ref;
}
