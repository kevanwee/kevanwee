"use client";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import Modal from "./Modal";
import EeveeBase from "./EeveeBase";
import type { Catalog, Resident } from "./friend-areas";
const Scene = lazy(() => import("./FriendAreaScene"));

export default function FriendAreas() {
  const [catalog, setCatalog] = useState<Catalog | null>(null),
    [selected, setSelected] = useState("transformforest"),
    [open, setOpen] = useState(false),
    [error, setError] = useState("");
  const residents = useRef(new Map<string, Resident[]>());
  useEffect(() => {
    const controller = new AbortController();
    fetch("/friend-areas/catalog.json", { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data: Catalog) => {
        setCatalog(data);
        try {
          const saved = localStorage.getItem("friend-area");
          if (data.areas.some((a) => a.id === saved)) setSelected(saved!);
        } catch {
          /* storage optional */
        }
      })
      .catch((e) => {
        if (e.name !== "AbortError")
          setError(
            "Friend Areas could not load. The Eevee garden is still available.",
          );
      });
    return () => controller.abort();
  }, []);
  const area = catalog?.areas.find((a) => a.id === selected);
  const scene = (expanded: boolean) =>
    area && catalog ? (
      <Suspense fallback={<p>Opening {area.name}…</p>}>
        <Scene
          area={area}
          catalog={catalog}
          residents={residents.current}
          paused={!expanded && open}
        />
      </Suspense>
    ) : (
      <EeveeBase inDialog={expanded} />
    );
  return (
    <section aria-label="Friend Area">
      <div
        onClick={(event) => {
          if (!(event.target as HTMLElement).closest("button,a")) setOpen(true);
        }}
        style={{ cursor: "zoom-in", borderRadius: 16, overflow: "hidden" }}
      >
        {scene(false)}
      </div>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{ fontSize: 12, opacity: 0.8, padding: "8px 2px" }}
      >
        Explore Friend Areas ↗
      </button>
      {error && <p role="status">{error}</p>}
      {open && (
        <Modal label="Friend Areas" onClose={() => setOpen(false)}>
          <section
            className="bg-cream-50 text-warm-800"
            style={{
              width: "min(850px,96vw)",
              maxHeight: "90dvh",
              overflowY: "auto",
              borderRadius: 20,
              padding: 20,
              boxShadow: "0 25px 100px #0006",
            }}
          >
            <header
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
                marginBottom: 14,
              }}
            >
              <label style={{ fontSize: 13 }}>
                Friend Area
                <br />
                <select
                  aria-label="Choose Friend Area"
                  value={selected}
                  onChange={(event) => {
                    setSelected(event.target.value);
                    try {
                      localStorage.setItem("friend-area", event.target.value);
                    } catch {
                      /* optional */
                    }
                  }}
                  style={{
                    fontSize: 20,
                    background: "transparent",
                    maxWidth: "65vw",
                    padding: "5px 0",
                  }}
                >
                  <option value="transformforest">Transform Forest</option>
                  {catalog?.areas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                aria-label="Close Friend Areas"
                onClick={() => setOpen(false)}
                style={{ padding: 12 }}
              >
                ✕
              </button>
            </header>
            <div
              style={{
                borderRadius: 12,
                overflow: "hidden",
                background: "#171f29",
              }}
            >
              {scene(true)}
            </div>
            <p style={{ fontSize: 13, marginTop: 12 }}>
              {area?.description ?? "Your familiar Eevee garden."}
            </p>
            <p style={{ fontSize: 12, marginTop: 8 }}>
              <strong>{area ? "Native residents" : "Garden residents"}</strong>{" "}
              ·{" "}
              {area && catalog
                ? area.roster.map((id) => catalog.sprites[id].name).join(" · ")
                : "Eevee · Vaporeon · Jolteon · Flareon · Umbreon · Sylveon"}
            </p>
            <p style={{ fontSize: 10, marginTop: 12, opacity: 0.7 }}>
              Scenery: Pokémon Mystery Dungeon, ripped by Toastypk and MYSTERY_DUNGEON;
              backgrounds via <a href="https://pamtre-berry.neocities.org/articles/friendareas" target="_blank" rel="noreferrer">Pamtre Berry</a>.
              Sprites: <a href="https://github.com/PMDCollab/SpriteCollab" target="_blank" rel="noreferrer">PMD SpriteCollab contributors</a>.
            </p>
          </section>
        </Modal>
      )}
    </section>
  );
}
