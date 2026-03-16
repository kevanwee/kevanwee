"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

const IcaCanvas = dynamic(() => import("@/components/IcaCanvas"), {
  ssr: false,
  loading: () => null,
});

export default function IcaFloat() {
  const [open, setOpen] = useState(false);

  return (
    <div
      style={{
        position: "fixed",
        bottom: "1.5rem",
        right: "1.5rem",
        zIndex: 40,
      }}
      aria-label="Little Ica — Hyacine Servant"
    >
      {open ? (
        <div
          style={{
            width: 160,
            height: 220,
            background: "rgba(250,248,244,0.92)",
            backdropFilter: "blur(8px)",
            borderRadius: "1rem",
            border: "1px solid #e8dece",
            boxShadow: "0 8px 32px rgba(26,21,18,0.15)",
            overflow: "hidden",
            position: "relative",
          }}
        >
          {/* Close */}
          <button
            onClick={() => setOpen(false)}
            style={{
              position: "absolute",
              top: 6,
              right: 8,
              zIndex: 1,
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 12,
              color: "#a5968a",
              lineHeight: 1,
            }}
            aria-label="Close Ica viewer"
          >
            ✕
          </button>
          <p
            style={{
              position: "absolute",
              bottom: 6,
              left: 0,
              right: 0,
              textAlign: "center",
              fontSize: 10,
              color: "#a5968a",
              pointerEvents: "none",
            }}
          >
            Little Ica ✦
          </p>
          <IcaCanvas />
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            background: "rgba(250,248,244,0.95)",
            border: "1.5px solid #e8dece",
            boxShadow: "0 4px 16px rgba(26,21,18,0.12)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 22,
            transition: "transform 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          aria-label="View Little Ica"
          title="Little Ica"
        >
          ✦
        </button>
      )}
    </div>
  );
}
