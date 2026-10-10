"use client";
import {
  lazy,
  Suspense,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import Modal from "./Modal";
import EeveeBase from "./EeveeBase";
import type { Catalog, Resident } from "./friend-areas";
import { declareFriendAreas } from "./pc/friend-areas";
import { openPc } from "./pc/runtime";
const Scene = lazy(() => import("./FriendAreaScene"));

export default function FriendAreas() {
  const [catalog, setCatalog] = useState<Catalog | null>(null),
    [selected, setSelected] = useState("transformforest"),
    [open, setOpen] = useState(false),
    [error, setError] = useState("");
  const residents = useRef(new Map<string, Resident[]>());
  useEffect(() => {
    const controller = new AbortController();
    fetch("/friend-areas/catalog.json", { signal: controller.signal, cache: "no-cache" })
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
  useEffect(() => {
    if (!catalog) return;
    // Every area keeps a PC box; the scene on screen applies the choices to its residents.
    return declareFriendAreas(catalog);
  }, [catalog]);
  const area = catalog?.areas.find((a) => a.id === selected);
  const options = [
    "transformforest",
    ...(catalog?.areas.map((a) => a.id) ?? []),
  ];
  function choose(id: string) {
    setSelected(id);
    try {
      localStorage.setItem("friend-area", id);
    } catch {
      /* storage is optional */
    }
  }
  function cycle(offset: number) {
    choose(
      options[
        (options.indexOf(selected) + offset + options.length) % options.length
      ],
    );
  }
  function navigate(event: KeyboardEvent<HTMLDivElement>, expand = false) {
    if (event.target !== event.currentTarget) return;
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      event.stopPropagation();
      cycle(event.key === "ArrowLeft" ? -1 : 1);
    } else if (expand && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      setOpen(true);
    }
  }
  const arrow = (offset: number) => (
    <button
      type="button"
      disabled={!catalog}
      aria-label={offset < 0 ? "Previous Friend Area" : "Next Friend Area"}
      onClick={() => cycle(offset)}
      title={
        offset < 0 ? "Previous area (Left arrow)" : "Next area (Right arrow)"
      }
      style={{ minWidth: 44, minHeight: 44, fontSize: 20, borderRadius: 10 }}
    >
      {offset < 0 ? "‹" : "›"}
    </button>
  );
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
        role="group"
        tabIndex={0}
        aria-label={`${area?.name ?? "Transform Forest"} map. Enter to expand; Left and Right to change area.`}
        onKeyDown={(event) => navigate(event, true)}
        onClick={(event) => {
          if (!(event.target as HTMLElement).closest("button,a")) setOpen(true);
        }}
        style={{ cursor: "zoom-in", borderRadius: 16, overflow: "hidden" }}
      >
        {scene(false)}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 6,
        }}
      >
        {arrow(-1)}
        <button
          type="button"
          aria-label="Explore Friend Areas"
          onClick={() => setOpen(true)}
          style={{ fontSize: 12, opacity: 0.8, padding: "8px 2px" }}
        >
          {area?.name ?? "Transform Forest"} ↗
        </button>
        {arrow(1)}
      </div>
      {/* The PC cabinet stands in Transform Forest; other areas reach it from here. */}
      {area && <button type="button" aria-label="Open Pokémon PC" aria-haspopup="dialog" onClick={openPc} style={{fontSize:12,padding:"6px 0"}}>Pokémon PC</button>}
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
                  onChange={(event) => choose(event.target.value)}
                  style={{
                    fontSize: 20,
                    background: "transparent",
                    maxWidth: "60vw",
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
              role="group"
              tabIndex={0}
              aria-label="Friend Area map. Use Left and Right arrows to change area."
              onKeyDown={(event) => navigate(event)}
              style={{
                borderRadius: 12,
                overflow: "hidden",
                background: "#171f29",
              }}
            >
              {scene(true)}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
              }}
            >
              {arrow(-1)}
              <span style={{ fontSize: 11, opacity: 0.7 }}>
                Click arrows or focus the map and use ← →
              </span>
              {arrow(1)}
            </div>
            <p style={{ fontSize: 13, marginTop: 12 }}>
              {area?.description ?? "Your familiar Eevee garden."}
            </p>
            {!!area?.guests?.length && catalog && (
              <details style={{ fontSize: 12, marginTop: 10 }}>
                <summary style={{ cursor: "pointer" }}>
                  Habitat visitors · up to {area.guestLimit} per visit
                </summary>
                <ul style={{ paddingLeft: 18, marginTop: 8 }}>
                  {area.guests.map((guest) => (
                    <li key={guest.id} style={{ margin: "5px 0" }}>
                      <strong>{catalog.sprites[guest.id].name}</strong> —{" "}
                      {guest.reason}{" "}
                      <span style={{ opacity: 0.7 }}>({guest.basis})</span>
                    </li>
                  ))}
                </ul>
              </details>
            )}
            <p style={{ fontSize: 12, marginTop: 8 }}>
              <strong>{area ? "Native residents" : "Garden residents"}</strong>{" "}
              ·{" "}
              {area && catalog
                ? area.roster.map((id) => catalog.sprites[id].name).join(" · ")
                : "Eevee · Vaporeon · Jolteon · Flareon · Umbreon · Sylveon"}
            </p>
            <p style={{ fontSize: 10, marginTop: 12, opacity: 0.7 }}>
              Scenery: Pokémon Mystery Dungeon, ripped by Toastypk and
              MYSTERY_DUNGEON; backgrounds via{" "}
              <a
                href="https://pamtre-berry.neocities.org/articles/friendareas"
                target="_blank"
                rel="noreferrer"
              >
                Pamtre Berry
              </a>
              . Sprites:{" "}
              <a
                href="https://github.com/PMDCollab/SpriteCollab"
                target="_blank"
                rel="noreferrer"
              >
                PMD SpriteCollab contributors
              </a>
              .
            </p>
          </section>
        </Modal>
      )}
    </section>
  );
}
