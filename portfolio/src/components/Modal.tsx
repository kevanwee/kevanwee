"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useWorldPreferences } from "./useWorldPreferences";

/** Native top-layer dialogs make the background inert, including to keyboard users. */
export default function Modal({ children, onClose, label, describedBy, className = "p-4" }: {
  children: ReactNode;
  onClose: () => void;
  label: string;
  describedBy?: string;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const { setModalCount } = useWorldPreferences();
  useEffect(() => {
    const dialog = ref.current!;
    const previousFocus = document.activeElement;
    const overflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    setModalCount(count => count + 1);
    return () => {
      dialog.close();
      document.body.style.overflow = overflow;
      setModalCount(count => Math.max(0, count - 1));
      if (previousFocus instanceof HTMLElement) previousFocus.focus({ preventScroll: true });
    };
  }, [setModalCount]);
  return (
    <dialog ref={ref} aria-label={label} aria-describedby={describedBy}
      className={`portfolio-dialog fixed inset-0 m-0 flex h-dvh max-h-none w-screen max-w-none items-center justify-center border-0 bg-transparent text-warm-800 [&:not([open])]:hidden ${className}`}
      onKeyDown={event => {
        if (event.key !== "Tab") return;
        const items = Array.from(event.currentTarget.querySelectorAll<HTMLElement>("button, a[href], input, select, textarea, iframe, [tabindex]"))
          .filter(item => item.tabIndex >= 0 && !item.hasAttribute("disabled") && item.getClientRects().length > 0);
        const first = items[0], last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }}
      onCancel={event => { event.preventDefault(); onClose(); }}
      onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
      {children}
    </dialog>
  );
}
