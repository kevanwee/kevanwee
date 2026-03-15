export default function PokemonBanner() {
  return (
    <div className="mt-10">
      <p className="mb-3 text-xs font-bold uppercase tracking-widest text-warm-400">
        Currently roaming · Route 111
      </p>

      <div
        className="relative overflow-hidden rounded-2xl border border-cream-200 bg-white"
        style={{ height: "180px" }}
      >
        {/* Fade edges so the route feels framed */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-10 bg-gradient-to-b from-white to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-10 bg-gradient-to-t from-white to-transparent" />

        {/* The route — auto-scrolls top→bottom→top so all Pokémon are visible */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/pokemon-roam-rt111.svg"
          alt="Animated Pokémon roaming Route 111"
          className="w-full route-scroll"
          style={{ display: "block", height: "auto" }}
        />
      </div>
    </div>
  );
}
